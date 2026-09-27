"use client";

import { FormEvent, useState } from "react";
import { ApiError, api } from "@/lib/client-api";

export function ContactForm() {
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
        <input name="topic" maxLength={80} placeholder="Quote, tracking, or documents" />
      </label>
      <label className="field">
        <span>Message</span>
        <textarea name="message" required minLength={10} maxLength={4000} />
      </label>
      {error ? <p className="text-sm text-[#7a3e22]">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--color-lane)]">{message}</p> : null}
      <button className="btn btn-primary" disabled={pending} type="submit">
        {pending ? "Sending…" : "Send to operations"}
      </button>
    </form>
  );
}
