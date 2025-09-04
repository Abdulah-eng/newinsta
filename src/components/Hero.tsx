import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import echelonHall from "@/assets/echelon-hall.jpg";
import echelonLogo from "@/assets/echelon-logo-new.png";

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      image: echelonHall,
      alt: "Echelon Texas Main Hall"
    },
    {
      image: echelonLogo,
      alt: "Echelon Texas Logo",
      isLogo: true
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Carousel Background */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className={`w-full h-full bg-cover bg-center ${
                slide.isLogo ? "bg-black flex items-center justify-center" : ""
              }`}
              style={
                slide.isLogo
                  ? {}
                  : { backgroundImage: `url(${slide.image})` }
              }
            >
              {slide.isLogo && (
                <img
                  src={slide.image}
                  alt={slide.alt}
                  className="max-w-xs h-auto opacity-90"
                />
              )}
            </div>
            <div className="absolute inset-0 bg-black/50" />
          </div>
        ))}
      </div>

      {/* Carousel Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-10 p-2 text-gold hover:text-gold-light transition-colors"
      >
        <ChevronLeft size={32} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-10 p-2 text-gold hover:text-gold-light transition-colors"
      >
        <ChevronRight size={32} />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-3 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide ? "bg-gold" : "bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center max-w-4xl px-6">
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 tracking-wide">
            Welcome to{" "}
            <span className="text-gold font-bold">Echelon Texas</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            An exclusive private members club where luxury meets community. 
            Experience the finest in hospitality, networking, and lifestyle.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 bg-gold hover:bg-gold-light text-black font-semibold transition-all hover:scale-105"
          >
            Join Echelon TX – $20/month
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;