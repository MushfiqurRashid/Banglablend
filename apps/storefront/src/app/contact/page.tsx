import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
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
import { siteConfig } from "@/config/site";
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

function ContactMapIllustration() {
  return (
    <div
      className="contact-map-illustration"
      role="img"
      aria-label="Stylised location map for Dhaka, Bangladesh"
    >
      <svg viewBox="0 0 900 320" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
        <rect width="900" height="320" fill="#eee7dc" />
        <path
          d="M0 225C115 201 181 248 294 216C405 184 474 199 563 242C675 296 764 251 900 263V320H0Z"
          fill="#dce8e5"
        />
        <g fill="#e4dac9">
          <path d="M38 34h138v66H38zM210 20h118v82H210zM366 31h128v58H366z" />
          <path d="M538 25h138v83H538zM714 35h148v55H714z" />
          <path d="M60 134h108v61H60zM208 129h144v67H208zM402 121h118v74H402z" />
          <path d="M558 138h130v55H558zM725 119h113v79H725z" />
        </g>
        <g fill="none" stroke="#fffdf8" strokeWidth="16" strokeLinecap="round">
          <path d="M-25 77C117 88 198 124 297 162C398 201 499 193 609 157C713 122 800 126 926 152" />
          <path d="M146-32C190 49 220 109 234 170C245 220 226 272 203 345" />
          <path d="M576-25C543 68 526 130 538 196C548 252 595 293 646 345" />
        </g>
        <g fill="none" stroke="#c9bfae" strokeWidth="3" strokeLinecap="round">
          <path d="M-10 42L373 317M73 321L454-5M298 322L725-18M471 324L889 49" />
          <path d="M-15 185L916 51M6 284L899 185M29 115L874 306" />
        </g>
        <g fill="#6f8060">
          <circle cx="92" cy="155" r="8" />
          <circle cx="704" cy="74" r="7" />
          <circle cx="785" cy="220" r="9" />
        </g>
      </svg>
      <span className="contact-map-pin" aria-hidden="true">
        <MapPin size={31} strokeWidth={1.8} />
      </span>
      <span className="contact-map-label">Dhaka</span>
    </div>
  );
}

export default function ContactPage() {
  const contactDetails = [
    {
      title: "Head Office",
      content: (
        <>
          Dhaka, Bangladesh
          <br />
          Visits by appointment
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
      content: siteConfig.contactEmail,
      href: `mailto:${siteConfig.contactEmail}`,
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
              a partnership opportunity or anything else—we’re here to help.
            </p>
          </div>
          <div className="contact-hero-media">
            <Image
              src="/images/our-story-hero.png"
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

        <section className="contact-find" aria-labelledby="find-us-title">
          <ContactMapIllustration />
          <div className="contact-find-copy">
            <Leaf className="contact-find-leaf" size={126} strokeWidth={0.75} aria-hidden="true" />
            <div>
              <h2 id="find-us-title">Find us</h2>
              <p>Connect with our team in Dhaka. Meetings are arranged by appointment.</p>
              <a
                className="contact-button contact-button-outline"
                href="https://www.google.com/maps/search/?api=1&query=Dhaka%2C+Bangladesh"
                target="_blank"
                rel="noreferrer"
              >
                Get directions
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>
      </PageContainer>
    </div>
  );
}
