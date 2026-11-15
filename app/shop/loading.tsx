import styles from "./shop.module.css";

export default function ShopLoading() {
  return (
    <main className={styles.page} aria-busy="true" aria-label="Loading shop">
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className="eyebrow">ART SQUARE</span>
          <h1>The Art Square collection</h1>
          <p>Loading the latest published pieces.</p>
        </div>
      </section>
      <section className={styles.catalog}>
        <span className="sr-only">Loading products</span>
        <div className={styles.skeletonGrid} aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => (
            <div className={styles.skeletonCard} key={index} />
          ))}
        </div>
      </section>
    </main>
  );
}
