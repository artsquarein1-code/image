import Image from "next/image";

const uploadedPhotos = [
  {
    src: "/images/products/blue-floral-pooja-thali.jpeg",
    alt: "Blue floral pooja thali with gold-toned ritual bowls",
    label: "Pooja thali",
  },
  {
    src: "/images/products/burgundy-floral-pooja-thali.jpeg",
    alt: "Burgundy handmade pooja thali with floral details and gold-toned bowls",
    label: "Pooja thali",
  },
  {
    src: "/images/products/emerald-resin-wall-clock.jpeg",
    alt: "Emerald green resin wall clock with gold Roman numerals",
    label: "Wall clocks",
  },
  {
    src: "/images/products/mint-mirror-art-panel.jpeg",
    alt: "Mint green handmade mirror art panel with a circular pattern",
    label: "Mirror art",
  },
  {
    src: "/images/products/orange-gold-pooja-thali.jpeg",
    alt: "Orange and gold pooja thali with decorative floral accents",
    label: "Pooja thali",
  },
  {
    src: "/images/products/pink-floral-pooja-thali.jpeg",
    alt: "Pink floral pooja thali with gold-toned ritual bowls",
    label: "Pooja thali",
  },
  {
    src: "/images/products/red-geometric-art-panel.jpeg",
    alt: "Red geometric handmade art panel with mirror details",
    label: "Decorative art",
  },
];

export default function UploadedPhotoGallery() {
  return (
    <section className="uploaded-gallery" aria-labelledby="uploaded-gallery-title">
      <div className="uploaded-gallery-heading">
        <span className="eyebrow">From the ART SQUARE collection</span>
        <h2 id="uploaded-gallery-title">Handmade, in every detail.</h2>
        <p>A closer look at the pieces shared with us by the ART SQUARE studio.</p>
      </div>
      <div className="uploaded-gallery-grid">
        {uploadedPhotos.map((photo) => (
          <figure className="uploaded-gallery-card" key={photo.src}>
            <div className="uploaded-gallery-photo">
              <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 640px) 50vw, (max-width: 900px) 33vw, 25vw" />
            </div>
            <figcaption>{photo.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
