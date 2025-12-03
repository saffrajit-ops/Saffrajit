export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: string;
  image: string;
  type: string;
  subtitle?: string;
  rating?: number;
  reviewCount?: number;
  images?: string[];
  size?: string;
  description?: string;
  features?: string[];
  ingredients?: string;
  howToUse?: string;
  stock?: number;
  cashOnDelivery?: {
    enabled: boolean;
  };
  returnPolicy?: {
    returnable: boolean;
    returnWindowDays: number;
  };
}

export const products: Product[] = [
  {
    id: "1",
    slug: "24k-gold-caviar-eye-repair",
    name: "24K Gold & Caviar 2 in 1 Eye Contouring & Repair Complex",
    category: "Eye Care",
    subtitle: "Advanced eye treatment",
    price: "$399.00",
    image: "/p/i3.png",
    type: "treatment",
    rating: 4.7,
    reviewCount: 3,
    images: ["/p/i3.png", "/p/i1.png", "/p/i2.png", "/p/i5.png"],
    size: "15 ml / 0.5 oz",
    description:
      "La Prairie's 24K Gold & Caviar Eye Complex improves the appearance of dull, discoloured skin, visibly reducing unevenness and promoting a lifted, youthful look around the delicate eye area.",
    features: [
      "Reduces fine lines and wrinkles",
      "Brightens dark circles",
      "Firms and lifts eye contour",
      "Infused with 24k gold and caviar extract",
    ],
    ingredients:
      "24K Gold, Caviar Extract, Hyaluronic Acid, Peptide Complex, Vitamin E",
    howToUse:
      "Apply morning and evening around the eye area. Gently pat until fully absorbed.",
  },
  {
    id: "2",
    slug: "24k-daily-rejuvenating-skin-treatment",
    name: "Gift Set: 24k Daily Rejuvenating Skin Treatment",
    category: "Gift Set",
    subtitle: "Complete daily rejuvenation system",
    price: "$799.00",
    image: "/p/i2.png",
    type: "gift-set",
    rating: 4.8,
    reviewCount: 5,
    images: ["/p/i2.png", "/p/i1.png", "/p/i3.png", "/p/i5.png"],
    size: "Full Set",
    description:
      "Complete rejuvenation system for youthful appearance. This luxurious gift set includes everything needed for a comprehensive daily skincare routine.",
    features: [
      "Complete daily skincare routine",
      "Rejuvenating formula",
      "Premium quality ingredients",
      "Elegant gift packaging",
    ],
    ingredients: "24K Gold, Caviar Extract, Collagen, Retinol, Vitamin C",
    howToUse: "Follow the included step-by-step guide for optimal results.",
  },
  {
    id: "3",
    slug: "24k-gold-caviar-magnetic-mask",
    name: "24K Gold & Caviar Magnetic Mask",
    category: "Treatment",
    subtitle: "Innovative magnetic mask technology",
    price: "$450.00",
    image: "/p/i5.png",
    type: "mask",
    rating: 4.6,
    reviewCount: 8,
    images: ["/p/i5.png", "/p/i1.png", "/p/i3.png", "/p/i2.png"],
    size: "50 ml / 1.7 oz",
    description:
      "Revolutionary magnetic mask that lifts impurities from deep within pores while delivering nourishing 24k gold and caviar extract.",
    features: [
      "Magnetic removal technology",
      "Deep pore cleansing",
      "Instant radiance boost",
      "Luxury spa experience at home",
    ],
    ingredients:
      "24K Gold, Caviar Extract, Iron Oxide, Glycerin, Botanical Extracts",
    howToUse:
      "Apply evenly, wait 10 minutes, then use the magnetic wand to remove.",
  },
  {
    id: "4",
    slug: "non-surgical-instant-lifting-mask",
    name: "Gift Set: Non-Surgical Instant Lifting Mask",
    category: "Gift Set",
    subtitle: "Instant lifting effect",
    price: "$850.00",
    image: "/p/i5.png",
    type: "gift-set",
    rating: 4.5,
    reviewCount: 6,
    images: ["/p/i5.png", "/p/i2.png", "/p/i1.png", "/p/i3.png"],
    size: "30 ml / 1 oz",
    description:
      "Non-surgical instant lifting solution that provides immediate visible results. Firms and tightens skin for a youthful appearance.",
    features: [
      "Instant visible lifting",
      "Non-surgical solution",
      "Long-lasting results",
      "Suitable for all skin types",
    ],
    ingredients: "24K Gold, Caviar Extract, Peptide Complex, DMAE, Argireline",
    howToUse:
      "Apply to clean skin, focusing on areas needing lift. Use morning and evening.",
  },
  {
    id: "5",
    slug: "24k-gold-caviar-overnight-treatment",
    name: "Gift Set: 24k Gold & Caviar Over-Night Application Treatment",
    category: "Gift Set",
    subtitle: "Intensive overnight renewal",
    price: "$899.00",
    image: "/p/i4.png",
    type: "gift-set",
    rating: 4.9,
    reviewCount: 4,
    images: ["/p/i4.png", "/p/i1.png", "/p/i5.png", "/p/i3.png"],
    size: "Full Set",
    description:
      "Intensive overnight treatment for deep skin renewal. Wake up to visibly transformed, radiant skin.",
    features: [
      "Overnight intensive care",
      "Deep skin renewal",
      "Intensive formula",
      "Complete treatment set",
    ],
    ingredients:
      "24K Gold, Caviar Extract, Night Repair Complex, Melatonin, Hyaluronic Acid",
    howToUse: "Apply before bed as the final step in your evening routine.",
  },
  {
    id: "6",
    slug: "24k-daily-application-treatment",
    name: "Gift Set: 24k Daily Application Treatment",
    category: "Gift Set",
    subtitle: "Daily luxury treatment",
    price: "$699.00",
    image: "/p/i1.png",
    type: "gift-set",
    rating: 4.7,
    reviewCount: 7,
    images: ["/p/i1.png", "/p/i3.png", "/p/i2.png", "/p/i5.png"],
    size: "50 ml / 1.7 oz",
    description:
      "Luxurious daily treatment with 24k gold for radiant skin. Perfect for everyday use to maintain youthful glow.",
    features: [
      "24k Gold Infused",
      "Daily use formula",
      "Anti-aging benefits",
      "Lightweight texture",
    ],
    ingredients:
      "24K Gold, Caviar Extract, Vitamin E, Antioxidants, Botanical Oils",
    howToUse: "Apply morning and evening to clean, dry skin.",
  },
  {
    id: "7",
    slug: "24k-gold-caviar-eye-serum",
    name: "24K Gold & Caviar Eye Serum",
    category: "Gift Set",
    subtitle: "Concentrated eye serum",
    price: "$299.00",
    image: "/p/i3.png",
    type: "serum",
    rating: 4.6,
    reviewCount: 9,
    images: ["/p/i3.png", "/p/i2.png", "/p/i1.png", "/p/i5.png"],
    size: "15 ml / 0.5 oz",
    description:
      "Concentrated eye serum that targets fine lines, dark circles, and puffiness for a refreshed, youthful look.",
    features: [
      "Reduces puffiness",
      "Minimizes dark circles",
      "Smooths fine lines",
      "Fast-absorbing formula",
    ],
    ingredients: "24K Gold, Caviar Extract, Caffeine, Peptides, Vitamin K",
    howToUse: "Gently pat around eye area morning and evening.",
  },
  {
    id: "8",
    slug: "24k-gold-caviar-rejuvenating-mask",
    name: "24K Gold & Caviar Rejuvenating Mask",
    category: "Gift Set",
    subtitle: "Weekly rejuvenation treatment",
    price: "$499.00",
    image: "/p/i5.png",
    type: "mask",
    rating: 4.8,
    reviewCount: 5,
    images: ["/p/i5.png", "/p/i4.png", "/p/i1.png", "/p/i3.png"],
    size: "75 ml / 2.5 oz",
    description:
      "Weekly rejuvenating mask that revitalizes and refreshes tired skin. Delivers intense hydration and radiance.",
    features: [
      "Weekly treatment",
      "Intense hydration",
      "Revitalizing formula",
      "Spa-quality results",
    ],
    ingredients:
      "24K Gold, Caviar Extract, Hyaluronic Acid, Aloe Vera, Marine Collagen",
    howToUse:
      "Apply generously 1-2 times per week. Leave on for 15-20 minutes, then rinse.",
  },
  {
    id: "9",
    slug: "24k-gold-caviar-ultimate-collection",
    name: "24K Gold & Caviar Ultimate Luxury Collection",
    category: "Gift Set",
    subtitle: "Complete luxury skincare experience",
    price: "$1,299.00",
    image: "/p/i4.png",
    type: "gift-set",
    rating: 5.0,
    reviewCount: 12,
    images: ["/p/i4.png", "/p/i1.png", "/p/i2.png", "/p/i5.png"],
    size: "Complete Set",
    description:
      "The ultimate luxury collection featuring our entire 24K Gold & Caviar range. Everything you need for a complete anti-aging regimen in one exquisite set.",
    features: [
      "Complete skincare system",
      "All premium products included",
      "Luxury presentation box",
      "Perfect for gifting",
    ],
    ingredients: "24K Gold, Caviar Extract, Complete Anti-Aging Complex",
    howToUse: "Follow the comprehensive guide included for best results.",
  },
  {
    id: "10",
    slug: "24k-gold-caviar-bridal-collection",
    name: "24K Gold & Caviar Bridal Radiance Collection",
    category: "Gift Set",
    subtitle: "Pre-wedding perfection set",
    price: "$949.00",
    image: "/p/i1.png",
    type: "gift-set",
    rating: 4.9,
    reviewCount: 8,
    images: ["/p/i1.png", "/p/i3.png", "/p/i5.png", "/p/i2.png"],
    size: "Bridal Set",
    description:
      "Specially curated for brides-to-be. Achieve radiant, flawless skin for your special day with this comprehensive pre-wedding skincare collection.",
    features: [
      "Pre-wedding preparation",
      "Radiance-boosting formula",
      "Complete 30-day program",
      "Elegant bridal packaging",
    ],
    ingredients: "24K Gold, Caviar Extract, Pearl Powder, Radiance Complex",
    howToUse: "Begin 30 days before your wedding for optimal results.",
  },
  {
    id: "11",
    slug: "24k-gold-caviar-travel-essentials",
    name: "24K Gold & Caviar Travel Essentials Set",
    category: "Gift Set",
    subtitle: "Luxury on the go",
    price: "$549.00",
    image: "/p/i2.png",
    type: "gift-set",
    rating: 4.7,
    reviewCount: 15,
    images: ["/p/i2.png", "/p/i1.png", "/p/i3.png", "/p/i5.png"],
    size: "Travel Size Set",
    description:
      "Travel-sized luxury essentials in TSA-approved sizes. Maintain your skincare routine wherever you go with this elegant travel collection.",
    features: [
      "TSA-approved sizes",
      "Complete travel routine",
      "Luxury travel case included",
      "Perfect for jet-setters",
    ],
    ingredients: "24K Gold, Caviar Extract, Travel-Optimized Formulas",
    howToUse: "Use as you would your full-size products while traveling.",
  },
  {
    id: "12",
    slug: "24k-gold-caviar-mothers-day-collection",
    name: "24K Gold & Caviar Mother's Day Special Collection",
    category: "Gift Set",
    subtitle: "Perfect gift for mom",
    price: "$849.00",
    image: "/p/i5.png",
    type: "gift-set",
    rating: 4.8,
    reviewCount: 20,
    images: ["/p/i5.png", "/p/i4.png", "/p/i1.png", "/p/i3.png"],
    size: "Special Edition Set",
    description:
      "Show your appreciation with this luxurious collection designed for mothers. Includes our most beloved products in beautiful gift packaging.",
    features: [
      "Curated for mothers",
      "Beautiful gift presentation",
      "Best-selling products",
      "Includes greeting card",
    ],
    ingredients: "24K Gold, Caviar Extract, Nurturing Botanical Complex",
    howToUse: "A complete pampering routine for the special woman in your life.",
  },
  {
    id: "13",
    slug: "24k-gold-caviar-anniversary-collection",
    name: "24K Gold & Caviar Anniversary Celebration Set",
    category: "Gift Set",
    subtitle: "Celebrate timeless beauty",
    price: "$999.00",
    image: "/p/i4.png",
    type: "gift-set",
    rating: 4.9,
    reviewCount: 11,
    images: ["/p/i4.png", "/p/i2.png", "/p/i5.png", "/p/i1.png"],
    size: "Anniversary Edition",
    description:
      "Celebrate your special milestone with this exclusive anniversary collection. Timeless luxury for timeless love.",
    features: [
      "Limited edition packaging",
      "Premium product selection",
      "Personalization available",
      "Romantic presentation",
    ],
    ingredients: "24K Gold, Caviar Extract, Rose Gold Complex, Diamond Dust",
    howToUse: "Share the luxury or enjoy together for a couples spa experience.",
  },
  {
    id: "14",
    slug: "24k-gold-caviar-holiday-luxury-set",
    name: "24K Gold & Caviar Holiday Luxury Gift Set",
    category: "Gift Set",
    subtitle: "Festive season elegance",
    price: "$1,099.00",
    image: "/p/i1.png",
    type: "gift-set",
    rating: 5.0,
    reviewCount: 18,
    images: ["/p/i1.png", "/p/i5.png", "/p/i3.png", "/p/i4.png"],
    size: "Holiday Edition",
    description:
      "Make the holidays extra special with this festive luxury collection. Beautifully packaged with seasonal elegance.",
    features: [
      "Festive holiday packaging",
      "Full-size luxury products",
      "Limited holiday edition",
      "Ready for gifting",
    ],
    ingredients: "24K Gold, Caviar Extract, Winter Botanical Blend",
    howToUse: "The perfect way to pamper yourself or loved ones during the holidays.",
  },
  {
    id: "15",
    slug: "24k-gold-caviar-starter-collection",
    name: "24K Gold & Caviar Discovery Starter Set",
    category: "Gift Set",
    subtitle: "Introduction to luxury",
    price: "$399.00",
    image: "/p/i3.png",
    type: "gift-set",
    rating: 4.6,
    reviewCount: 25,
    images: ["/p/i3.png", "/p/i1.png", "/p/i2.png", "/p/i5.png"],
    size: "Starter Set",
    description:
      "New to 24K Gold & Caviar? Start your luxury skincare journey with this carefully curated introduction set featuring our essential products.",
    features: [
      "Perfect for beginners",
      "Essential products included",
      "Value-priced introduction",
      "Complete starter routine",
    ],
    ingredients: "24K Gold, Caviar Extract, Essential Anti-Aging Complex",
    howToUse: "Follow the simple 3-step routine guide included in the set.",
  },
];

export const giftSets = products.filter((p) => p.type === 'gift-set');

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getRelatedProducts(currentProductId: string, limit: number = 3): Product[] {
  return products.filter((p) => p.id !== currentProductId).slice(0, limit);
}
