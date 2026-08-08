import Image from "next/image";
import {
  Amphora,
  Check,
  HandCoins,
  Leaf,
  ShieldCheck,
  Sprout,
  Store,
  X,
  type LucideIcon,
} from "lucide-react";
import styles from "./why-bangla-blend.module.css";

interface ComparisonRow {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  banglaBlend: string;
  conventional: string;
  other: string;
}
const comparisonRows: ComparisonRow[] = [
  {
    icon: Leaf,
    title: "Single Origin",
    banglaBlend: "Sourced directly from our partner farms",
    conventional: "Never",
    other: "Usually from bulk importers",
  },
  {
    icon: HandCoins,
    title: "Pay Farmers Living Wages",
    banglaBlend: "3x – 5x the commodity price",
    conventional: "Never",
    other: "Very little transparency",
  },
  {
    icon: Sprout,
    title: "Small-Batch Production",
    subtitle: "from freshly harvested and imported ingredients",
    banglaBlend: "Produced in small batches from freshly harvested and imported ingredients",
    conventional: "2–3 years from harvest",
    other: "No transparency",
  },
  {
    icon: ShieldCheck,
    title: "Highest Quality Standards",
    banglaBlend: "No pesticides, no fillers, always lab tested",
    conventional: "Never",
    other: "Cheap filler ingredients",
  },
];

export function WhyBanglaBlend() {
  return (
    <section
      className={styles.section}
      aria-labelledby="why-bangla-blend-title"
      data-testid="why-bangla-blend"
    >
      <div className={styles.frame}>
        <header className={styles.heading}>
          <span className={styles.eyebrow} aria-hidden="true" />
          <h2 id="why-bangla-blend-title">Why Bangla Blend</h2>
          <p>Real ingredients. Honest sourcing. Flavour with purpose.</p>
        </header>

        <div className={styles.tableFrame}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>
              A comparison of Bangla Blend, a conventional grocery store and other spice
              companies across sourcing, wages, production and quality standards.
            </caption>
            <thead>
              <tr>
                <th scope="col">
                  <span className={styles.columnLabel}>What Matters</span>
                </th>
                <th scope="col" className={styles.brandColumn}>
                  <span className={styles.brandHeading}>
                    <span className={styles.brandBadge}>
                      <Image
                        src="/images/bangla-blend-logo-final-v3.webp"
                        alt=""
                        width={54}
                        height={54}
                      />
                    </span>
                    <strong>Bangla Blend</strong>
                    <small>The Taste of Bangladesh</small>
                  </span>
                </th>
                <th scope="col">
                  <span className={styles.otherHeading}>
                    <span className={styles.conventionalIcon}>
                      <Store size={26} aria-hidden="true" />
                    </span>
                    <strong className={styles.conventionalLabel}>Conventional Grocery Store</strong>
                  </span>
                </th>
                <th scope="col">
                  <span className={styles.otherHeading}>
                    <span className={styles.otherIcon}>
                      <Amphora size={26} aria-hidden="true" />
                    </span>
                    <strong className={styles.otherLabel}>Other Spice Companies</strong>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(({ icon: Icon, title, subtitle, banglaBlend, conventional, other }) => (
                <tr key={title}>
                  <th scope="row">
                    <span className={styles.rowHeading}>
                      <span className={styles.rowIcon}>
                        <Icon size={19} aria-hidden="true" />
                      </span>
                      <span>
                        <strong>{title}</strong>
                        {subtitle ? <small>{subtitle}</small> : null}
                      </span>
                    </span>
                  </th>
                  <td className={styles.brandColumn} data-label="Bangla Blend">
                    <span className={`${styles.cellContent} ${styles.brandContent}`}>
                      <span className={styles.checkIcon}>
                        <Check size={16} aria-hidden="true" />
                      </span>
                      <span>{banglaBlend}</span>
                    </span>
                  </td>
                  <td data-label="Conventional Grocery Store">
                    <span className={styles.cellContent}>
                      <span className={styles.crossIcon}>
                        <X size={16} aria-hidden="true" />
                      </span>
                      <span>{conventional}</span>
                    </span>
                  </td>
                  <td data-label="Other Spice Companies">
                    <span className={styles.cellContent}>
                      <span className={styles.questionIcon}>?</span>
                      <span>{other}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className={styles.closing}>
          <span aria-hidden="true" />
          Honest from the source. Crafted for your kitchen.
          <span aria-hidden="true" />
        </p>
      </div>
    </section>
  );
}
