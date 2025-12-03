'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';

const ingredients = [
  {
    name: '24K Nano Gold',
    description: 'Pure 24K gold nanoparticles penetrate deep into the skin, stimulating collagen production and improving elasticity. This precious metal enhances cellular renewal, reduces inflammation, and provides powerful antioxidant protection for a luminous, youthful glow.',
    benefits: 'Boosts collagen synthesis, improves skin firmness, and delivers anti-aging benefits while promoting a radiant complexion.',
    image: '/ingredients/1.png',
  },
  {
    name: 'Green Tea Extract',
    description: 'Rich in polyphenols and catechins, green tea extract offers exceptional antioxidant protection against environmental damage. It soothes inflammation, reduces redness, and helps protect skin from UV damage while promoting a clear, healthy complexion.',
    benefits: 'Powerful antioxidant defense, anti-inflammatory properties, and protection against premature aging.',
    image: '/ingredients/2.png',
  },
  {
    name: 'Coco Extract',
    description: 'Derived from coconut, this nourishing extract deeply hydrates and softens the skin. Packed with fatty acids and vitamins, it strengthens the skin barrier, locks in moisture, and provides essential nutrients for smooth, supple skin.',
    benefits: 'Intense hydration, skin barrier repair, and long-lasting moisture retention for soft, healthy skin.',
    image: '/ingredients/3.png',
  },
  {
    name: 'Seaweed Extract',
    description: 'Harvested from pristine ocean waters, seaweed extract is rich in minerals, vitamins, and amino acids. It detoxifies, firms, and revitalizes the skin while improving circulation and promoting cellular regeneration for a toned, youthful appearance.',
    benefits: 'Detoxifies and purifies, improves skin elasticity, and delivers essential marine nutrients.',
    image: '/ingredients/4.png',
  },
  {
    name: 'DMAE',
    description: 'Dimethylaminoethanol (DMAE) is a powerful compound that provides immediate and long-term firming effects. It tightens and tones the skin, reduces the appearance of fine lines, and enhances facial contours for a lifted, sculpted look.',
    benefits: 'Instant firming effect, reduces sagging, and improves skin tone and texture.',
    image: '/ingredients/5.png',
  },
  {
    name: 'Jasmine Oil',
    description: 'This luxurious essential oil balances and rejuvenates all skin types. Jasmine oil helps fade scars and marks, evens skin tone, and provides aromatherapeutic benefits that promote relaxation and well-being while nourishing your skin.',
    benefits: 'Balances skin, fades imperfections, and provides calming aromatherapy benefits.',
    image: '/ingredients/6.png',
  },
];

function IngredientCard({ ingredient, index }: { ingredient: typeof ingredients[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const isEven = index % 2 === 0;

  return (
    <section ref={ref} className="py-12 lg:py-16 px-6 lg:px-12">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Image */}
          <motion.div
            className={`relative w-full overflow-hidden bg-gray-100 ${isEven ? 'order-1 lg:order-1' : 'order-1 lg:order-2'}`}
            style={{ aspectRatio: '16/9' }}
            initial={{ opacity: 0, x: isEven ? -30 : 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <img
              src={ingredient.image}
              alt={ingredient.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/5" />
          </motion.div>

          {/* Content */}
          <motion.div
            className={`space-y-4 lg:space-y-5 ${isEven ? 'order-2 lg:order-2' : 'order-2 lg:order-1'}`}
            initial={{ opacity: 0, x: isEven ? 30 : -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div>
              <p className="text-xs md:text-sm tracking-[0.3em] text-gray-600 mb-2 md:mb-3">
                KEY INGREDIENT
              </p>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-gray-900 mb-3 md:mb-4">
                {ingredient.name}
              </h2>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-4 md:mb-5">
                {ingredient.description}
              </p>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed font-medium">
                {ingredient.benefits}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function OurIngredientsPage() {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section ref={heroRef} className="pt-16 pb-12 lg:pt-24 lg:pb-16 px-6 lg:px-12 bg-gradient-to-b from-gray-50 to-white">
        <motion.div
          className="max-w-[1200px] mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={heroInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <p className="text-xs md:text-sm tracking-[0.3em] text-gray-600 mb-3 md:mb-4">
            THE SCIENCE OF LUXURY
          </p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-gray-900 mb-4 md:mb-6">
            Our Ingredients
          </h1>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
            Discover the powerful, scientifically-proven ingredients that make our formulations extraordinary. 
            Each ingredient is carefully selected for its unique properties and proven efficacy in delivering 
            visible results for your skin.
          </p>
        </motion.div>
      </section>

      {/* Ingredient Cards */}
      {ingredients.map((ingredient, index) => (
        <IngredientCard key={ingredient.name} ingredient={ingredient} index={index} />
      ))}

      {/* CTA Section */}
      <section className="py-16 lg:py-20 px-6 lg:px-12" style={{ backgroundColor: '#f6f6fa' }}>
        <motion.div
          className="max-w-[800px] mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-gray-900 mb-4 md:mb-6">
            Experience the Difference
          </h2>
          <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-6 md:mb-8">
            Our carefully curated ingredients work in harmony to deliver transformative results. 
            Explore our collection and discover the perfect products for your skincare needs.
          </p>
          <Button 
            size="lg" 
            className="px-8 md:px-12 bg-gray-900 hover:bg-gray-800 text-white tracking-wider rounded-none font-light text-xs md:text-sm h-10 md:h-12"
          >
            SHOP ALL PRODUCTS
          </Button>
        </motion.div>
      </section>
    </main>
  );
}
