import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowUpRight, Bell, Plus, MapPin, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Complaint, ComplaintStatus } from "@/lib/types";

const labels: Record<ComplaintStatus,string> = {
  submitted:"Submitted", under_review:"Under review", assigned:"Assigned",
  in_progress:"In progress", awaiting_confirmation:"Awaiting confirmation",
  resolved:"Resolved", reopened:"Reopened"
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [{ data: profile }, { data: complaints, error }] = await Promise.all([
    supabase.from("profiles").select("full_name,role").eq("id",user.id).single(),
    supabase.from("complaints").select("id,tracking_code,user_id,title,description,category,location,image_url,status,created_at,updated_at").order("created_at",{ascending:false}).limit(30)
  ]);
  const rows = (complaints ?? []) as Complaint[];
  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const mine = rows.filter(row=>row.user_id===user.id);
  const active = mine.filter(row=>row.status!=="resolved").length;
  const resolved = mine.filter(row=>row.status==="resolved").length;

  return <main className="app-shell">
    <header className="topbar"><Link className="brand" href="/"><span className="brand-mark"><Wrench size={19}/></span>Afitfix</Link><div className="topbar-actions"><span className="avatar">{firstName.slice(0,2).toUpperCase()}</span></div></header>
    <div className="page-wrap">
      <section className="welcome"><span className="eyebrow">Student dashboard</span><h1>Welcome, {firstName}</h1><p>Here’s what’s happening across your campus.</p></section>
      <section className="hero-card"><h2>See something that needs fixing?</h2><p>Report it in a few steps and keep track of the progress.</p><Link className="primary-button" href="/report/new">Create a report <Plus size={17}/></Link></section>
      <section className="stats-grid"><div className="stat-card"><strong>{mine.length}</strong><span>Your reports</span></div><div className="stat-card"><strong>{active}</strong><span>Still active</span></div><div className="stat-card"><strong>{resolved}</strong><span>Resolved</span></div></section>
      <div className="section-heading"><h2>Campus community</h2><span>Latest reports</span></div>
      {error ? <div className="empty-state">Could not load reports. Check that the Supabase schema has been applied.</div> : rows.length===0 ? <div className="empty-state">No reports yet. Be the first to let the community know what needs attention.</div> : <div className="feed-list">{rows.map(row=><article className="complaint-card" key={row.id}>
        <div className="card-meta"><span className="category-label">{row.category} · {row.tracking_code}</span><span className={`status-pill ${row.status}`}><Activity size={12}/>{labels[row.status]}</span></div>
        <h3><Link href={`/report/${row.id}`}>{row.title}</Link></h3><p>{row.description}</p>
        <div className="card-footer"><span className="engagement"><span><MapPin size={13}/>{row.location}</span></span><span>{new Date(row.created_at).toLocaleDateString()}</span></div>
      </article>)}</div>}
      <div className="section-heading"><h2>Your activity</h2></div>
      <div className="complaint-card"><p>You have <strong>{mine.length}</strong> reports, with <strong>{active}</strong> still being worked on. Updates will appear here as admins review them.</p></div>
      {profile?.role==="admin" && <p className="admin-link"><Link href="/admin">Open admin dashboard <ArrowUpRight size={15}/></Link></p>}
    </div>
    <nav className="bottom-nav"><Link className="nav-item active" href="/dashboard"><Activity size={19}/>Home</Link><Link className="nav-item" href="/dashboard#community"><Bell size={19}/>Explore</Link><Link className="nav-item" href="/report/new"><Plus size={20}/>Report</Link><Link className="nav-item" href="/dashboard#activity"><Wrench size={19}/>My reports</Link></nav>
  </main>;
}