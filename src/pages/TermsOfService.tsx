import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-4xl font-serif text-primary mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: September 5, 2025</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">1. Acceptance of Terms</h2>
            <p className="text-foreground/80 leading-relaxed">
              By accessing and using the services provided by Echelon Inc, a Delaware Corporation ("Company", "we", "us", or "our"), 
              you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">2. Description of Service</h2>
            <p className="text-foreground/80 leading-relaxed">
              Echelon Inc provides an exclusive membership platform that offers networking opportunities, premium content, 
              and access to luxury experiences. Our services include but are not limited to digital platform access, 
              community features, and member benefits.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">3. Membership and Fees</h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              Membership fees are billed on a recurring basis as selected during signup. All fees are non-refundable 
              except as required by law or as specifically stated in our refund policy.
            </p>
            <ul className="list-disc list-inside text-foreground/80 space-y-2">
              <li>Monthly subscriptions are billed every 30 days</li>
              <li>Annual subscriptions are billed every 365 days</li>
              <li>Fees are charged in advance for the upcoming billing period</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">4. User Conduct</h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              Members agree to use our services responsibly and in accordance with all applicable laws. 
              Prohibited activities include but are not limited to:
            </p>
            <ul className="list-disc list-inside text-foreground/80 space-y-2">
              <li>Harassment or abuse of other members</li>
              <li>Sharing inappropriate or offensive content</li>
              <li>Attempting to gain unauthorized access to our systems</li>
              <li>Using the service for any illegal purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">5. Privacy and Data Protection</h2>
            <p className="text-foreground/80 leading-relaxed">
              We take your privacy seriously. Our collection, use, and protection of your personal information 
              is governed by our Privacy Policy, which is incorporated into these Terms by reference.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">6. Intellectual Property</h2>
            <p className="text-foreground/80 leading-relaxed">
              All content, features, and functionality of our services are owned by Echelon Inc and are protected 
              by copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">7. Limitation of Liability</h2>
            <p className="text-foreground/80 leading-relaxed">
              To the fullest extent permitted by law, Echelon Inc shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages arising out of your use of our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">8. Termination</h2>
            <p className="text-foreground/80 leading-relaxed">
              We may terminate or suspend your membership at any time for violation of these Terms. 
              You may cancel your membership at any time through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">9. Governing Law</h2>
            <p className="text-foreground/80 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, 
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">10. Contact Information</h2>
            <p className="text-foreground/80 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at legal@echelontx.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;