import { NewsletterForm } from "@/components/forms/newsletter-form";

export function NewsletterSection() {
  return (
    <section className="newsletter-band">
      <div className="shell newsletter-inner">
        <div><span className="eyebrow">From our kitchen</span><h2>Flavors and stories from Bangladesh</h2></div>
        <div><p>Occasional recipes, product notes and careful regional stories. No noise.</p><NewsletterForm /></div>
      </div>
    </section>
  );
}
