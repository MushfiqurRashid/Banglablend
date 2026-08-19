"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

const featuredStories = [
  {
    category: "Food Heritage",
    title: "The Masalas That Shape a Cuisine",
    description:
      "Travel from Bengal's trading history to the distinctive spice traditions of Chattogram, Sylhet, Rajshahi and Old Dhaka.",
    href: "/discover-bangladesh/food-heritage/bangladesh-spice-heritage-regional-masala",
    image: "/images/stories/spice-heritage/spice-heritage-hero.webp",
    imageAlt: "A stone mortar surrounded by bowls of whole and ground spices",
  },
  {
    category: "Ingredient Stories",
    title: "Six Ingredients, Six Stories",
    description:
      "Follow turmeric, red chilli, ginger, garlic, mustard and onion from field and market to the family kitchen.",
    href: "/discover-bangladesh/ingredient-stories/six-ingredients-that-shape-the-bangladeshi-kitchen",
    image: "/images/stories/ingredient-stories/ingredients-hero.webp",
    imageAlt: "A market table filled with chillies, turmeric, garlic, onions and whole spices",
  },
  {
    category: "Food Heritage",
    title: "Bangladesh, District by District",
    description: "Fourteen places and fourteen ways of reading Bangladesh through food, landscape and family memory.",
    href: "/discover-bangladesh/food-heritage/bangladesh-food-heritage-by-district",
    image: "/images/stories/district-food/district-food-hero.webp",
    imageAlt: "A table of colourful Bangladeshi dishes served in earthen bowls",
  },
  {
    category: "Festivals & Seasons",
    title: "Winter Pitha Traditions",
    description: "Traditional pithas, ingredients and stories that warm every Bengali winter.",
    href: "/discover-bangladesh/festivals-seasons",
    image: "/images/recipe-masala-chai.webp",
    imageAlt: "Warm spiced tea served in earthen cups",
  },
  {
    category: "Farmer & Sourcing Stories",
    title: "From Farm to Jar",
    description: "Follow the journey of our spices from local farms to your kitchen.",
    href: "/discover-bangladesh/farmer-sourcing-stories",
    image: "/images/our-story-impact.webp",
    imageAlt: "A Bangladeshi farmer harvesting leafy greens",
  },
] as const;

export function DiscoverFeaturedStories() {
  const railRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);

  const updateRailState = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    setIsScrollable(rail.scrollWidth - rail.clientWidth > 4);
    const cards = Array.from(rail.querySelectorAll<HTMLElement>("[data-featured-card]"));
    if (!cards.length) return;

    const railLeft = rail.getBoundingClientRect().left;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - railLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    updateRailState();
    const resizeObserver = new ResizeObserver(updateRailState);
    resizeObserver.observe(rail);
    return () => resizeObserver.disconnect();
  }, [updateRailState]);

  function scrollToStory(index: number) {
    const rail = railRef.current;
    const cards = rail
      ? Array.from(rail.querySelectorAll<HTMLElement>("[data-featured-card]"))
      : [];
    const card = cards[index];
    if (!rail || !card) return;

    rail.scrollTo({ left: card.offsetLeft - rail.offsetLeft, behavior: "smooth" });
    setActiveIndex(index);
  }

  return (
    <div className="discover-featured-carousel">
      {isScrollable ? (
        <button
          type="button"
          className="discover-carousel-arrow discover-carousel-arrow-previous"
          aria-label="Show previous featured story"
          disabled={activeIndex === 0}
          onClick={() => scrollToStory(Math.max(0, activeIndex - 1))}
        >
          <ArrowLeft size={21} />
        </button>
      ) : null}

      <div className="discover-featured-rail" ref={railRef} onScroll={updateRailState}>
        {featuredStories.map((story) => (
          <article className="discover-featured-card" data-featured-card key={story.title}>
            <Link
              href={story.href}
              className="discover-featured-media"
              aria-label={`Read ${story.title}`}
            >
              <Image
                src={story.image}
                alt={story.imageAlt}
                fill
                sizes="(max-width: 600px) 82vw, (max-width: 800px) 44vw, 20vw"
              />
            </Link>
            <div className="discover-featured-body">
              <span>{story.category}</span>
              <h3>
                <Link href={story.href}>{story.title}</Link>
              </h3>
              <p>{story.description}</p>
              <Link href={story.href} className="discover-read-link">
                Read more
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
      </div>

      {isScrollable ? (
        <>
          <button
            type="button"
            className="discover-carousel-arrow discover-carousel-arrow-next"
            aria-label="Show next featured story"
            disabled={activeIndex === featuredStories.length - 1}
            onClick={() => scrollToStory(Math.min(featuredStories.length - 1, activeIndex + 1))}
          >
            <ArrowRight size={21} />
          </button>
          <div className="discover-carousel-dots" aria-label="Choose a featured story">
            {featuredStories.map((story, index) => (
              <button
                type="button"
                className={index === activeIndex ? "is-active" : undefined}
                aria-label={`Show ${story.title}`}
                aria-current={index === activeIndex ? "true" : undefined}
                key={story.title}
                onClick={() => scrollToStory(index)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
