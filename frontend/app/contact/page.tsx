'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ButtonLoader } from '@/components/ui/loader';
import { toast } from 'sonner';
import { useContactStore } from '@/lib/contact-store';

interface CompanyInfo {
    phone: string;
    email: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    businessHours?: {
        weekdays: string;
        saturday: string;
        sunday: string;
    };
}

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });

    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
    const [isLoadingInfo, setIsLoadingInfo] = useState(true);

    const { isSubmitting, error, success, submitContact, reset } = useContactStore();

    // Fetch company info
    useEffect(() => {
        fetchCompanyInfo();
    }, []);

    const fetchCompanyInfo = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${API_URL}/company-info`, {
                next: { revalidate: 60 }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    setCompanyInfo(data.data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch company info:', error);
        } finally {
            setIsLoadingInfo(false);
        }
    };

    // Handle success notification
    useEffect(() => {
        if (success) {
            toast.success('Message sent successfully!', {
                description: 'We will get back to you soon.',
            });
            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: '',
            });
            // Reset store state after a delay
            setTimeout(() => reset(), 100);
        }
    }, [success, reset]);

    // Handle error notification
    useEffect(() => {
        if (error) {
            toast.error('Failed to send message', {
                description: error,
            });
        }
    }, [error]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submitContact(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Fallback data
    const fallbackData: CompanyInfo = {
        phone: '+1 747-283-7766',
        email: 'info@canagoldbeauty.com',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'United States'
        },
        businessHours: {
            weekdays: 'Monday - Friday: 9:00 AM - 6:00 PM EST',
            saturday: 'Saturday: 10:00 AM - 4:00 PM EST',
            sunday: 'Sunday: Closed'
        }
    };

    const contactData = companyInfo || fallbackData;

    return (
        <main className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="bg-gray-50 py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-serif tracking-wider mb-4"
                    >
                        CONTACT US
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-600 max-w-2xl mx-auto"
                    >
                        Have a question or need assistance? We're here to help. Reach out to us and we'll respond as soon as possible.
                    </motion.p>
                </div>
            </section>

            {/* Contact Information & Form */}
            <section className="py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                        {/* Contact Information */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                        >
                            <div>
                                <h2 className="text-2xl font-serif tracking-wider mb-8">GET IN TOUCH</h2>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Phone className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold tracking-wider mb-1">PHONE</h3>
                                            <p className="text-gray-600">{contactData.phone}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold tracking-wider mb-1">EMAIL</h3>
                                            <p className="text-gray-600">{contactData.email}</p>
                                        </div>
                                    </div>

                                    {contactData.address && (contactData.address.street || contactData.address.city || contactData.address.country) && (
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <MapPin className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold tracking-wider mb-1">ADDRESS</h3>
                                                <p className="text-gray-600">
                                                    {contactData.address.street && <>{contactData.address.street}<br /></>}
                                                    {contactData.address.city && contactData.address.state && <>{contactData.address.city}, {contactData.address.state} {contactData.address.zipCode}<br /></>}
                                                    {contactData.address.country}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {contactData.businessHours && (
                                <div className="pt-8 border-t border-gray-200">
                                    <h3 className="text-sm font-semibold tracking-wider mb-4">BUSINESS HOURS</h3>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        {contactData.businessHours.weekdays && <p>{contactData.businessHours.weekdays}</p>}
                                        {contactData.businessHours.saturday && <p>{contactData.businessHours.saturday}</p>}
                                        {contactData.businessHours.sunday && <p>{contactData.businessHours.sunday}</p>}
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-2"
                        >
                            <div className="bg-gray-50 p-8 md:p-12">
                                <h2 className="text-2xl font-serif tracking-wider mb-8">SEND US A MESSAGE</h2>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <Label htmlFor="name" className="text-xs tracking-wider uppercase mb-2 block">
                                                Name *
                                            </Label>
                                            <Input
                                                id="name"
                                                name="name"
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="rounded-none border-gray-300 focus:border-black"
                                                placeholder="Your name"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="email" className="text-xs tracking-wider uppercase mb-2 block">
                                                Email *
                                            </Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="rounded-none border-gray-300 focus:border-black"
                                                placeholder="your@email.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <Label htmlFor="phone" className="text-xs tracking-wider uppercase mb-2 block">
                                                Phone
                                            </Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="rounded-none border-gray-300 focus:border-black"
                                                placeholder="+1 (555) 000-0000"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="subject" className="text-xs tracking-wider uppercase mb-2 block">
                                                Subject *
                                            </Label>
                                            <Input
                                                id="subject"
                                                name="subject"
                                                type="text"
                                                required
                                                value={formData.subject}
                                                onChange={handleChange}
                                                className="rounded-none border-gray-300 focus:border-black"
                                                placeholder="How can we help?"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="message" className="text-xs tracking-wider uppercase mb-2 block">
                                            Message *
                                        </Label>
                                        <Textarea
                                            id="message"
                                            name="message"
                                            required
                                            value={formData.message}
                                            onChange={handleChange}
                                            rows={6}
                                            className="rounded-none border-gray-300 focus:border-black resize-none"
                                            placeholder="Tell us more about your inquiry..."
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full md:w-auto bg-gray-900 hover:bg-gray-800 text-white rounded-none h-12 px-12 text-xs tracking-[0.15em] font-light flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <ButtonLoader />
                                                <span>SENDING...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" strokeWidth={1.5} />
                                                <span>SEND MESSAGE</span>
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </main>
    );
}
