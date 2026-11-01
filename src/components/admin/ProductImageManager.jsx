import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud, Link as LinkIcon, Star, Trash2, ArrowLeft, ArrowRight,
  AlertCircle, CheckCircle2, Copy, Check, Image as ImageIcon, Loader2,
  ExternalLink, Sparkles
} from 'lucide-react';
import {
  validateImageUrl,
  validateImageFile,
  probeImageAccessible,
  formatFileSize,
  FALLBACK_IMAGE
} from '../../lib/imageUtils';
import {
  uploadProductImage,
  checkStorageBucket,
  STORAGE_BUCKET
} from '../../lib/productImageService';

export default function ProductImageManager({
  images = [],
  onChange,
  productId = 'new',
  onTrackDeletedImage
}) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'url'
  const [urlInput, setUrlInput] = useState('');
  const [urlValidating, setUrlValidating] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [urlPreview, setUrlPreview] = useState(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]); // array of { id, name, size, progress, status, error }
  const [globalError, setGlobalError] = useState('');
  const [storageNotice, setStorageNotice] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const fileInputRef = useRef(null);

  // Check bucket readiness on mount
  useEffect(() => {
    checkStorageBucket().then((res) => {
      if (res.setupNeeded) {
        setStorageNotice({
          title: 'Supabase Storage Bucket Setup Recommended',
          message: `The storage bucket "${STORAGE_BUCKET}" has not been created yet in your Supabase dashboard or lacks policies. You can still use external image URLs immediately, or run Migration 002 in your Supabase SQL Editor for local uploads.`
        });
      }
    });
  }, []);

  // When URL changes, clear errors
  const handleUrlInputChange = (e) => {
    setUrlInput(e.target.value);
    setUrlError('');
    setUrlPreview(null);
  };

  // Validate and preview external URL
  const handleTestUrl = async () => {
    if (!urlInput.trim()) {
      setUrlError('Please enter an image URL.');
      return;
    }

    const validation = validateImageUrl(urlInput);
    if (!validation.valid) {
      setUrlError(validation.error);
      return;
    }

    setUrlValidating(true);
    setUrlError('');

    try {
      const probe = await probeImageAccessible(validation.sanitizedUrl);
      if (!probe.accessible) {
        setUrlError(probe.error || 'Failed to load image from this URL. Please verify the URL.');
      } else {
        setUrlPreview(validation.sanitizedUrl);
      }
    } catch (err) {
      setUrlError('Error validating image URL.');
    } finally {
      setUrlValidating(false);
    }
  };

  // Add validated external URL to unified gallery
  const handleAddUrlImage = () => {
    if (!urlInput.trim()) {
      setUrlError('Please enter an image URL.');
      return;
    }

    const validation = validateImageUrl(urlInput);
    if (!validation.valid) {
      setUrlError(validation.error);
      return;
    }

    const cleanUrl = validation.sanitizedUrl;
    if (images.some(img => img.image_url === cleanUrl)) {
      setUrlError('This image URL is already in the product gallery.');
      return;
    }

    const isFirst = images.length === 0;
    const newImageItem = {
      id: `url_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      image_url: cleanUrl,
      image_source: 'external_url',
      display_order: images.length,
      is_primary: isFirst,
      file_name: cleanUrl.split('/').pop()?.split('?')[0] || 'external-image'
    };

    const nextImages = [...images, newImageItem];
    onChange(nextImages);

    // Reset URL fields
    setUrlInput('');
    setUrlPreview(null);
    setUrlError('');
  };

  const readFileAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle local file selection
  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setGlobalError('');

    const files = Array.from(fileList);
    const newQueueItems = files.map(f => ({
      id: `upload_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      file: f,
      name: f.name,
      size: f.size,
      progress: 0,
      status: 'pending', // 'pending' | 'uploading' | 'completed' | 'error'
      error: null,
      note: null
    }));

    setUploadQueue(prev => [...prev, ...newQueueItems]);

    // Process files one by one or in small batches
    for (const qItem of newQueueItems) {
      // Validate
      const validation = validateImageFile(qItem.file);
      if (!validation.valid) {
        updateQueueItem(qItem.id, { status: 'error', error: validation.error });
        continue;
      }

      updateQueueItem(qItem.id, { status: 'uploading', progress: 30 });

      try {
        const uploadResult = await uploadProductImage(qItem.file, productId, {
          onProgress: ({ progress }) => {
            updateQueueItem(qItem.id, { progress });
          }
        });

        updateQueueItem(qItem.id, { status: 'completed', progress: 100 });

        // Add to unified images gallery
        onChange(currentImages => {
          const isFirst = currentImages.length === 0;
          return [
            ...currentImages,
            {
              id: qItem.id,
              image_url: uploadResult.image_url,
              image_source: 'upload',
              storage_path: uploadResult.storage_path,
              display_order: currentImages.length,
              is_primary: isFirst,
              file_name: uploadResult.file_name,
              file_size: uploadResult.file_size
            }
          ];
        });
      } catch (err) {
        console.warn('Storage upload encountered error, falling back to local image data:', err);

        // Resilient Fallback: Read local file as Data URL so the user's uploaded image is immediately in the gallery!
        try {
          const dataUrl = await readFileAsDataUrl(qItem.file);
          updateQueueItem(qItem.id, {
            status: 'completed',
            progress: 100,
            note: 'Added to gallery (Local mode)'
          });

          onChange(currentImages => {
            const isFirst = currentImages.length === 0;
            return [
              ...currentImages,
              {
                id: qItem.id,
                image_url: dataUrl,
                image_source: 'upload',
                storage_path: null,
                display_order: currentImages.length,
                is_primary: isFirst,
                file_name: qItem.name,
                file_size: qItem.size,
                is_local_mode: true
              }
            ];
          });
        } catch (readErr) {
          updateQueueItem(qItem.id, { status: 'error', error: 'Could not read file.' });
        }

        if (err.isBucketError || err.message?.includes('bucket') || err.message?.includes('policy')) {
          setStorageNotice({
            title: 'Supabase Storage Setup Pending',
            message: `Bucket "${STORAGE_BUCKET}" is not configured in your Supabase project yet. Your uploaded image has been added to the gallery in local mode. Run Migration 002 in your Supabase SQL editor to enable cloud storage.`
          });
        }
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateQueueItem = (id, updates) => {
    setUploadQueue(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Gallery reordering
  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    // Recalculate display_order
    const updated = copy.map((img, idx) => ({
      ...img,
      display_order: idx
    }));

    onChange(updated);
  };

  // Primary image selection
  const handleSetPrimary = (index) => {
    const updated = images.map((img, idx) => ({
      ...img,
      is_primary: idx === index
    }));
    onChange(updated);
  };

  // Remove an image from gallery
  const handleRemove = (index) => {
    const toRemove = images[index];
    const filtered = images.filter((_, idx) => idx !== index);

    // If removed image was primary, set new first image as primary
    let updated = filtered.map((img, idx) => ({
      ...img,
      display_order: idx,
      is_primary: toRemove.is_primary ? idx === 0 : img.is_primary
    }));

    if (updated.length > 0 && !updated.some(img => img.is_primary)) {
      updated[0].is_primary = true;
    }

    onChange(updated);

    // Track if this was an uploaded image so we can delete from storage on save
    if (toRemove.image_source === 'upload' && toRemove.storage_path) {
      onTrackDeletedImage?.(toRemove.storage_path);
    }
  };

  const copyMigrationSql = () => {
    const sql = `-- Run this in your Supabase Dashboard SQL Editor
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('${STORAGE_BUCKET}', '${STORAGE_BUCKET}', true, 5242880, array['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true;

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images" on storage.objects for select to anon, authenticated using (bucket_id = '${STORAGE_BUCKET}');

drop policy if exists "allow upload product images" on storage.objects;
create policy "allow upload product images" on storage.objects for insert to anon, authenticated with check (bucket_id = '${STORAGE_BUCKET}');

drop policy if exists "allow update product images" on storage.objects;
create policy "allow update product images" on storage.objects for update to anon, authenticated using (bucket_id = '${STORAGE_BUCKET}') with check (bucket_id = '${STORAGE_BUCKET}');

drop policy if exists "allow delete product images" on storage.objects;
create policy "allow delete product images" on storage.objects for delete to anon, authenticated using (bucket_id = '${STORAGE_BUCKET}');

alter table public.products add column if not exists primary_image text;
update public.products set primary_image = image_url where primary_image is null and image_url is not null;
`;
    navigator.clipboard?.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="product-image-manager">
      <div className="image-manager-header">
        <div>
          <h3 className="section-title">Product Images &amp; Gallery</h3>
          <p className="section-subtitle">
            Upload images from your computer or paste external URLs. Combine both seamlessly into one unified product gallery.
          </p>
        </div>
        <div className="image-count-badge">
          <span>{images.length} {images.length === 1 ? 'image' : 'images'}</span>
        </div>
      </div>

      {/* Storage Notification Banner if needed */}
      {storageNotice && (
        <div className="storage-notice-banner">
          <div className="storage-notice-content">
            <AlertCircle size={18} className="notice-icon" />
            <div>
              <strong>{storageNotice.title}</strong>
              <p>{storageNotice.message}</p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-xs copy-sql-btn"
            onClick={copyMigrationSql}
          >
            {copiedSql ? <Check size={13} /> : <Copy size={13} />}
            {copiedSql ? 'SQL Copied!' : 'Copy Supabase SQL'}
          </button>
        </div>
      )}

      {/* Segmented Option Selector */}
      <div className="image-option-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'upload'}
          className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <UploadCloud size={16} />
          <span>Option A: Upload Images</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'url'}
          className={`tab-btn ${activeTab === 'url' ? 'active' : ''}`}
          onClick={() => setActiveTab('url')}
        >
          <LinkIcon size={16} />
          <span>Option B: Add Image Using URL</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="tab-panel-container">
        {/* Option A: Local Upload */}
        {activeTab === 'upload' && (
          <div className="upload-tab-panel">
            <div
              className={`upload-dropzone ${isDragging ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden-file-input"
                onChange={(e) => handleFiles(e.target.files)}
                style={{ display: 'none' }}
              />
              <div className="dropzone-icon">
                <UploadCloud size={32} />
              </div>
              <p className="dropzone-primary-text">
                <strong>Click to upload</strong> or drag and drop image files
              </p>
              <p className="dropzone-hint">
                Supports JPG, JPEG, PNG, WEBP &bull; Max 5 MB per image &bull; Multiple uploads supported
              </p>
            </div>

            {/* Upload Queue Progress List */}
            {uploadQueue.length > 0 && (
              <div className="upload-queue-list">
                {uploadQueue.slice(-4).map((item) => (
                  <div key={item.id} className={`queue-item ${item.status}`}>
                    <div className="queue-item-info">
                      <span className="queue-file-name">{item.name}</span>
                      <span className="queue-file-size">({formatFileSize(item.size)})</span>
                    </div>

                    <div className="queue-item-status">
                      {item.status === 'uploading' && (
                        <div className="uploading-state">
                          <Loader2 size={13} className="spin-icon" />
                          <span>Uploading...</span>
                        </div>
                      )}
                      {item.status === 'completed' && (
                        <div className="completed-state">
                          <CheckCircle2 size={14} />
                          <span>{item.note || 'Uploaded'}</span>
                        </div>
                      )}
                      {item.status === 'error' && (
                        <div className="error-state-text" title={item.error}>
                          <AlertCircle size={14} />
                          <span>{item.error || 'Upload failed'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Option B: External URL */}
        {activeTab === 'url' && (
          <div className="url-tab-panel">
            <div className="url-input-row">
              <div className="url-input-wrap">
                <LinkIcon size={16} className="input-icon" />
                <input
                  type="url"
                  placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                  value={urlInput}
                  onChange={handleUrlInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddUrlImage();
                    }
                  }}
                />
              </div>

              <div className="url-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleTestUrl}
                  disabled={urlValidating || !urlInput.trim()}
                  title="Verify if image is accessible"
                >
                  {urlValidating ? <Loader2 size={14} className="spin-icon" /> : 'Preview'}
                </button>
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={handleAddUrlImage}
                  disabled={urlValidating || !urlInput.trim()}
                >
                  Add Image
                </button>
              </div>
            </div>

            {urlError && (
              <div className="field-error-msg">
                <AlertCircle size={14} />
                <span>{urlError}</span>
              </div>
            )}

            {/* Instant URL Preview Card */}
            {urlPreview && (
              <div className="url-preview-card">
                <img
                  src={urlPreview}
                  alt="Preview"
                  onError={() => setUrlError('Image failed to render. Please check the URL.')}
                />
                <div className="url-preview-info">
                  <span className="preview-label">Image accessible and verified</span>
                  <button
                    type="button"
                    className="btn btn-dark btn-xs"
                    onClick={handleAddUrlImage}
                  >
                    Add to Gallery Now
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {globalError && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          <span>{globalError}</span>
        </div>
      )}

      {/* Unified Gallery Section */}
      <div className="unified-gallery-wrapper">
        <div className="gallery-subheader">
          <h4>Unified Product Gallery ({images.length})</h4>
          <span className="gallery-tip">
            ★ Star indicates the Primary Image shown on product cards &amp; storefront listings. Use arrows to reorder.
          </span>
        </div>

        {images.length === 0 ? (
          <div className="empty-gallery-state">
            <div className="empty-icon"><ImageIcon size={32} /></div>
            <p><strong>No product images added yet</strong></p>
            <p className="small-muted">
              Select local files with "Option A: Upload Images" or paste image links with "Option B: Add Image Using URL".
            </p>
          </div>
        ) : (
          <div className="unified-gallery-grid">
            {images.map((item, index) => {
              const isPrimary = Boolean(item.is_primary);
              const isUpload = item.image_source === 'upload';

              return (
                <div
                  key={item.id || index}
                  className={`gallery-card ${isPrimary ? 'is-primary' : ''}`}
                >
                  {/* Thumbnail Image */}
                  <div className="card-thumb-wrap">
                    <img
                      src={item.image_url || FALLBACK_IMAGE}
                      alt={`Product view ${index + 1}`}
                      loading="lazy"
                      onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                    />

                    {/* Order Badge */}
                    <span className="order-badge">#{index + 1}</span>

                    {/* Source Badge */}
                    <span className={`source-badge ${isUpload ? 'badge-upload' : 'badge-url'}`}>
                      {isUpload ? <UploadCloud size={10} /> : <LinkIcon size={10} />}
                      {isUpload ? 'Upload' : 'URL'}
                    </span>

                    {/* Primary Badge */}
                    {isPrimary && (
                      <span className="primary-pill">
                        <Star size={11} fill="currentColor" /> Primary Cover
                      </span>
                    )}
                  </div>

                  {/* Card Controls */}
                  <div className="card-actions">
                    <button
                      type="button"
                      className={`btn-action-star ${isPrimary ? 'active' : ''}`}
                      onClick={() => handleSetPrimary(index)}
                      title={isPrimary ? 'Current Primary Image' : 'Set as Primary Image'}
                    >
                      <Star size={14} fill={isPrimary ? 'currentColor' : 'none'} />
                      <span>{isPrimary ? 'Primary' : 'Make Primary'}</span>
                    </button>

                    <div className="reorder-group">
                      <button
                        type="button"
                        className="btn-reorder"
                        disabled={index === 0}
                        onClick={() => handleMove(index, -1)}
                        title="Move Left / Earlier"
                      >
                        <ArrowLeft size={13} />
                      </button>

                      <button
                        type="button"
                        className="btn-reorder"
                        disabled={index === images.length - 1}
                        onClick={() => handleMove(index, 1)}
                        title="Move Right / Later"
                      >
                        <ArrowRight size={13} />
                      </button>

                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => handleRemove(index)}
                        title="Remove Image"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
