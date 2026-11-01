/**
 * Image Utilities for Power Brands (FORME)
 * Provides robust validation, normalization, and fallback handling for all product images.
 */

export const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Normalizes an image item into standard shape:
 * { image_url: string, image_source: 'upload' | 'external_url', display_order: number, is_primary: boolean, id?: string }
 */
export function normalizeProductImage(item, index = 0) {
  if (!item) return null;

  if (typeof item === 'string') {
    const isUpload = item.includes('/storage/v1/object/public/product-images') || item.includes('product-images');
    return {
      id: `img_${index}_${Math.random().toString(36).slice(2, 8)}`,
      image_url: item.trim(),
      image_source: isUpload ? 'upload' : 'external_url',
      display_order: index,
      is_primary: index === 0
    };
  }

  if (typeof item === 'object') {
    const url = item.image_url || item.url || '';
    if (!url) return null;
    const isUpload = item.image_source === 'upload' ||
      url.includes('/storage/v1/object/public/product-images') ||
      url.includes('product-images');

    return {
      id: item.id || `img_${index}_${Math.random().toString(36).slice(2, 8)}`,
      image_url: url.trim(),
      image_source: isUpload ? 'upload' : (item.image_source || 'external_url'),
      display_order: typeof item.display_order === 'number' ? item.display_order : index,
      is_primary: Boolean(item.is_primary),
      storage_path: item.storage_path || null,
      file_name: item.file_name || null,
      file_size: item.file_size || null
    };
  }

  return null;
}

/**
 * Extracts all gallery images from a product into a normalized array of image objects.
 */
export function getAllProductImages(product) {
  if (!product) return [];

  const rawImages = [];

  // Check structured images array
  if (Array.isArray(product.images)) {
    product.images.forEach((img, idx) => {
      const norm = normalizeProductImage(img, idx);
      if (norm && norm.image_url) rawImages.push(norm);
    });
  }

  // Include primary_image / image_url if not already in the list
  const primaryCandidate = product.primary_image || product.image_url;
  if (primaryCandidate && typeof primaryCandidate === 'string' && primaryCandidate.trim()) {
    const cleanUrl = primaryCandidate.trim();
    const alreadyPresent = rawImages.some(img => img.image_url === cleanUrl);
    if (!alreadyPresent) {
      rawImages.unshift({
        id: `img_primary_${Math.random().toString(36).slice(2, 8)}`,
        image_url: cleanUrl,
        image_source: cleanUrl.includes('/storage/v1/object/public/product-images') ? 'upload' : 'external_url',
        display_order: 0,
        is_primary: true
      });
    }
  }

  // Sort by display order
  rawImages.sort((a, b) => a.display_order - b.display_order);

  // Re-index display_order and ensure exactly one is_primary flag
  const hasPrimary = rawImages.some(img => img.is_primary);
  return rawImages.map((img, idx) => ({
    ...img,
    display_order: idx,
    is_primary: hasPrimary ? img.is_primary : (idx === 0)
  }));
}

/**
 * Resolves the primary image URL for display in cards, storefronts, and thumbnails.
 */
export function getPrimaryImageUrl(product) {
  if (!product) return FALLBACK_IMAGE;

  // 1. Direct primary_image column
  if (typeof product.primary_image === 'string' && product.primary_image.trim()) {
    return product.primary_image.trim();
  }

  // 2. Direct image_url column
  if (typeof product.image_url === 'string' && product.image_url.trim()) {
    return product.image_url.trim();
  }

  // 3. Look inside images array
  if (Array.isArray(product.images) && product.images.length > 0) {
    const primaryObj = product.images.find(img => img && typeof img === 'object' && img.is_primary);
    if (primaryObj?.image_url) return primaryObj.image_url;

    const first = product.images[0];
    if (typeof first === 'string' && first.trim()) return first.trim();
    if (first?.image_url && typeof first.image_url === 'string') return first.image_url.trim();
  }

  // 4. Fallback to display_image if previously computed
  if (typeof product.display_image === 'string' && product.display_image.trim()) {
    return product.display_image.trim();
  }

  return FALLBACK_IMAGE;
}

/**
 * Validates an image URL format and protocol safety.
 */
export function validateImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'Image URL is required.' };
  }

  const trimmed = url.trim();

  // Check URL scheme - only http: and https: allowed
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only http:// and https:// URLs are supported.' };
    }
  } catch (err) {
    return { valid: false, error: 'Please enter a valid, well-formed web URL.' };
  }

  // Reject unsafe schemes explicitly
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return { valid: false, error: 'Unsafe URL scheme detected.' };
  }

  return { valid: true, sanitizedUrl: trimmed };
}

/**
 * Probes whether an image URL is accessible and can be rendered by the browser.
 */
export function probeImageAccessible(url, timeoutMs = 7000) {
  return new Promise((resolve) => {
    const img = new Image();
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        // Don't strictly block on timeout in case of CORS or CDN slow response
        resolve({ accessible: true, timedOut: true });
      }
    }, timeoutMs);

    img.onload = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve({ accessible: true, width: img.naturalWidth, height: img.naturalHeight });
      }
    };

    img.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve({ accessible: false, error: 'Unable to load image from provided URL.' });
      }
    };

    img.src = url;
  });
}

/**
 * Validates a local file before uploading.
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type || 'unknown'}. Please upload JPG, PNG, or WEBP.`
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 5 MB limit (${formatFileSize(file.size)}).`
    };
  }

  return { valid: true };
}

/**
 * Formats byte counts into human-readable strings.
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Generates a clean, unique file path for Supabase Storage.
 */
export function generateStoragePath(productId, originalFileName) {
  const cleanBase = (originalFileName || 'image')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const extMatch = cleanBase.match(/\.(jpg|jpeg|png|webp)$/i);
  const ext = extMatch ? extMatch[1] : 'jpg';
  const nameWithoutExt = cleanBase.replace(/\.[^/.]+$/, '');

  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const timestamp = Date.now();
  const folder = productId && productId !== 'new' ? productId : 'staged';

  return `products/${folder}/${timestamp}_${randomSuffix}_${nameWithoutExt}.${ext}`;
}
