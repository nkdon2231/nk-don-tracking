"use client";

import { FormEvent, useState } from "react";
import { ApiError, api } from "@/lib/client-api";
import { TRACKING_RE } from "@/lib/constants";
import { SUPPORT_TOPICS } from "@/lib/site-content";

export function ContactForm({ initialTopic = "", initialNumber = "" }: { initialTopic?: string; initialNumber?: string }) {
  const topic = SUPPORT_TOPICS.includes(initialTopic as (typeof SUPPORT_TOPICS)[number]) ? initialTopic : SUPPORT_TOPICS[0];
  const number = TRACKING_RE.test(initialNumber.trim().toUpperCase()) ? initialNumber.trim().toUpperCase() : "";
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    setMessage("");
    try {
      const result = await api<{ message: string }>("/api/contact", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone") ?? "",
          topic: form.get("topic") ?? "",
          message: form.get("message"),
        }),
      });
      setMessage(result.message);
      event.currentTarget.reset();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The message could not be saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="card grid gap-4 p-5" onSubmit={onSubmit}>
      <label className="field">
        <span>Name</span>
        <input name="name" required maxLength={120} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" required maxLength={200} />
        </label>
        <label className="field">
          <span>Phone</span>
          <input name="phone" maxLength={40} />
        </label>
      </div>
      <label className="field">
        <span>Topic</span>
        <select name="topic" defaultValue={topic}>
          {SUPPORT_TOPICS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Message</span>
        <textarea name="message" required minLength={10} maxLength={4000} defaultValue={number ? `Tracking number: ${number}\n` : undefined} />
      </label>
      {error ? <p className="rounded-xl border border-[#8a4a32] bg-[#2a1814] px-4 py-3 text-sm text-[#ffd0c2]">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--color-lane)]">{message}</p> : null}
      <button className="btn btn-primary" disabled={pending} type="submit">
        {pending ? "Sending…" : "Send to operations"}
      </button>
    </form>
  );
}
