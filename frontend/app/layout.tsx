import './globals.css';
import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/sonner';
import { AuthInitializer } from '@/components/auth/AuthInitializer';
import { GoogleOAuthProvider } from '@/components/auth/GoogleOAuthProvider';
import { GlobalBannerWrapper } from '@/components/banners/GlobalBannerWrapper';
import { PageTracker } from '@/components/tracking/PageTracker';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-cormorant',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'Cana Gold Beauty - Where Nature Meets Science',
  description: 'Your number one source for Luxury Skin Care and Health products',
  icons: {
    icon: '/logo.png',
  },
  openGraph: {
    title: 'Cana Gold Beauty - Where Nature Meets Science',
    description: 'Your number one source for Luxury Skin Care and Health products',
    images: ['/og.webp'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${cormorant.variable} font-sans`}>
        <GoogleOAuthProvider>
          <AuthInitializer>
            <PageTracker />
            <Navigation />
            {children}
            <Footer />
            <GlobalBannerWrapper />
          </AuthInitializer>
        </GoogleOAuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
