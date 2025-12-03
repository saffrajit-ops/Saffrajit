'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Sparkles, Leaf, Droplets, Waves, Zap, Flower } from 'lucide-react';

const ingredients = [
  {
    icon: Sparkles,
    name: '24K Nano Gold',
    description: 'Pure gold particles that penetrate deep to rejuvenate and illuminate',
  },
  {
    icon: Leaf,
    name: 'Green Tea Extract',
    description: 'Powerful antioxidants to protect and repair skin from environmental damage',
  },
  {
    icon: Droplets,
    name: 'Coco Extract',
    description: 'Deep hydration and nourishment for soft, supple skin',
  },
  {
    icon: Waves,
    name: 'Seaweed Extract',
    description: 'Marine minerals that detoxify and revitalize tired skin',
  },
  {
    icon: Zap,
    name: 'DMAE',
    description: 'Advanced firming agent that lifts and tightens for youthful contours',
  },
  {
    icon: Flower,
    name: 'Jasmine Oil',
    description: 'Luxurious essential oil that soothes and balances sensitive skin',
  },
];

export default function IngredientsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-24 px-6 lg:px-12 bg-gray-50">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-sm tracking-[0.3em] text-gray-600 mb-4">KEY INGREDIENTS</h2>
          <h3 className="font-serif text-4xl lg:text-5xl mb-6">
            Nature's Finest Elements
          </h3>
          <p className="text-gray-700 max-w-2xl mx-auto">
            Each ingredient is carefully selected for its unique properties and synergistic benefits
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ingredients.map((ingredient, index) => (
            <motion.div
              key={ingredient.name}
              className="bg-white p-8 rounded-lg hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-4">
                <ingredient.icon className="text-white" size={24} />
              </div>
              <h4 className="text-xl font-semibold mb-2">{ingredient.name}</h4>
              <p className="text-gray-600 leading-relaxed">{ingredient.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
