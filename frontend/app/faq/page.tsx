'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // 🟡 ORDERS & SHIPPING
  {
    category: 'Orders & Shipping',
    question: 'When will my order be shipped?',
    answer:
      'All orders are processed within 1–2 business days. Standard shipping usually takes 5–7 business days after processing, while expedited shipping options (2–3 days) are also available at checkout.',
  },
  {
    category: 'Orders & Shipping',
    question: 'Which shipping carriers do you use?',
    answer:
      'We primarily use USPS for standard delivery and UPS for expedited services. Tracking details will be sent once your order ships.',
  },
  {
    category: 'Orders & Shipping',
    question: 'Do you ship outside the United States?',
    answer:
      'We currently ship across the U.S. and Canada. For international delivery inquiries, please contact our support team at info@canagoldbeauty.com.',
  },
  {
    category: 'Orders & Shipping',
    question: 'How can I track my order?',
    answer:
      'After your order ships, you’ll receive an email with tracking details. You can also log in to your Cana Gold account to check your current order status anytime.',
  },
  {
    category: 'Orders & Shipping',
    question: 'Can I modify or cancel my order?',
    answer:
      'We can make changes or cancellations only within one hour of placing your order. Once processing starts, we’re unable to make modifications.',
  },

  // 🟢 RETURNS & REFUNDS
  {
    category: 'Returns & Refunds',
    question: 'What is your return policy?',
    answer:
      'We accept returns within 30 days of delivery. Products must be unopened, unused, and in their original packaging. To begin a return, contact us at info@canagoldbeauty.com.',
  },
  {
    category: 'Returns & Refunds',
    question: 'When will I receive my refund?',
    answer:
      'Once your returned items are received and inspected, your refund will be processed within 5–7 business days to your original payment method.',
  },
  {
    category: 'Returns & Refunds',
    question: 'Do I have to pay for return shipping?',
    answer:
      'If your item is defective, damaged, or incorrect, we’ll cover the return shipping cost. Otherwise, a small return shipping fee may be deducted from your refund.',
  },

  // 🟣 PRODUCTS
  {
    category: 'Products',
    question: 'Are Cana Gold products cruelty-free?',
    answer:
      'Yes! All Cana Gold products are 100% cruelty-free. We never test on animals and partner only with ethical suppliers that share our commitment.',
  },
  {
    category: 'Products',
    question: 'What ingredients are used in Cana Gold products?',
    answer:
      'Our products feature premium Cannabis Sativa Seed Oil blended with luxury elements such as 24K Gold, Caviar Extract, and other nourishing botanicals that help rejuvenate and protect your skin.',
  },
  {
    category: 'Products',
    question: 'How should I store my skincare products?',
    answer:
      'Keep products in a cool, dry place away from direct sunlight. Make sure lids are tightly closed to maintain product freshness and shelf life (typically 12–24 months).',
  },
  {
    category: 'Products',
    question: 'Are your products safe for sensitive skin?',
    answer:
      'Our formulas are designed for all skin types and dermatologically tested for safety. However, we always recommend doing a patch test before first use if you have sensitive skin.',
  },
  {
    category: 'Products',
    question: 'Do Cana Gold products contain THC?',
    answer:
      'No, our products use hemp-derived Cannabis Sativa Seed Oil and do not contain THC or any psychoactive compounds.',
  },

  // 🔵 ACCOUNT & PAYMENT
  {
    category: 'Account & Payment',
    question: 'Do I need to create an account to order?',
    answer:
      'You can shop as a guest, but creating an account allows you to track orders, manage addresses, and receive exclusive promotions.',
  },
  {
    category: 'Account & Payment',
    question: 'What payment options are available?',
    answer:
      'We accept Visa, Mastercard, American Express, Discover, and secure payments via Stripe. All transactions are encrypted for your protection.',
  },
  {
    category: 'Account & Payment',
    question: 'How secure is my payment information?',
    answer:
      'Your payment is processed through Stripe, a PCI-compliant provider. We never store or access your credit card details directly.',
  },
  {
    category: 'Account & Payment',
    question: 'How can I reset my account password?',
    answer:
      'Click on “Forgot Password” on the login page, then follow the instructions in your email to reset your password securely.',
  },
];

const categories = Array.from(new Set(faqs.map((faq) => faq.category)));

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredFaqs =
    selectedCategory === 'All'
      ? faqs
      : faqs.filter((faq) => faq.category === selectedCategory);

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
              <HelpCircle className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-serif tracking-wider mb-4"
          >
            FREQUENTLY ASKED QUESTIONS
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 max-w-2xl mx-auto"
          >
            Get answers to the most common questions about our skincare products,
            orders, shipping, and returns.
          </motion.p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-6 py-2 text-sm tracking-wider transition-colors ${
                  selectedCategory === 'All'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ALL
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-2 text-sm tracking-wider transition-colors ${
                    selectedCategory === category
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.toUpperCase()}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Accordion FAQ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {filteredFaqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 overflow-hidden">
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 pr-4">
                    <span className="text-xs text-gray-500 tracking-wider uppercase block mb-1">
                      {faq.category}
                    </span>
                    <span className="text-base font-medium text-gray-900">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${
                      openIndex === index ? 'transform rotate-180' : ''
                    }`}
                    strokeWidth={1.5}
                  />
                </button>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>

          {/* Contact Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 bg-gray-50 p-8 text-center"
          >
            <h3 className="text-xl font-serif tracking-wider mb-4">
              STILL HAVE QUESTIONS?
            </h3>
            <p className="text-gray-600 mb-6">
              Can’t find what you’re looking for? Reach out to our support team.
            </p>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Email:</strong> info@canagoldbeauty.com
              </p>
              <p>
                <strong>Phone:</strong> +1 747-283-7766
              </p>
              <p className="text-gray-500">
                Monday – Friday: 9:00 AM – 6:00 PM EST
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
