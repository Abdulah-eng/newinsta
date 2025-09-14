import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const QA = () => {
  const qaData = [
    {
      question: "What is Echelon TX",
      answer: "Echelon TX is a private, members-only lifestyle club and boutique resort designed for adults who value connection, privacy, and elevated experiences. Set on roughly nine acres in North Texas, Echelon blends modern architecture with natural surroundings to create a retreat-style environment the first all-inclusive private members club of its kind in North Texas. The property features a striking main clubhouse with bar, lounge, dining and event spaces; a resort-style pool and cabanas; and a village of 18 luxury tiny homes for overnight stays. Membership includes access to curated social events, real-time community features through a custom app, and an atmosphere that is exclusive, sophisticated, and unapologetically fun."
    },
    {
      question: "When is Echelon TX set to open",
      answer: "Echelon TX is currently in the planning and design phase. While we don't have a firm date yet, our goal is to host a soft opening toward the end of 2026 and a grand opening in early 2027."
    },
    {
      question: "Why you should join Echelon TX now",
      answer: "Joining now means you become part of Echelon TX from the ground up. Early members get exclusive online access to our private social platform Echelon TX is the next evolution of social networking—think Instagram rebuilt for the lifestyle community. Early members get exclusive online access today to a private, adults-only space where you can post freely (photos, videos, stories, grid views) without mainstream platform restrictions, connect through private messaging, first looks at construction updates, and an inside view as the property takes shape. We'll also host members-only events and select retreat experiences that capture the feel of Echelon TX long before the doors officially open."
    }
  ];

  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif text-gold mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Everything you need to know about Echelon TX membership and experience
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {qaData.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-gold/20 rounded-lg bg-charcoal/50"
              >
                <AccordionTrigger className="px-6 py-4 text-left text-gold hover:text-gold-light hover:no-underline">
                  <span className="text-lg font-semibold">{item.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <p className="text-white/80 leading-relaxed text-base">
                    {item.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default QA;
