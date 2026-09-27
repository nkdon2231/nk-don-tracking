import type { Metadata } from "next";
import { PublicShell } from "@/components/site";

export const metadata: Metadata = { title: "FAQ" };

const FAQS = [
  {
    q: "What does a tracking number look like?",
    a: "NKDON numbers use the format NKD-YYYYMMDD-XXXX, for example NKD-20260924-4034.",
  },
  {
    q: "Do I need an account to track?",
    a: "No. Public tracking reads the live shipment file. Only operations staff sign in.",
  },
  {
    q: "Why is a shipment marked demonstration?",
    a: "Demo records are used to exercise the desk and public tracker. They are labelled and can be purged by a super admin.",
  },
  {
    q: "Can I see documents on the tracking page?",
    a: "Yes, when operations publish evidence as public. Private files stay inside the admin desk.",
  },
  {
    q: "How do I request pickup or a rate?",
    a: "Use Book or Rates. The request is stored as an inquiry for the operations team.",
  },
];

export default function FaqPage() {
  return (
    <PublicShell current="/faq">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-4xl font-semibold">Questions customers actually ask.</h1>
        <div className="mt-8 space-y-4">
          {FAQS.map((item) => (
            <article key={item.q} className="rounded-2xl border border-line bg-white p-5">
              <h2 className="font-semibold">{item.q}</h2>
              <p className="mt-2 text-sm leading-6 text-steel">{item.a}</p>
            </article>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
