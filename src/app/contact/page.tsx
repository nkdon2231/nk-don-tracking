import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { PublicFrame } from "@/components/site-chrome";
import { publicCompany } from "@/server/public-profile";

export const metadata = {
  title: "Contact",
  description: "Send a pickup, quote, or tracking question to the NKDON operations desk.",
};

export default async function ContactPage() {
  const company = await publicCompany();
  const details = company
    ? [
        company.phone ? ["Phone", company.phone] : null,
        company.email ? ["Email", company.email] : null,
        company.address ? ["Address", company.address] : null,
        company.operatingHours ? ["Hours", company.operatingHours] : null,
      ].filter((item): item is [string, string] => Boolean(item))
    : [];

  return (
    <PublicFrame>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">Support</p>
          <h1 className="serif mt-2 text-5xl">Send a message</h1>
          <p className="mt-4 leading-7 text-[var(--color-muted)]">
            Quotes, document questions, and tracking help are saved for staff. Email and SMS are not sent until a provider is connected, so this form does not promise an automatic reply.
          </p>
          <p className="mt-3 text-sm leading-6">
            Already have a number? <Link href="/track">Track it</Link>. Unsure of the format? <Link href="/faq">Read the FAQ</Link>.
          </p>
          {details.length ? (
            <dl className="mt-6 grid gap-3 text-sm">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">{label}</dt>
                  <dd className="mt-1">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-6 text-sm leading-6 text-[var(--color-muted)]">
              Phone, email, and address appear here after a super admin saves them in company settings. Until then, use the form.
            </p>
          )}
          <img src="/images/handover.jpg" alt="A handover at a loading point" className="mt-6 h-64 w-full rounded-[1.5rem] object-cover" />
        </div>
        <ContactForm />
      </section>
    </PublicFrame>
  );
}