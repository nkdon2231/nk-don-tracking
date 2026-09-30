import Link from "next/link";
import { PublicFrame } from "@/components/site-chrome";
import { pageMeta } from "@/lib/seo";
import { SERVICES, SOLUTIONS } from "@/lib/site-content";

export const metadata = pageMeta({
  title: "Solutions",
  description: "Courier, freight, air, warehousing, and customs movements booked as one QCORVAZENT record.",
  path: "/solutions",
});

export default function SolutionsPage() {
  return (
    <PublicFrame>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-copper)]">Solutions</p>
        <h1 className="serif mt-3 max-w-3xl text-5xl leading-[0.95] sm:text-6xl">One record. Three ways a movement is booked.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
          These are groupings of the services QCORVAZENT already books. They are not extra products, and they do not add offices, fleets, or people that are not on the file.
        </p>
      </section>
      <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-16">
        {SOLUTIONS.map((solution) => {
          const services = SERVICES.filter((service) => (solution.services as readonly string[]).includes(service.value));
          return (
            <article key={solution.id} id={solution.id} className="card overflow-hidden">
              <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
                <img src={services[0]?.image} alt={services[0]?.alt ?? ""} className="h-56 w-full object-cover lg:h-full lg:min-h-72" />
                <div className="p-6 sm:p-8">
                  <h2 className="serif text-3xl">{solution.title}</h2>
                  <p className="mt-3 max-w-xl leading-7 text-[var(--color-muted)]">{solution.summary}</p>
                  <ul className="mt-5 grid gap-3">
                    {services.map((service) => (
                      <li key={service.value}>
                        <Link href={`/services#${service.value}`} className="font-semibold no-underline hover:text-[var(--color-copper)]">
                          {service.label}
                        </Link>
                        <p className="text-sm leading-6 text-[var(--color-muted)]">{service.summary}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </PublicFrame>
  );
}
