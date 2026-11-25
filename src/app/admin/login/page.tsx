"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to sign in.");
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next?.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <Link href="/" className="auth-back"><ArrowLeft size={17} /> Back to Afitfix</Link>
      <section className="auth-card">
        <div className="brand auth-brand"><span className="brand-mark"><img src="/afit-crest.png" alt="" /></span>Afitfix</div>
        <span className="eyebrow"><ShieldCheck size={14} /> Administration</span>
        <h1>Admin sign in</h1>
        <p className="auth-copy">Sign in to manage campus reports and update their progress.</p>
        <form className="auth-form" onSubmit={submit}>
          <label>Admin username
            <input required autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} placeholder="Enter admin username" />
          </label>
          <label>Password
            <input required type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter admin password" />
          </label>
          {message && <p className="form-notice" role="alert">{message}</p>}
          <button className="primary-button auth-submit" disabled={busy}>
            {busy && <LoaderCircle className="spin" size={17} />}
            {busy ? "Signing in…" : "Sign in to admin"}
          </button>
        </form>
        <p className="auth-switch"><Link href="/login">Student login</Link></p>
      </section>
    </main>
  );
}
