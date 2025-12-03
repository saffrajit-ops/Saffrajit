'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface LuxuryData {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  video: {
    url: string;
  };
}

export default function LuxuryShowcase() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [luxuryData, setLuxuryData] = useState<LuxuryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLuxuryData();
  }, []);

  const fetchLuxuryData = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      console.log('🔍 Fetching luxury showcase from:', `${API_URL}/luxury-showcase`);

      const res = await fetch(`${API_URL}/luxury-showcase`, {
        next: { revalidate: 60 } // Cache for 60 seconds
      });

      console.log('📡 Response status:', res.status);

      if (res.ok) {
        const data = await res.json();
        console.log('✅ Luxury data received:', data);

        if (data.success && data.data) {
          console.log('🎬 Video URL:', data.data.video?.url);
          setLuxuryData(data.data);
        }
      } else {
        console.error('❌ API response not OK:', res.status);
      }
    } catch (error) {
      console.error('❌ Failed to fetch luxury showcase:', error);
      // Will use fallback content
    } finally {
      setIsLoading(false);
    }
  };

  // Show fallback content if loading or no data (server error/offline)
  if (isLoading || !luxuryData) {
    return (
      <section ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/video2.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <motion.div
          className="relative z-10 text-center text-white px-6 max-w-4xl"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
        >
          <motion.h2
            className="text-sm tracking-[0.3em] mb-4"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            LUXURY GIFT SETS
          </motion.h2>
          <motion.h3
            className="font-serif text-5xl md:text-7xl mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            The Perfect Gift
          </motion.h3>
          <motion.p
            className="text-lg md:text-xl mb-8 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Curated collections featuring 24K Gold & Caviar treatments, from daily rejuvenation
            to overnight luxury and instant lifting solutions
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Link href="/gifts">
              <Button
                size="lg"
                className="bg-white text-black px-8 py-6 text-base tracking-wider rounded-none relative overflow-hidden group"
              >
                <span className="relative z-10">EXPLORE GIFT SETS</span>
                <span className="absolute inset-0 bg-black transform translate-y-full transition-transform duration-500 ease-out group-hover:translate-y-0"></span>
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center text-white z-20">
                  EXPLORE GIFT SETS
                </span>
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    );
  }

  return (
    <section ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video
          key={luxuryData.video.url}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          onError={(e) => console.error('❌ Video failed to load:', e)}
          onLoadedData={() => console.log('✅ Video loaded successfully')}
        >
          <source src={luxuryData.video.url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <motion.div
        className="relative z-10 text-center text-white px-6 max-w-4xl"
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1 }}
      >
        <motion.h2
          className="text-sm tracking-[0.3em] mb-4"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {luxuryData.subtitle}
        </motion.h2>
        <motion.h3
          className="font-serif text-5xl md:text-7xl mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {luxuryData.title}
        </motion.h3>
        <motion.p
          className="text-lg md:text-xl mb-8 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {luxuryData.description}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <Link href={luxuryData.buttonLink}>
            <Button
              size="lg"
              className="bg-white text-black px-8 py-6 text-base tracking-wider rounded-none relative overflow-hidden group"
            >
              <span className="relative z-10">{luxuryData.buttonText}</span>
              <span className="absolute inset-0 bg-black transform translate-y-full transition-transform duration-500 ease-out group-hover:translate-y-0"></span>
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center text-white z-20">
                {luxuryData.buttonText}
              </span>
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
