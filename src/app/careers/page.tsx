
'use client';

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge }from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { ArrowRight, BrainCircuit, Globe, Handshake, Briefcase, Search, HeartPulse, Laptop, Coffee, Plane, BookOpen, Clock, Users, Twitter, Facebook, Linkedin } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import React from 'react';


const jobOpenings = [
    { department: 'Engineering', title: 'Senior Frontend Engineer', location: 'Remote', type: 'Full-time' },
    { department: 'Engineering', title: 'Backend Engineer (Go)', location: 'New York, NY', type: 'Full-time' },
    { department: 'Product', title: 'Product Manager, Core Payments', location: 'London, UK', type: 'Full-time' },
    { department: 'Design', title: 'UX/UI Designer', location: 'Remote', type: 'Full-time' },
    { department: 'Engineering', title: 'DevOps Engineer', location: 'Remote', type: 'Full-time' },
    { department: 'Marketing', title: 'Content Marketing Manager', location: 'New York, NY', type: 'Part-time' },
];

const companyValues = [
    { title: 'Innovation at Heart', description: 'We are driven by a passion to create what\'s next.', icon: <BrainCircuit className="h-8 w-8 text-primary" /> },
    { title: 'Global Mindset', description: 'We think beyond borders to serve a worldwide community.', icon: <Globe className="h-8 w-8 text-primary" /> },
    { title: 'Customer First', description: 'Our users are at the core of every decision we make.', icon: <Users className="h-8 w-8 text-primary" /> },
    { title: 'Radical Integrity', description: 'We operate with unwavering honesty and transparency.', icon: <Handshake className="h-8 w-8 text-primary" /> },
];

const companyPerks = [
    { title: 'Health & Wellness', description: 'Comprehensive health, dental, and vision insurance.', icon: <HeartPulse className="h-8 w-8 text-primary" /> },
    { title: 'Remote-First Culture', description: 'Work from anywhere in the world.', icon: <Laptop className="h-8 w-8 text-primary" /> },
    { title: 'Flexible PTO', description: 'Take the time you need to rest and recharge.', icon: <Clock className="h-8 w-8 text-primary" /> },
    { title: 'Learning Budget', description: 'A dedicated budget for books, courses, and conferences.', icon: <BookOpen className="h-8 w-8 text-primary" /> },
    { title: 'Annual Retreats', description: 'Join us for our annual company-wide offsite.', icon: <Plane className="h-8 w-8 text-primary" /> },
    { title: 'Home Office Stipend', description: 'A stipend to set up your perfect home office.', icon: <Coffee className="h-8 w-8 text-primary" /> },
];

export default function CareersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('All');
    const [selectedLocation, setSelectedLocation] = useState('All');
    const [selectedType, setSelectedType] = useState('All');


    const departments = ['All', ...Array.from(new Set(jobOpenings.map(j => j.department)))];
    const locations = ['All', ...Array.from(new Set(jobOpenings.map(j => j.location)))];
    const types = ['All', ...Array.from(new Set(jobOpenings.map(j => j.type)))];

    const filteredJobs = jobOpenings.filter(job => 
        (selectedDepartment === 'All' || job.department === selectedDepartment) &&
        (selectedLocation === 'All' || job.location === selectedLocation) &&
        (selectedType === 'All' || job.type === selectedType) &&
        (job.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex flex-col min-h-screen">
            <SiteHeader />

            <main>
                {/* Hero Section */}
                <section className="w-full py-20 md:py-32 lg:py-40 bg-primary/10 rounded-b-xl">
                    <div className="container mx-auto px-4 md:px-6 text-center">
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">Shape the Future of Finance With Us</h1>
                        <p className="max-w-[700px] mx-auto text-muted-foreground md:text-xl mt-4">
                            We're a passionate team on a mission to make money borderless. If you're driven by innovation and impact, you're in the right place.
                        </p>
                        {/* Advanced Search and Filter */}
                        <div className="mt-12 max-w-4xl mx-auto">
                            <div className="bg-background/90 backdrop-blur-sm p-6 rounded-[15px] shadow-lg">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="relative md:col-span-2">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input 
                                            placeholder="Search by role title..." 
                                            className="pl-10 h-12"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <Select onValueChange={setSelectedDepartment} defaultValue="All">
                                        <SelectTrigger className="h-12"><SelectValue placeholder="Department" /></SelectTrigger>
                                        <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Select onValueChange={setSelectedLocation} defaultValue="All">
                                        <SelectTrigger className="h-12"><SelectValue placeholder="Location" /></SelectTrigger>
                                        <SelectContent>{locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* Values Section */}
                <section className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container mx-auto px-4 md:px-6">
                         <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Our Core Values</h2>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                The principles that guide every decision we make.
                            </p>
                        </div>
                        <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
                           {companyValues.map((value) => (
                                <div key={value.title} className="grid gap-4 text-center">
                                    {React.cloneElement(value.icon, { className: "h-8 w-8 text-primary mx-auto" })}
                                    <h3 className="text-xl font-bold">{value.title}</h3>
                                    <p className="text-muted-foreground">{value.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Open Positions Section */}
                <section id="openings" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Current Openings</h2>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                Find your next opportunity in our list of open roles.
                            </p>
                        </div>
                        
                        {/* Job List */}
                        <div className="max-w-4xl mx-auto space-y-4">
                            {filteredJobs.length > 0 ? filteredJobs.map(job => (
                                <Link href="#" key={job.title}>
                                    <Card className="hover:bg-muted/50 transition-colors">
                                        <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div>
                                                <h3 className="font-semibold text-lg">{job.title}</h3>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                                                    <div className="flex items-center gap-2"><Briefcase className="h-4 w-4" />{job.department}</div>
                                                    <div className="flex items-center gap-2"><Globe className="h-4 w-4" />{job.location}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 sm:mt-0">
                                                <Badge variant="secondary">{job.type}</Badge>
                                                <Button variant="outline" size="sm">Apply Now <ArrowRight className="ml-2 h-4 w-4" /></Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            )) : (
                                <p className="text-center text-muted-foreground py-12">No open positions match your search.</p>
                            )}
                        </div>
                    </div>
                </section>
                
                {/* Perks & Benefits Section */}
                <section className="w-full py-12 md:py-24 lg:py-32">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Perks & Benefits</h2>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                                We invest in our team's growth, health, and happiness.
                            </p>
                        </div>
                        <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12">
                        {companyPerks.map(perk => (
                                <div key={perk.title} className="flex gap-4">
                                    <div className="p-3 bg-muted rounded-lg h-fit">{perk.icon}</div>
                                    <div>
                                        <h3 className="text-lg font-bold">{perk.title}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">{perk.description}</p>
                                    </div>
                                </div>
                        ))}
                        </div>
                    </div>
                </section>

                {/* Don't see a fit? */}
                <section className="w-full py-20 bg-muted">
                    <div className="container mx-auto px-4 md:px-6">
                        <Card className="bg-primary text-primary-foreground text-center p-8 md:p-12">
                            <h2 className="text-3xl font-bold">Don't See the Right Fit?</h2>
                            <p className="max-w-xl mx-auto mt-4">We're always looking for talented people. If you're passionate about our mission, we'd love to hear from you.</p>
                            <Button variant="secondary" size="lg" className="mt-6">Get in Touch <ArrowRight className="ml-2 h-5 w-5" /></Button>
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
    )
}
