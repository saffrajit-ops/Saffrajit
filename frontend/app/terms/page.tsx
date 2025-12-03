"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield } from "lucide-react"

const AccordionItem = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center py-4 text-left"
      >
        <span className="text-lg font-semibold text-gray-800">{title}</span>
        <span className="text-2xl font-bold text-gray-600">{open ? "–" : "+"}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden pb-4 text-gray-700 space-y-2 leading-relaxed"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <section className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <Shield className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600">
            Learn how we collect, use, and protect your information at Canagold Beauty.
          </p>
        </div>

        <div className="bg-gray-50 shadow-sm rounded-2xl p-6 space-y-4">
          {/* Section 1 */}
          <AccordionItem title="Introduction">
            <p>
              This Privacy Policy explains how Canagold Beauty (“we,” “our,” or “us”) collects,
              uses, and discloses your information when you use our website or purchase our
              products. By using our services, you consent to the collection and use of
              information in accordance with this policy.
            </p>
          </AccordionItem>

          {/* Section 2 */}
          <AccordionItem title="What We Do With Your Information">
            <p>
              When you purchase something from our store, as part of the buying and selling
              process, we collect the personal information you give us such as your name,
              address, and email address.
            </p>
            <p>
              When you browse our store, we also automatically receive your computer’s internet
              protocol (IP) address in order to provide us with information that helps us learn
              about your browser and operating system.
            </p>
            <p>
              Email marketing (if applicable): With your permission, we may send you emails about
              our store, new products, and other updates.
            </p>
          </AccordionItem>

          {/* Section 3 */}
          <AccordionItem title="Other Information We Collect">
            <p>
              We may collect additional information, including but not limited to demographic
              details, purchase history, and communication preferences. This helps us improve our
              products, customer support, and marketing efforts.
            </p>
          </AccordionItem>

          {/* Section 4 */}
          <AccordionItem title="Cookies">
            <p>
              Cookies are small pieces of data stored on your device that help improve your
              browsing experience. We use cookies to maintain sessions, remember preferences, and
              analyze website traffic. You can choose to disable cookies in your browser settings,
              but some features of our site may not function properly.
            </p>
          </AccordionItem>

          {/* Section 5 */}
          <AccordionItem title="How We Use Your Information">
            <p>We may use your information for the following purposes:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>To process and fulfill orders, including payments and shipping.</li>
              <li>To send order confirmations, updates, and marketing emails.</li>
              <li>To improve our website, products, and customer experience.</li>
              <li>To comply with legal obligations and prevent fraudulent activity.</li>
            </ul>
          </AccordionItem>
          {/* Section 6 */}
          <AccordionItem title="Sharing Your Information">
            <p>
              We may share your personal information with trusted third parties only when
              necessary to provide our services. These include payment processors, shipping
              carriers, and analytics providers. Each partner is required to handle your data
              securely and only for the intended purpose.
            </p>
            <p>
              We do not sell or rent your personal information to third parties for their own
              marketing purposes.
            </p>
          </AccordionItem>

          {/* Section 7 */}
          <AccordionItem title="Third-Party Services">
            <p>
              Certain third-party service providers (such as payment gateways and shipping
              companies) may collect, use, and disclose your information to the extent necessary
              to perform the services they provide to us.
            </p>
            <p>
              However, some third-party providers (like analytics or advertising partners) have
              their own privacy policies that govern how they use your information. We recommend
              reviewing their policies to understand how your data is handled.
            </p>
          </AccordionItem>

          {/* Section 8 */}
          <AccordionItem title="Security of Your Information">
            <p>
              We take reasonable precautions and follow industry best practices to protect your
              personal information from being lost, misused, accessed, disclosed, altered, or
              destroyed.
            </p>
            <p>
              While no online transmission or storage system can be guaranteed 100% secure, we
              continuously improve our safeguards to protect your data.
            </p>
          </AccordionItem>

          {/* Section 9 */}
          <AccordionItem title="Consent">
            <p>
              By using our site, you represent that you are at least the age of majority in your
              state or province of residence, or that you have given us your consent to allow any
              of your minor dependents to use this site.
            </p>
            <p>
              You may withdraw your consent for us to contact you, to continue data collection,
              use, or disclosure at any time by contacting us at{" "}
              <a
                href="mailto:info@canagoldbeauty.com"
                className="text-primary underline"
              >
                info@canagoldbeauty.com
              </a>
              .
            </p>
          </AccordionItem>

          {/* Section 10 */}
          <AccordionItem title="Your Rights">
            <p>
              You have the right to access, correct, amend, or delete any personal information we
              have about you. If you wish to exercise these rights, please contact us using the
              details provided below.
            </p>
          </AccordionItem>

          {/* Section 11 */}
          <AccordionItem title="Retention of Data">
            <p>
              We retain your personal information for as long as necessary to fulfill the
              purposes outlined in this policy, comply with our legal obligations, resolve
              disputes, and enforce our agreements.
            </p>
          </AccordionItem>

          {/* Section 12 */}
          <AccordionItem title="Links to Other Websites">
            <p>
              Our website may contain links to other websites not operated by us. We are not
              responsible for the privacy practices of such other sites and encourage you to read
              their privacy statements.
            </p>
          </AccordionItem>

          {/* Section 13 */}
          <AccordionItem title="Changes to This Privacy Policy">
            <p>
              We reserve the right to modify this privacy policy at any time, so please review it
              frequently. Changes and clarifications will take effect immediately upon their
              posting on the website.
            </p>
            <p>
              If we make material changes to this policy, we will notify you here that it has
              been updated so that you are aware of what information we collect, how we use it,
              and under what circumstances, if any, we use and/or disclose it.
            </p>
          </AccordionItem>

          {/* Section 14 */}
          <AccordionItem title="Contact Information">
            <p>
              If you would like to access, correct, amend, or delete any personal information we
              have about you, register a complaint, or simply want more information, contact our
              Privacy Compliance Officer at:
            </p>
            <ul className="list-none space-y-1 ml-2">
              <li>📧 <strong>Email:</strong>{" "}
                <a
                  href="mailto:info@canagoldbeauty.com"
                  className="text-primary underline"
                >
                  info@canagoldbeauty.com
                </a>
              </li>
              <li>🏢 <strong>Address:</strong> Canagold Beauty, U.S.A.</li>
            </ul>
          </AccordionItem>
        </div>
      </div>
    </section>
  )
}
