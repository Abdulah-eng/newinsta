import { Crown, Users, Shield, Sparkles } from "lucide-react";

const Benefits = () => {
  const benefits = [
    {
      icon: Crown,
      title: "Exclusive Access",
      description: "Members-only community and events with like-minded individuals"
    },
    {
      icon: Users,
      title: "Professional Networking",
      description: "Connect with influential professionals and industry leaders"
    },
    {
      icon: Shield,
      title: "Private & Secure",
      description: "Your privacy is our priority with secure membership"
    },
    {
      icon: Sparkles,
      title: "Luxury Experience",
      description: "World-class amenities and curated lifestyle experiences"
    }
  ];

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-black to-charcoal">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif text-gold mb-6">
            Membership Benefits
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Join an exclusive community that values sophistication, privacy, and meaningful connections
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div
                key={index}
                className="text-center p-8 rounded-lg bg-black/50 border border-gold/20 hover:border-gold/40 transition-colors group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 mb-6 group-hover:bg-gold/20 transition-colors">
                  <IconComponent className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  {benefit.title}
                </h3>
                <p className="text-white/70 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Benefits;