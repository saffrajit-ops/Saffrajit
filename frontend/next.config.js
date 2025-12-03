/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['res.cloudinary.com', 'lh3.googleusercontent.com'],
  },
  // Allow videos, API calls, and Google OAuth
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
    default-src 'self';
    connect-src 'self' 
      https://accounts.google.com 
      https://accounts.google.com/gsi/client 
      https://www.googleapis.com 
      https://oauth2.googleapis.com 
      http://localhost:5000 
      https://cana-gold-backend.vercel.app 
      https://res.cloudinary.com;
    media-src 'self' https://res.cloudinary.com blob: data:;
    img-src 'self' https://res.cloudinary.com https://lh3.googleusercontent.com data: blob:;
    script-src 'self' 'unsafe-eval' 'unsafe-inline'
      https://accounts.google.com
      https://accounts.google.com/gsi/
      https://accounts.google.com/gsi/client
      https://apis.google.com;
    style-src 'self' 'unsafe-inline' https://accounts.google.com;
    frame-src 'self' https://accounts.google.com;
  `.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
