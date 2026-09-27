import type { Metadata } from "next";
import { InquiryForm } from "@/components/inquiry-form";
import { PublicShell } from "@/components/site";

export const metadata: Metadata = { title: "Rates" };

export default function RatesPage() {
  return (
    <PublicShell current="/rates">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <InquiryForm
          topic="Rate request"
          heading="Request a rate or quote."
          intro="Describe the lane, cargo, weight or volume, and whether you need courier, air, or freight. This is a request into operations, not an instant tariff calculator."
          submitLabel="Request rates"
        />
      </div>
    </PublicShell>
  );
}
