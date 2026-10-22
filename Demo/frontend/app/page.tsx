"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, Avatar } from "@/lib/api";

const OTHER_INDUSTRIES = [
  "Healthcare", "Banking & Finance", "Education", "Hospitality", "HR & Recruitment",
  "Manufacturing", "Automotive", "Retail & E-commerce", "Travel & Tourism",
  "Customer Support", "Government Services", "Legal Services",
];

export default function LandingPage() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Avatar[]>("/api/avatars/demo")
      .then(setAvatars)
      .catch(() => setAvatars([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen">
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <div className="text-lg font-bold tracking-tight text-brand-800">Aegis&nbsp;AI</div>
        <div className="flex gap-3">
          <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50">
            Admin Login
          </Link>
          <Link href="/register" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Get Started
          </Link>
        </div>
      </nav>

      <section className="px-6 pb-10 pt-16 text-center md:px-12">
        <p className="mx-auto mb-4 w-fit rounded-full bg-brand-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
          Not a chatbot. Not a talking head.
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
          A Digital AI Employee for Every Industry
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          One agentic platform &mdash; avatar as the human interface, an LLM agent as the brain, your
          business knowledge as memory, and authorized tools as hands. Configure it once per industry,
          reuse the same engine everywhere.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-6 md:px-12">
        <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
          Try a live avatar
        </h2>
        {loading && <p className="text-center text-slate-400">Loading avatars…</p>}
        {!loading && avatars.length === 0 && (
          <p className="text-center text-slate-400">
            No demo avatars found. Run <code className="rounded bg-slate-100 px-1">python -m seed.seed_db</code> in
            the backend to seed demo tenants.
          </p>
        )}
        <div className="grid gap-6 md:grid-cols-2">
          {avatars.map((avatar) => (
            <Link
              key={avatar.id}
              href={`/avatar/${avatar.id}`}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
                  {avatar.name.slice(0, 1)}
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-900">{avatar.name}</div>
                  <div className="text-sm capitalize text-slate-500">{avatar.industry.replace("_", " ")} &middot; {avatar.role}</div>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-600">{avatar.greeting}</p>
              <div className="mt-4 text-sm font-semibold text-brand-600 group-hover:underline">
                Start a conversation &rarr;
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12 md:px-12">
        <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
          Same platform, extensible to
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {OTHER_INDUSTRIES.map((industry) => (
            <span key={industry} className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-500">
              {industry}
            </span>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-8 text-center text-sm text-slate-400 md:px-12">
        Avatar = Human Interface &middot; Agent = Brain &middot; Knowledge Base = Memory &middot; Tools = Hands &middot; Human Escalation = Safety Net
      </footer>
    </main>
  );
}
