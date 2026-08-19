export interface LaunchRecipeIngredient {
  amount: string;
  name: string;
  note?: string;
}

export interface LaunchRecipeGroup {
  title: string;
  ingredients: LaunchRecipeIngredient[];
}

export interface LaunchRecipeStep {
  instruction: string;
  timerMinutes?: number;
}

export interface LaunchRecipeStepSection {
  title: string;
  steps: LaunchRecipeStep[];
}

export interface LaunchRecipeProduct {
  title: string;
  handle: string;
  image: string;
  note: string;
}

export interface LaunchRecipe {
  title: string;
  banglaTitle: string;
  slug: string;
  excerpt: string;
  story: string;
  region: string;
  category: "Fish & seafood" | "Meat & poultry" | "Vegetarian" | "Pantry";
  prepTime: number;
  cookTime: number;
  totalTime: number;
  inactiveTime?: number;
  servings?: number;
  yield: string;
  difficulty: "Easy" | "Moderate" | "Advanced";
  image: string;
  imageWide: string;
  imageSquare: string;
  imageAlt: string;
  imageCredit: string;
  ingredientGroups: LaunchRecipeGroup[];
  stepSections: LaunchRecipeStepSection[];
  servingSuggestions: string[];
  tips: string[];
  storage?: string;
  safety?: string;
  dietaryTags: string[];
  librarySections: Array<"traditional" | "everyday-cooking">;
  relatedProducts: LaunchRecipeProduct[];
  author: string;
  publishedAt: string;
  featured: boolean;
  verified: true;
}

const recipeImage = (slug: string, variant: "card" | "wide" | "square" = "card") =>
  `/images/recipes/${slug}${variant === "card" ? "" : `-${variant}`}.webp`;

const hathazariChilli: LaunchRecipeProduct = {
  title: "Hathazari Red Chilli Powder",
  handle: "hathazari-red-chili",
  image: "/images/products/hathazari-red-chilli-product.webp",
  note: "For vivid colour and a measured, aromatic heat.",
};

const blackPepper: LaunchRecipeProduct = {
  title: "Black Pepper",
  handle: "black-pepper",
  image: "/images/products/black-pepper-product.webp",
  note: "Crush freshly for a warmer, more fragrant finish.",
};

export const launchRecipes: LaunchRecipe[] = [
  {
    title: "Rui Shorshe Jhal",
    banglaTitle: "রুই সর্ষে ঝাল",
    slug: "rui-shorshe-jhal",
    excerpt:
      "Tender rohu in a sharp, golden mustard gravy, finished with green chillies and a final thread of raw mustard oil.",
    story:
      "Mustard does the expressive work in this restrained fish curry. Keep the heat gentle once the paste enters the pan: the aim is a clean pungency and silky gravy, never bitterness.",
    region: "Bangladesh",
    category: "Fish & seafood",
    prepTime: 30,
    cookTime: 20,
    totalTime: 50,
    inactiveTime: 15,
    servings: 4,
    yield: "6 pieces, serving 4",
    difficulty: "Moderate",
    image: recipeImage("rui-shorshe-jhal"),
    imageWide: recipeImage("rui-shorshe-jhal", "wide"),
    imageSquare: recipeImage("rui-shorshe-jhal", "square"),
    imageAlt: "Rohu fish pieces in golden mustard gravy with green chillies",
    imageCredit: "Bangla Blend Kitchen",
    ingredientGroups: [
      {
        title: "Fish",
        ingredients: [
          { amount: "6 pieces (700–800 g)", name: "Rui or rohu fish" },
          { amount: "½ tsp", name: "Turmeric powder" },
          { amount: "To taste", name: "Salt" },
          { amount: "4 tbsp", name: "Mustard oil", note: "plus 1 tsp to finish" },
        ],
      },
      {
        title: "Mustard paste",
        ingredients: [
          { amount: "3 tbsp", name: "Black and yellow mustard seeds", note: "mixed" },
          { amount: "2", name: "Green chillies" },
          { amount: "¼ tsp", name: "Salt" },
          { amount: "3–4 tbsp", name: "Water" },
        ],
      },
      {
        title: "For the gravy",
        ingredients: [
          { amount: "3–4", name: "Green chillies", note: "slit" },
          { amount: "1½ cups", name: "Warm water" },
        ],
      },
    ],
    stepSections: [
      {
        title: "Preparation",
        steps: [
          {
            instruction:
              "Pat the fish dry, season with turmeric and salt, and leave to marinate while you prepare the mustard.",
            timerMinutes: 15,
          },
          {
            instruction:
              "Soak the mustard seeds in warm water for 15 minutes, then blend with two green chillies, salt and 3–4 tablespoons water. Strain for an especially smooth gravy.",
            timerMinutes: 15,
          },
        ],
      },
      {
        title: "Cooking",
        steps: [
          {
            instruction:
              "Heat the mustard oil until shimmering. Fry the fish lightly for 1–2 minutes per side, then lift it onto a plate.",
            timerMinutes: 4,
          },
          {
            instruction:
              "Lower the heat and cook the mustard paste for 2–3 minutes, stirring continuously so it stays fragrant rather than bitter.",
            timerMinutes: 3,
          },
          {
            instruction:
              "Add the warm water and a pinch of turmeric, season carefully, and bring the gravy to a gentle boil.",
          },
          {
            instruction:
              "Return the fish to the pan with the slit green chillies. Cover and simmer gently until the fish is opaque and flakes easily.",
            timerMinutes: 9,
          },
          {
            instruction:
              "Turn off the heat, drizzle over 1 teaspoon raw mustard oil, and rest before serving.",
            timerMinutes: 10,
          },
        ],
      },
    ],
    servingSuggestions: ["Steamed white rice", "Masoor dal", "Aloo bhaja", "Begun bhaja"],
    tips: [
      "A mix of black and yellow mustard seeds gives a balanced flavour and colour.",
      "Do not over-blend or aggressively boil the mustard paste; either can make it bitter.",
      "Let the curry rest for 10 minutes so the mustard settles into the fish.",
    ],
    safety: "Cook fish until opaque and easy to flake; remove any fine bones while eating.",
    dietaryTags: ["Dairy-free", "Gluten-free"],
    librarySections: ["traditional", "everyday-cooking"],
    relatedProducts: [],
    author: "Bangla Blend Kitchen",
    publishedAt: "2026-08-19",
    featured: true,
    verified: true,
  },
  {
    title: "Loitta Shutki Bhuna",
    banglaTitle: "লইট্টা শুঁটকি ভুনা",
    slug: "loitta-shutki-bhuna",
    excerpt:
      "Dried Bombay duck cooked slowly with deeply browned onion, garlic, mustard oil and green chilli until intensely savoury and dry.",
    story:
      "Loitta shutki rewards patience: careful washing softens its salinity, while slow bhuna cooking turns its bold aroma into something rounded, rich and deeply satisfying.",
    region: "Chattogram",
    category: "Fish & seafood",
    prepTime: 30,
    cookTime: 35,
    totalTime: 65,
    inactiveTime: 15,
    servings: 4,
    yield: "Serves 4",
    difficulty: "Moderate",
    image: recipeImage("loitta-shutki-bhuna"),
    imageWide: recipeImage("loitta-shutki-bhuna", "wide"),
    imageSquare: recipeImage("loitta-shutki-bhuna", "square"),
    imageAlt: "Dry loitta shutki bhuna with caramelized onions and chillies in an earthenware bowl",
    imageCredit: "Bangla Blend Kitchen, generated for this collection",
    ingredientGroups: [
      {
        title: "Main ingredients",
        ingredients: [
          { amount: "150–200 g", name: "Loitta shutki", note: "dried Bombay duck" },
          { amount: "3 medium", name: "Onions", note: "thinly sliced" },
          { amount: "10–12 cloves", name: "Garlic", note: "chopped" },
          { amount: "1 tbsp", name: "Ginger paste" },
          { amount: "5–6", name: "Green chillies", note: "slit" },
          { amount: "4–5 tbsp", name: "Mustard oil" },
          { amount: "To taste", name: "Salt", note: "add only after tasting" },
        ],
      },
      {
        title: "Ground spices",
        ingredients: [
          { amount: "1 tsp", name: "Turmeric powder" },
          { amount: "1 tsp", name: "Red chilli powder" },
          { amount: "1 tsp", name: "Coriander powder" },
          { amount: "½ tsp", name: "Cumin powder" },
        ],
      },
      {
        title: "To finish",
        ingredients: [{ amount: "A small handful", name: "Fresh coriander", note: "optional" }],
      },
    ],
    stepSections: [
      {
        title: "Preparation",
        steps: [
          {
            instruction:
              "Rinse the shutki thoroughly three or four times, checking it carefully as you work.",
          },
          {
            instruction:
              "Soak in warm water, then drain and press out excess water. This moderates the salt and aroma.",
            timerMinutes: 15,
          },
        ],
      },
      {
        title: "Cooking",
        steps: [
          { instruction: "Heat the mustard oil until shimmering." },
          {
            instruction: "Add the onions and cook until a deep, even gold.",
            timerMinutes: 10,
          },
          {
            instruction:
              "Add the garlic and ginger paste and cook until the raw aroma disappears.",
            timerMinutes: 3,
          },
          {
            instruction:
              "Stir in the turmeric, red chilli, coriander and cumin with a splash of water. Cook until fragrant.",
          },
          {
            instruction:
              "Add the drained shutki and coat every piece with the spiced onion mixture. Add the green chillies.",
          },
          {
            instruction:
              "Cover and cook over low heat, stirring occasionally and adding only a spoonful of water if the pan catches.",
            timerMinutes: 20,
          },
          {
            instruction:
              "Uncover and continue cooking until dry and well roasted. Taste before adding any salt, then finish with coriander if using.",
          },
        ],
      },
    ],
    servingSuggestions: ["Steamed white rice", "Masoor dal", "Begun bhorta", "Sliced onion and green chilli"],
    tips: [
      "Mustard oil gives the most characteristic flavour.",
      "Shutki is naturally salty, so wait until the end before adjusting the seasoning.",
      "For a Chattogram-style variation, add small pieces of potato or aubergine during the covered cook.",
    ],
    storage: "Cool promptly and refrigerate in a covered container. Use within 3 days.",
    safety: "Check the dried fish carefully, rinse thoroughly and cook until piping hot throughout.",
    dietaryTags: ["Dairy-free", "Gluten-free"],
    librarySections: ["traditional"],
    relatedProducts: [hathazariChilli],
    author: "Bangla Blend Kitchen",
    publishedAt: "2026-08-19",
    featured: true,
    verified: true,
  },
  {
    title: "Muri Ghonto",
    banglaTitle: "মুড়িঘণ্ট",
    slug: "muri-ghonto",
    excerpt:
      "Aromatic short-grain rice, potato and fried rohu fish head cooked together into a moist, celebratory Bengali classic.",
    story:
      "Muri Ghonto makes a prized part of the fish the centre of the table. Frying the head well and toasting the rice before simmering build its distinctive depth and gently nutty aroma.",
    region: "Bangladesh",
    category: "Fish & seafood",
    prepTime: 30,
    cookTime: 45,
    totalTime: 75,
    inactiveTime: 15,
    servings: 4,
    yield: "Serves 4",
    difficulty: "Advanced",
    image: recipeImage("muri-ghonto"),
    imageWide: recipeImage("muri-ghonto", "wide"),
    imageSquare: recipeImage("muri-ghonto", "square"),
    imageAlt: "Muri Ghonto with aromatic rice, potato and fried rohu fish head",
    imageCredit: "Bangla Blend Kitchen, generated for this collection",
    ingredientGroups: [
      {
        title: "Main ingredients",
        ingredients: [
          { amount: "1 large (400–500 g)", name: "Rohu fish head", note: "cleaned and cut into 4 pieces" },
          { amount: "½ cup", name: "Gobindobhog rice", note: "or another aromatic short-grain rice" },
          { amount: "2 medium", name: "Potatoes", note: "peeled and cubed" },
          { amount: "2", name: "Onions", note: "finely sliced" },
          { amount: "1 tbsp", name: "Ginger paste" },
          { amount: "2", name: "Bay leaves" },
          { amount: "2–3", name: "Dried red chillies" },
          { amount: "2", name: "Green chillies", note: "slit" },
        ],
      },
      {
        title: "Whole spices",
        ingredients: [
          { amount: "1 tsp", name: "Cumin seeds" },
          { amount: "2–3", name: "Green cardamom pods" },
          { amount: "3", name: "Cloves" },
          { amount: "1 small stick", name: "Cinnamon" },
        ],
      },
      {
        title: "Ground spices",
        ingredients: [
          { amount: "1 tsp", name: "Turmeric powder" },
          { amount: "1 tsp", name: "Red chilli powder" },
          { amount: "1 tsp", name: "Cumin powder" },
          { amount: "½ tsp", name: "Coriander powder" },
          { amount: "To taste", name: "Salt" },
          { amount: "1 tsp", name: "Sugar", note: "optional" },
        ],
      },
      {
        title: "For cooking",
        ingredients: [
          { amount: "5 tbsp", name: "Mustard oil" },
          { amount: "2½ cups", name: "Hot water" },
          { amount: "1 tsp", name: "Ghee" },
        ],
      },
    ],
    stepSections: [
      {
        title: "Preparation",
        steps: [
          {
            instruction:
              "Pat the cleaned fish-head pieces dry, season with turmeric and a little salt, and leave to marinate.",
            timerMinutes: 15,
          },
          { instruction: "Wash the rice until the water runs mostly clear, then drain thoroughly." },
        ],
      },
      {
        title: "Cooking",
        steps: [
          {
            instruction:
              "Heat the mustard oil until shimmering. Fry the fish-head pieces until deeply golden on both sides, then remove.",
          },
          { instruction: "Fry the potatoes in the same pan until lightly golden, then remove." },
          {
            instruction:
              "Add the bay leaves, dried chillies, cumin seeds, cinnamon, cardamom and cloves. Let them sizzle until fragrant.",
          },
          {
            instruction: "Add the onions and cook until golden, then stir in the ginger paste.",
            timerMinutes: 10,
          },
          {
            instruction:
              "Mix in the ground spices with a splash of water and cook until the oil begins to separate.",
          },
          {
            instruction: "Add the drained rice and fry, stirring continuously.",
            timerMinutes: 4,
          },
          {
            instruction:
              "Return the potatoes, add the hot water, and bring to a boil. Break the fried fish head into manageable pieces and add them carefully.",
          },
          {
            instruction:
              "Cover and simmer on low until the rice is tender and has absorbed most of the liquid.",
            timerMinutes: 18,
          },
          {
            instruction:
              "Add the green chillies, sugar if using, and ghee. Rest for 5 minutes before serving.",
            timerMinutes: 5,
          },
        ],
      },
    ],
    servingSuggestions: ["Steamed rice", "Moong dal", "Begun bhaja", "Tomato chutney", "Papad"],
    tips: [
      "Gobindobhog rice gives the most characteristic aroma and texture.",
      "Fry the fish head thoroughly for a deeper flavour.",
      "The finished dish should be moist, neither dry nor soupy.",
    ],
    safety: "Fish heads contain fine bones. Serve and eat carefully, especially when cooking for children.",
    dietaryTags: ["Gluten-free"],
    librarySections: ["traditional"],
    relatedProducts: [hathazariChilli],
    author: "Bangla Blend Kitchen",
    publishedAt: "2026-08-19",
    featured: false,
    verified: true,
  },
  {
    title: "Tel Koi",
    banglaTitle: "তেল কই",
    slug: "tel-koi",
    excerpt:
      "Koi fish simmered simply with nigella, green chilli and mustard oil in a light, aromatic gravy.",
    story:
      "The short ingredient list is the point: fresh koi, good mustard oil and careful cooking create a dish with clarity, warmth and a lingering chilli perfume.",
    region: "Bangladesh",
    category: "Fish & seafood",
    prepTime: 25,
    cookTime: 20,
    totalTime: 45,
    inactiveTime: 15,
    servings: 4,
    yield: "6 fish, serving 4",
    difficulty: "Moderate",
    image: recipeImage("tel-koi"),
    imageWide: recipeImage("tel-koi", "wide"),
    imageSquare: recipeImage("tel-koi", "square"),
    imageAlt: "Koi fish in a mustard-oil gravy with green chillies",
    imageCredit: "Bangla Blend Kitchen",
    ingredientGroups: [
      {
        title: "Main ingredients",
        ingredients: [
          { amount: "6 medium", name: "Koi fish", note: "cleaned" },
          { amount: "5 tbsp", name: "Mustard oil" },
          { amount: "1 tsp", name: "Turmeric powder" },
          { amount: "To taste", name: "Salt" },
          { amount: "6–8", name: "Green chillies", note: "slit" },
          { amount: "1½ cups", name: "Warm water" },
          { amount: "½ tsp", name: "Nigella seeds" },
        ],
      },
      {
        title: "To finish",
        ingredients: [
          { amount: "1 tsp", name: "Raw mustard oil", note: "optional" },
          { amount: "A small handful", name: "Fresh coriander", note: "optional" },
        ],
      },
    ],
    stepSections: [
      {
        title: "Preparation",
        steps: [
          {
            instruction:
              "Pat the cleaned fish dry, rub with turmeric and salt, and leave to marinate.",
            timerMinutes: 15,
          },
        ],
      },
      {
        title: "Cooking",
        steps: [
          {
            instruction:
              "Heat the mustard oil until shimmering. Fry the fish lightly for about 2 minutes per side, then remove.",
            timerMinutes: 4,
          },
          {
            instruction: "Add the nigella seeds and let them sizzle, then add the green chillies.",
          },
          {
            instruction:
              "Pour in the warm water, season lightly and bring the gravy to a gentle boil.",
          },
          {
            instruction:
              "Return the fish, cover and simmer gently until cooked through and flavoured by the gravy.",
            timerMinutes: 9,
          },
          {
            instruction:
              "Finish with raw mustard oil and coriander if using, then rest briefly before serving.",
            timerMinutes: 5,
          },
        ],
      },
    ],
    servingSuggestions: ["Steamed white rice", "Masoor dal", "Aloo bhorta", "Begun bhaja"],
    tips: [
      "Fresh koi gives the best texture.",
      "Handle the fish gently after frying so the pieces remain intact.",
      "Add green chilli to taste, but keep the gravy clean and light.",
    ],
    safety: "Cook fish until opaque and easy to flake; remove any fine bones while eating.",
    dietaryTags: ["Dairy-free", "Gluten-free"],
    librarySections: ["traditional", "everyday-cooking"],
    relatedProducts: [],
    author: "Bangla Blend Kitchen",
    publishedAt: "2026-08-19",
    featured: false,
    verified: true,
  },
  {
    title: "Chital Macher Muitha",
    banglaTitle: "চিতল মাছের মুইঠা",
    slug: "chital-macher-muitha",
    excerpt:
      "Soft chital fish dumplings gently simmered in an aromatic onion-and-spice curry.",
    story:
      "Muitha asks for a little craft and a light hand. Steaming the shaped fish first helps the dumplings keep their tenderness while they absorb the finished curry.",
    region: "Bangladesh",
    category: "Fish & seafood",
    prepTime: 30,
    cookTime: 40,
    totalTime: 70,
    servings: 5,
    yield: "12–14 dumplings, serving 4–5",
    difficulty: "Advanced",
    image: recipeImage("chital-macher-muitha"),
    imageWide: recipeImage("chital-macher-muitha", "wide"),
    imageSquare: recipeImage("chital-macher-muitha", "square"),
    imageAlt: "Chital fish dumplings in a golden aromatic curry",
    imageCredit: "Bangla Blend Kitchen",
    ingredientGroups: [
      {
        title: "For the muitha",
        ingredients: [
          { amount: "500 g", name: "Boneless chital fish flesh" },
          { amount: "1 medium", name: "Onion", note: "finely chopped" },
          { amount: "1 tbsp", name: "Ginger paste" },
          { amount: "1 tsp", name: "Garlic paste" },
          { amount: "2", name: "Green chillies", note: "finely chopped" },
          { amount: "2 tbsp", name: "Gram flour" },
          { amount: "½ tsp", name: "Turmeric powder" },
          { amount: "½ tsp", name: "Cumin powder" },
          { amount: "To taste", name: "Salt" },
          { amount: "2 tbsp", name: "Fresh coriander", note: "chopped" },
          { amount: "1 tbsp", name: "Mustard oil" },
        ],
      },
      {
        title: "For the curry",
        ingredients: [
          { amount: "3 tbsp", name: "Mustard oil" },
          { amount: "2", name: "Bay leaves" },
          { amount: "1 stick", name: "Cinnamon" },
          { amount: "2", name: "Green cardamom pods" },
          { amount: "3", name: "Cloves" },
          { amount: "1", name: "Onion", note: "finely sliced" },
          { amount: "1 tbsp", name: "Ginger paste" },
          { amount: "1 tsp", name: "Garlic paste" },
          { amount: "1 tsp each", name: "Turmeric, red chilli, cumin and coriander powder" },
          { amount: "2 cups", name: "Warm water" },
          { amount: "3–4", name: "Green chillies" },
          { amount: "1 tsp", name: "Ghee", note: "optional" },
          { amount: "To taste", name: "Salt" },
        ],
      },
    ],
    stepSections: [
      {
        title: "Shape the muitha",
        steps: [
          { instruction: "Mince or blend the boneless fish until evenly smooth." },
          {
            instruction:
              "Mix with the onion, ginger, garlic, green chilli, gram flour, turmeric, cumin, salt, coriander and mustard oil. Knead until firm enough to hold its shape.",
          },
          { instruction: "Shape into 12–14 small oval dumplings." },
          {
            instruction:
              "Steam the dumplings until firm and cooked through, then set aside.",
            timerMinutes: 12,
          },
        ],
      },
      {
        title: "Cook the curry",
        steps: [
          {
            instruction:
              "Heat the mustard oil. Add the bay leaves, cinnamon, cardamom and cloves and cook until fragrant.",
          },
          {
            instruction: "Add the onion and fry until golden, then stir in the ginger and garlic.",
            timerMinutes: 10,
          },
          {
            instruction:
              "Add the ground spices with a splash of water and cook until the oil begins to separate.",
          },
          { instruction: "Pour in the warm water, season and bring to a gentle boil." },
          {
            instruction:
              "Lower in the steamed muitha and simmer gently so the dumplings absorb the curry without breaking.",
            timerMinutes: 12,
          },
          {
            instruction:
              "Add the green chillies. Finish with ghee and coriander if desired.",
            timerMinutes: 2,
          },
        ],
      },
    ],
    servingSuggestions: ["Steamed white rice", "Plain pulao", "Cucumber and onion salad", "Lemon wedges"],
    tips: [
      "Use very fresh, carefully deboned chital for the softest texture.",
      "Steam the dumplings before adding them to the curry to reduce breakage.",
      "Once the muitha are in the pan, keep the simmer gentle.",
    ],
    safety: "Check the fish flesh meticulously for bones before mincing and cook the dumplings through before serving.",
    dietaryTags: ["Dairy-free option"],
    librarySections: ["traditional"],
    relatedProducts: [hathazariChilli],
    author: "Bangla Blend Kitchen",
    publishedAt: "2026-08-19",
    featured: false,
    verified: true,
  },
  {
    title: "Chicken Achar",
    banglaTitle: "মুরগির আচার",
    slug: "chicken-achar",
    excerpt:
      "Achar-style chicken cooked with mustard oil, five whole spices, dried chilli and a bright vinegar-and-lemon finish.",
    story:
      "This is a punchy cooked chicken preparation inspired by achar flavours, not a shelf-stable preserve. Make it in a modest batch, chill it promptly and enjoy it within the safe refrigerated window.",
    region: "Bangladesh",
    category: "Pantry",
    prepTime: 40,
    cookTime: 30,
    totalTime: 70,
    inactiveTime: 30,
    servings: 6,
    yield: "About 650 g",
    difficulty: "Moderate",
    image: recipeImage("chicken-achar"),
    imageWide: recipeImage("chicken-achar", "wide"),
    imageSquare: recipeImage("chicken-achar", "square"),
    imageAlt: "Achar-style spiced chicken with dried red chillies in a glass serving jar",
    imageCredit: "Bangla Blend Kitchen",
    ingredientGroups: [
      {
        title: "Chicken",
        ingredients: [
          { amount: "500 g", name: "Boneless chicken", note: "cut into bite-sized pieces" },
          { amount: "1 tbsp", name: "Ginger paste" },
          { amount: "1 tbsp", name: "Garlic paste" },
          { amount: "1 tsp", name: "Turmeric powder" },
          { amount: "1 tbsp", name: "Kashmiri red chilli powder" },
          { amount: "1 tsp", name: "Hot red chilli powder", note: "optional" },
          { amount: "To taste", name: "Salt" },
        ],
      },
      {
        title: "Achar spices",
        ingredients: [
          { amount: "2 tbsp", name: "Mustard seeds" },
          { amount: "1 tbsp", name: "Fennel seeds" },
          { amount: "1 tbsp", name: "Cumin seeds" },
          { amount: "1 tsp", name: "Fenugreek seeds" },
          { amount: "1 tsp", name: "Nigella seeds" },
          { amount: "10–12", name: "Dried red chillies" },
          { amount: "8–10 cloves", name: "Garlic", note: "peeled" },
          { amount: "4–5", name: "Green chillies", note: "optional" },
        ],
      },
      {
        title: "For cooking",
        ingredients: [
          { amount: "1 cup", name: "Mustard oil" },
          { amount: "2 tbsp", name: "White vinegar" },
          { amount: "1 tbsp", name: "Lemon juice" },
        ],
      },
    ],
    stepSections: [
      {
        title: "Preparation",
        steps: [
          {
            instruction:
              "Pat the chicken completely dry. Mix with the ginger, garlic, turmeric, chilli powder and salt, then marinate in the refrigerator.",
            timerMinutes: 30,
          },
        ],
      },
      {
        title: "Cooking",
        steps: [
          {
            instruction:
              "Heat the mustard oil until shimmering, then lower the heat slightly. Fry the chicken until browned and its thickest pieces reach 74°C/165°F; remove to a plate.",
          },
          {
            instruction:
              "In the remaining oil, gently toast the mustard, fennel, cumin, fenugreek and nigella seeds until fragrant.",
          },
          {
            instruction: "Add the whole garlic and dried chillies and cook briefly without burning them.",
            timerMinutes: 2,
          },
          {
            instruction:
              "Return the chicken, add the vinegar and lemon juice, and cook on low until the spices cling and the oil separates.",
            timerMinutes: 10,
          },
          {
            instruction:
              "Add green chillies for the final 2 minutes if using. Transfer to a clean shallow container and refrigerate promptly.",
            timerMinutes: 2,
          },
        ],
      },
    ],
    servingSuggestions: ["Steamed rice", "Paratha", "Naan", "Khichuri", "Pulao"],
    tips: [
      "Drying the chicken before marinating improves browning.",
      "Toast the whole spices gently; fenugreek becomes bitter when burnt.",
      "Use only a clean spoon when serving from the refrigerated container.",
    ],
    storage:
      "This recipe is not shelf-stable. Refrigerate at 4°C/40°F or below within 2 hours and use within 3–4 days, or freeze in portions.",
    safety:
      "Cook chicken to a minimum internal temperature of 74°C/165°F. Discard if left at room temperature for more than 2 hours, or 1 hour in very hot conditions.",
    dietaryTags: ["Dairy-free", "Gluten-free"],
    librarySections: ["traditional", "everyday-cooking"],
    relatedProducts: [hathazariChilli],
    author: "Bangla Blend Kitchen",
    publishedAt: "2026-08-19",
    featured: false,
    verified: true,
  },
  {
    title: "Traditional Cholar Dal",
    banglaTitle: "ছোলার ডাল",
    slug: "cholar-dal",
    excerpt:
      "Festive Bengal gram dal with fried coconut, raisins, whole spices and a final spoonful of ghee.",
    story:
      "Cholar Dal balances gentle sweetness with warm whole spices and the nutty bite of fried coconut. Soaking the split lentils helps them cook evenly while keeping their character.",
    region: "Bangladesh",
    category: "Vegetarian",
    prepTime: 20,
    cookTime: 45,
    totalTime: 305,
    inactiveTime: 240,
    servings: 6,
    yield: "Serves 4–6",
    difficulty: "Easy",
    image: recipeImage("cholar-dal"),
    imageWide: recipeImage("cholar-dal", "wide"),
    imageSquare: recipeImage("cholar-dal", "square"),
    imageAlt: "Thick golden split Bengal gram dal with fried coconut, raisins and green chillies",
    imageCredit: "Bangla Blend Kitchen, generated for this collection",
    ingredientGroups: [
      {
        title: "Dal",
        ingredients: [
          { amount: "2 cups", name: "Cholar dal", note: "split Bengal gram" },
          { amount: "5 cups", name: "Water", note: "plus more if needed" },
          { amount: "2 tbsp", name: "Mustard oil or ghee" },
          { amount: "1 medium", name: "Onion", note: "finely sliced" },
          { amount: "1 tbsp", name: "Ginger paste" },
          { amount: "1 tsp", name: "Garlic paste", note: "optional" },
        ],
      },
      {
        title: "Whole spices",
        ingredients: [
          { amount: "2", name: "Bay leaves" },
          { amount: "1 stick", name: "Cinnamon" },
          { amount: "3", name: "Green cardamom pods" },
          { amount: "4", name: "Cloves" },
          { amount: "1 tsp", name: "Cumin seeds" },
        ],
      },
      {
        title: "Ground spices",
        ingredients: [
          { amount: "½ tsp", name: "Turmeric powder" },
          { amount: "1 tsp", name: "Red chilli powder" },
          { amount: "1 tsp", name: "Cumin powder" },
          { amount: "1 tsp", name: "Coriander powder" },
          { amount: "To taste", name: "Salt" },
          { amount: "1 tsp", name: "Sugar" },
        ],
      },
      {
        title: "Traditional additions",
        ingredients: [
          { amount: "¼ cup", name: "Coconut cubes", note: "lightly fried" },
          { amount: "2 tbsp", name: "Raisins" },
          { amount: "2", name: "Green chillies", note: "slit" },
          { amount: "1 tsp", name: "Ghee" },
          { amount: "A small handful", name: "Fresh coriander" },
        ],
      },
    ],
    stepSections: [
      {
        title: "Preparation",
        steps: [
          {
            instruction:
              "Rinse the dal thoroughly, soak it for at least 4 hours, then drain.",
            timerMinutes: 240,
          },
        ],
      },
      {
        title: "Cooking",
        steps: [
          {
            instruction:
              "Boil the soaked dal in the measured water until tender but not completely broken down.",
            timerMinutes: 30,
          },
          {
            instruction:
              "Heat the mustard oil or ghee. Add the bay leaves, cinnamon, cardamom, cloves and cumin seeds and cook until fragrant.",
          },
          {
            instruction: "Add the onion and fry until golden, then stir in the ginger and garlic.",
            timerMinutes: 10,
          },
          {
            instruction:
              "Add the ground spices, salt and sugar with a splash of water. Cook until the oil begins to separate.",
          },
          {
            instruction:
              "Add the cooked dal, coconut, raisins and green chillies. Simmer until creamy, loosening with hot water if needed.",
            timerMinutes: 10,
          },
          { instruction: "Finish with ghee and coriander and serve hot." },
        ],
      },
    ],
    servingSuggestions: ["Luchi", "Puri", "Paratha", "Khichuri", "Steamed rice"],
    tips: [
      "Soaking helps the split gram cook evenly.",
      "Fry the coconut before adding it for a deeper, nutty flavour.",
      "Add hot water a little at a time if the dal becomes too thick.",
    ],
    storage: "Cool promptly, refrigerate in a covered container and use within 3–4 days.",
    dietaryTags: ["Vegetarian", "Gluten-free", "Vegan option"],
    librarySections: ["traditional", "everyday-cooking"],
    relatedProducts: [hathazariChilli],
    author: "Bangla Blend Kitchen",
    publishedAt: "2026-08-19",
    featured: true,
    verified: true,
  },
  {
    title: "Date-Molasses Beef Bhuna",
    banglaTitle: "খেজুরের গুড়ের গরুর মাংস ভুনা",
    slug: "date-molasses-beef-bhuna",
    excerpt:
      "Slow-cooked beef bhuna glazed with date molasses for a dark, savoury-sweet finish made for a festive table.",
    story:
      "Date molasses enters near the end, where it can caramelize around the tender beef without losing its aroma. The result should be glossy and deeply spiced rather than sugary.",
    region: "Bangladesh",
    category: "Meat & poultry",
    prepTime: 25,
    cookTime: 95,
    totalTime: 180,
    inactiveTime: 60,
    servings: 6,
    yield: "Serves 4–6",
    difficulty: "Advanced",
    image: recipeImage("date-molasses-beef-bhuna"),
    imageWide: recipeImage("date-molasses-beef-bhuna", "wide"),
    imageSquare: recipeImage("date-molasses-beef-bhuna", "square"),
    imageAlt: "Dark glossy beef bhuna with dates and aromatic whole spices",
    imageCredit: "Bangla Blend Kitchen",
    ingredientGroups: [
      {
        title: "Main ingredients",
        ingredients: [
          { amount: "1 kg", name: "Beef", note: "cut into medium cubes" },
          { amount: "3 tbsp", name: "Mustard or vegetable oil" },
          { amount: "2 large", name: "Onions", note: "thinly sliced" },
          { amount: "2 tbsp", name: "Ginger paste" },
          { amount: "2 tbsp", name: "Garlic paste" },
          { amount: "5–6", name: "Green chillies" },
          { amount: "3", name: "Bay leaves" },
        ],
      },
      {
        title: "Ground spices",
        ingredients: [
          { amount: "1 tsp", name: "Turmeric powder" },
          { amount: "2 tsp", name: "Kashmiri red chilli powder" },
          { amount: "1 tsp", name: "Hot red chilli powder", note: "optional" },
          { amount: "1½ tsp", name: "Cumin powder" },
          { amount: "1½ tsp", name: "Coriander powder" },
          { amount: "1 tsp", name: "Roasted cumin powder" },
          { amount: "1 tsp", name: "Black pepper", note: "freshly ground" },
          { amount: "To taste", name: "Salt" },
        ],
      },
      {
        title: "Whole spices",
        ingredients: [
          { amount: "1 stick", name: "Cinnamon" },
          { amount: "4", name: "Green cardamom pods" },
          { amount: "5", name: "Cloves" },
        ],
      },
      {
        title: "Signature finish",
        ingredients: [
          { amount: "½ cup", name: "Date molasses", note: "start with less and adjust to taste" },
          { amount: "8–10", name: "Seedless dates", note: "halved; optional" },
          { amount: "1 tsp", name: "Ghee" },
        ],
      },
    ],
    stepSections: [
      {
        title: "Marinate",
        steps: [
          {
            instruction:
              "Mix the beef with the ginger, garlic, turmeric, chilli powders, cumin, coriander, black pepper, salt and half the onion. Cover and refrigerate.",
            timerMinutes: 60,
          },
        ],
      },
      {
        title: "Slow cook",
        steps: [
          {
            instruction:
              "Heat the oil in a heavy pot. Add the bay leaves, cinnamon, cardamom and cloves and cook until fragrant.",
          },
          { instruction: "Add the remaining onion and cook until deep golden." },
          {
            instruction:
              "Add the marinated beef and cook over medium-high heat, stirring frequently, until it releases its juices and begins to brown.",
            timerMinutes: 18,
          },
          {
            instruction:
              "Cover and cook on low, stirring occasionally, until almost tender. Add a small splash of hot water only if the pan becomes dry.",
            timerMinutes: 50,
          },
          {
            instruction:
              "Stir in most of the date molasses and the dates. Cook uncovered until the sauce becomes thick, dark and glossy. Taste before adding the remaining molasses.",
            timerMinutes: 18,
          },
          {
            instruction:
              "Add the roasted cumin and green chillies, finish with ghee, and rest before serving.",
            timerMinutes: 10,
          },
        ],
      },
    ],
    servingSuggestions: ["Steamed basmati rice", "Pulao", "Naan", "Paratha", "Cucumber and onion salad"],
    tips: [
      "Use a fragrant date molasses and add it gradually so sweetness does not dominate.",
      "Keep added water to a minimum for a proper bhuna texture.",
      "Cook the beef slowly until genuinely tender before glazing it with molasses.",
    ],
    storage: "Cool promptly, refrigerate in a covered container and use within 3–4 days.",
    dietaryTags: ["Gluten-free"],
    librarySections: ["traditional"],
    relatedProducts: [hathazariChilli, blackPepper],
    author: "Bangla Blend Kitchen",
    publishedAt: "2026-08-19",
    featured: true,
    verified: true,
  },
  {
    title: "Haor-Style Duck Bhuna",
    banglaTitle: "হাওর-স্টাইল হাঁস ভুনা",
    slug: "haor-duck-bhuna",
    excerpt:
      "Country duck cooked low and slow with onion, pepper and whole spices until tender and richly coated.",
    story:
      "Duck brings its own generous fat to the pot. Patient cooking lets that richness mingle with browned onion, green chilli and roasted cumin for the thick finish associated with bhuna.",
    region: "Haor Basin",
    category: "Meat & poultry",
    prepTime: 25,
    cookTime: 90,
    totalTime: 175,
    inactiveTime: 60,
    servings: 6,
    yield: "Serves 4–6",
    difficulty: "Advanced",
    image: recipeImage("haor-duck-bhuna"),
    imageWide: recipeImage("haor-duck-bhuna", "wide"),
    imageSquare: recipeImage("haor-duck-bhuna", "square"),
    imageAlt: "Dark, dry-style duck bhuna with green chillies in an earthenware bowl",
    imageCredit: "Bangla Blend Kitchen, generated for this collection",
    ingredientGroups: [
      {
        title: "Main ingredients",
        ingredients: [
          { amount: "1 kg", name: "Duck", note: "cut into medium pieces" },
          { amount: "4 tbsp", name: "Mustard oil" },
          { amount: "3 medium", name: "Onions", note: "thinly sliced" },
          { amount: "2 tbsp", name: "Ginger paste" },
          { amount: "2 tbsp", name: "Garlic paste" },
          { amount: "8–10", name: "Green chillies" },
          { amount: "2", name: "Bay leaves" },
        ],
      },
      {
        title: "Whole spices",
        ingredients: [
          { amount: "1 stick", name: "Cinnamon" },
          { amount: "4", name: "Green cardamom pods" },
          { amount: "5", name: "Cloves" },
          { amount: "1 tsp", name: "Black peppercorns" },
        ],
      },
      {
        title: "Ground spices",
        ingredients: [
          { amount: "1 tsp", name: "Turmeric powder" },
          { amount: "2 tsp", name: "Red chilli powder" },
          { amount: "1½ tsp", name: "Coriander powder" },
          { amount: "1½ tsp", name: "Cumin powder" },
          { amount: "1 tsp", name: "Black pepper", note: "freshly ground" },
          { amount: "To taste", name: "Salt" },
        ],
      },
      {
        title: "To finish",
        ingredients: [
          { amount: "½ cup", name: "Fried onion" },
          { amount: "1 tsp", name: "Roasted cumin powder" },
          { amount: "1 tsp", name: "Ghee", note: "optional" },
        ],
      },
    ],
    stepSections: [
      {
        title: "Marinate",
        steps: [
          {
            instruction:
              "Mix the duck with the ginger, garlic, turmeric, chilli, cumin, coriander, ground black pepper and salt. Cover and refrigerate.",
            timerMinutes: 60,
          },
        ],
      },
      {
        title: "Slow cook",
        steps: [
          {
            instruction:
              "Heat the mustard oil in a heavy pot. Add the bay leaves, cinnamon, cardamom, cloves and peppercorns and cook until fragrant.",
          },
          { instruction: "Add the sliced onions and cook until deep golden." },
          {
            instruction:
              "Add the marinated duck and cook over medium-high heat, stirring frequently, until it releases its juices and begins to brown.",
            timerMinutes: 18,
          },
          {
            instruction:
              "Cover and cook over low heat in the duck's own fat and juices, stirring occasionally. Add hot water only a splash at a time if essential.",
            timerMinutes: 55,
          },
          {
            instruction:
              "When the duck is tender and has reached at least 74°C/165°F, stir in the fried onion and roasted cumin.",
          },
          {
            instruction:
              "Add the green chillies and cook uncovered until the masala is thick and the oil has separated. Finish with ghee if using, then rest.",
            timerMinutes: 12,
          },
        ],
      },
    ],
    servingSuggestions: ["Steamed white rice", "Kalijira rice", "Plain pulao", "Bhuna khichuri", "Cucumber and onion salad"],
    tips: [
      "Free-range duck gives a firmer texture and fuller flavour but may need longer cooking.",
      "Cook slowly so the meat tenderizes as its fat renders.",
      "The finished masala should be thick and cling to the duck rather than form a watery gravy.",
    ],
    storage: "Cool promptly, refrigerate in a covered container and use within 3–4 days.",
    safety: "Cook duck to a minimum internal temperature of 74°C/165°F, checking the thickest pieces away from bone.",
    dietaryTags: ["Dairy-free option", "Gluten-free"],
    librarySections: ["traditional"],
    relatedProducts: [hathazariChilli, blackPepper],
    author: "Bangla Blend Kitchen",
    publishedAt: "2026-08-19",
    featured: true,
    verified: true,
  },
];

export function getLaunchRecipe(slug: string) {
  return launchRecipes.find((recipe) => recipe.slug === slug);
}
