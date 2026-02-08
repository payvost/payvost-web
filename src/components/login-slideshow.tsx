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

const slides = [
    {
        id: 1,
        title: "Instantly convert between currencies",
        subtitle: "Exchange money at the best rates with zero hidden fees.",
        image: "/Man operating payvost app.png",
    },
    {
        id: 2,
        title: "Global payments made easy",
        subtitle: "Send and receive funds across borders in seconds.",
        image: "/Man operating payvost app.png",
    },
    {
        id: 3,
        title: "Secure and reliable",
        subtitle: "Your financial data is protected with bank-grade security.",
        image: "/Man operating payvost app.png",
    },
];

export function LoginSlideshow() {
    const [api, setApi] = React.useState<CarouselApi>();
    const [current, setCurrent] = React.useState(0);
    const [count, setCount] = React.useState(0);

    React.useEffect(() => {
        if (!api) {
            return;
        }

        setCount(api.scrollSnapList().length);
        setCurrent(api.selectedScrollSnap() + 1);

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });
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
                                {/* Image Section - Takes distinct space or background */}
                                <div className="relative flex-1 w-full overflow-hidden">
                                    <Image
                                        src={slide.image}
                                        alt={slide.title}
                                        fill
                                        className="object-cover object-top"
                                        priority={slide.id === 1}
                                    />
                                    {/* Overlay for better text readability if text is on image, 
                      but user asked for "Title and subtitle below every slide". 
                      So I will put text in a separate section if "below" means 
                      below the image physically, or overlay at bottom if "below" means visual hierarchy.
                      "display Title and subtitle below every slide" - implies distinct section or position.
                      Looking at the beautiful slide display reference (implied), often it's an image with text overlay at bottom.
                      Let's try putting text at the bottom overlay with gradient.
                  */}
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                                </div>

                                {/* Text Content */}
                                <div className="absolute bottom-10 left-0 right-0 p-8 text-white z-20">
                                    <h2 className="text-3xl font-display font-medium tracking-tight mb-3">
                                        {slide.title}
                                    </h2>
                                    <p className="text-white/80 text-lg font-light leading-relaxed max-w-md">
                                        {slide.subtitle}
                                    </p>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {/* Navigation Dots if needed */}
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

            {/* Brand Logo on top left corner if needed, or maybe just keeps it clean */}
        </div>
    );
}
