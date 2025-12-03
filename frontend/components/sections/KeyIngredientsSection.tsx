'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';

const ingredients = [
  '24K Nano Gold',
  'Green Tea Extract',
  'Coco Extract',
  'Seaweed Extract',
  'DMAE',
  'Jasmine Oil',
];

export default function KeyIngredientsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-16 px-6 lg:px-12 bg-[#f6f6fa]">
      <div className="max-w-[1600px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Image - Top on mobile, Left on desktop */}
          <motion.div
            className="relative w-full overflow-hidden bg-gray-100 order-1"
            style={{ aspectRatio: "16/9" }}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <img
              src="/ingredients.png"
              alt="Key Ingredients"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/10" />
          </motion.div>

          {/* Content - Bottom on mobile, Right on desktop */}
          <motion.div
            className="space-y-4 lg:space-y-5 order-2"
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div>
              <p className="text-xs md:text-sm tracking-[0.3em] text-gray-600 mb-2 md:mb-3">
                KEY INGREDIENTS
              </p>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-gray-900 mb-4 md:mb-5">
                Powered by Nature's Finest
              </h2>

              <div className="space-y-1.5 mb-4 md:mb-5">
                {ingredients.map((ingredient, index) => (
                  <motion.div
                    key={ingredient}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  >
                    <div className="w-1.5 h-1.5 bg-gray-900 rounded-full" />
                    <p className="text-sm md:text-base text-gray-900 font-light tracking-wide">
                      {ingredient}
                    </p>
                  </motion.div>
                ))}
              </div>

              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                Our luxurious formulations combine the finest ingredients from
                nature and science, carefully selected to deliver exceptional
                results and transform your skincare routine.
              </p>
            </div>

            <Button
              size="lg"
              className="px-8 md:px-12 bg-gray-900 hover:bg-gray-800 text-white tracking-wider rounded-none font-light text-xs md:text-sm h-10 md:h-12"
            >
              DISCOVER MORE
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
