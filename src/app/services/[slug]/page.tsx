import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicFrame } from "@/components/site-chrome";
import { SERVICES } from "@/lib/site-content";

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.value }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = SERVICES.find((item) => item.value === slug);
  return {
    title: service?.label ?? "Service",
    description: service?.summary ?? "A QCORVAZENT service.",
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = SERVICES.find((item) => item.value === slug);
  if (!service) notFound();
  return (
    <PublicFrame>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">Services</p>
          <h1 className="serif mt-3 text-5xl leading-[0.95]">{service.label}</h1>
          <p className="mt-4 text-lg leading-8">{service.summary}</p>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">{service.detail}</p>
          <ul className="mt-5 grid list-disc gap-1 pl-5 text-sm">
            {service.covers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-[var(--color-lane)]">{service.suited}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href={`/quote?service=${service.value}`}>
              Quote this service
            </Link>
            <Link className="btn btn-ghost" href={`/book?service=${service.value}`}>
              Request a pickup
            </Link>
          </div>
          <p className="mt-4 text-xs leading-5 text-[var(--color-muted)]">
            Parcel, document, freight, and consignment are package types on the request. They are not extra services beyond this list.
          </p>
        </div>
        <img src={service.image} alt={service.alt} className="h-80 w-full rounded-[1.6rem] object-cover lg:h-full" />
      </section>
    </PublicFrame>
  );
}
