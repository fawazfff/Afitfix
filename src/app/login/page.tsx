"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, LoaderCircle } from "lucide-react";
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
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function choosePhoto(file: File | null) {
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : "");
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const cleanName = fullName.trim().replace(/\\s+/g, " ");
        if (cleanName.length < 2) throw new Error("Enter your first and last name.");
        if (photo && (photo.size > 3 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(photo.type))) {
          throw new Error("Choose a JPG, PNG or WebP image smaller than 3 MB.");
        }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: cleanName, matric_number: matric.trim() } },
        });
        if (error) throw error;
        if (data.session && data.user && photo) {
          const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
          const path = data.user.id + "/avatar-" + Date.now() + "." + ext;
          const { error: uploadError } = await supabase.storage.from("profile-avatars").upload(path, photo, { contentType: photo.type, upsert: true });
          if (uploadError) throw new Error("Your account was created, but the picture could not be uploaded. You can add it from your profile.");
          const avatarUrl = supabase.storage.from("profile-avatars").getPublicUrl(path).data.publicUrl;
          const { error: profileError } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", data.user.id);
          if (profileError) throw new Error("Your account was created, but the picture could not be saved. You can add it from your profile.");
        }
        if (data.session) {
          router.push("/dashboard");
          router.refresh();
        } else {
          setMessage(photo ? "Account created. Confirm your email, then sign in and add your profile picture from Profile." : "Account created. Check your email to confirm your address, then sign in.");
          setMode("signin");
          setPassword("");
          setPhoto(null); setPreview("");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
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
      <div className="brand auth-brand"><span className="brand-mark"><img src="/afit-crest.png" alt="" /></span>Afitfix</div>
      <span className="eyebrow">Your campus. Your voice.</span>
      <h1>{mode === "signin" ? "Welcome back" : "Join your campus community"}</h1>
      <p className="auth-copy">{mode === "signin" ? "Sign in to report issues and follow campus fixes." : "Create an account to report issues and support other students."}</p>
      <form className="auth-form" onSubmit={submit}>
        {mode === "signup" && <>
          <label>Full name<input required autoComplete="name" minLength={2} maxLength={100} value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Your first and last name"/></label>
          <label>Matric number <span className="optional">Optional</span><input maxLength={40} value={matric} onChange={e=>setMatric(e.target.value)} placeholder="Your matric number"/></label>
          <label className="signup-photo-label">Profile picture <span className="optional">Optional · JPG, PNG or WebP · max 3 MB</span><span className="profile-photo-control"><Camera size={16}/> Choose a photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>choosePhoto(e.target.files?.[0] ?? null)}/></span></label>
          {preview && <img className="signup-avatar-preview" src={preview} alt="Selected profile picture preview"/>}
          {photo && <p className="file-name">Selected: {photo.name}</p>}
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
