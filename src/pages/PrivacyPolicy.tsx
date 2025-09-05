import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
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
          <h1 className="text-4xl font-serif text-primary mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: September 5, 2025</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">1. Information We Collect</h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              Echelon Inc, a Delaware Corporation ("we", "us", or "our") collects information you provide directly to us, 
              such as when you create an account, subscribe to our services, or contact us for support.
            </p>
            <h3 className="text-xl font-medium text-primary mb-2">Personal Information</h3>
            <ul className="list-disc list-inside text-foreground/80 space-y-2 mb-4">
              <li>Name and contact information (email address, phone number)</li>
              <li>Payment information (processed securely through our payment providers)</li>
              <li>Profile information and preferences</li>
              <li>Communications with us</li>
            </ul>
            <h3 className="text-xl font-medium text-primary mb-2">Usage Information</h3>
            <ul className="list-disc list-inside text-foreground/80 space-y-2">
              <li>Log data (IP address, browser type, pages visited)</li>
              <li>Device information</li>
              <li>Usage patterns and preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">2. How We Use Your Information</h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              We use the information we collect to provide, maintain, and improve our services:
            </p>
            <ul className="list-disc list-inside text-foreground/80 space-y-2">
              <li>To provide and deliver the services you request</li>
              <li>To process transactions and send related information</li>
              <li>To send you technical notices and support messages</li>
              <li>To communicate with you about products, services, and events</li>
              <li>To monitor and analyze trends and usage</li>
              <li>To detect, investigate, and prevent fraudulent or illegal activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">3. Information Sharing and Disclosure</h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              We do not sell, trade, or otherwise transfer your personal information to third parties except as described below:
            </p>
            <ul className="list-disc list-inside text-foreground/80 space-y-2">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights, property, or safety</li>
              <li>With service providers who assist in our operations (under strict confidentiality agreements)</li>
              <li>In connection with a merger, sale, or transfer of business assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">4. Data Security</h2>
            <p className="text-foreground/80 leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission 
              over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">5. Data Retention</h2>
            <p className="text-foreground/80 leading-relaxed">
              We retain your personal information for as long as necessary to provide our services, comply with legal 
              obligations, resolve disputes, and enforce our agreements. When we no longer need your information, 
              we will securely delete or anonymize it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">6. Your Rights and Choices</h2>
            <p className="text-foreground/80 leading-relaxed mb-4">
              You have certain rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-foreground/80 space-y-2">
              <li>Access and review your personal information</li>
              <li>Update or correct inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to or restrict certain processing</li>
              <li>Data portability (receive a copy of your data)</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">7. Cookies and Tracking Technologies</h2>
            <p className="text-foreground/80 leading-relaxed">
              We use cookies and similar tracking technologies to collect and track information about your use of our 
              services. You can control cookies through your browser settings, though disabling cookies may affect 
              the functionality of our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">8. International Data Transfers</h2>
            <p className="text-foreground/80 leading-relaxed">
              Your information may be transferred to and maintained on computers located outside of your state, 
              province, country, or other governmental jurisdiction where data protection laws may differ.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">9. Children's Privacy</h2>
            <p className="text-foreground/80 leading-relaxed">
              Our services are not intended for individuals under the age of 18. We do not knowingly collect 
              personal information from children under 18.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">10. Changes to This Privacy Policy</h2>
            <p className="text-foreground/80 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-primary mb-4">11. Contact Us</h2>
            <p className="text-foreground/80 leading-relaxed">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className="mt-4 text-foreground/80">
              <p>Email: privacy@echelontx.com</p>
              <p>Address: Echelon Inc, Delaware Corporation</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;