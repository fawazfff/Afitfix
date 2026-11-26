import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowRight, Bell, MapPin, Compass, UserRound, ClipboardList, CheckCircle2, Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Complaint, ComplaintStatus } from "@/lib/types";
import { SignOutButton } from "@/app/components/sign-out-button";

const labels: Record<ComplaintStatus,string> = {
  submitted:"Submitted", under_review:"Under review", assigned:"Assigned",
  in_progress:"In progress", awaiting_confirmation:"Awaiting confirmation",
  resolved:"Resolved", reopened:"Reopened"
};

function CampusIllustration() {
  return <svg className="campus-scene" viewBox="0 0 560 300" role="img" aria-label="Illustration of campus buildings and a student reporting a maintenance issue">
    <path d="M0 248c82-31 150-20 222-5s158 15 338-17v74H0z" fill="#dce9e4"/>
    <path d="M0 274c112-27 192-13 287-4s172-8 273-24v54H0z" fill="#c6ddd4"/>
    <circle cx="456" cy="55" r="28" fill="#f3d28b"/>
    <path d="M40 222V116l84-43 84 43v106z" fill="#f7f5ed" stroke="#234c79" strokeWidth="3"/>
    <path d="M30 119 124 65l94 54" fill="none" stroke="#234c79" strokeWidth="8" strokeLinejoin="round"/>
    <path d="M62 134h124M62 222h124" stroke="#234c79" strokeWidth="3"/>
    <path d="M79 143h24v37H79zm66 0h24v37h-24z" fill="#b9d6e4" stroke="#234c79" strokeWidth="3"/>
    <path d="M108 190h32v32h-32z" fill="#d6e6e9" stroke="#234c79" strokeWidth="3"/>
    <path d="M246 222V142l68-34 68 34v80z" fill="#e7eee9" stroke="#234c79" strokeWidth="3"/>
    <path d="m235 145 79-43 79 43" fill="none" stroke="#234c79" strokeWidth="8" strokeLinejoin="round"/>
    <path d="M270 158h23v29h-23zm65 0h23v29h-23z" fill="#b9d6e4" stroke="#234c79" strokeWidth="3"/>
    <path d="M302 190h25v32h-25z" fill="#d6e6e9" stroke="#234c79" strokeWidth="3"/>
    <path d="M0 229h560" stroke="#8eaf9f" strokeWidth="3"/>
    <path d="M425 223v-38m-13 12 13-15 13 15" fill="none" stroke="#3d755d" strokeWidth="5" strokeLinecap="round"/>
    <circle cx="425" cy="168" r="17" fill="#7ca88a"/>
    <path d="M425 199c-14 0-22 10-22 24h44c0-14-8-24-22-24" fill="#3d755d"/>
    <g transform="translate(385 97)">
      <rect width="143" height="67" rx="13" fill="#fff" stroke="#d7e2dc" strokeWidth="2"/>
      <circle cx="20" cy="22" r="10" fill="#e1f1e8"/>
      <path d="m15 22 4 4 7-9" fill="none" stroke="#28734f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M38 18h83M38 27h61" stroke="#28425f" strokeWidth="4" strokeLinecap="round"/>
      <path d="M16 47h105" stroke="#dce5e1" strokeWidth="3" strokeLinecap="round"/>
    </g>
    <g transform="translate(206 205)">
      <circle cx="0" cy="0" r="12" fill="#b97950"/>
      <path d="M-12-2c1-17 23-19 25-2-7-5-17-5-25 2" fill="#243b59"/>
      <path d="M-13 16c-12 4-16 22-16 39h58c0-18-7-35-18-39z" fill="#315f9d"/>
      <path d="M-19 30 5 47" stroke="#b97950" strokeWidth="7" strokeLinecap="round"/>
      <rect x="3" y="23" width="21" height="27" rx="3" fill="#fff" stroke="#315f9d" strokeWidth="2"/>
      <path d="M8 31h11M8 37h8" stroke="#315f9d" strokeWidth="2" strokeLinecap="round"/>
    </g>
  </svg>;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: complaints, error: complaintsError },
    { count: totalCount, error: totalError },
    { count: activeCount, error: activeError },
    { count: resolvedCount, error: resolvedError },
    { data: announcements },
  ] = await Promise.all([
    supabase.from("profiles").select("full_name,role").eq("id", user.id).single(),
    supabase.from("complaints").select("id,tracking_code,user_id,title,description,category,location,image_url,status,created_at,updated_at").order("created_at", { ascending: false }).limit(30),
    supabase.from("complaints").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("complaints").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("status", "resolved"),
    supabase.from("complaints").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "resolved"),
    supabase.from("announcements").select("id,title,body,created_at,is_pinned").eq("is_published", true).order("is_pinned", {ascending:false}).order("created_at", {ascending:false}).limit(3),
  ]);

  const rows = (complaints ?? []) as Complaint[];
  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const countError = totalError || activeError || resolvedError;
  const total = totalCount ?? 0;
  const active = activeCount ?? 0;
  const resolved = resolvedCount ?? 0;

  return <main className="app-shell student-home">
    <header className="topbar"><Link className="brand" href="/dashboard"><span className="brand-mark"><img src="/afit-crest.png" alt="" /></span>Afitfix</Link><div className="topbar-actions"><Link className="icon-button" href="/notifications" aria-label="Notifications"><Bell size={18}/></Link><span className="avatar">{firstName.slice(0,2).toUpperCase()}</span><SignOutButton/></div></header>
    <div className="page-wrap student-home-wrap">
      <section className="student-greeting"><div><span className="eyebrow">AFIT · STUDENT HOME</span><h1>Good day, {firstName}.</h1><p>Here’s what’s happening around campus.</p></div><span className="greeting-date">Your campus, in view</span></section>
      <section className="campus-feature">
        <div className="campus-feature-copy"><span className="feature-kicker">MAKE YOUR CAMPUS BETTER</span><h2>Notice something<br/>that needs attention?</h2><p>Let the right people know. Share the location, explain the issue and follow every update.</p><Link className="campus-report-button" href="/report/new">Report an issue <ArrowRight size={17}/></Link></div>
        <div className="campus-feature-art"><CampusIllustration/><span className="campus-art-caption">A better campus takes all of us.</span></div>
      </section>
      <section className="student-stats" aria-label="Your report statistics">
        <div className="student-stat"><span className="student-stat-icon"><ClipboardList size={17}/></span><div><strong>{countError ? "—" : total}</strong><span>Your reports</span></div></div>
        <div className="student-stat"><span className="student-stat-icon stat-icon-amber"><Activity size={17}/></span><div><strong>{countError ? "—" : active}</strong><span>Being worked on</span></div></div>
        <div className="student-stat"><span className="student-stat-icon stat-icon-green"><CheckCircle2 size={17}/></span><div><strong>{countError ? "—" : resolved}</strong><span>Resolved</span></div></div>
      </section>
      {countError && <p className="muted-note" role="status">Your report totals could not be loaded. Please refresh in a moment.</p>}
      {(announcements ?? []).length > 0 && <section className="student-section"><div className="student-section-heading"><div><span className="eyebrow">FROM THE ADMIN TEAM</span><h2>Campus announcements</h2></div><Megaphone size={19}/></div><div className="announcement-list">{announcements?.map(item=><article className="announcement-row" key={item.id}><span className="announcement-marker"/><div><h3>{item.title}</h3><p>{item.body}</p><small>{new Date(item.created_at).toLocaleDateString()}</small></div></article>)}</div></section>}
      <section className="student-section" id="community"><div className="student-section-heading"><div><span className="eyebrow">THE AFIT COMMUNITY</span><h2>Recent campus reports</h2></div><Link href="/explore" className="student-text-link">Explore all <ArrowRight size={15}/></Link></div>
      {complaintsError ? <div className="student-empty"><ClipboardList size={24}/><strong>Reports aren’t available right now</strong><span>Please refresh in a moment.</span></div> : rows.length===0 ? <div className="student-empty"><ClipboardList size={24}/><strong>No reports have been shared yet</strong><span>When students report an issue, it will show up here.</span><Link href="/report/new">Submit the first report <ArrowRight size={15}/></Link></div> : <div className="student-report-list">{rows.slice(0,5).map(row=><article className="student-report-row" key={row.id}>
        {row.image_url ? <img className="student-report-thumb" src={row.image_url} alt={"Photo for " + row.title} loading="lazy"/> : <span className="student-report-thumb student-report-placeholder"><ClipboardList size={20}/></span>}
        <div className="student-report-main"><div className="student-report-meta"><span>{row.category}</span><span className={"status-pill " + row.status}>{labels[row.status]}</span></div><h3><Link href={"/report/" + row.id}>{row.title}</Link></h3><p><MapPin size={13}/>{row.location}<span>·</span>{row.tracking_code}</p></div>
        <Link href={"/report/" + row.id} className="student-report-open" aria-label={"Open " + row.title}><ArrowRight size={17}/></Link>
      </article>)}</div>}
      </section>
      <div className="student-home-footnote">Afitfix helps students raise campus concerns and see what happens next.</div>
      {profile?.role==="admin" && <p className="admin-link"><Link href="/admin">Open admin dashboard <ArrowRight size={15}/></Link></p>}
    </div>
    <nav className="bottom-nav"><Link className="nav-item active" href="/dashboard"><Activity size={19}/>Home</Link><Link className="nav-item" href="/explore"><Compass size={19}/>Explore</Link><Link className="nav-item" href="/profile"><UserRound size={19}/>Profile</Link></nav>
  </main>;
}
