"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Bell, Compass, LoaderCircle, Save, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SignOutButton } from "@/app/components/sign-out-button";

type ProfileData = { full_name: string | null; matric_number: string | null; role: string; avatar_url: string | null };

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [matric, setMatric] = useState("");
  const [avatar, setAvatar] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const { data, error } = await supabase.from("profiles")
        .select("full_name,matric_number,role,avatar_url").eq("id", user.id).maybeSingle();
      if (!active) return;
      setEmail(user.email ?? "");
      if (error) setMessage("We couldn't load your profile. Please try again.");
      else {
        const value = (data ?? { full_name: user.user_metadata?.full_name ?? "", matric_number: user.user_metadata?.matric_number ?? "", role: "student", avatar_url: null }) as ProfileData;
        setProfile(value); setName(value.full_name ?? ""); setMatric(value.matric_number ?? ""); setAvatar(value.avatar_url ?? "");
      }
      setBusy(false);
    })();
    return () => { active = false; };
  }, [router]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      let avatarUrl = avatar;
      if (photo) {
        if (photo.size > 3 * 1024 * 1024) throw new Error("Choose an image smaller than 3 MB.");
        if (!["image/jpeg", "image/png", "image/webp"].includes(photo.type)) throw new Error("Use a JPG, PNG or WebP image.");
        const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
        const path = user.id + "/avatar-" + Date.now() + "." + ext;
        const { error: uploadError } = await supabase.storage.from("profile-avatars").upload(path, photo, { contentType: photo.type, upsert: true });
        if (uploadError) throw uploadError;
        avatarUrl = supabase.storage.from("profile-avatars").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("profiles").update({ full_name: name.trim(), matric_number: matric.trim() || null, avatar_url: avatarUrl || null }).eq("id", user.id);
      if (error) throw error;
      setAvatar(avatarUrl); setPhoto(null);
      setProfile(current => current ? { ...current, full_name: name.trim(), matric_number: matric.trim() || null, avatar_url: avatarUrl || null } : current);
      setMessage("Your profile has been saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save your profile."); }
    finally { setSaving(false); }
  }

  return <main className="app-shell">
    <header className="topbar"><Link className="brand" href="/dashboard"><span className="brand-mark"><img src="/afit-crest.png" alt="" /></span>Afitfix</Link><div className="topbar-actions"><Link className="icon-button" href="/notifications" aria-label="Notifications"><Bell size={18}/></Link><SignOutButton/></div></header>
    <div className="page-wrap">
      <section className="welcome"><span className="eyebrow">Your account</span><h1>Your profile</h1><p>Keep your student details up to date.</p></section>
      <section className="complaint-card profile-card profile-editor">
        {busy ? <div className="empty-state"><LoaderCircle className="spin" size={19}/> Loading profile…</div> : profile ? <>
          <div className="profile-avatar profile-avatar-large">{avatar ? <img src={avatar} alt="Your profile" /> : <UserRound size={30}/>}</div>
          <span className="status-pill">{profile.role === "admin" ? "Administrator" : "Student account"}</span>
          <form className="auth-form profile-form" onSubmit={save}>
            <label>Profile picture <span className="optional">Optional · JPG, PNG or WebP · max 3 MB</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setPhoto(e.target.files?.[0] ?? null)}/></label>
            {photo && <p className="file-name">{photo.name}</p>}
            <label>Full name<input required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)} /></label>
            <label>Matric number<input maxLength={40} value={matric} onChange={e=>setMatric(e.target.value)} placeholder="Your matric number"/></label>
            <label>Email address<input value={email} readOnly disabled/></label>
            <label>Account type<input value={profile.role === "admin" ? "Administrator" : "Student"} readOnly disabled/></label>
            {message && <p className="form-notice" role="status">{message}</p>}
            <button className="primary-button auth-submit" disabled={saving}>{saving ? <LoaderCircle className="spin" size={17}/> : <Save size={17}/>}Save profile</button>
          </form>
        </> : <div className="empty-state">{message || "Profile unavailable."}<button className="text-action" onClick={()=>router.refresh()}>Try again</button></div>}
      </section>
    </div>
    <nav className="bottom-nav"><Link className="nav-item" href="/dashboard"><Activity size={19}/>Home</Link><Link className="nav-item" href="/explore"><Compass size={19}/>Explore</Link><Link className="nav-item active" href="/profile"><UserRound size={19}/>Profile</Link></nav>
  </main>;
}
