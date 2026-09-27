import type { Metadata } from "next";
import { InquiryForm } from "@/components/inquiry-form";
import { PublicShell } from "@/components/site";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <PublicShell current="/contact">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <InquiryForm
          topic="Contact"
          heading="Talk to operations."
          intro="Messages are stored against the NKDON inquiry record. Email delivery is only sent when a notification provider is configured."
          submitLabel="Send message"
        />
      </div>
    </PublicShell>
  );
}
