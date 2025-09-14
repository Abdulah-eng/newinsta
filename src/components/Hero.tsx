import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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



      {/* Content Overlay - Positioned to showcase the building */}
      <div className="absolute inset-0 z-10">
        {/* Left side content - positioned to not cover the main building */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 max-w-2xl">
          <h1 className="text-6xl md:text-7xl font-serif text-white mb-6 tracking-wide leading-tight">
            Welcome to{" "}
            <span className="text-gold font-bold">Echelon TX</span>
          </h1>
        </div>

        {/* Bottom center content with description and button */}
        <div className="absolute left-1/2 bottom-8 -translate-x-1/2 text-center">
          <p className="text-2xl md:text-3xl text-white/90 mb-8 leading-relaxed">
            An exclusive private members club<br />
            where luxury meets community.
          </p>
          <Button 
            onClick={handleTrialClick}
            size="lg" 
            className="text-2xl px-8 py-6 bg-gold hover:bg-gold-light text-black font-semibold transition-all hover:scale-105"
          >
            Start 3-Day Free Trial – $20/month
          </Button>
        </div>

      </div>
    </section>
  );
};

export default Hero;