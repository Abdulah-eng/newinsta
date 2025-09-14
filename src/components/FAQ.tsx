import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "What does membership include?",
      answer: "Your $20/month membership grants you access to our exclusive digital community, member feed, early updates on events, and priority access to our upcoming physical club location."
    },
    {
      question: "How do I join Echelon TX?",
      answer: "Simply click the 'Join Echelon TX' button and complete the secure checkout process. You'll receive immediate access to the member portal upon payment confirmation."
    },
    {
      question: "Is my privacy protected?",
      answer: "Absolutely. We maintain the highest standards of privacy and security for all members. All interactions within the community are strictly confidential and protected."
    },
    {
      question: "Can I cancel my membership anytime?",
      answer: "Yes, you can cancel your membership at any time through your account settings. Your access will continue until the end of your current billing period."
    },
    {
      question: "What makes Echelon TX different?",
      answer: "We're not just a club - we're a carefully curated community of accomplished individuals who value quality, discretion, and meaningful connections in an exclusive environment."
    },
    {
      question: "Will there be a physical location?",
      answer: "Yes! While we're launching digitally, we're developing a luxury physical club location. Members will receive exclusive early access and special rates when it opens."
    }
  ];

  return (
    <section className="py-24 px-6 bg-charcoal">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif text-gold mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-white/80">
            Everything you need to know about joining Echelon TX
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border border-gold/20 rounded-lg px-6 bg-black/30"
            >
              <AccordionTrigger className="text-left text-white hover:text-gold font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-white/80 leading-relaxed pt-2">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;