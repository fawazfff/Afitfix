"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "signup") setMode("signup");
  }, []);
  const [fullName, setFullName] = useState("");
  const [matric, setMatric] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName.trim(), matric_number: matric.trim() } },
        });
        if (error) throw error;
        if (data.session) router.push("/dashboard");
        else {
          setMessage("Account created. Check your email to confirm your address, then sign in.");
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to continue. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-shell">
    <Link href="/" className="auth-back"><ArrowLeft size={17}/> Back to Afitfix</Link>
    <section className="auth-card">
      <div className="brand auth-brand"><span className="brand-mark"><ShieldCheck size={19}/></span>Afitfix</div>
      <span className="eyebrow">Your campus. Your voice.</span>
      <h1>{mode === "signin" ? "Welcome back" : "Join your campus community"}</h1>
      <p className="auth-copy">{mode === "signin" ? "Sign in to report issues and follow campus fixes." : "Create an account to report issues and support other students."}</p>
      <form className="auth-form" onSubmit={submit}>
        {mode === "signup" && <>
          <label>Full name<input required autoComplete="name" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Your full name"/></label>
          <label>Matric number <span className="optional">Optional</span><input value={matric} onChange={e=>setMatric(e.target.value)} placeholder="Your matric number"/></label>
        </>}
        <label>Email address<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
        <label>Password<input required type="password" minLength={8} autoComplete={mode==="signin"?"current-password":"new-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label>
        {message && <p className="form-notice" role="status">{message}</p>}
        <button className="primary-button auth-submit" disabled={busy}>{busy && <LoaderCircle className="spin" size={17}/>}{mode==="signin"?"Sign in":"Create account"}</button>
      </form>
      <p className="auth-switch">{mode==="signin"?"New to Afitfix?":"Already registered?"} <button onClick={()=>{setMode(mode==="signin"?"signup":"signin");setMessage("");}}>{mode==="signin"?"Create an account":"Sign in"}</button></p>
    </section>
  </main>;
}