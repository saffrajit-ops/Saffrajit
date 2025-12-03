'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect, type ComponentPropsWithRef } from 'react';
import Link from 'next/link';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';

const collections = [
  {
    title: 'Anti Aging',
    image: '/p/i2.png',
  },
  {
    title: 'Eye Care',
    image: '/p/i4.png',
  },
  {
    title: 'Body Care',
    image: '/p/i1.png',
  },
  {
    title: 'Instant Face Lift',
    image: '/p/i5.png',
  },
  {
    title: 'Neck',
    image: '/p/i3.png',
  },
  {
    title: 'Masks',
    image: '/p/i2.png',
  },
];

export default function CollectionsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const autoplayRef = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <section ref={ref} className="py-24 px-6 lg:px-12 bg-neutral-50">
      <div className="max-w-[1600px] mx-auto">
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-xs md:text-sm tracking-[0.3em] text-gray-600 mb-3 md:mb-4">SHOP BY CATEGORIES</h2>
          <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl text-gray-900">Skincare Categories</h3>
        </motion.div>

        <Carousel
          setApi={setApi}
          opts={{
            align: 'start',
            loop: true,
          }}
          plugins={[autoplayRef.current]}
          className="w-full"
          onMouseEnter={() => autoplayRef.current.stop()}
          onMouseLeave={() => autoplayRef.current.play()}
        >
          <CarouselContent className="-ml-4 md:-ml-8 lg:-ml-20">
            {collections.map((collection, index) => (
              <CarouselItem
                key={collection.title}
                className="pl-4 md:pl-8 lg:pl-20 basis-full md:basis-1/2 lg:basis-[28%]"
              >
                <Link href={`/skincare?category=${encodeURIComponent(collection.title)}`}>
                  <motion.div
                    className="group cursor-pointer"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.1,
                    }}
                  >
                    <div className="relative h-[350px] md:h-[400px] lg:h-[360px] overflow-hidden bg-white">
                      <img
                        src={collection.image}
                        alt={collection.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-500" />
                    </div>
                    <div className="text-center mt-4 md:mt-6">
                      <h4 className="text-xs md:text-sm tracking-[0.2em] text-gray-900 uppercase">
                        {collection.title}
                      </h4>
                    </div>
                  </motion.div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 md:gap-2 mt-8 md:mt-12">
            {collections.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`h-1 md:h-1.5 rounded-full transition-all duration-300 ${index === current
                  ? 'w-6 md:w-8 bg-gray-900'
                  : 'w-1 md:w-1.5 bg-gray-300 hover:bg-gray-400'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </Carousel>
      </div>
    </section>
  );
}
