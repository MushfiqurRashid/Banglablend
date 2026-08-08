export const divisions = [
  { title: "Dhaka", slug: "dhaka", note: "Editorial profile in preparation" },
  { title: "Chattogram", slug: "chattogram", note: "Regional stories and connected locations" },
  { title: "Rajshahi", slug: "rajshahi", note: "Editorial profile in preparation" },
  { title: "Khulna", slug: "khulna", note: "Editorial profile in preparation" },
  { title: "Barishal", slug: "barishal", note: "Editorial profile in preparation" },
  { title: "Sylhet", slug: "sylhet", note: "Editorial profile in preparation" },
  { title: "Rangpur", slug: "rangpur", note: "Editorial profile in preparation" },
  { title: "Mymensingh", slug: "mymensingh", note: "Editorial profile in preparation" }
];
export const chattogramRegions = [
  { title: "Chattogram", slug: "chattogram" },
  { title: "Hathazari", slug: "hathazari" },
  { title: "Cox’s Bazar", slug: "coxs-bazar" },
  { title: "Chittagong Hill Tracts", slug: "chittagong-hill-tracts" }
];

export const recipes = [
  {
    title: "Shorisha Ilish",
    slug: "shorisha-ilish",
    excerpt: "A fish preparation rich with mustard, presented as a working recipe for review.",
    region: "Bangladesh",
    prepTime: 20,
    cookTime: 25,
    servings: 4,
    difficulty: "Intermediate",
    image: "/images/shorisha-ilish-recipe.webp",
    verified: false,
    ingredients: [
      { metric: "800 g", imperial: "1¾ lb", bangla: "ইলিশ", english: "hilsa steaks" },
      { metric: "45 g", imperial: "3 tbsp", bangla: "সরিষা", english: "mustard paste" },
      { metric: "4", imperial: "4", bangla: "কাঁচা মরিচ", english: "green chillies" }
    ],
    steps: [
      "Prepare the fish and mustard mixture according to your approved kitchen procedure.",
      "Cook gently until the fish is done, taking care not to overwork the delicate pieces.",
      "Taste, adjust and serve hot with steamed rice."
    ]
  },
  {
    title: "Everyday Masala Dal",
    slug: "everyday-masala-dal",
    excerpt: "A flexible weeknight dal framework for testing the Originals collection.",
    region: "Bangladesh",
    prepTime: 15,
    cookTime: 35,
    servings: 4,
    difficulty: "Beginner",
    image: "/images/shorisha-ilish-recipe.webp",
    verified: false,
    ingredients: [],
    steps: []
  },
  {
    title: "Spiced Lemon Tea",
    slug: "spiced-lemon-tea",
    excerpt: "A simple tea ritual using ginger and warming spice.",
    region: "Bangladesh",
    prepTime: 5,
    cookTime: 10,
    servings: 2,
    difficulty: "Beginner",
    image: "/images/hero-spice-still-life.webp",
    verified: false,
    ingredients: [],
    steps: []
  }
];

export const journalCategories = [
  {
    title: "Food Heritage",
    slug: "food-heritage",
    description: "The dishes, techniques and table traditions that carry memory across generations."
  },
  {
    title: "Regional Flavours",
    slug: "regional-flavours",
    description: "A closer look at the distinct culinary landscapes found across Bangladesh."
  },
  {
    title: "Ingredient Stories",
    slug: "ingredient-stories",
    description: "Origins, characteristics and careful uses of ingredients found in Bangladeshi kitchens."
  },
  {
    title: "Farmer & Sourcing Stories",
    slug: "farmer-sourcing-stories",
    description: "People, places and sourcing relationships shared only with evidence and consent."
  },
  {
    title: "Cooking Guides",
    slug: "cooking-guides",
    description: "Practical guidance that helps cooks build confidence with Bangladeshi flavours."
  },
  {
    title: "Festivals & Seasons",
    slug: "festivals-seasons",
    description: "Food traditions connected to the rhythms, celebrations and seasons of Bangladesh."
  },
  {
    title: "Behind Bangla Blend",
    slug: "behind-bangla-blend",
    description: "The decisions, standards and people shaping Bangla Blend as it grows."
  }
];

export const articles = [
  {
    title: "The everyday table as living heritage",
    slug: "the-everyday-table-as-living-heritage",
    category: "Food Heritage",
    categorySlug: "food-heritage",
    excerpt: "Why food heritage lives not only in celebration dishes, but also in repeated everyday gestures.",
    date: "2026-07-20",
    readingTime: 5,
    image: "/images/shorisha-ilish-recipe.webp",
    body: [
      "Food heritage is often presented through grand dishes and festival tables. It also lives in quieter knowledge: how rice is washed, when a spice is added, which texture signals that a dish is ready, and how a meal changes with the season.",
      "Bangla Blend documents these practices carefully. Family memory can begin an editorial inquiry, but published cultural and historical claims need review, context and an identifiable source.",
      "That care leaves room for variation. A dish can hold many valid household expressions without one version being declared the only authentic one."
    ]
  },
  {
    title: "Reading Bangladesh through regional flavour",
    slug: "reading-bangladesh-through-regional-flavour",
    category: "Regional Flavours",
    categorySlug: "regional-flavours",
    excerpt: "A framework for exploring place through ingredients, techniques and local food memories.",
    date: "2026-07-20",
    readingTime: 6,
    image: "/images/bangladesh-river-landscape.webp",
    body: [
      "Rivers, coasts, hills, cities and agricultural landscapes all influence what is available to cook and how food traditions develop. Regional flavour is a relationship between place, people and practice. It is not simply a decorative label.",
      "Our regional stories connect dishes with reviewed sources, contributor knowledge and clearly identified locations. When the evidence is incomplete, the detail stays in editorial review.",
      "The aim is a growing map of Bangladesh that welcomes complexity and helps readers follow a flavour into a recipe, ingredient or product."
    ]
  },
  {
    title: "Mustard in the Bengali kitchen",
    slug: "mustard-in-the-bengali-kitchen",
    category: "Ingredient Stories",
    categorySlug: "ingredient-stories",
    excerpt: "An introduction to mustard's pungency, aroma and many roles in Bengali cooking.",
    date: "2026-07-20",
    readingTime: 4,
    image: "/images/shorisha-ilish-recipe.webp",
    body: [
      "Mustard can enter a kitchen as seed, oil or paste, with each form bringing a different kind of heat and aroma. The result depends on variety, freshness, preparation and the other ingredients around it.",
      "A useful ingredient story separates broadly applicable cooking guidance from claims about a specific harvest or source. Origin and processing details for individual products are published only when their records have been verified.",
      "For cooks meeting mustard anew, small adjustments and careful tasting are more useful than rigid rules."
    ]
  },
  {
    title: "What responsible sourcing stories require",
    slug: "what-responsible-sourcing-stories-require",
    category: "Farmer & Sourcing Stories",
    categorySlug: "farmer-sourcing-stories",
    excerpt: "The records, consent and review behind a sourcing story that is ready to publish.",
    date: "2026-07-20",
    readingTime: 5,
    image: "/images/bangladesh-river-landscape.webp",
    body: [
      "A producer's name or a place of origin should never be used as atmosphere. A responsible sourcing story begins with consent and a record that connects the person, ingredient, location and product accurately.",
      "Claims about livelihoods, environmental practices, certifications and impact need evidence appropriate to the claim. Where that evidence does not yet exist, Bangla Blend does not fill the gap with implication.",
      "This approach makes space for stories that are specific, respectful and useful to the people represented as well as to the customer reading them."
    ]
  },
  {
    title: "Why regional stories need careful sourcing",
    slug: "why-regional-stories-need-care",
    category: "Behind Bangla Blend",
    categorySlug: "behind-bangla-blend",
    excerpt: "How the editorial workflow separates an interesting lead from a publishable claim.",
    date: "2026-07-20",
    readingTime: 5,
    image: "/images/bangladesh-river-landscape.webp",
    body: [
      "Bangla Blend treats regional storytelling as a publishing responsibility. A compelling anecdote, familiar phrase or supplier note is a useful lead, but it is not automatically a fact ready for customers.",
      "Each claim tied to a place should carry a source, a verification state and an editor. Personal stories require consent, while product provenance must agree with the commerce record.",
      "The result is a slower but more trustworthy kind of storytelling: useful context without borrowed authority, invented detail or decorative nostalgia."
    ]
  },
  {
    title: "Building a useful spice pantry",
    slug: "building-a-useful-spice-pantry",
    category: "Cooking Guides",
    categorySlug: "cooking-guides",
    excerpt: "A practical framework for choosing, storing and using everyday spices.",
    date: "2026-07-20",
    readingTime: 4,
    image: "/images/hero-spice-still-life.webp",
    body: [
      "A useful spice pantry reflects the food you actually cook. Begin with a small group of versatile ingredients, learn how they smell and taste when fresh, and add more only when a recipe or technique calls for them.",
      "Keep spices sealed away from heat, light and moisture. Whole spices generally hold their character longer, while ground spices reward smaller quantities and regular refreshment.",
      "Labels and dates make the pantry easier to use. The goal is not a large collection, but ingredients you understand well enough to reach for with confidence."
    ]
  },
  {
    title: "A seasonal table for Pohela Boishakh",
    slug: "a-seasonal-table-for-pohela-boishakh",
    category: "Festivals & Seasons",
    categorySlug: "festivals-seasons",
    excerpt: "Thinking about celebration food through season, hospitality and the many ways families gather.",
    date: "2026-07-20",
    readingTime: 5,
    image: "/images/shorisha-ilish-recipe.webp",
    body: [
      "Pohela Boishakh tables are shaped by family practice, region, setting and the season's ingredients. No single menu can represent every way Bengalis welcome the new year.",
      "A thoughtful celebration guide offers context without turning a living tradition into a checklist. It can suggest ways to plan a generous meal while recognising household and regional variation.",
      "Bangla Blend publishes festival stories after cultural review and updates them as contributors add better context."
    ]
  },
  {
    title: "The path from product to recipe",
    slug: "from-product-to-recipe",
    category: "Behind Bangla Blend",
    categorySlug: "behind-bangla-blend",
    excerpt: "A look at how each product connects to useful cooking guidance.",
    date: "2026-07-20",
    readingTime: 3,
    image: "/images/shorisha-ilish-recipe.webp",
    body: [
      "A Bangla Blend product page should not be the end of the journey. It should help a cook understand the flavour, find an appropriate recipe and see the place or practice that informed it.",
      "Those connections are maintained as structured references. Product facts remain in commerce data, while recipes and stories can be reviewed and updated independently in the editorial system.",
      "The customer receives a connected experience without one system pretending to be the authority for every kind of information."
    ]
  }
];
