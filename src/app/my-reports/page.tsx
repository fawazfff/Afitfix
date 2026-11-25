import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowLeft, Bell, MapPin, Plus, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Complaint, ComplaintStatus } from "@/lib/types";
import { SignOutButton } from "@/app/components/sign-out-button";

const labels: Record<ComplaintStatus,string> = { submitted:"Submitted", under_review:"Under review", assigned:"Assigned", in_progress:"In progress", awaiting_confirmation:"Awaiting confirmation", resolved:"Resolved", reopened:"Reopened" };

export default async function MyReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await supabase.from("complaints").select("id,tracking_code,user_id,title,description,category,location,image_url,status,created_at,updated_at").eq("user_id", user.id).order("created_at", { ascending: false });
  const rows = (data ?? []) as Complaint[];
  return <main className="app-shell">
    <header className="topbar"><Link className="brand" href="/dashboard"><span className="brand-mark"><img src="/afit-crest.png" alt="" /></span>Afitfix</Link><div className="topbar-actions"><Link className="icon-button" href="/notifications" aria-label="Notifications"><Bell size={18}/></Link><SignOutButton/></div></header>
    <div className="page-wrap"><section className="welcome"><span className="eyebrow">Your activity</span><h1>My reports</h1><p>Every campus issue you have submitted, together in one place.</p></section>
      <div className="section-heading"><h2>Your submissions</h2><span>{rows.length} total</span></div>
      {error ? <div className="empty-state">Could not load your reports. Please refresh and try again.</div> : rows.length===0 ? <div className="empty-state">You have not submitted a report yet. When you do, it will appear here.<p><Link className="primary-button" href="/report/new">Create your first report <Plus size={16}/></Link></p></div> : <div className="feed-list">{rows.map(row=><article className="complaint-card" key={row.id}>
        <div className="card-meta"><span className="category-label">{row.category} · {row.tracking_code}</span><span className={`status-pill ${row.status}`}><Activity size={12}/>{labels[row.status]}</span></div>
        <h3><Link href={`/report/${row.id}`}>{row.title}</Link></h3>{row.image_url && <img className="report-card-photo" src={row.image_url} alt={`Photo for ${row.title}`} loading="lazy"/>}<p>{row.description}</p>
        <div className="card-footer"><span className="engagement"><span><MapPin size={13}/>{row.location}</span></span><span>{new Date(row.created_at).toLocaleDateString()}</span></div>
      </article>)}</div>}
      <p className="admin-link"><Link href="/dashboard"><ArrowLeft size={15}/> Back to dashboard</Link></p>
    </div>
    <nav className="bottom-nav"><Link className="nav-item active" href="/dashboard"><Activity size={19}/>Home</Link><Link className="nav-item" href="/explore"><Compass size={19}/>Explore</Link><Link className="nav-item" href="/profile"><UserRound size={19}/>Profile</Link></nav>
  </main>;
}