export interface ComingSoonPageConfig {
  title: string;
  eyebrow: string;
  description: string;
  image: string;
  imageAlt: string;
  parent: {
    label: string;
    href: string;
  };
}

export const discoverComingSoonPages = {
  "food-heritage": {
    title: "Food Heritage",
    eyebrow: "Discover Bangladesh",
    description:
      "A considered archive of dishes, rituals and living food memory is taking shape. We are gathering every story with the context and care it deserves.",
    image: "/images/home-hero-hathajari.jpg",
    imageAlt: "A rich arrangement of Bangladeshi spices and ingredients",
    parent: { label: "Discover Bangladesh", href: "/discover-bangladesh" },
  },
  "regional-flavours": {
    title: "Regional Flavours",
    eyebrow: "Discover Bangladesh",
    description:
      "A journey through Bangladesh’s distinct regional kitchens is in preparation, shaped by place, season and the people who keep these flavours alive.",
    image: "/images/bangladesh-river-landscape.png",
    imageAlt: "A calm river landscape in Bangladesh",
    parent: { label: "Discover Bangladesh", href: "/discover-bangladesh" },
  },
  "ingredient-stories": {
    title: "Ingredient Stories",
    eyebrow: "Discover Bangladesh",
    description:
      "We are tracing the origins, character and kitchen life of remarkable ingredients, one carefully reviewed story at a time.",
    image: "/images/hero-spice-still-life.png",
    imageAlt: "Bangla Blend jars beside bowls of whole and ground spices",
    parent: { label: "Discover Bangladesh", href: "/discover-bangladesh" },
  },
  "farmer-sourcing-stories": {
    title: "Farmer & Sourcing Stories",
    eyebrow: "Discover Bangladesh",
    description:
      "Field notes and verified sourcing stories are being prepared to introduce the hands, places and practices behind the ingredients.",
    image: "/images/campaign/chilli-sourcing.jpg",
    imageAlt: "A grower gathering red chillies dried in the sun",
    parent: { label: "Discover Bangladesh", href: "/discover-bangladesh" },
  },
  "cooking-guides": {
    title: "Cooking Guides",
    eyebrow: "Discover Bangladesh",
    description:
      "Practical, generous guidance from the Bangla Blend kitchen is on the way, developed to make every technique feel clear and rewarding.",
    image: "/images/recipe-grilled-hilsa.png",
    imageAlt: "Grilled hilsa with green chillies and lime",
    parent: { label: "Discover Bangladesh", href: "/discover-bangladesh" },
  },
  "festivals-seasons": {
    title: "Festivals & Seasons",
    eyebrow: "Discover Bangladesh",
    description:
      "A seasonal collection of celebrations, table traditions and special-occasion flavours is being thoughtfully assembled.",
    image: "/images/recipe-masala-chai.png",
    imageAlt: "Masala chai served in handmade clay cups",
    parent: { label: "Discover Bangladesh", href: "/discover-bangladesh" },
  },
  "behind-bangla-blend": {
    title: "Behind Bangla Blend",
    eyebrow: "Discover Bangladesh",
    description:
      "Notes from our kitchen, studio and growing community are coming together for a closer look at how Bangla Blend is made.",
    image: "/images/our-story-craft.png",
    imageAlt: "Hands preparing spices with a traditional stone mortar",
    parent: { label: "Discover Bangladesh", href: "/discover-bangladesh" },
  },
} satisfies Record<string, ComingSoonPageConfig>;

export const giftComingSoonPages = {
  "gift-sets": {
    title: "Gift Sets",
    eyebrow: "The art of giving",
    description:
      "A refined collection of Bangla Blend favourites is being composed for generous tables, meaningful moments and beautifully considered gifting.",
    image: "/images/gifts-hero.png",
    imageAlt: "A premium Bangla Blend gift presentation",
    parent: { label: "Gifts", href: "/gifts" },
  },
  "regional-gifts": {
    title: "Regional Gifts",
    eyebrow: "The art of giving",
    description:
      "We are curating gift stories inspired by the regions of Bangladesh, bringing together distinctive flavours, craft and a true sense of place.",
    image: "/images/bangladesh-river-landscape.png",
    imageAlt: "A river landscape evoking the regions of Bangladesh",
    parent: { label: "Gifts", href: "/gifts" },
  },
  corporate: {
    title: "Corporate Gifting",
    eyebrow: "Gifting with purpose",
    description:
      "A more personal approach to business gifting is in development, with considered presentation, flexible quantities and thoughtful support.",
    image: "/images/gifts/presentation-trio.jpg",
    imageAlt: "Three carefully presented Bangla Blend gifts",
    parent: { label: "Gifts", href: "/gifts" },
  },
} satisfies Record<string, ComingSoonPageConfig>;

export const giftsComingSoonPage = {
  title: "Gifts",
  eyebrow: "The art of giving",
  description:
    "A refined gift shop of Bangla Blend favourites is being composed for generous tables, meaningful celebrations and beautifully considered giving.",
  image: "/images/gifts-hero.png",
  imageAlt: "A premium Bangla Blend gift presentation",
  parent: { label: "Home", href: "/" },
} satisfies ComingSoonPageConfig;

export const recipeComingSoonPages = {
  recipes: {
    title: "Recipe Library",
    eyebrow: "The Bangla Blend kitchen",
    description:
      "A generous library of tested recipes, regional favourites and everyday inspiration is simmering. We look forward to sharing it with you.",
    image: "/images/shorisha-ilish-recipe.png",
    imageAlt: "Mustard fish curry served with green chillies and rice",
    parent: { label: "Home", href: "/" },
  },
  "by-region": {
    title: "Recipes by Region",
    eyebrow: "The Bangla Blend kitchen",
    description:
      "We are mapping recipes through the places and food traditions that shape them, with each regional connection carefully reviewed.",
    image: "/images/bangladesh-river-landscape.png",
    imageAlt: "A river landscape in Bangladesh at dawn",
    parent: { label: "Recipe Library", href: "/recipes" },
  },
  "by-product": {
    title: "Recipes by Product",
    eyebrow: "The Bangla Blend kitchen",
    description:
      "New ways to cook with Bangla Blend originals, pantry staples and signature blends are being tested in our kitchen.",
    image: "/images/hero-spice-still-life.png",
    imageAlt: "Bangla Blend products with bowls of spices",
    parent: { label: "Recipe Library", href: "/recipes" },
  },
  traditional: {
    title: "Traditional Recipes",
    eyebrow: "The Bangla Blend kitchen",
    description:
      "Beloved dishes and established Bengali food traditions are being documented with respect, context and careful kitchen testing.",
    image: "/images/recipe-mezban-gosh.png",
    imageAlt: "Mezban beef curry in a hammered brass bowl",
    parent: { label: "Recipe Library", href: "/recipes" },
  },
  "everyday-cooking": {
    title: "Everyday Cooking",
    eyebrow: "The Bangla Blend kitchen",
    description:
      "Approachable recipes for the rhythm of everyday meals are on the way—practical, flavourful and made to be returned to often.",
    image: "/images/recipe-chana-dal-bhuna.png",
    imageAlt: "Golden chana dal with fried onion and green chilli",
    parent: { label: "Recipe Library", href: "/recipes" },
  },
} satisfies Record<string, ComingSoonPageConfig>;

export const meetAnnapurnaComingSoonPage = {
  title: "Meet Annapurna",
  eyebrow: "Our Story",
  description:
    "Annapurna’s story will be shared in her own voice. Her personal note and portrait are being prepared with the same warmth and care behind Bangla Blend.",
  image: "/images/our-story-annapurna.png",
  imageAlt: "An illustrated woman holding a bowl in a warm kitchen",
  parent: { label: "Our Story", href: "/our-story" },
} satisfies ComingSoonPageConfig;

export const wholesaleComingSoonPage = {
  title: "Wholesale",
  eyebrow: "For trade partners",
  description:
    "A considered wholesale programme for restaurants, hotels and specialist retailers is taking shape. Partnership details will be shared when everything is ready.",
  image: "/images/campaign/pantry-lineup.jpg",
  imageAlt: "A curated lineup of Bangla Blend pantry products",
  parent: { label: "Home", href: "/" },
} satisfies ComingSoonPageConfig;
