"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearSession, isAuthenticated } from "@/lib/api";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/avatars", label: "Avatars", icon: "🧑‍💼" },
  { href: "/admin/knowledge", label: "Knowledge Base", icon: "📚" },
  { href: "/admin/conversations", label: "Conversations", icon: "💬" },
  { href: "/admin/escalations", label: "Escalations", icon: "🚨" },
  { href: "/admin/leads", label: "Leads", icon: "🎯" },
  { href: "/admin/appointments", label: "Appointments", icon: "📅" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Checking session…</div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white p-4">
        <div className="mb-6 px-2 text-lg font-bold text-brand-800">Aegis AI Admin</div>
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === item.href ? "bg-brand-100 text-brand-700" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => {
            clearSession();
            router.push("/login");
          }}
          className="mt-4 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          🚪 Sign out
        </button>
        <Link href="/" className="mt-1 rounded-lg px-3 py-2 text-left text-sm text-slate-400 hover:bg-slate-100">
          &larr; Public site
        </Link>
      </aside>
      <div className="flex-1 overflow-y-auto p-8">{children}</div>
    </div>
  );
}
