import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { user, subscribed, startTrial } = useAuth();
  const navigate = useNavigate();
  
  const slides = [
    {
      image: "/main.png",
      alt: "Echelon TX Main"
    },
    {
      image: "/pool.png",
      alt: "Echelon TX Pool"
    },
    {
      image: "/e1.png",
      alt: "Echelon TX Exclusive"
    }
  ];

  // Simple auto-advance effect - completely independent
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array - runs only once on mount

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleTrialClick = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (subscribed) {
      navigate('/portal');
      return;
    }
    
    await startTrial();
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
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            <div className="absolute inset-0 bg-black/40" />
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


      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center max-w-4xl px-6">
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 tracking-wide">
            Welcome to{" "}
            <span className="text-gold font-bold">Echelon TX</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            An exclusive private members club where luxury meets community. 
            Experience the finest in hospitality, networking, and lifestyle.
          </p>
          <Button 
            onClick={handleTrialClick}
            size="lg" 
            className="text-lg px-8 py-6 bg-gold hover:bg-gold-light text-black font-semibold transition-all hover:scale-105"
          >
            Start 3-Day Free Trial – $20/month
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;