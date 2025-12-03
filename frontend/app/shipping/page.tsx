'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, Package, RefreshCw, Clock, ChevronDown } from 'lucide-react';

export default function ShippingPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const sections = [
    {
      title: 'Shipping Overview',
      content: (
        <>
          <p className="mb-4">
            We offer shipping of online purchases to the U.S. and Canada and other countries.
            We use <strong>USPS</strong> to ship your package; <strong>UPS</strong> provides our expedited service.
            For orders shipping to a location outside of the U.S. or Canada, please email us at
            <a href="mailto:info@canagoldbeauty.com" className="text-blue-600"> info@canagoldbeauty.com</a>.
          </p>
          <p className="font-semibold">
            Please note: We ship Monday–Friday only during normal business hours.
            Any orders placed during non-business hours will be processed the following business day.
            Orders will not ship over the weekend.
          </p>
        </>
      ),
    },
    {
      title: 'Shipping Costs',
      content: (
        <>
          <p className="mb-4">
            Cana Gold Beauty offers <strong>FREE USPS Shipping</strong> on all US orders over <strong>$100*</strong>.
            No promotion code is required.
          </p>
          <p className="text-sm italic">
            *Free Shipping is not offered on orders placed during Flash Sales (such as on TV Shows on ABC and NBC).
          </p>
        </>
      ),
    },
    {
      title: 'Shipping Rates – US',
      content: (
        <table className="w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100 text-gray-800">
            <tr>
              <th className="p-2 text-left">Delivery Option</th>
              <th className="p-2 text-left">Cost</th>
              <th className="p-2 text-left">Shipping & Handling Time*</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border-t">USPS Priority Shipping</td>
              <td className="p-2 border-t">$11</td>
              <td className="p-2 border-t">USPS Priority 3–5 Business Days</td>
            </tr>
            <tr>
              <td className="p-2 border-t">USPS Priority Signature Required</td>
              <td className="p-2 border-t">$14</td>
              <td className="p-2 border-t">USPS Priority 3–5 Business Days</td>
            </tr>
            <tr>
              <td className="p-2 border-t">UPS 2 Day Air (Orders before 12 noon PT)</td>
              <td className="p-2 border-t">$25</td>
              <td className="p-2 border-t">2 Business Days (M–F)</td>
            </tr>
            <tr>
              <td className="p-2 border-t">UPS Next Day Air (Orders before 12 noon PT)</td>
              <td className="p-2 border-t">$29</td>
              <td className="p-2 border-t">Next Business Day (M–F)</td>
            </tr>
          </tbody>
        </table>
      ),
    },
    {
      title: 'Shipping Rates – Canada',
      content: (
        <>
          <p className="mb-4">
            Regions affected by the Canada Post Work Stoppage may experience delays.
            Cana Gold Beauty offers <strong>FREE USPS Shipping</strong> on all Canada orders over $100*.
          </p>
          <p className="mb-4">
            Customers are responsible for all Canadian import duties, taxes, and brokerage fees (if any).
            These fees may be charged when your package reaches the Canadian border.
          </p>
          <table className="w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100 text-gray-800">
              <tr>
                <th className="p-2 text-left">Delivery Option</th>
                <th className="p-2 text-left">Cost</th>
                <th className="p-2 text-left">Shipping & Handling Time*</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border-t">Ground Service</td>
                <td className="p-2 border-t">$25</td>
                <td className="p-2 border-t">6–14 Business Days (estimated)</td>
              </tr>
            </tbody>
          </table>
        </>
      ),
    },
    {
      title: 'Order Tracking',
      content: (
        <p>
          When you place an order, you will receive an order confirmation email.
          For questions, please contact <a href="mailto:info@canagoldbeauty.com" className="text-blue-600">info@canagoldbeauty.com</a>.
          Include your order number in the email subject.
        </p>
      ),
    },
    {
      title: 'Canceling an Order',
      content: (
        <p>
          Orders are processed immediately to ensure prompt delivery.
          Once submitted, we’re unable to cancel or change an order.
        </p>
      ),
    },
    {
      title: 'Out-of-Stock Items & Back Orders',
      content: (
        <p>
          If an item is out of stock, we’ll notify you via email with the expected restock date.
          Your remaining order will ship on time, and the back-ordered item will ship when available at no extra cost.
        </p>
      ),
    },
    {
      title: '30-Day Money Back Guarantee',
      content: (
        <>
          <p className="mb-4">
            We want you to be 100% satisfied with your purchase.
            If for any reason you’re unhappy, we’ll issue a refund or exchange for items returned within 30 days.
          </p>
          <p className="text-sm italic">
            *Products purchased during Flash Sales or annual Friends & Family Sales are subject to a 14-day return policy.
          </p>
        </>
      ),
    },
    {
      title: 'Return Policy',
      content: (
        <>
          <p className="mb-4">
            Return the unused portion within 30 days of your order for a refund (excluding shipping fees).
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Complete the Return Form (included with your shipment).</li>
            <li>If unavailable, print your email confirmation or contact <a href="mailto:info@canagoldbeauty.com" className="text-blue-600">info@canagoldbeauty.com</a>.</li>
            <li>Ship products to: Cana Gold Beauty Inc., c/o Return Department, 2005 Ocean Front Walk, Venice, CA 90291.</li>
          </ol>
          <p className="mt-4">
            Refunds are processed within 14 business days of receiving your return. Credits may take up to two billing cycles to appear.
          </p>
          <p className="mt-2 text-sm italic">
            Products must be unused and sealed. Opened items or those missing components may not qualify for a refund.
          </p>
        </>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gray-50 py-16 md:py-24 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-serif tracking-wider mb-4"
        >
          SHIPPING & RETURNS
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-600 max-w-2xl mx-auto"
        >
          Learn about our shipping policies and hassle-free return process
        </motion.p>
      </section>

      {/* Accordion Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {sections.map((item, index) => (
            <div key={index} className="border-b border-gray-200">
              <button
                onClick={() => toggleAccordion(index)}
                className="flex justify-between items-center w-full py-4 text-left"
              >
                <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
                <ChevronDown
                  className={`w-5 h-5 text-gray-600 transform transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: openIndex === index ? 'auto' : 0,
                  opacity: openIndex === index ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden text-gray-700 pb-4"
              >
                {item.content}
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-gray-50 p-8 text-center">
        <Clock className="w-12 h-12 text-gray-900 mx-auto mb-4" strokeWidth={1.5} />
        <h3 className="text-xl font-serif tracking-wider mb-4">NEED HELP?</h3>
        <p className="text-gray-600 mb-6">
          Our customer service team is here to assist you with any questions about shipping or returns.
        </p>
        <div className="space-y-2">
          <p><strong>Email:</strong> info@canagoldbeauty.com</p>
          <p><strong>Phone:</strong> +1 7472837766</p>
          <p className="text-sm text-gray-500">Monday - Friday: 9:00 AM - 6:00 PM EST</p>
        </div>
      </section>
    </main>
  );
}
