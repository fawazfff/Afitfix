import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowUpRight, Bell, Plus, MapPin, Compass, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Complaint, ComplaintStatus } from "@/lib/types";
import { SignOutButton } from "@/app/components/sign-out-button";

const labels: Record<ComplaintStatus,string> = {
  submitted:"Submitted", under_review:"Under review", assigned:"Assigned",
  in_progress:"In progress", awaiting_confirmation:"Awaiting confirmation",
  resolved:"Resolved", reopened:"Reopened"
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: complaints, error: complaintsError },
    { count: totalCount, error: totalError },
    { count: activeCount, error: activeError },
    { count: resolvedCount, error: resolvedError },\n    { data: announcements },
  ] = await Promise.all([
    supabase.from("profiles").select("full_name,role").eq("id", user.id).single(),
    supabase.from("complaints").select("id,tracking_code,user_id,title,description,category,location,image_url,status,created_at,updated_at").order("created_at", { ascending: false }).limit(30),
    supabase.from("complaints").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("complaints").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("status", "resolved"),
    supabase.from("complaints").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "resolved"),\n    supabase.from("announcements").select("id,title,body,created_at,is_pinned").eq("is_published", true).order("is_pinned", {ascending:false}).order("created_at", {ascending:false}).limit(3),
  ]);

  const rows = (complaints ?? []) as Complaint[];
  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const countError = totalError || activeError || resolvedError;
  const total = totalCount ?? 0;
  const active = activeCount ?? 0;
  const resolved = resolvedCount ?? 0;

  return <main className="app-shell">
    <header className="topbar"><Link className="brand" href="/dashboard"><span className="brand-mark"><img src="/afit-crest.png" alt="" /></span>Afitfix</Link><div className="topbar-actions"><Link className="icon-button" href="/notifications" aria-label="Notifications"><Bell size={18}/></Link><span className="avatar">{firstName.slice(0,2).toUpperCase()}</span><SignOutButton/></div></header>
    <div className="page-wrap">
      <section className="welcome"><span className="eyebrow">Student dashboard</span><h1>Welcome, {firstName}</h1><p>Here’s what’s happening across your campus.</p></section>
      {(announcements ?? []).length > 0 && <section className="announcement-feed"><div className="section-heading"><h2>Campus announcements</h2><span>From Afitfix admins</span></div>{announcements?.map(item=><article className="complaint-card announcement-student-card" key={item.id}><span className="eyebrow">Campus update</span><h3>{item.title}</h3><p>{item.body}</p><small>{new Date(item.created_at).toLocaleDateString()}</small></article>)}</section>}\n      <section className="hero-card"><h2>See something that needs fixing?</h2><p>Report it in a few steps and keep track of the progress.</p><Link className="primary-button" href="/report/new">Create a report <Plus size={17}/></Link></section>
      <section className="stats-grid" aria-label="Your report statistics">
        <div className="stat-card"><strong>{countError ? "—" : total}</strong><span>Your reports</span></div>
        <div className="stat-card"><strong>{countError ? "—" : active}</strong><span>Still active</span></div>
        <div className="stat-card"><strong>{countError ? "—" : resolved}</strong><span>Resolved</span></div>
      </section>
      {countError && <p className="muted-note" role="status">Your report totals could not be loaded. Please refresh in a moment.</p>}
      <div className="section-heading" id="community"><h2>Campus community</h2><span>Latest reports</span></div>
      {complaintsError ? <div className="empty-state">Could not load reports. Check that the Supabase schema has been applied.</div> : rows.length===0 ? <div className="empty-state">No reports yet. Be the first to let the community know what needs attention.</div> : <div className="feed-list">{rows.map(row=><article className="complaint-card" key={row.id}>
        <div className="card-meta"><span className="category-label">{row.category} · {row.tracking_code}</span><span className={`status-pill ${row.status}`}><Activity size={12}/>{labels[row.status]}</span></div>
        <h3><Link href={`/report/${row.id}`}>{row.title}</Link></h3>{row.image_url && <img className="report-card-photo" src={row.image_url} alt={`Photo for ${row.title}`} loading="lazy"/>}<p>{row.description}</p>
        <div className="card-footer"><span className="engagement"><span><MapPin size={13}/>{row.location}</span></span><span>{new Date(row.created_at).toLocaleDateString()}</span></div>
      </article>)}</div>}
      <div className="section-heading" id="activity"><h2>Your activity</h2></div>
      <div className="complaint-card"><p>You have <strong>{countError ? "an unknown number of" : total}</strong> reports, with <strong>{countError ? "an unknown number of" : active}</strong> still active. Updates will appear here as admins review them.</p></div>
      {profile?.role==="admin" && <p className="admin-link"><Link href="/admin">Open admin dashboard <ArrowUpRight size={15}/></Link></p>}
    </div>
    <nav className="bottom-nav"><Link className="nav-item active" href="/dashboard"><Activity size={19}/>Home</Link><Link className="nav-item" href="/explore"><Compass size={19}/>Explore</Link><Link className="nav-item" href="/profile"><UserRound size={19}/>Profile</Link></nav>
  </main>;
}
