
'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Icons } from "@/components/icons";
import { Mail, Phone, MapPin, Send, Twitter, Facebook, Linkedin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('A valid email is required'),
  category: z.string().min(1, 'Please select a category'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const faqs = [
  {
    question: "What are your support hours?",
    answer: "Our support team is available 24/7. You can reach out to us anytime via live chat, email, or by submitting a support ticket."
  },
  {
    question: "How long does it take to get a response?",
    answer: "We strive to respond to all inquiries as quickly as possible. Live chat responses are typically instant. For email and support tickets, our average response time is 2-4 hours."
  },
  {
    question: "Can I get support in other languages?",
    answer: "Yes, we offer support in English, Spanish, and French. Please specify your preferred language when contacting us."
  },
   {
    question: "Where can I find my transaction ID?",
    answer: "You can find the transaction ID on the transaction details page. Navigate to the 'Transactions' tab from your dashboard, click on the specific transaction, and the ID will be displayed at the top of the receipt."
  }
];

export default function ContactPage() {
    const { toast } = useToast();
    const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormValues>({
        resolver: zodResolver(contactFormSchema)
    });

    const onSubmit: SubmitHandler<ContactFormValues> = async (data) => {
        console.log(data);
        toast({
        title: 'Message Sent!',
        description: "Thank you for contacting us. Our team will get back to you shortly.",
        });
        reset();
    };

    return (
        <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1">
            <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
                 <div className="container px-4 md:px-6 text-center">
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">Get in Touch</h1>
                    <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl mt-4">
                        We're here to help with any questions or issues you may have.
                    </p>
                </div>
            </section>
            
            <section className="w-full py-12 md:py-24 lg:py-32">
                <div className="container px-4 md:px-6 grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Send us a Message</CardTitle>
                                <CardDescription>Fill out the form below and we'll get back to you as soon as possible.</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input id="name" placeholder="John Doe" {...register('name')} />
                                            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input id="email" type="email" placeholder="john.doe@example.com" {...register('email')} />
                                            {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Inquiry Category</Label>
                                        <Select onValueChange={(value) => register('category').onChange({ target: { value, name: 'category' } })}>
                                            <SelectTrigger id="category">
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="general">General Inquiry</SelectItem>
                                                <SelectItem value="technical">Technical Support</SelectItem>
                                                <SelectItem value="billing">Billing Question</SelectItem>
                                                <SelectItem value="feedback">Feedback/Suggestion</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input id="subject" placeholder="Briefly describe your issue" {...register('subject')} />
                                        {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message</Label>
                                        <Textarea id="message" placeholder="Please provide as much detail as possible..." rows={6} {...register('message')} />
                                        {errors.message && <p className="text-sm text-destructive">{errors.message.message}</p>}
                                    </div>
                                    <Button type="submit" className="w-full"><Send className="mr-2 h-4 w-4" />Submit Message</Button>
                                </CardContent>
                            </form>
                        </Card>
                    </div>

                    {/* Side Info */}
                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <Mail className="h-6 w-6 text-primary mt-1" />
                                    <div>
                                        <h4 className="font-semibold">Email</h4>
                                        <p className="text-sm text-muted-foreground">For general and technical inquiries.</p>
                                        <a href="mailto:support@payvost.com" className="text-sm text-primary hover:underline">support@payvost.com</a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <Phone className="h-6 w-6 text-primary mt-1" />
                                    <div>
                                        <h4 className="font-semibold">Phone</h4>
                                        <p className="text-sm text-muted-foreground">For urgent matters.</p>
                                        <a href="tel:+1234567890" className="text-sm text-primary hover:underline">+1 (234) 567-890</a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <MapPin className="h-6 w-6 text-primary mt-1" />
                                    <div>
                                        <h4 className="font-semibold">New York Office</h4>
                                        <p className="text-sm text-muted-foreground">123 Finance Street, New York, NY 10001</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
            
            <section className="w-full pb-12 md:pb-24 lg:pb-32">
                <div className="container px-4 md:px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                    <Card className="max-w-4xl mx-auto">
                        <CardContent className="p-0">
                            <Accordion type="single" collapsible className="w-full">
                                {faqs.map((faq, index) => (
                                    <AccordionItem value={`item-${index}`} key={index}>
                                        <AccordionTrigger className="p-6 text-left">{faq.question}</AccordionTrigger>
                                        <AccordionContent className="px-6 pb-6">
                                            <p className="text-muted-foreground">{faq.answer}</p>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </main>
        <footer className="bg-muted text-muted-foreground py-12">
            <div className="container mx-auto px-4 md:px-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-[30%] space-y-4">
                  <Link href="#" className="flex items-center space-x-2">
                    <Icons.logo className="h-8" />
                  </Link>
                  <p className="text-sm">Stay up to date with the latest news, announcements, and articles.</p>
                  <form className="flex w-full max-w-sm space-x-2">
                    <Input type="email" placeholder="Enter your email" />
                    <Button type="submit">Subscribe</Button>
                  </form>
                </div>
                <div className="w-full md:w-[70%] grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Product</h4>
                    <ul className="space-y-2">
                        <li><Link href="/#features" className="hover:text-primary transition-colors">Features</Link></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">Pricing</Link></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">Integrations</Link></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">API</Link></li>
                    </ul>
                    </div>
                    <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Company</h4>
                    <ul className="space-y-2">
                        <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                        <li><Link href="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
                        <li><Link href="/press" className="hover:text-primary transition-colors">Press</Link></li>
                        <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                    </ul>
                    </div>
                    <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Resources</h4>
                    <ul className="space-y-2">
                        <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                        <li><Link href="/support" className="hover:text-primary transition-colors">Help Center</Link></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">Developers</Link></li>
                        <li><Link href="#" className="hover:text-primary transition-colors">Security</Link></li>
                    </ul>
                    </div>
                    <div className="space-y-4">
                    <h4 className="font-semibold text-foreground">Policies</h4>
                    <ul className="space-y-2">
                        <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                        <li><Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
                    </ul>
                    </div>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-muted-foreground/20 flex flex-col sm:flex-row justify-between items-center">
                <p className="text-sm">&copy; {new Date().getFullYear()} Payvost Inc. All rights reserved.</p>
                <div className="flex space-x-4 mt-4 sm:mt-0">
                  <Link href="https://x.com/payvost" rel="nofollow" target="_blank" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></Link>
                  <Link href="https://facebook.com/payvost" rel="nofollow" target="_blank" className="hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></Link>
                  <Link href="#" className="hover:text-primary transition-colors"><Linkedin className="h-5 w-5" /></Link>
                </div>
              </div>
            </div>
        </footer>
        </div>
    );
}
