/**
 * Supabase Storage Integration & Bulk Image Queue Service
 * Handles single & batch uploads, deletions, bucket verification, and retry queues.
 */

import { supabase } from './supabase.js';
import {
  validateImageFile,
  generateStoragePath
} from './imageUtils.js';

export const STORAGE_BUCKET = 'product-images';

/**
 * Checks whether the `product-images` storage bucket exists and is accessible.
 */
export async function checkStorageBucket() {
  if (!supabase) return { configured: false, exists: false, error: 'Supabase client not configured.' };

  try {
    const { data, error } = await supabase.storage.getBucket(STORAGE_BUCKET);
    if (error) {
      // 404 or policy denied
      return {
        configured: true,
        exists: false,
        error: error.message || 'Storage bucket not found or access restricted.',
        setupNeeded: true
      };
    }
    return { configured: true, exists: true, bucket: data };
  } catch (err) {
    return {
      configured: true,
      exists: false,
      error: err.message || 'Error checking storage bucket.',
      setupNeeded: true
    };
  }
}

/**
 * Uploads a single file to Supabase Storage with automatic retry support.
 *
 * @param {File} file - Browser File object
 * @param {string} productId - Product ID or 'staged' for new products
 * @param {object} options - { maxRetries: 3, onProgress: fn }
 */
export async function uploadProductImage(file, productId = 'staged', options = {}) {
  const { maxRetries = 2, onProgress } = options;

  if (!supabase) {
    throw new Error('Supabase client is not available.');
  }

  // 1. Client-side validation
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const storagePath = generateStoragePath(productId, file.name);

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    try {
      if (onProgress) onProgress({ attempt: attempt + 1, status: 'uploading', progress: 50 });

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (error) throw error;

      // Obtain public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(storagePath);

      if (onProgress) onProgress({ attempt: attempt + 1, status: 'completed', progress: 100 });

      return {
        success: true,
        image_url: urlData.publicUrl,
        image_source: 'upload',
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size
      };
    } catch (err) {
      lastError = err;
      attempt++;
      if (attempt <= maxRetries) {
        // Exponential backoff wait: 500ms, 1000ms
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
      }
    }
  }

  // If failed with bucket not found or RLS policy
  const message = lastError?.message || 'Storage upload failed.';
  const isBucketMissing = message.toLowerCase().includes('bucket not found') ||
    message.toLowerCase().includes('not found') ||
    message.toLowerCase().includes('policy');

  const enhancedError = new Error(
    isBucketMissing
      ? `Storage setup required: The bucket "${STORAGE_BUCKET}" is not configured or lacks admin policies. Run migration 002 in Supabase SQL editor.`
      : message
  );
  enhancedError.isBucketError = isBucketMissing;
  throw enhancedError;
}

/**
 * Extracts storage path from a Supabase Storage public URL.
 */
export function extractStoragePath(url) {
  if (!url || typeof url !== 'string') return null;
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    return decodeURIComponent(url.substring(idx + marker.length));
  }
  return null;
}

/**
 * Deletes an uploaded file from Supabase Storage.
 * Does nothing if the image is an external URL.
 */
export async function deleteProductImageFromStorage(storagePathOrUrl) {
  if (!supabase || !storagePathOrUrl) return { skipped: true };

  let path = storagePathOrUrl;
  if (path.startsWith('http')) {
    path = extractStoragePath(path);
  }

  // If not in our storage bucket, do not attempt to delete
  if (!path) {
    return { skipped: true, reason: 'External URL or outside storage bucket' };
  }

  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) throw error;
    return { success: true, removed: data };
  } catch (err) {
    console.warn(`[Storage] Failed to delete image at ${path}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Queue Processor for Bulk Image Operations (supports 100–200+ images)
 * Limits concurrency, provides progress updates, and supports retries.
 */
export class BulkImageProcessor {
  constructor(options = {}) {
    this.concurrency = options.concurrency || 3;
    this.maxRetries = options.maxRetries || 2;
    this.onProgress = options.onProgress || (() => {});
    this.onItemComplete = options.onItemComplete || (() => {});
    this.onItemError = options.onItemError || (() => {});
    this.isCancelled = false;
  }

  cancel() {
    this.isCancelled = true;
  }

  /**
   * Processes a list of files or URL items.
   * @param {Array<{ file?: File, url?: string, productId: string, id: string }>} items
   */
  async process(items) {
    this.isCancelled = false;
    const total = items.length;
    let completed = 0;
    let failed = 0;
    const results = [];

    // Helper to run a single item
    const runItem = async (item) => {
      if (this.isCancelled) {
        return { item, success: false, error: 'Cancelled' };
      }

      try {
        if (item.file) {
          const uploadRes = await uploadProductImage(item.file, item.productId, {
            maxRetries: this.maxRetries
          });
          const res = { item, ...uploadRes };
          completed++;
          this.onItemComplete(res);
          return res;
        } else if (item.url) {
          const res = {
            item,
            success: true,
            image_url: item.url,
            image_source: 'external_url'
          };
          completed++;
          this.onItemComplete(res);
          return res;
        }
      } catch (err) {
        failed++;
        const res = { item, success: false, error: err.message };
        this.onItemError(res);
        return res;
      } finally {
        this.onProgress({
          total,
          completed,
          failed,
          progress: Math.round(((completed + failed) / total) * 100)
        });
      }
    };

    // Execute with limited concurrency pool
    const queue = [...items];
    const workers = [];

    const worker = async () => {
      while (queue.length > 0 && !this.isCancelled) {
        const nextItem = queue.shift();
        const res = await runItem(nextItem);
        results.push(res);
      }
    };

    const workerCount = Math.min(this.concurrency, items.length);
    for (let i = 0; i < workerCount; i++) {
      workers.push(worker());
    }

    await Promise.all(workers);
    return {
      total,
      completed,
      failed,
      results,
      cancelled: this.isCancelled
    };
  }
}
