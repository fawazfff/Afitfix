"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ArrowLeft, Bell, LoaderCircle, Plus, ShieldCheck, UserRound, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SignOutButton } from "@/app/components/sign-out-button";

type ProfileData = { full_name: string | null; matric_number: string | null; role: string };

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  useEffect(() => { let active = true; (async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }
    const { data, error } = await supabase.from("profiles").select("full_name,matric_number,role").eq("id", user.id).single();
    if (!active) return;
    setEmail(user.email ?? "");
    if (error) setMessage("Your account details could not be loaded. Please refresh.");
    else setProfile(data as ProfileData);
    setBusy(false);
  })(); return () => { active = false; }; }, [router]);
  return <main className="app-shell">
    <header className="topbar"><Link className="brand" href="/dashboard"><span className="brand-mark"><img src="/afit-crest.png" alt="" /></span>Afitfix</Link><div className="topbar-actions"><Link className="icon-button" href="/notifications" aria-label="Notifications"><Bell size={18}/></Link><SignOutButton/></div></header>
    <div className="page-wrap"><section className="welcome"><span className="eyebrow">Your account</span><h1>Profile</h1><p>View the details connected to your Afitfix account.</p></section>
      <section className="complaint-card profile-card">
        {busy ? <div className="empty-state"><LoaderCircle className="spin" size={19}/> Loading profile…</div> : profile ? <>
          <div className="profile-avatar"><UserRound size={28}/></div><h2>{profile.full_name || "AFIT student"}</h2><span className="status-pill"><ShieldCheck size={13}/>{profile.role === "admin" ? "Administrator" : "Student"}</span>
          <div className="profile-details"><div><span>Email address</span><strong>{email || "Not available"}</strong></div><div><span>Full name</span><strong>{profile.full_name || "Not provided"}</strong></div><div><span>Matric number</span><strong>{profile.matric_number || "Not provided"}</strong></div></div>
        </> : <p className="muted-note">{message || "Profile unavailable."}</p>}
        {message && <p className="form-notice">{message}</p>}
      </section>
      <p className="admin-link"><Link href="/dashboard"><ArrowLeft size={15}/> Back to dashboard</Link></p>
    </div>
    <nav className="bottom-nav"><Link className="nav-item" href="/dashboard"><Activity size={19}/>Home</Link><Link className="nav-item" href="/explore"><Bell size={19}/>Explore</Link><Link className="nav-item" href="/report/new"><Plus size={20}/>Report</Link><Link className="nav-item" href="/my-reports"><Wrench size={19}/>My reports</Link><Link className="nav-item active" href="/profile">Profile</Link></nav>
  </main>;
}