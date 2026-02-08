
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, Send, Building, LifeBuoy } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
    <>
      <main className="flex-1 p-4 lg:p-6">
        {/* Hero Section */}
        <div className="w-full bg-primary/10 rounded-lg p-12 md:p-20 lg:p-24 text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Contact Our Support Team
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mt-4">
                We're here to help with any questions or issues you may have.
            </p>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                     {errors.subject && <p className="text-destructive text-sm">{errors.subject.message}</p>}
                                </div>
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
                        <CardTitle>Other Ways to Reach Us</CardTitle>
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
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Our Offices</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex items-start gap-4">
                            <MapPin className="h-6 w-6 text-primary mt-1" />
                            <div>
                                <h4 className="font-semibold">New York, USA</h4>
                                <p className="text-sm text-muted-foreground">123 Finance Street, New York, NY 10001</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-4">
                            <MapPin className="h-6 w-6 text-primary mt-1" />
                            <div>
                                <h4 className="font-semibold">London, UK</h4>
                                <p className="text-sm text-muted-foreground">456 Currency Avenue, London, EC2V 7AZ</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
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
      </main>
    </>
  );
}
