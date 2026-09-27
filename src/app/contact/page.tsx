import { ContactForm } from "@/components/contact-form";
import { PublicFrame } from "@/components/site-chrome";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <PublicFrame>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[0.8fr_1.1fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">Operations desk</p>
          <h1 className="serif mt-2 text-5xl">Send a message</h1>
          <p className="mt-4 leading-7 text-[var(--color-muted)]">
            Quotes, document questions, and tracking help are recorded for staff. Email and SMS are not sent until a provider is connected, so do not rely on an automatic reply.
          </p>
          <img src="/images/handover.jpg" alt="A handover at a loading point" className="mt-6 h-64 w-full rounded-[1.5rem] object-cover" />
        </div>
        <ContactForm />
      </section>
    </PublicFrame>
  );
}
