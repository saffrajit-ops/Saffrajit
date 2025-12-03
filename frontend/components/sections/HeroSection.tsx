'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface HeroData {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  video: {
    url: string;
  };
}

export default function HeroSection() {
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHeroData();
  }, []);

  const fetchHeroData = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      console.log('🔍 Fetching hero section from:', `${API_URL}/hero-section`);
      
      const res = await fetch(`${API_URL}/hero-section`, {
        next: { revalidate: 60 } // Cache for 60 seconds
      });
      
      console.log('📡 Response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Hero data received:', data);
        
        if (data.success && data.data) {
          console.log('🎬 Video URL:', data.data.video?.url);
          setHeroData(data.data);
        }
      } else {
        console.error('❌ API response not OK:', res.status);
      }
    } catch (error) {
      console.error('❌ Failed to fetch hero section:', error);
      // Will use fallback content
    } finally {
      setIsLoading(false);
    }
  };

  // Show fallback content if loading or no data (server error/offline)
  if (isLoading || !heroData) {
    return (
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/video1.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="relative z-10 text-center text-white px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <h2 className="text-sm tracking-[0.3em] mb-4">THE POWER OF PURITY</h2>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl mb-6 tracking-wide">
              Saffrajit
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
              Premium Kashmiri Saffron & Pure Shilajit – Direct from Nature, Verified for Purity
            </p>
            <Link href="/products">
              <Button
                size="lg"
                className="bg-white text-black px-8 py-6 text-base tracking-wider rounded-none relative overflow-hidden group"
              >
                <span className="relative z-10">EXPLORE PRODUCTS</span>
                <span className="absolute inset-0 bg-black transform translate-y-full transition-transform duration-500 ease-out group-hover:translate-y-0"></span>
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center text-white z-20">
                  EXPLORE PRODUCTS
                </span>
              </Button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-white"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown size={32} />
        </motion.div>
      </section>
    );
  }

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <video
          key={heroData.video.url}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          onError={(e) => console.error('❌ Video failed to load:', e)}
          onLoadedData={() => console.log('✅ Video loaded successfully')}
        >
          <source src={heroData.video.url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-10 text-center text-white px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <h2 className="text-sm tracking-[0.3em] mb-4">{heroData.subtitle}</h2>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl mb-6 tracking-wide">
            {heroData.title}
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            {heroData.description}
          </p>
          <Link href={heroData.buttonLink}>
            <Button
              size="lg"
              className="bg-white text-black px-8 py-6 text-base tracking-wider rounded-none relative overflow-hidden group"
            >
              <span className="relative z-10">{heroData.buttonText}</span>
              <span className="absolute inset-0 bg-black transform translate-y-full transition-transform duration-500 ease-out group-hover:translate-y-0"></span>
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center text-white z-20">
                {heroData.buttonText}
              </span>
            </Button>
          </Link>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-white"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ChevronDown size={32} />
      </motion.div>
    </section>
  );
}
