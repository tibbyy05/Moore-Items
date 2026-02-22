import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function FaqPage() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-3xl sm:text-4xl font-playfair font-semibold text-warm-900 mb-6">
            FAQ
          </h1>
          <Accordion type="single" collapsible className="bg-warm-50/40 rounded-2xl border border-warm-200">
            <AccordionItem value="shipping-time">
              <AccordionTrigger>How long does shipping take?</AccordionTrigger>
              <AccordionContent>
                Most orders arrive within 2-5 business days after processing.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="return-policy">
              <AccordionTrigger>What is your return policy?</AccordionTrigger>
              <AccordionContent>
                We offer 30-day returns on unused items in original packaging.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="international">
              <AccordionTrigger>Do you ship internationally?</AccordionTrigger>
              <AccordionContent>
                At this time, we ship within the United States only.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="tracking">
              <AccordionTrigger>How do I track my order?</AccordionTrigger>
              <AccordionContent>
                You’ll receive a tracking link via email once your order ships.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="payment-methods">
              <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
              <AccordionContent>
                We accept major credit cards and Apple Pay at checkout.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="payment-security">
              <AccordionTrigger>Is my payment secure?</AccordionTrigger>
              <AccordionContent>
                Yes. Payments are processed securely with industry-standard encryption.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="support">
              <AccordionTrigger>How do I contact customer support?</AccordionTrigger>
              <AccordionContent>
                Email support@mooreitems.com and we’ll respond within 24 hours.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </main>
      <Footer />
    </>
  );
}
