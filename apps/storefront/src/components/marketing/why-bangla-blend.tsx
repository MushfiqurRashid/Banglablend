import Image from "next/image";
import {
  ArrowRight,
  Check,
  CookingPot,
  ListChecks,
  MapPinned,
  Minus,
  SearchCheck,
  Sparkles,
  Store,
} from "lucide-react";
import styles from "./why-bangla-blend.module.css";

const comparisonRows = [
  {
    icon: MapPinned,
    title: "Regional purpose",
    banglaBlend: "Built around Bangladeshi recipes and regional flavour traditions.",
    typical: "Designed for broad, general use.",
    guide: "Look for a blend with a clear culinary point of view.",
  },
  {
    icon: Sparkles,
    title: "Craft approach",
    banglaBlend: "Careful batches guide how each blend is developed.",
    typical: "Consistency designed for distribution at scale.",
    guide: "Choose a process that matches the way you want to cook.",
  },
  {
    icon: ListChecks,
    title: "Product clarity",
    banglaBlend: "Sizes, ingredients, storage and serving guidance stay together.",
    typical: "Usually focused on essential pack information.",
    guide: "Choose enough detail to cook and store with confidence.",
  },
  {
    icon: CookingPot,
    title: "Beyond the jar",
    banglaBlend: "Recipes, pairings and regional stories connect product to plate.",
    typical: "Usually presented as a standalone pantry staple.",
    guide: "Look for practical inspiration you will genuinely use.",
  },
] as const;

export function WhyBanglaBlend() {
  return (
    <section
      className={styles.section}
      aria-labelledby="why-bangla-blend-title"
      data-testid="why-bangla-blend"
    >
      <div className={styles.frame}>
        <header className={styles.heading}>
          <span className={styles.eyebrow}>The Bangla Blend standard</span>
          <h2 id="why-bangla-blend-title">Why Bangla Blend</h2>
          <p>Regional flavour. Thoughtful craft. Useful cooking guidance.</p>
        </header>

        <div className={styles.tableFrame}>
          <table className={styles.table}>
            <caption className={styles.srOnly}>
              A comparison of the Bangla Blend approach, a typical spice shelf and what
              shoppers can look for.
            </caption>
            <thead>
              <tr>
                <th scope="col">
                  <span className={styles.columnLabel}>What matters</span>
                </th>
                <th scope="col" className={styles.brandColumn}>
                  <span className={styles.brandHeading}>
                    <Image
                      src="/images/bangla-blend-logo-final-v3.png"
                      alt=""
                      width={54}
                      height={54}
                    />
                    <span>
                      <strong>Bangla Blend</strong>
                      <small>Purposeful regional flavour</small>
                    </span>
                  </span>
                </th>
                <th scope="col">
                  <span className={styles.otherHeading}>
                    <Store size={25} aria-hidden="true" />
                    <span>
                      <strong>Typical spice shelf</strong>
                      <small>The familiar baseline</small>
                    </span>
                  </span>
                </th>
                <th scope="col">
                  <span className={styles.otherHeading}>
                    <SearchCheck size={25} aria-hidden="true" />
                    <span>
                      <strong>Your buying guide</strong>
                      <small>A useful way to choose</small>
                    </span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(({ icon: Icon, title, banglaBlend, typical, guide }) => (
                <tr key={title}>
                  <th scope="row">
                    <span className={styles.rowHeading}>
                      <span className={styles.rowIcon}>
                        <Icon size={19} aria-hidden="true" />
                      </span>
                      <strong>{title}</strong>
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
                  <td data-label="Typical spice shelf">
                    <span className={styles.cellContent}>
                      <span className={styles.neutralIcon}>
                        <Minus size={16} aria-hidden="true" />
                      </span>
                      <span>{typical}</span>
                    </span>
                  </td>
                  <td data-label="Your buying guide">
                    <span className={styles.cellContent}>
                      <span className={styles.guideIcon}>
                        <ArrowRight size={16} aria-hidden="true" />
                      </span>
                      <span>{guide}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className={styles.closing}>
          <span aria-hidden="true" />
          Honest about the details. Thoughtful about the flavour.
          <span aria-hidden="true" />
        </p>
      </div>
    </section>
  );
}
