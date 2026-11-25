"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Bell, Camera, Compass, LoaderCircle, Save, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SignOutButton } from "@/app/components/sign-out-button";

type ProfileData = { full_name: string | null; matric_number: string | null; role: string; avatar_url: string | null; course_of_study: string | null; academic_level: string | null };

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [matric, setMatric] = useState("");
  const [course, setCourse] = useState("");
  const [level, setLevel] = useState("");
  const [reportCount, setReportCount] = useState(0);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [avatar, setAvatar] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) { router.replace("/login"); return; }
        const { data, error } = await supabase.from("profiles")
          .select("full_name,matric_number,role,avatar_url,course_of_study,academic_level").eq("id", user.id).maybeSingle();
        if (!active) return;
        if (error) throw error;
        const value: ProfileData = data ?? {
          full_name: user.user_metadata?.full_name ?? "",
          matric_number: user.user_metadata?.matric_number ?? "",
          role: "student",
          avatar_url: user.user_metadata?.avatar_url ?? null,
          course_of_study: null,
          academic_level: null,
        };
        setProfile(value);
        setEmail(user.email ?? "");
        setName(value.full_name ?? "");
        setMatric(value.matric_number ?? "");
        setCourse(value.course_of_study ?? "");
        setLevel(value.academic_level ?? "");
        const { data: reports } = await supabase.from("complaints").select("status").eq("user_id", user.id);
        if (active) {
          setReportCount(reports?.length ?? 0);
          setResolvedCount(reports?.filter((item: {status:string}) => item.status === "resolved").length ?? 0);
        }
        setAvatar(value.avatar_url ?? "");
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "We couldn't load your profile.");
      } finally {
        if (active) setBusy(false);
      }
    })();
    return () => { active = false; };
  }, [router]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function choosePhoto(file: File | null) {
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : "");
    setMessage("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim().replace(/\\s+/g, " ");
    if (cleanName.length < 2) { setMessage("Enter your first and last name."); return; }
    setSaving(true); setMessage("");
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
      const updates = { full_name: cleanName, matric_number: matric.trim() || null, course_of_study: course || null, academic_level: level || null, avatar_url: avatarUrl || null };
      const { data, error } = await supabase.from("profiles").update(updates).eq("id", user.id)
        .select("full_name,matric_number,role,avatar_url,course_of_study,academic_level").single();
      if (error) throw error;
      setProfile(data as ProfileData);
      setName(data.full_name ?? cleanName);
      setMatric(data.matric_number ?? "");
      setCourse(data.course_of_study ?? "");
      setLevel(data.academic_level ?? "");
      setAvatar(data.avatar_url ?? "");
      setPhoto(null); setPreview("");
      setReportCount(reportCount);
      setMessage("Your profile has been saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save your profile. Please try again.");
    } finally { setSaving(false); }
  }

  return <main className="app-shell">
    <header className="topbar"><Link className="brand" href="/dashboard"><span className="brand-mark"><img src="/afit-crest.png" alt="" /></span>Afitfix</Link><div className="topbar-actions"><Link className="icon-button" href="/notifications" aria-label="Notifications"><Bell size={18}/></Link><SignOutButton/></div></header>
    <div className="page-wrap">
      <section className="welcome"><span className="eyebrow">Your account</span><h1>Your profile</h1><p>Make sure your student details are correct.</p></section>
      <section className="complaint-card profile-card profile-editor">
        {busy ? <div className="empty-state"><LoaderCircle className="spin" size={19}/> Loading profile…</div> : profile ? <>
          <div className="profile-avatar profile-avatar-large">{preview || avatar ? <img src={preview || avatar} alt="Profile preview" /> : <UserRound size={30}/>}</div>
          <form className="auth-form profile-form" onSubmit={save}>
            <label className="profile-photo-label"><span>Profile picture</span><span className="optional">Optional · JPG, PNG or WebP · max 3 MB</span><span className="profile-photo-control"><Camera size={16}/> Choose a photo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>choosePhoto(e.target.files?.[0] ?? null)}/></span></label>
            {photo && <p className="file-name">Selected: {photo.name}</p>}
            {avatar && <button type="button" className="text-action" onClick={()=>{setAvatar("");setPreview("");setPhoto(null);}}>Remove current profile picture</button>}
            <label>Full name<input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your first and last name"/></label>
            <label>Matric number <span className="optional">Optional</span><input maxLength={40} value={matric} onChange={e=>setMatric(e.target.value)} placeholder="Your matric number"/></label>
            <label>Course of study<select value={course} onChange={e=>setCourse(e.target.value)}><option value="">Select your course</option><option value="Computer Science">Computer Science</option><option value="Cyber Security">Cyber Security</option></select></label>
            <label>Academic level<select value={level} onChange={e=>setLevel(e.target.value)}><option value="">Select your level</option>{["100 Level","200 Level","300 Level","400 Level","500 Level"].map(item=><option key={item} value={item}>{item}</option>)}</select></label>
            <div className="profile-activity-stats"><div><strong>{reportCount}</strong><span>Reports submitted</span></div><div><strong>{resolvedCount}</strong><span>Reports resolved</span></div></div>
            <label>Email address <span className="optional">Email cannot be edited here</span><input type="email" value={email} readOnly disabled/></label>
            <label>Account type<input value={profile.role === "admin" ? "Administrator" : "Student"} readOnly disabled/></label>
            {message && <p className="form-notice" role="status">{message}</p>}
            <button className="primary-button auth-submit" disabled={saving}>{saving ? <LoaderCircle className="spin" size={17}/> : <Save size={17}/>}Save changes</button>
          </form>
        </> : <div className="empty-state">{message || "Your profile could not be loaded."}<button className="text-action" onClick={()=>router.refresh()}>Try again</button></div>}
      </section>
    </div>
    <nav className="bottom-nav"><Link className="nav-item" href="/dashboard"><Activity size={19}/>Home</Link><Link className="nav-item" href="/explore"><Compass size={19}/>Explore</Link><Link className="nav-item active" href="/profile"><UserRound size={19}/>Profile</Link></nav>
  </main>;
}
