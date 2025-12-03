'use client';

import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import Image from 'next/image';

export default function StorySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const founderRef = useRef(null);
  const founderInView = useInView(founderRef, { once: true, margin: '-100px' });

  return (
    <>
      <section ref={ref} className="py-24 px-6 lg:px-12 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-sm tracking-[0.3em] text-gray-600 mb-4">OUR STORY</h2>
              <h3 className="font-serif text-4xl lg:text-5xl mb-6">
                The Power of Purity
              </h3>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Saffrajit was founded on a simple belief: wellness should never be compromised. 
                  We started with a vision to bring the world's finest natural wellness products — 
                  Kashmiri Saffron and Pure Shilajit — directly to those who seek authenticity.
                </p>
                <p>
                  In a market flooded with adulterated products, we made a commitment: 
                  100% purity, direct sourcing from trusted origins, and rigorous lab verification. 
                  Every product is tested, certified, and delivered with transparency.
                </p>
                <p>
                  Today, Saffrajit serves wellness seekers across the globe, delivering 
                  premium-quality products that honor both traditional wisdom and modern science. 
                  Real wellness comes from real purity — and that's our promise.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative h-[600px] rounded-lg overflow-hidden"
            >
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Values Section */}
      <section ref={founderRef} className="py-24 px-6 lg:px-12 bg-gradient-to-b from-white to-amber-50/30">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={founderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-sm tracking-[0.3em] text-gray-600 mb-4">OUR COMMITMENT</h2>
            <h3 className="font-serif text-4xl lg:text-5xl">Pure. Powerful. Precious.</h3>
          </motion.div>

          <div className="space-y-24">
            {/* Premium Kashmiri Saffron */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={founderInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              <div className="relative h-[500px] rounded-lg overflow-hidden shadow-xl">
                <Image
                  src="/saffron.jpg"
                  alt="Premium Kashmiri Saffron"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="font-serif text-3xl mb-2">Premium Kashmiri Saffron</h4>
                  <p className="text-amber-600 font-medium tracking-wide">The Finest Saffron</p>
                </div>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    Experience the rich aroma, deep natural color, and authentic taste of genuine Kashmiri Saffron. 
                    Each strand is carefully selected from premium sources in Kashmir and Iran.
                  </p>
                  <div>
                    <p className="font-semibold mb-2">Key Benefits:</p>
                    <ul className="list-none space-y-2 ml-4">
                      <li className="flex items-start">
                        <span className="text-amber-600 mr-2">✦</span>
                        <span>Supports immunity and heart health</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-amber-600 mr-2">✦</span>
                        <span>Enhances memory and mood naturally</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-amber-600 mr-2">✦</span>
                        <span>Improves skin glow and vitality</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-amber-600 mr-2">✦</span>
                        <span>Perfect for culinary and wellness use</span>
                      </li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-600 italic">
                    Available in 0.5g, 1g, 2g, 5g, and bulk packs
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Pure Shilajit */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={founderInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            >
              <div className="space-y-6 lg:order-1">
                <div>
                  <h4 className="font-serif text-3xl mb-2">Pure Shilajit</h4>
                  <p className="text-amber-600 font-medium tracking-wide">Nature's Wellness Booster</p>
                </div>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    A natural wellness powerhouse rich in essential minerals and fulvic acid. 
                    Our Shilajit is lab-verified for purity and potency, sourced directly from pristine mountain regions.
                  </p>
                  <div>
                    <p className="font-semibold mb-2">Key Benefits:</p>
                    <ul className="list-none space-y-2 ml-4">
                      <li className="flex items-start">
                        <span className="text-amber-600 mr-2">✦</span>
                        <span>Enhances strength and stamina</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-amber-600 mr-2">✦</span>
                        <span>Supports overall immunity and wellness</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-amber-600 mr-2">✦</span>
                        <span>Improves energy, focus, and performance</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-amber-600 mr-2">✦</span>
                        <span>Rich in essential minerals and fulvic acid</span>
                      </li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-600 italic">
                    Available in 10g, 20g, 30g, and 50g sizes
                  </p>
                </div>
              </div>
              <div className="relative h-[500px] rounded-lg overflow-hidden shadow-xl lg:order-2">
                <Image
                  src="/shilajit.jpg"
                  alt="Pure Shilajit"
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>

            {/* Why Choose Saffrajit */}
            <QualityPromiseSection founderInView={founderInView} />
          </div>
        </div>
      </section>
    </>
  );
}

function QualityPromiseSection({ founderInView }: { founderInView: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const fullContent = `At Saffrajit, we believe that true wellness comes from real purity. We don't just sell products — we provide assurance, trust, and transparency in every package.

Our Quality Promise:

✔ Direct Sourcing: We work directly with verified producers in Kashmir, Iran, and mountain regions to ensure authenticity and eliminate middlemen.

✔ Lab-Tested Purity: Every batch is rigorously tested for purity, potency, and safety. No adulteration, no artificial colors, no harmful chemicals.

✔ Premium Packaging: Our products are sealed in food-grade, moisture-resistant packaging to preserve freshness and ensure maximum shelf life.

✔ Worldwide Delivery: We proudly deliver to customers across the globe with secure, export-grade packaging.

✔ Honest Pricing: We offer the best quality at fair prices — no hidden costs, no compromises.

We stand by our products 100%. Your wellness is our priority.`;

  const previewContent = fullContent.split('\n\n').slice(0, 2).join('\n\n');

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={founderInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
    >
      <div className="relative h-[500px] rounded-lg overflow-hidden shadow-xl">
        <Image
          src="/quality.jpg"
          alt="Quality Assurance"
          fill
          className="object-cover"
        />
      </div>
      <div className="space-y-6">
        <div>
          <h4 className="font-serif text-3xl mb-2">Our Quality Promise</h4>
          <p className="text-amber-600 font-medium tracking-wide">
            100% Purity. No Compromise.
          </p>
        </div>
        <div>
          <div className="relative">
            <div
              className={`space-y-4 text-gray-700 leading-relaxed transition-all duration-500 ${isExpanded
                  ? 'max-h-[400px] overflow-y-auto pr-4'
                  : 'max-h-[300px] overflow-hidden'
                }`}
            >
              {isExpanded ? (
                fullContent.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))
              ) : (
                <>
                  {previewContent.split('\n\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </>
              )}
            </div>
            {!isExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 text-amber-600 hover:text-amber-700 font-medium tracking-wide transition-colors duration-200 flex items-center gap-2 relative z-10"
            type="button"
          >
            {isExpanded ? (
              <>
                Read Less
                <svg
                  className="w-4 h-4 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </>
            ) : (
              <>
                Read More
                <svg
                  className="w-4 h-4 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
