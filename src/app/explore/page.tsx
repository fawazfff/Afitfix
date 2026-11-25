"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Bell, Compass, Filter, LoaderCircle, MapPin, Search, ThumbsUp, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SignOutButton } from "@/app/components/sign-out-button";
import type { Complaint, ComplaintStatus } from "@/lib/types";

type Vote = { complaint_id: string; user_id: string };
const categories = ["All categories","Electricity","Water & Plumbing","Classroom","Hostel","Laboratory","Cleanliness","Internet","Other"];
const labels: Record<ComplaintStatus,string> = { submitted:"Submitted", under_review:"Under review", assigned:"Assigned", in_progress:"In progress", awaiting_confirmation:"Awaiting confirmation", resolved:"Resolved", reopened:"Reopened" };

export default function ExplorePage() {
  const router = useRouter();
  const [rows,setRows] = useState<Complaint[]>([]);
  const [counts,setCounts] = useState<Record<string,number>>({});
  const [mine,setMine] = useState<Set<string>>(new Set());
  const [userId,setUserId] = useState("");
  const [busy,setBusy] = useState(true);
  const [message,setMessage] = useState("");
  const [search,setSearch] = useState("");
  const [category,setCategory] = useState("All categories");
  const [status,setStatus] = useState("All statuses");
  const [sort,setSort] = useState("newest");
  const [voting,setVoting] = useState<string|null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      setUserId(user.id);
      const [{data,error},{data:votes}] = await Promise.all([
        supabase.from("complaints").select("id,tracking_code,user_id,title,description,category,location,image_url,status,created_at,updated_at").order("created_at",{ascending:false}).limit(200),
        supabase.from("complaint_votes").select("complaint_id,user_id")
      ]);
      if (!active) return;
      if (error) setMessage("Campus reports could not be loaded. Please refresh.");
      const list = (data ?? []) as Complaint[];
      setRows(list);
      const voteRows = (votes ?? []) as Vote[];
      const nextCounts: Record<string,number> = {};
      const nextMine = new Set<string>();
      voteRows.forEach(v => { nextCounts[v.complaint_id] = (nextCounts[v.complaint_id] ?? 0) + 1; if (v.user_id === user.id) nextMine.add(v.complaint_id); });
      setCounts(nextCounts); setMine(nextMine); setBusy(false);
    })();
    return () => { active = false; };
  }, [router]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(row => (category === "All categories" || row.category === category)
      && (status === "All statuses" || row.status === status)
      && (!q || [row.title,row.description,row.location,row.tracking_code].some(value => value.toLowerCase().includes(q))))
      .sort((a,b) => sort === "popular" ? (counts[b.id] ?? 0) - (counts[a.id] ?? 0) : sort === "oldest" ? a.created_at.localeCompare(b.created_at) : b.created_at.localeCompare(a.created_at));
  },[rows,search,category,status,sort,counts]);

  async function toggleVote(row: Complaint) {
    setVoting(row.id); setMessage("");
    const supabase = createClient();
    const hasVote = mine.has(row.id);
    const result = hasVote
      ? await supabase.from("complaint_votes").delete().eq("complaint_id",row.id).eq("user_id",userId)
      : await supabase.from("complaint_votes").insert({complaint_id:row.id,user_id:userId});
    if (result.error) setMessage(result.error.message);
    else {
      setMine(current => { const next = new Set(current); hasVote ? next.delete(row.id) : next.add(row.id); return next; });
      setCounts(current => ({...current,[row.id]:Math.max(0,(current[row.id] ?? 0)+(hasVote?-1:1))}));
    }
    setVoting(null);
  }

  return <main className="app-shell">
    <header className="topbar"><Link className="brand" href="/dashboard"><span className="brand-mark"><img src="/afit-crest.png" alt="" /></span>Afitfix</Link><div className="topbar-actions"><Link className="icon-button" href="/notifications" aria-label="Notifications"><Bell size={18}/></Link><SignOutButton/></div></header>
    <div className="page-wrap">
      <section className="welcome"><span className="eyebrow">AFIT community</span><h1>Explore campus</h1><p>Find reports, support issues that matter and follow the conversation.</p></section>
      <section className="explore-tools">
        <label className="explore-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search reports, places or tracking IDs"/></label>
        <div className="explore-filter-row"><label><Filter size={15}/><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(item=><option key={item}>{item}</option>)}</select></label><label><select value={status} onChange={e=>setStatus(e.target.value)}><option>All statuses</option>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label><select value={sort} onChange={e=>setSort(e.target.value)}><option value="newest">Newest first</option><option value="popular">Most supported</option><option value="oldest">Oldest first</option></select></label></div>
      </section>
      <div className="section-heading"><h2>Community reports</h2><span>{filtered.length} {filtered.length===1?"report":"reports"}</span></div>
      {message && <p className="form-notice" role="status">{message}</p>}
      {busy ? <div className="empty-state"><LoaderCircle className="spin" size={20}/> Loading campus reports…</div> : filtered.length===0 ? <div className="empty-state">No reports match those filters. Try changing your search.</div> : <div className="feed-list">{filtered.map(row=><article className="complaint-card" key={row.id}>
        <div className="card-meta"><span className="category-label">{row.category} · {row.tracking_code}</span><span className={`status-pill ${row.status}`}><Activity size={12}/>{labels[row.status]}</span></div>
        <h3><Link href={`/report/${row.id}`}>{row.title}</Link></h3>{row.image_url && <img className="report-card-photo" src={row.image_url} alt={`Photo for ${row.title}`} loading="lazy"/>}<p>{row.description}</p>
        <div className="card-footer"><span className="engagement"><span><MapPin size={13}/>{row.location}</span></span><span>{new Date(row.created_at).toLocaleDateString()}</span></div>
        <div className="explore-card-actions"><button className={`vote-button ${mine.has(row.id)?"voted":""}`} disabled={voting===row.id} onClick={()=>toggleVote(row)}><ThumbsUp size={15}/>{mine.has(row.id)?"Supported":"Support"} · {counts[row.id] ?? 0}</button><Link className="text-action" href={`/report/${row.id}`}>View discussion</Link></div>
      </article>)}</div>}
    </div>
    <nav className="bottom-nav"><Link className="nav-item" href="/dashboard"><Activity size={19}/>Home</Link><Link className="nav-item active" href="/explore"><Compass size={19}/>Explore</Link><Link className="nav-item" href="/profile"><UserRound size={19}/>Profile</Link></nav>
  </main>;
}
