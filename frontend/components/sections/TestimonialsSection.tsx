'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const testimonials = [
  {
    name: 'Sarah Mitchell',
    location: 'Los Angeles, CA',
    rating: 5,
    text: 'The 24K Gold Serum has transformed my skin completely. I can see visible results after just two weeks of use. Absolutely worth the investment!',
    image: 'https://images.pexels.com/photos/3765550/pexels-photo-3765550.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Emily Chen',
    location: 'New York, NY',
    rating: 5,
    text: 'I have tried countless luxury skincare brands, but Cana Gold stands out. The marine collection is incredible - my skin has never looked better.',
    image: 'https://images.pexels.com/photos/3764119/pexels-photo-3764119.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    name: 'Jessica Rodriguez',
    location: 'Miami, FL',
    rating: 5,
    text: 'The DMAE Eye Cream is a game-changer! Fine lines have diminished and my eyes look more youthful. Highly recommend to anyone serious about anti-aging.',
    image: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

export default function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section ref={ref} className="py-24 px-6 lg:px-12 bg-white">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-sm tracking-[0.3em] text-gray-600 mb-4">TESTIMONIALS</h2>
          <h3 className="font-serif text-4xl lg:text-5xl">What Our Clients Say</h3>
        </motion.div>

        <motion.div
          className="relative max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="bg-gray-50 rounded-none p-12 relative">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 rounded-none overflow-hidden flex-shrink-0">
                <img
                  src={testimonials[currentIndex].image}
                  alt={testimonials[currentIndex].name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex justify-center md:justify-start mb-3">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <Star key={i} size={18} className="fill-black text-black" />
                  ))}
                </div>
                <p className="text-base font-light text-gray-700 leading-relaxed mb-6 italic">
                  "{testimonials[currentIndex].text}"
                </p>
                <div>
                  <p className="font-light text-base tracking-wider uppercase">{testimonials[currentIndex].name}</p>
                  <p className="text-gray-600 text-xs font-light tracking-wider">{testimonials[currentIndex].location}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={prevTestimonial}
                className="w-10 h-10 rounded-none border border-gray-300 flex items-center justify-center hover:bg-black hover:text-white transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextTestimonial}
                className="w-10 h-10 rounded-none border border-gray-300 flex items-center justify-center hover:bg-black hover:text-white transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
