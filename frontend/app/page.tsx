'use client';

import HeroSection from '@/components/sections/HeroSection';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import CollectionsSection from '@/components/sections/CollectionsSection';
import NewsletterSection from '@/components/sections/NewsletterSection';
import LuxuryShowcase from '@/components/sections/LuxuryShowcase';
import GiftSetsSection from '@/components/sections/GiftSetsSection';
import ShopByConcernSection from '@/components/sections/ShopByConcernSection';
import KeyIngredientsSection from '@/components/sections/KeyIngredientsSection';


export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <HeroSection />
      <CollectionsSection />
      <LuxuryShowcase />
      <GiftSetsSection />
      <KeyIngredientsSection />
      <FeaturedProducts />
      <ShopByConcernSection />
      <NewsletterSection />
    </main>
  );
}
