'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FooterBanner } from '@/components/banners/FooterBanner';

interface CompanyInfo {
  phone: string;
  email: string;
  socialMedia: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
    pinterest: string;
    youtube: string;
  };
  copyrightText: string;
}

export default function Footer() {
  const pathname = usePathname();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Determine current page from pathname based on actual site structure
  const getPageName = () => {
    if (pathname === '/') return 'home'
    if (pathname === '/skincare') return 'skincare'
    if (pathname === '/gifts') return 'gifts'
    if (pathname.startsWith('/product/')) return 'product-detail'
    if (pathname === '/checkout') return 'checkout'
    if (pathname.startsWith('/profile')) return 'profile'
    if (pathname === '/about') return 'about'
    if (pathname === '/cana-gold-story') return 'cana-gold-story'
    if (pathname === '/our-ingredients') return 'our-ingredients'
    if (pathname === '/contact') return 'contact'
    if (pathname.startsWith('/blog')) return 'blog'
    if (pathname === '/faq') return 'faq'
    if (pathname === '/shipping') return 'shipping'
    if (pathname === '/privacy') return 'privacy'
    if (pathname === '/terms') return 'terms'
    if (pathname === '/login') return 'login'
    if (pathname === '/register') return 'register'
    if (pathname === '/order-confirmation') return 'order-confirmation'
    
    return 'home'
  }

  const currentPage = getPageName();

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/company-info`);
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setCompanyInfo(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch company info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${API_URL}/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, source: 'footer' }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Successfully subscribed to newsletter!' });
        setEmail('');
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to subscribe' });
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setMessage({ type: 'error', text: 'Failed to subscribe. Please try again.' });
    } finally {
      setIsSubmitting(false);
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    }
  };

  // Fallback data
  const fallbackData: CompanyInfo = {
    phone: '+1 7472837766',
    email: 'info@canagoldbeauty.com',
    socialMedia: {
      facebook: 'https://www.facebook.com/CanaGoldBeauty/',
      instagram: 'https://www.instagram.com/canagoldbeauty/',
      twitter: 'https://twitter.com/CanaGoldBeauty',
      linkedin: 'https://www.linkedin.com/company/cana-gold/',
      pinterest: 'https://www.pinterest.com/CanaGoldBeauty/',
      youtube: '',
    },
    copyrightText: '© 2009 - 2022 CANAGOLD. ALL RIGHTS RESERVED. WEBSITE BY FIXL SOLUTIONS.',
  };

  const data = companyInfo || fallbackData;

  return (
    <>
      {/* Footer Banner - Just before footer */}
      <div className="container mx-auto px-4">
        <FooterBanner page={currentPage} />
      </div>

      <footer className="bg-zinc-900 text-white">
      {/* Footer Content Section */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-10">
          
          {/* Sign Up & Save / Toll Free No. */}
          <div className="lg:col-span-1">
            <h4 className="text-sm font-semibold tracking-wide mb-6 uppercase">SIGN UP & SAVE</h4>
            
            {/* Email Input and Sign Up Button */}
            <form onSubmit={handleNewsletterSubmit} className="mb-10">
              <div className="flex border border-white">
                <Input
                  type="email"
                  placeholder="ENTER YOUR EMAIL ADDRESS"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="flex-grow bg-transparent border-none text-white placeholder:text-gray-400 rounded-none h-12 font-light text-sm p-3 focus:ring-0 focus:ring-offset-0"
                />
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-white text-black hover:bg-gray-200 rounded-none h-12 font-semibold tracking-wider text-xs px-6 disabled:opacity-50"
                >
                  {isSubmitting ? 'LOADING...' : 'SIGN UP'}
                </Button>
              </div>
              {message && (
                <p className={`text-xs mt-2 ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {message.text}
                </p>
              )}
            </form>

            <h4 className="text-sm font-semibold tracking-wide mb-3 uppercase">TOLL FREE NO.</h4>
            <p className="text-xl font-medium text-white">{data.phone}</p>
          </div>

          {/* Cana Gold Section */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide mb-6 uppercase">CANA GOLD</h4>
            <ul className="space-y-3 text-sm font-light text-gray-300">
              <li><Link href="/cana-gold-story" className="hover:text-white transition-colors">CANA GOLD STORY</Link></li>
              <li><Link href="/our-ingredients" className="hover:text-white transition-colors">OUR INGREDIENTS</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">BLOG</Link></li>
            </ul>
          </div>

          {/* Customer Care Section */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide mb-6 uppercase">CUSTOMER CARE</h4>
            <ul className="space-y-3 text-sm font-light text-gray-300">
              <li><Link href="/contact" className="hover:text-white transition-colors">CONTACT US</Link></li>
              <li><Link href="/shipping" className="hover:text-white transition-colors">SHIPPING & RETURN</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">PRIVACY POLICY</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">TERMS OF SERVICE</Link></li>
            </ul>
          </div>

          {/* Follow Us Section */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide mb-6 uppercase">FOLLOW US</h4>
            <div className="flex flex-wrap gap-3">
              {/* Note: Links updated with assumed external URLs. The icon style is dark background, white icons. */}
              
              {/* Twitter */}
              {data.socialMedia.twitter && (
                <a href={data.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="bg-white p-2 rounded-full hover:bg-gray-300 transition-colors">
                  <Twitter size={18} className="text-black" />
                </a>
              )}
              {/* Instagram */}
              {data.socialMedia.instagram && (
                <a href={data.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="bg-white p-2 rounded-full hover:bg-gray-300 transition-colors">
                  <Instagram size={18} className="text-black" />
                </a>
              )}
              {/* Facebook */}
              {data.socialMedia.facebook && (
                <a href={data.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="bg-white p-2 rounded-full hover:bg-gray-300 transition-colors">
                  <Facebook size={18} className="text-black" />
                </a>
              )}
              {/* LinkedIn */}
              {data.socialMedia.linkedin && (
                <a href={data.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="bg-white p-2 rounded-full hover:bg-gray-300 transition-colors">
                  <Linkedin size={18} className="text-black" />
                </a>
              )}
              {/* Pinterest */}
              {data.socialMedia.pinterest && (
                <a href={data.socialMedia.pinterest} target="_blank" rel="noopener noreferrer" className="bg-white p-2 rounded-full hover:bg-gray-300 transition-colors">
                  <Pin size={18} className="text-black" />
                </a>
              )}
              {/* YouTube */}
              {data.socialMedia.youtube && (
                <a href={data.socialMedia.youtube} target="_blank" rel="noopener noreferrer" className="bg-white p-2 rounded-full hover:bg-gray-300 transition-colors">
                  <Youtube size={18} className="text-black" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Copyright Section (Bottom Bar) */}
        <div className="pt-8 text-center border-t border-gray-800 mt-10">
          <p className="text-sm text-gray-400 font-light">
            {data.copyrightText}
          </p>
        </div>
      </div>
    </footer>
    </>
  );
}