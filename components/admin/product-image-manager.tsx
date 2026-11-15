"use client";

import Image from "next/image";
import { useState, type DragEvent } from "react";
import styles from "./admin-management.module.css";

type Photo = {
  id: string;
  product_id: string;
  storage_path: string;
  public_url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
  file_size: number | null;
  mime_type: string | null;
};

type UploadProgress = { current: number; total: number; fileName: string } | null;

export default function ProductImageManager({
  productName,
  photos,
  pendingFiles,
  previewUrls,
  busy,
  uploadProgress,
  uploadFailed,
  onFiles,
  onRemovePending,
  onMove,
  onPrimary,
  onRemove,
  onAltText,
}: {
  productName: string;
  photos: Photo[];
  pendingFiles: File[];
  previewUrls: string[];
  busy: boolean;
  uploadProgress: UploadProgress;
  uploadFailed: boolean;
  onFiles: (files: File[]) => void;
  onRemovePending: (index: number) => void;
  onMove: (photo: Photo, direction: -1 | 1) => void;
  onPrimary: (photo: Photo) => void;
  onRemove: (photo: Photo) => void;
  onAltText: (photo: Photo, value: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (!busy) onFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <section className={`image-manager ${styles.imageManager}`} aria-labelledby="product-images-heading">
      <h3 id="product-images-heading">Product images</h3>
      <p className="admin-note">JPEG, PNG, or WebP up to 10 MiB each. Photos are stored in the persistent product-images bucket.</p>
      <label
        className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""}`}
        htmlFor="upload"
        onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { const nextTarget = event.relatedTarget; if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) setIsDragging(false); }}
        onDrop={handleDrop}
      >
        <span className={styles.dropTitle}>Drop product photos here</span>
        <span className={styles.dropCopy}>or choose photos from your device</span>
        <span className={styles.chooseButton}>Choose photos</span>
      </label>
      <input
        className={styles.visuallyHidden}
        id="upload"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={busy}
        aria-describedby="upload-help"
        onChange={(event) => {
          onFiles(Array.from(event.currentTarget.files ?? []));
          event.currentTarget.value = "";
        }}
      />
      <p className={styles.fileHint} id="upload-help">Select multiple photos at once. You can add more photos in another selection.</p>

      {uploadProgress && (
        <div className={styles.uploadProgress} role="status" aria-live="polite">
          <div className={styles.progressHeading}>
            <span>Uploading image {uploadProgress.current} of {uploadProgress.total}</span>
            <span className={styles.progressFile}>{uploadProgress.fileName}</span>
          </div>
          <progress value={uploadProgress.current - 1} max={uploadProgress.total} aria-label={`Uploading image ${uploadProgress.current} of ${uploadProgress.total}`} />
        </div>
      )}
      {uploadFailed && <p className={styles.uploadError} role="alert">Upload failed. Your selected photos are still queued so you can retry.</p>}

      <div className={`image-list ${styles.imageList}`}>
        {pendingFiles.map((file, index) => (
          <article className={`image-row ${styles.imageRow}`} key={`${file.name}-${file.size}-${index}`}>
            <Image src={previewUrls[index]} alt={`Preview of ${file.name}`} width={64} height={72} unoptimized />
            <div className={styles.imageInfo}>
              <strong>{file.name}</strong>
              <small>{file.type} · {Math.ceil(file.size / 1024)} KB · Queued</small>
            </div>
            <button className="admin-button" type="button" disabled={busy} aria-label={`Remove ${file.name} from upload queue`} onClick={() => onRemovePending(index)}>Remove</button>
          </article>
        ))}
        {photos.map((photo, index) => (
          <article className={`image-row ${styles.imageRow}`} key={photo.id}>
            <Image src={photo.public_url} alt={photo.alt_text || productName} width={64} height={72} unoptimized />
            <div className={styles.imageInfo}>
              <strong>{photo.is_primary ? "Primary image" : `Gallery image ${index + 1}`}</strong>
              <small>{photo.mime_type || "Image"}{photo.file_size ? ` · ${Math.ceil(photo.file_size / 1024)} KB` : ""}</small>
              <label className={styles.altField}>
                <span>Alt text</span>
                <input
                  aria-label={`Alt text for ${photo.alt_text || productName}`}
                  type="text"
                  maxLength={250}
                  defaultValue={photo.alt_text}
                  placeholder={productName}
                  onBlur={(event) => {
                    if (event.currentTarget.value !== photo.alt_text) onAltText(photo, event.currentTarget.value.trim());
                  }}
                />
              </label>
            </div>
            <div className={`image-actions ${styles.imageActions}`}>
              <button type="button" className="admin-button" aria-label={`Move ${photo.alt_text || `image ${index + 1}`} up`} disabled={busy || index === 0} onClick={() => onMove(photo, -1)}>↑</button>
              <button type="button" className="admin-button" aria-label={`Move ${photo.alt_text || `image ${index + 1}`} down`} disabled={busy || index === photos.length - 1} onClick={() => onMove(photo, 1)}>↓</button>
              <button type="button" className="admin-button" onClick={() => onPrimary(photo)} disabled={busy || photo.is_primary}>Make primary</button>
              <button type="button" className="admin-button danger" onClick={() => onRemove(photo)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
