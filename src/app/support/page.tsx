import Link from "next/link";
import { PublicFrame } from "@/components/site-chrome";
import { pageMeta } from "@/lib/seo";
import { SUPPORT_EMAIL } from "@/lib/constants";
import { SERVICES } from "@/lib/site-content";

export const metadata = pageMeta({
  title: "Support",
  description: "Shipment support, tracking help, quotes, and customs questions for QCORVAZENT International Courier & Express.",
  path: "/support",
});

const PATHS = [
  {
    href: "/contact?topic=Shipment%20support",
    title: "Contact support",
    copy: "The message is saved for the desk. Email is not sent until a provider is connected.",
  },
  {
    href: "/contact?topic=Tracking%20assistance",
    title: "Shipment support",
    copy: "Send the tracking number and what you expected to see. Staff read it in Messages.",
  },
  {
    href: "/support/tracking",
    title: "Tracking assistance",
    copy: "Where the number sits, what each status means, and what to do when nothing new is recorded.",
  },
  {
    href: "/faq",
    title: "FAQ",
    copy: "Number format, public files, quotes, and why names stay off the tracking page.",
  },
  {
    href: "/services",
    title: "Shipping information",
    copy: "The services staff can actually book, and what each record is meant to hold.",
  },
  {
    href: "/services/customs_documentation",
    title: "Customs information",
    copy: "How papers and clearance events sit on the shipment. Not a government filing portal.",
  },
  {
    href: "/support/tracking#delivery",
    title: "Delivery questions",
    copy: "Out for delivery, proof of delivery, and what is withheld from the public page.",
  },
  {
    href: "/quote",
    title: "Get a quote",
    copy: "A pending request. No automatic price.",
  },
  {
    href: "/book",
    title: "Request a pickup",
    copy: "A pending booking. A tracking number exists only after staff open the shipment.",
  },
];

export default function SupportPage() {
  const customs = SERVICES.find((item) => item.value === "customs_documentation");
  return (
    <PublicFrame>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">Support</p>
        <h1 className="serif mt-3 max-w-3xl text-5xl leading-[0.95]">Help that reaches the desk, or explains the record.</h1>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--color-muted)]">
          QCORVAZENT does not run a chatbot and does not send automatic status mail. Use a form when a person needs to see the question. Use the guides when the answer is how the record works.
        </p>
        <p className="mt-6 text-sm leading-6">
          <span className="block text-xs uppercase tracking-[0.14em] text-[var(--color-copper)]">Customer Support Email</span>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-1 inline-block text-lg font-semibold text-[var(--color-copper)] no-underline">
            {SUPPORT_EMAIL}
          </a>
          <span className="mt-1 block max-w-xl text-[var(--color-muted)]">Write to this address, or use the contact form. The site does not send email on its own.</span>
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PATHS.map((item) => (
            <Link key={item.href} href={item.href} className="card p-5 no-underline">
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{item.copy}</p>
            </Link>
          ))}
        </div>
        {customs ? (
          <article className="card mt-8 p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-copper)]">Customs, in brief</p>
            <h2 className="serif mt-2 text-3xl">{customs.label}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">{customs.detail}</p>
          </article>
        ) : null}
      </section>
    </PublicFrame>
  );
}
