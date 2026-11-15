"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import styles from "./product-gallery.module.css";

type ProductPhoto = {
  id: string;
  public_url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
};

export default function ProductGallery({ photos, productName }: { photos: ProductPhoto[]; productName: string }) {
  const [activePhoto, setActivePhoto] = useState(photos[0]);
  const dialogRef = useRef<HTMLDialogElement>(null);

  if (!activePhoto) {
    return <div className={styles.empty}>Product photography coming soon</div>;
  }

  return (
    <div className={styles.gallery}>
      <button
        className={styles.mainPhoto}
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`View full-size image of ${activePhoto.alt_text || productName}`}
      >
        <Image
          src={activePhoto.public_url}
          alt={activePhoto.alt_text || productName}
          fill
          priority
          sizes="(max-width: 900px) 100vw, 54vw"
          unoptimized
        />
        <span className={styles.zoomHint}>View full size</span>
      </button>
      {photos.length > 1 && (
        <div className={styles.thumbnails} role="group" aria-label="Product images">
          {photos.map((photo, index) => (
            <button
              className={`${styles.thumbnail} ${activePhoto.id === photo.id ? styles.active : ""}`}
              key={photo.id}
              type="button"
              aria-label={`Show image ${index + 1} of ${photos.length}`}
              aria-pressed={activePhoto.id === photo.id}
              onClick={() => setActivePhoto(photo)}
            >
              <Image src={photo.public_url} alt="" fill sizes="100px" unoptimized />
            </button>
          ))}
        </div>
      )}
      <dialog className={styles.zoomDialog} ref={dialogRef} aria-label={`${productName} full-size image`}>
        <button className={styles.closeButton} type="button" onClick={() => dialogRef.current?.close()} aria-label="Close full-size image">
          Close
        </button>
        <Image
          src={activePhoto.public_url}
          alt={activePhoto.alt_text || productName}
          fill
          sizes="100vw"
          unoptimized
        />
      </dialog>
    </div>
  );
}
