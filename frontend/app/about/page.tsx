'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Sparkles, Heart, Award, Globe } from 'lucide-react';

const values = [
  {
    icon: Sparkles,
    title: 'Innovation',
    description: 'Pioneering formulations developed with leading plastic surgeons',
  },
  {
    icon: Heart,
    title: 'Passion',
    description: 'Dedicated to creating products that transform beauty routines',
  },
  {
    icon: Award,
    title: 'Quality',
    description: 'Only the finest ingredients make it into our luxury formulations',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Serving customers across the US and internationally',
  },
];

export default function AboutPage() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <main className="min-h-screen bg-white pt-32 pb-24">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="font-serif text-5xl lg:text-7xl mb-6">Our Story</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Where Nature Meets Science in Perfect Harmony
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative h-[600px] rounded-lg overflow-hidden"
          >
            <img
              src="https://images.pexels.com/photos/3738347/pexels-photo-3738347.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Cana Gold laboratory"
              className="w-full h-full object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col justify-center space-y-6"
          >
            <h2 className="font-serif text-4xl">From Home Lab to Global Luxury</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
              <p>
                Welcome to Cana Gold, your number one source for Luxury Skin Care and Health products.
                We're dedicated to giving you the very best ingredients with a focus on Beauty & Health.
              </p>
              <p>
                Cana Gold has come a long way from its beginnings in my home lab. When I first started,
                my passion for Beauty and Health inspired me to quit my day job and gave me the drive to
                create some of the most unique skin care and health products on the planet.
              </p>
              <p>
                With the help of the best celebrity plastic surgeons, we've developed revolutionary
                formulations that combine 24K Nano Gold, Green Tea Extract, Coco Extract, Seaweed Extract,
                DMAE, and Jasmine Oil.
              </p>
              <p>
                I now ship my new luxury line of products to customers all over the US & abroad, and I am
                thrilled to be a part of the Beauty and Health industry. Cana Gold comes to you now with
                different lines to bring you beauty from inside to outside.
              </p>
            </div>
          </motion.div>
        </div>

        <section ref={ref} className="py-16 bg-gray-50 rounded-2xl px-8 lg:px-16">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-serif text-4xl mb-4">Our Values</h2>
            <p className="text-gray-600">The principles that guide everything we do</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="text-white" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <motion.div
          className="mt-24 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h2 className="font-serif text-4xl mb-6">The Science Behind Beauty</h2>
          <p className="text-gray-700 text-lg max-w-3xl mx-auto leading-relaxed">
            Our collaboration with celebrity plastic surgeons ensures that every product is formulated
            with the latest scientific research and the highest quality natural ingredients. We believe
            that true beauty comes from the perfect harmony between nature and science.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
