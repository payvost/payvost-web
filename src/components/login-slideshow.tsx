'use client';

import * as React from 'react';
import Image from 'next/image';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    type CarouselApi,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import Autoplay from 'embla-carousel-autoplay';

const slides = [
    {
        id: 1,
        title: "Send Money Globally in Seconds",
        subtitle: "Transfer funds across borders with real-time exchange rates and zero hidden fees.",
        image: "/man-payvost-app.png",
    },
    {
        id: 2,
        title: "Your Financial Hub, Simplified",
        subtitle: "Manage all your payments, cards, and transactions from one powerful dashboard.",
        image: "/man-payvost-app.png",
    },
    {
        id: 3,
        title: "Bank-Grade Security You Can Trust",
        subtitle: "Advanced encryption and multi-factor authentication keep your money safe 24/7.",
        image: "/man-payvost-app.png",
    },
];

export function LoginSlideshow() {
    const [api, setApi] = React.useState<CarouselApi>();
    const [current, setCurrent] = React.useState(0);
    const [count, setCount] = React.useState(0);

    // Auto-advance logic (5s interval)
    React.useEffect(() => {
        if (!api) return;

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });

        const intervalId = setInterval(() => {
            api.scrollNext();
        }, 5000);

        return () => clearInterval(intervalId);
    }, [api]);

    return (
        <div className="relative h-full w-full overflow-hidden rounded-2xl bg-[#001F3F]">
            <Carousel
                setApi={setApi}
                className="h-full w-full"
                opts={{
                    loop: true,
                }}
            >
                <CarouselContent className="h-full -ml-0">
                    {slides.map((slide) => (
                        <CarouselItem key={slide.id} className="h-full pl-0 relative">
                            <div className="relative h-full w-full flex flex-col">
                                {/* Image Section */}
                                <div className="relative flex-1 w-full overflow-hidden">
                                    <Image
                                        src={slide.image}
                                        alt={slide.title}
                                        fill
                                        className="object-cover object-top"
                                        priority={slide.id === 1}
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                    />
                                    {/* Gradient overlay removed based on user request */}
                                </div>

                                {/* Text Content */}
                                <div className="absolute bottom-10 left-0 right-0 p-8 text-white z-20">
                                    <h2 className="text-3xl font-display font-medium tracking-tight mb-3 drop-shadow-md">
                                        {slide.title}
                                    </h2>
                                    <p className="text-white/90 text-lg font-light leading-relaxed max-w-md drop-shadow-md">
                                        {slide.subtitle}
                                    </p>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                {/* Navigation Dots */}
                <div className="absolute top-8 left-8 flex gap-2 z-30">
                    {Array.from({ length: count }).map((_, index) => (
                        <button
                            key={index}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-300",
                                current === index + 1 ? "w-8 bg-white" : "w-1.5 bg-white/40"
                            )}
                            onClick={() => api?.scrollTo(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </Carousel>
        </div>
    );
}

