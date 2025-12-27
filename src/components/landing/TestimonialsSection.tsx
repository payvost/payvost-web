
'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from "@/components/ui/carousel";
import { Sparkles, Star, CheckCircle2 } from "lucide-react";
import { testimonials } from "@/data/landing-page";

export function TestimonialsSection() {
    const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [snapCount, setSnapCount] = useState(0);

    useEffect(() => {
        if (!carouselApi) return;
        setSnapCount(carouselApi.scrollSnapList().length);
        setSelectedIndex(carouselApi.selectedScrollSnap());

        const onSelect = () => setSelectedIndex(carouselApi.selectedScrollSnap());
        const onReInit = () => {
            setSnapCount(carouselApi.scrollSnapList().length);
            setSelectedIndex(carouselApi.selectedScrollSnap());
        };

        carouselApi.on('select', onSelect);
        carouselApi.on('reInit', onReInit);
        return () => {
            carouselApi.off('select', onSelect);
            carouselApi.off('reInit', onReInit);
        };
    }, [carouselApi]);

    return (
        <section id="testimonials" className="relative w-full py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
            <div className="container mx-auto max-w-screen-2xl px-4 md:px-6">
                <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
                    <Badge variant="outline" className="w-fit border-primary/40 bg-primary/10 text-primary uppercase tracking-[0.3em] sm:tracking-[0.35em] text-[10px] sm:text-xs">
                        Customer stories
                    </Badge>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                        What our customers say
                    </h2>
                    <p className="max-w-3xl text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed">
                        Payvost powers remittance, payroll, and treasury teams around the world. Hear how builders ship faster and move capital with confidence.
                    </p>
                </div>

                <div className="mt-10 sm:mt-12 grid gap-6 grid-cols-1 lg:grid-cols-2 items-stretch">
                    {/* Featured Testimonial Card */}
                    <div className="relative w-full max-w-full mx-auto lg:mx-0 flex flex-col">
                        <Card className="relative w-full rounded-3xl border border-border/40 bg-background/90">
                            <CardContent className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 lg:p-10">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-center sm:text-left justify-center sm:justify-start">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.32em] sm:tracking-[0.4em] text-primary/80">
                                        Featured customer
                                    </span>
                                </div>
                                <blockquote className="text-lg sm:text-xl md:text-2xl font-semibold leading-relaxed text-foreground">
                                    “Payvost let us launch local payouts in three new markets in under a quarter. Our finance team finally has real-time visibility across every transfer.”
                                </blockquote>
                                <div className="flex flex-col xs:flex-row xs:items-center gap-4 xs:gap-5 text-center xs:text-left w-full">
                                    <Avatar className="mx-auto xs:mx-0 h-16 w-16 flex-shrink-0" >
                                        <AvatarFallback>{testimonials[0].initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col items-center xs:items-start gap-1">
                                        <p className="text-base sm:text-lg font-semibold text-foreground break-words">{testimonials[0].name}</p>
                                        <p className="text-sm text-muted-foreground break-words">{testimonials[0].role}, {testimonials[0].company}</p>
                                    </div>
                                </div>
                                <div className="flex justify-center xs:justify-start items-center gap-1 text-amber-400">
                                    {Array.from({ length: 5 }).map((_, idx) => (
                                        <Star key={idx} className="h-3.5 w-3.5 fill-current" />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Carousel Testimonials */}
                    <div className="relative w-full max-w-full mx-0 lg:mx-0 flex flex-col">
                        <div className="relative w-full rounded-3xl border border-border/30 bg-background/85 p-4 sm:p-6 md:p-8">
                            <Carousel
                                opts={{
                                    align: "start",
                                    loop: true,
                                }}
                                className="w-full"
                                setApi={setCarouselApi}
                            >
                                <CarouselContent className="ml-0 sm:-ml-3">
                                    {testimonials.slice(1).map((testimonial, index) => (
                                        <CarouselItem key={testimonial.name} className="pl-1.5 sm:pl-3 basis-full lg:basis-1/2">
                                            <div className="flex flex-col rounded-2xl border border-border/30 bg-muted/40 p-4 sm:p-6 transition duration-300 hover:border-primary/40 hover:bg-muted/60 min-h-[180px]">
                                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 w-full">
                                                    <Avatar className="h-12 w-12 flex-shrink-0 mx-auto sm:mx-0">
                                                        <AvatarFallback>{testimonial.initials}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col items-center sm:items-start gap-1 w-full">
                                                        <p className="text-sm font-semibold text-foreground break-words">{testimonial.name}</p>
                                                        <p className="text-xs text-muted-foreground break-words">{testimonial.role}, {testimonial.company}</p>
                                                    </div>
                                                </div>
                                                <p className="mt-4 text-sm leading-relaxed text-muted-foreground break-words">
                                                    “{testimonial.quote}”
                                                </p>
                                                <div className="mt-4 flex items-center gap-1 text-amber-400">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star key={i} className={`h-3.5 w-3.5 ${i < testimonial.rating ? 'fill-current' : 'text-muted-foreground/40'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="-left-3 hidden sm:flex" />
                                <CarouselNext className="-right-3 hidden sm:flex" />
                            </Carousel>
                            {snapCount > 1 && (
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    {Array.from({ length: snapCount }).map((_, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => carouselApi?.scrollTo(i)}
                                            aria-label={`Go to slide ${i + 1}`}
                                            aria-current={selectedIndex === i}
                                            className={
                                                selectedIndex === i
                                                    ? 'h-2.5 w-6 rounded-full bg-primary transition-all'
                                                    : 'h-2.5 w-2.5 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors'
                                            }
                                        >
                                            <span className="sr-only">Slide {i + 1}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-background/60 px-4 py-3 text-left text-xs sm:text-sm text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <span>Customer satisfaction rating: 4.9 / 5</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-background/60 px-4 py-3 text-left text-xs sm:text-sm text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <span>Net promoter score above 70</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-background/60 px-4 py-3 text-left text-xs sm:text-sm text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <span>Dedicated success managers for enterprise accounts</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
