import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Handshake,
  Leaf,
  Mail,
  MapPin,
  MessageCircleMore,
  PackageCheck,
  ShoppingBag,
  Tags,
} from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageContainer } from "@/components/layout/page-container";
import "./contact.css";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Bangla Blend about products, orders, partnerships, wholesale and feedback.",
};

const helpTopics = [
  {
    title: "We’re Here to Help",
    copy: "Got a question? Find helpful answers in our customer guide.",
    href: "/faq",
    icon: MessageCircleMore,
  },
  {
    title: "Order Support",
    copy: "Need help with your order? Keep your order number close by.",
    href: "/account/orders",
    icon: PackageCheck,
  },
  {
    title: "Partnerships",
    copy: "Let’s work together to bring Bangla Blend to more tables.",
    href: "/wholesale",
    icon: Handshake,
  },
  {
    title: "Wholesale Inquiries",
    copy: "Interested in bulk orders? Tell us about your business.",
    href: "/wholesale",
    icon: Tags,
  },
  {
    title: "Feedback",
    copy: "We value your feedback, ideas and thoughtful suggestions.",
    href: "#contact-form",
    icon: Leaf,
  },
] as const;

function ContactOrnament() {
  return (
    <span className="contact-ornament" aria-hidden="true">
      <span />
    </span>
  );
}
export default function ContactPage() {
  const contactDetails = [
    {
      title: "Office Location",
      content: (
        <>
          Road 23, Gulshan 1
          <br />
          Dhaka 1212, Bangladesh
        </>
      ),
      href: undefined,
      icon: MapPin,
    },
    {
      title: "Order Support",
      content: (
        <>
          Include your order number
          <br />
          when sending a message
        </>
      ),
      href: "#contact-form",
      icon: ShoppingBag,
    },
    {
      title: "Email",
      content: "banglablend@gmail.com",
      href: "mailto:banglablend@gmail.com",
      icon: Mail,
    },
    {
      title: "Response Time",
      content: (
        <>
          Messages are handled during
          <br />
          Bangladesh business hours
        </>
      ),
      href: undefined,
      icon: Clock3,
    },
  ] as const;

  return (
    <div className="contact-page">
      <section className="contact-hero" aria-labelledby="contact-title">
        <PageContainer className="contact-hero-grid">
          <div className="contact-hero-copy">
            <Breadcrumbs items={[{ label: "Contact" }]} />
            <h1 id="contact-title">Get in touch</h1>
            <ContactOrnament />
            <p>
              We’d love to hear from you. Whether you have a question about our products, an order,
              a partnership opportunity or anything else. We’re here to help.
            </p>
          </div>
          <div className="contact-hero-media">
            <Image
              src="/images/our-story-hero.webp"
              alt="Turmeric, dried chilli, mustard seeds and fresh curry leaves arranged on a warm stone surface"
              fill
              priority
              sizes="(max-width: 780px) 100vw, 58vw"
            />
          </div>
        </PageContainer>
      </section>

      <PageContainer className="contact-content">
        <section className="contact-primary-grid" aria-label="Contact Bangla Blend">
          <div className="contact-form-panel" id="contact-form">
            <h2>Send us a message</h2>
            <p>Fill out the form below and we’ll get back to you as soon as possible.</p>
            <ContactForm />
          </div>

          <aside className="contact-info-card" aria-labelledby="contact-information-title">
            <h2 id="contact-information-title">Contact information</h2>
            <div className="contact-info-list">
              {contactDetails.map(({ title, content, href, icon: Icon }) => (
                <div className="contact-info-row" key={title}>
                  <span className="contact-icon-circle" aria-hidden="true">
                    <Icon size={24} strokeWidth={1.55} />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    {href ? <a href={href}>{content}</a> : <p>{content}</p>}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <nav className="contact-help-grid" aria-label="Contact help topics">
          {helpTopics.map(({ title, copy, href, icon: Icon }) => (
            <Link className="contact-help-item" href={href} key={title} aria-label={title}>
              <span className="contact-icon-circle" aria-hidden="true">
                <Icon size={25} strokeWidth={1.45} />
              </span>
              <strong>{title}</strong>
              <span>{copy}</span>
              <ArrowRight className="contact-help-arrow" size={16} aria-hidden="true" />
            </Link>
          ))}
        </nav>

      </PageContainer>
    </div>
  );
}
