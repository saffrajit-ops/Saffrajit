'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Minus } from 'lucide-react';

interface Section {
  title: string;
  content: JSX.Element;
}

export default function PrivacyPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const sections: Section[] = [
    {
      title: 'Introduction / Overview',
      content: (
        <>
          <p>
            Welcome to canagoldbeauty.com website. Because canagoldbeauty.com respects your privacy,
            we have created this Privacy Policy to govern how we treat the personal information you
            provide to us. It is important for you to understand what information we gather about
            you during a visit to our website and what we do with that information.
          </p>
          <p className="mt-2">
            Any time you visit canagoldbeauty.com you are subject to this Privacy Policy and our
            Terms and Conditions. If you have any questions, comments or concerns about our privacy
            practices, please contact us by e-mail at{' '}
            <a href="mailto:info@canagoldbeauty.com" className="text-blue-600">
              info@canagoldbeauty.com
            </a>.
          </p>
        </>
      ),
    },
    {
      title: 'What We Do With Your Personally Identifiable Information',
      content: (
        <>
          <p>
            It is always up to you whether to disclose personally identifiable information to us.
            “Personally identifiable information” means information that can be used to identify you
            as an individual, such as:
          </p>
          <ul className="list-disc list-inside ml-4 mt-3 space-y-2">
            <li>Name, email, phone number, billing and shipping address</li>
            <li>User ID and password</li>
            <li>Credit card or payment information</li>
            <li>Account preferences and communication choices</li>
          </ul>
          <p className="mt-4">
            If you provide personally identifiable information, we will:
          </p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
            <li>Not sell or rent it to a third party without your permission</li>
            <li>
              Take commercially reasonable precautions to protect the information from loss, misuse,
              and unauthorized access
            </li>
            <li>
              Use or disclose it only to provide services you ordered, comply with legal
              requirements, or transfer data securely in case of merger/acquisition
            </li>
          </ul>
        </>
      ),
    },
    {
      title: 'Other Information We Collect',
      content: (
        <p>
          We may collect information that cannot readily identify you, such as your domain name,
          IP address, browser type, and device data. This data helps us analyze usage trends,
          administer the website, and improve our services.
        </p>
      ),
    },
    {
      title: 'Information Collected Automatically',
      content: (
        <>
          <p>
            Our website uses cookies, log files, web beacons, analytics, and third-party ad services
            to enhance user experience.
          </p>

          <h4 className="font-semibold mt-4">Cookies</h4>
          <p>
            Cookies are small files that store user preferences. We use them for remembering login
            sessions, tracking activity, and improving our website performance.
          </p>

          <h4 className="font-semibold mt-4">Log Files</h4>
          <p>
            We automatically collect data like IP address, browser type, pages viewed, and
            timestamps for analytics and site security.
          </p>

          <h4 className="font-semibold mt-4">Web Beacons</h4>
          <p>
            Web beacons in our pages or emails help us understand how users interact with content
            and which links are clicked.
          </p>

          <h4 className="font-semibold mt-4">Location Data</h4>
          <p>
            If you access via mobile, we may collect GPS-based location information with your
            device’s permission.
          </p>
        </>
      ),
    },
    {
      title: 'Information We Receive From Third Parties',
      content: (
        <p>
          We may receive updated information about you from third-party services (e.g., payment
          processors, shipping providers, or analytics tools) to maintain accurate records or
          improve our services.
        </p>
      ),
    },
    {
      title: 'External Data Storage Sites',
      content: (
        <p>
          Your data may be stored on secure servers operated by trusted third-party hosting
          providers. We ensure they maintain strong privacy and security protections.
        </p>
      ),
    },
    {
      title: 'How We Use Your Information',
      content: (
        <ul className="list-disc list-inside ml-4 space-y-2">
          <li>Process and deliver your orders</li>
          <li>Provide customer support</li>
          <li>Personalize your shopping experience</li>
          <li>Send order updates and promotions</li>
          <li>Improve our website and marketing efforts</li>
          <li>Comply with legal obligations</li>
        </ul>
      ),
    },
    {
      title: 'Product Reviews / Share This',
      content: (
        <p>
          Any information you post publicly (reviews, testimonials, comments) can be viewed by
          others. Please avoid sharing personal or sensitive information in public posts.
        </p>
      ),
    },
    {
      title: 'Your Choices',
      content: (
        <p>
          You may review, update, or delete your personal information at any time by contacting us.
          You may also opt out of marketing emails or adjust your communication preferences.
        </p>
      ),
    },
    {
      title: 'Information Security',
      content: (
        <p>
          We maintain administrative and technical safeguards to protect your personal data,
          including SSL encryption for transactions. However, no system is 100% secure, and we
          cannot guarantee absolute protection.
        </p>
      ),
    },
    {
      title: 'Links, Third-Party Websites & Social Media',
      content: (
        <p>
          Our site may include links to other websites (e.g., Facebook, Instagram). We are not
          responsible for their privacy practices. Review their policies before sharing information.
        </p>
      ),
    },
    {
      title: 'Users From Outside the United States',
      content: (
        <p>
          By using our site, you consent to the transfer and processing of your information in the
          United States, where privacy laws may differ from those in your country.
        </p>
      ),
    },
    {
      title: 'California Residents’ Privacy Rights',
      content: (
        <p>
          California residents may request information regarding third parties with whom we shared
          personal data for marketing. To exercise this right, contact us with the subject line
          “Your California Privacy Rights”.
        </p>
      ),
    },
    {
      title: 'Business Transfers',
      content: (
        <p>
          If our business is sold, merged, or transferred, your information may be included as part
          of the transferred assets, subject to this Privacy Policy.
        </p>
      ),
    },
    {
      title: 'Changes to This Policy',
      content: (
        <p>
          We may update this Privacy Policy periodically. Updates will be posted here with a revised
          “Last Updated” date. Continued use of our site constitutes acceptance of any changes.
        </p>
      ),
    },
    {
      title: 'Contact Us',
      content: (
        <div className="bg-gray-50 p-5 rounded-xl space-y-2">
          <p><strong>Email:</strong> info@canagoldbeauty.com</p>
          <p><strong>Phone:</strong> +1 747-283-7766</p>
          <p><strong>Address:</strong> Cana Gold Beauty, United States</p>
        </div>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-6"
          >
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-serif tracking-wider mb-4"
          >
            PRIVACY POLICY
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 max-w-2xl mx-auto"
          >
            Last Updated: January 2024
          </motion.p>
        </div>
      </section>

      {/* Accordion Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {sections.map((section, index) => (
            <div key={index} className="border rounded-xl overflow-hidden">
              <button
                onClick={() => toggle(index)}
                className="w-full flex justify-between items-center text-left p-5 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-lg font-medium text-gray-900">{section.title}</span>
                {openIndex === index ? (
                  <Minus className="w-5 h-5 text-gray-500" />
                ) : (
                  <Plus className="w-5 h-5 text-gray-500" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 text-gray-700 leading-relaxed bg-white">
                      {section.content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
