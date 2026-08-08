import Image from "next/image";
import { NewsletterForm } from "@/components/forms/newsletter-form";

export function NewsletterSection() {
  return (
    <section className="newsletter-band">
      <div className="shell newsletter-inner">
        <div className="newsletter-copy">
          <span className="eyebrow">From our kitchen</span>
          <h2>Flavors and stories from Bangladesh</h2>
          <p>
            A considered note on regional food, ingredients and the people who keep their stories
            alive.
          </p>
          <div className="newsletter-topics" aria-label="Newsletter topics">
            <span>Recipes</span>
            <span>Regional stories</span>
            <span>Product notes</span>
          </div>
        </div>

        <div className="newsletter-card">
          <div className="newsletter-card-media">
            <Image
              src="/images/our-story-notes.webp"
              alt="A handwritten recipe notebook beside tea and whole spices"
              fill
              sizes="(max-width: 900px) 100vw, 45vw"
            />
            <span>Notes from Bangladesh</span>
          </div>
          <div className="newsletter-card-body">
            <span className="newsletter-card-kicker">A letter worth opening</span>
            <h3>Join the table.</h3>
            <p>Occasional recipes, product notes and careful regional stories. No noise.</p>
            <NewsletterForm />
            <small>Thoughtful notes only. Unsubscribe whenever you like.</small>
          </div>
        </div>
      </div>
    </section>
  );
}
