import type { Metadata } from "next";
import { InquiryForm } from "@/components/inquiry-form";
import { PublicShell } from "@/components/site";

export const metadata: Metadata = { title: "Book pickup" };

export default function BookPage() {
  return (
    <PublicShell current="/book">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <InquiryForm
          topic="Pickup booking"
          heading="Request a pickup or booking."
          intro="Include origin, destination, cargo type, ready date, and any reference you already have. Operations will open a shipment file when the move is accepted."
          submitLabel="Submit booking request"
        />
      </div>
    </PublicShell>
  );
}
