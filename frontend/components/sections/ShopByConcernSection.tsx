'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ShopByConcernSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section ref={ref} className="py-16 px-6 lg:px-12" style={{ backgroundColor: '#f6f6fa' }}>
      <div className="max-w-[1600px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Image - Top on mobile, Right on desktop */}
          <motion.div
            className="relative w-full overflow-hidden bg-gray-100 order-1 lg:order-2"
            style={{ aspectRatio: '16/9' }}
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <img
              src="/wellness.png"
              alt="Premium Wellness Products"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/10" />
          </motion.div>

          {/* Content - Bottom on mobile, Left on desktop */}
          <motion.div
            className="space-y-4 lg:space-y-5 order-2 lg:order-1"
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div>
              <p className="text-xs md:text-sm tracking-[0.3em] text-gray-600 mb-2 md:mb-3">
                SHOP FOR WELLNESS
              </p>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-gray-900 mb-3 md:mb-4">
                Natural Energy & Vitality
              </h2>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-4 md:mb-5">
                Discover the power of pure Saffron and Shilajit — nature's most potent wellness boosters. 
                Lab-verified purity, directly sourced, and delivered to enhance your strength, stamina, and overall vitality.
              </p>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                Experience the difference that real purity makes. Each product is crafted for maximum effectiveness 
                and authentic wellness transformation.
              </p>
            </div>
            
            <Link href="/products">
              <Button 
                size="lg" 
                className="px-8 md:px-12 bg-gray-900 hover:bg-gray-800 text-white tracking-wider rounded-none font-light text-xs md:text-sm h-10 md:h-12"
              >
                SHOP WELLNESS PRODUCTS
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
