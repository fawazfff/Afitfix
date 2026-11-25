"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Bell, BookOpen, CheckCircle2, ClipboardList, FileText, LoaderCircle, Megaphone, Search, ShieldCheck, Users, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Complaint, ComplaintStatus } from "@/lib/types";
import { SignOutButton } from "@/app/components/sign-out-button";

type Section = "overview" | "reports" | "students" | "announcements" | "activity";
type Student = { id:string; full_name:string; email:string; matric_number:string|null; created_at:string };
type Notice = { id:string; title:string; body:string; is_published:boolean; is_pinned:boolean; created_at:string };
type History = { id:string; complaint_id:string; new_status:ComplaintStatus; note:string|null; created_at:string };
type AdminNote = { id:string; complaint_id:string; note:string; created_at:string };
const statuses: ComplaintStatus[] = ["submitted","under_review","assigned","in_progress","awaiting_confirmation","resolved","reopened"];
const labels: Record<ComplaintStatus,string> = { submitted:"Submitted",under_review:"Under review",assigned:"Assigned",in_progress:"In progress",awaiting_confirmation:"Awaiting confirmation",resolved:"Resolved",reopened:"Reopened" };
const sections: {id:Section;label:string;icon:typeof Activity}[] = [
  {id:"overview",label:"Overview",icon:Activity},{id:"reports",label:"All reports",icon:ClipboardList},
  {id:"students",label:"Students",icon:Users},{id:"announcements",label:"Announcements",icon:Megaphone},{id:"activity",label:"Activity log",icon:BookOpen}
];

export default function AdminPage(){
 const router=useRouter();
 const [section,setSection]=useState<Section>("overview");
 const [rows,setRows]=useState<Complaint[]>([]);
 const [students,setStudents]=useState<Student[]>([]);
 const [announcements,setAnnouncements]=useState<Notice[]>([]);
 const [history,setHistory]=useState<History[]>([]);
 const [notes,setNotes]=useState<AdminNote[]>([]);
 const [draftNotes,setDraftNotes]=useState<Record<string,string>>({});
 const [progressDrafts,setProgressDrafts]=useState<Record<string,string>>({});
 const [search,setSearch]=useState("");
 const [statusFilter,setStatusFilter]=useState("all");
 const [categoryFilter,setCategoryFilter]=useState("all");
 const [noticeTitle,setNoticeTitle]=useState("");
 const [noticeBody,setNoticeBody]=useState("");
 const [busy,setBusy]=useState(true);
 const [saving,setSaving]=useState<string|null>(null);
 const [message,setMessage]=useState("");
 const [adminId,setAdminId]=useState("");

 useEffect(()=>{let live=true;(async()=>{
  const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace("/admin/login");return;}
  const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).single();
  if(profile?.role!=="admin"){router.replace("/dashboard");return;}
  setAdminId(user.id);
  const [reportsResult,studentsResult,announcementsResult,historyResult,notesResult]=await Promise.all([
   supabase.from("complaints").select("*").order("created_at",{ascending:false}).limit(500),
   supabase.from("profiles").select("id,full_name,email,matric_number,created_at").order("created_at",{ascending:false}).limit(500),
   supabase.from("announcements").select("*").order("created_at",{ascending:false}).limit(100),
   supabase.from("complaint_status_history").select("id,complaint_id,new_status,note,created_at").order("created_at",{ascending:false}).limit(100),
   supabase.from("admin_report_notes").select("id,complaint_id,note,created_at").order("created_at",{ascending:false}).limit(300)
  ]);
  if(!live)return;
  if(reportsResult.error)setMessage("Reports could not be loaded: "+reportsResult.error.message);
  setRows((reportsResult.data??[]) as Complaint[]);
  setStudents((studentsResult.data??[]) as Student[]);
  setAnnouncements((announcementsResult.data??[]) as Notice[]);
  setHistory((historyResult.data??[]) as History[]);
  setNotes((notesResult.data??[]) as AdminNote[]);
  setBusy(false);
 })();return()=>{live=false}},[router]);

 const filtered=useMemo(()=>rows.filter(row=>
  (statusFilter==="all"||row.status===statusFilter)&&(categoryFilter==="all"||row.category===categoryFilter)&&
  (!search.trim()||[row.title,row.description,row.location,row.tracking_code].some(v=>v.toLowerCase().includes(search.trim().toLowerCase())))
 ),[rows,statusFilter,categoryFilter,search]);
 const open=rows.filter(r=>r.status!=="resolved").length;
 const resolved=rows.filter(r=>r.status==="resolved").length;
 const needsReview=rows.filter(r=>r.status==="submitted"||r.status==="reopened").length;
 const categories=Array.from(new Set(rows.map(r=>r.category)));

 async function changeStatus(row:Complaint,next:ComplaintStatus){
  if(next===row.status)return;setSaving(row.id);setMessage("");
  try{
   const supabase=createClient();const {error}=await supabase.rpc("admin_update_complaint_status",{p_complaint_id:row.id,p_new_status:next,p_note:null});
   if(error)throw error;
   setRows(current=>current.map(item=>item.id===row.id?{...item,status:next,updated_at:new Date().toISOString()}:item));
   setMessage(row.tracking_code+" updated to "+labels[next]+".");
   const {data}=await supabase.from("complaint_status_history").select("id,complaint_id,new_status,note,created_at").eq("complaint_id",row.id).order("created_at",{ascending:false}).limit(1);
   if(data?.[0])setHistory(current=>[data[0] as History,...current.filter(h=>h.id!==data[0].id)]);
  }catch(error){setMessage(error instanceof Error?error.message:"Could not update report status.");}
  finally{setSaving(null);}
 }

 async function addNote(event:FormEvent<HTMLFormElement>,row:Complaint){
  event.preventDefault();const note=draftNotes[row.id]?.trim();if(!note)return;
  setSaving("note-"+row.id);setMessage("");
  const {data,error}=await createClient().from("admin_report_notes").insert({complaint_id:row.id,admin_id:adminId,note}).select("id,complaint_id,note,created_at").single();
  if(error)setMessage("Could not save note: "+error.message);
  else{setNotes(current=>[data as AdminNote,...current]);setDraftNotes(current=>({...current,[row.id]:""}));setMessage("Internal admin note saved.");}
  setSaving(null);
 }

 async function addProgressUpdate(event:FormEvent<HTMLFormElement>,row:Complaint){
  event.preventDefault();const note=progressDrafts[row.id]?.trim();if(!note)return;
  setSaving("progress-"+row.id);setMessage("");
  const {data,error}=await createClient().from("complaint_status_history").insert({
   complaint_id:row.id,changed_by:adminId,old_status:row.status,new_status:row.status,note
  }).select("id,complaint_id,new_status,note,created_at").single();
  if(error)setMessage("Could not publish progress update: "+error.message);
  else{setHistory(current=>[data as History,...current]);setProgressDrafts(current=>({...current,[row.id]:""}));setMessage("Progress update published to the student report.");}
  setSaving(null);
 }

 async function publishAnnouncement(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!noticeTitle.trim()||!noticeBody.trim())return;setSaving("announcement");setMessage("");
  const {data,error}=await createClient().from("announcements").insert({title:noticeTitle.trim(),body:noticeBody.trim(),created_by:adminId,is_published:true}).select("*").single();
  if(error)setMessage("Could not publish announcement: "+error.message);
  else{setAnnouncements(current=>[data as Notice,...current]);setNoticeTitle("");setNoticeBody("");setMessage("Announcement published.");}
  setSaving(null);
 }

 async function toggleAnnouncement(item:Notice){
  const {error}=await createClient().from("announcements").update({is_published:!item.is_published}).eq("id",item.id);
  if(error)setMessage(error.message);else setAnnouncements(current=>current.map(a=>a.id===item.id?{...a,is_published:!a.is_published}:a));
 }

 if(busy)return <main className="admin-shell"><div className="empty-state"><LoaderCircle className="spin" size={20}/> Loading admin workspace…</div></main>;

 return <main className="admin-shell">
  <aside className="admin-sidebar">
   <Link className="admin-brand" href="/"><span className="brand-mark"><img src="/afit-crest.png" alt=""/></span><span>Afitfix<small>ADMINISTRATION</small></span></Link>
   <div className="admin-nav-label">WORKSPACE</div>
   <nav>{sections.map(item=><button key={item.id} className={section===item.id?"active":""} onClick={()=>setSection(item.id)}><item.icon size={18}/>{item.label}{item.id==="reports"&&<span>{rows.length}</span>}</button>)}</nav>
   <div className="admin-sidebar-bottom"><Link href="/dashboard">View student site</Link><SignOutButton/></div>
  </aside>
  <section className="admin-main">
   <header className="admin-topbar"><div><span className="eyebrow">Afitfix administration</span><h1>{sections.find(s=>s.id===section)?.label}</h1></div><span className="status-pill"><ShieldCheck size={14}/> Admin</span></header>
   <div className="admin-content">
    {message&&<p className="form-notice" role="status">{message}</p>}
    {section==="overview"&&<>
     <div className="admin-welcome"><div><h2>Campus report overview</h2><p>Here's the latest picture of what's happening across AFIT.</p></div><button className="primary-button" onClick={()=>setSection("reports")}>Review reports <ClipboardList size={16}/></button></div>
     <div className="admin-stats"><article><span>Total reports</span><strong>{rows.length}</strong><small>All submissions loaded</small></article><article><span>Needs attention</span><strong>{needsReview}</strong><small>New or reopened</small></article><article><span>Open reports</span><strong>{open}</strong><small>Not yet resolved</small></article><article><span>Resolved</span><strong>{resolved}</strong><small>Marked as resolved</small></article></div>
     <div className="admin-overview-grid"><section className="admin-panel"><div className="admin-panel-heading"><h3>Recent reports</h3><button className="text-action" onClick={()=>setSection("reports")}>View all</button></div>{rows.slice(0,6).map(row=><button className="admin-recent-row" key={row.id} onClick={()=>setSection("reports")}><span><b>{row.title}</b><small>{row.tracking_code} · {row.location}</small></span><span className={`status-pill ${row.status}`}>{labels[row.status]}</span></button>)}{rows.length===0&&<p className="muted-note">No reports submitted yet.</p>}</section>
     <section className="admin-panel"><div className="admin-panel-heading"><h3>Reports by category</h3></div>{categories.map(cat=>{const count=rows.filter(r=>r.category===cat).length;return <div className="category-stat" key={cat}><span>{cat}</span><b>{count}</b><i><span style={{width:(rows.length?count/rows.length*100:0)+"%"}}/></i></div>})}{categories.length===0&&<p className="muted-note">Category insights will appear when reports arrive.</p>}</section></div>
     <section className="admin-panel"><div className="admin-panel-heading"><h3>Most supported reports</h3><span>Based on student votes</span></div><p className="muted-note">Open individual reports to review community support and discussion.</p>{rows.slice(0,4).map(row=><Link className="admin-recent-row" key={row.id} href={`/report/${row.id}`}><span><b>{row.title}</b><small>{row.tracking_code} · {row.category}</small></span><span>View report ↗</span></Link>)}</section>
    </>}
    {section==="reports"&&<>
     <div className="admin-toolbar"><label className="admin-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title, location or tracking ID"/></label><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">All statuses</option>{statuses.map(s=><option key={s} value={s}>{labels[s]}</option>)}</select><select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option value="all">All categories</option>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
     <p className="admin-result-count">{filtered.length} reports</p>
     {filtered.map(row=><article className="admin-report-card" key={row.id}>
      <div className="admin-report-head"><div><span className="category-label">{row.category} · {row.tracking_code}</span><h3>{row.title}</h3></div><span className={`status-pill ${row.status}`}>{labels[row.status]}</span></div>
      {row.image_url&&<a href={row.image_url} target="_blank" rel="noreferrer"><img className="admin-report-image" src={row.image_url} alt={`Attachment for ${row.title}`}/></a>}
      <p>{row.description}</p><div className="card-footer"><span>{row.location}</span><span>{new Date(row.created_at).toLocaleString()}</span></div>
      <div className="admin-report-actions"><label>Change status<select value={row.status} disabled={saving===row.id} onChange={e=>changeStatus(row,e.target.value as ComplaintStatus)}>{statuses.map(s=><option key={s} value={s}>{labels[s]}</option>)}</select></label><Link className="text-action" href={`/report/${row.id}`}>Open public report ↗</Link></div>
      <div className="admin-note-area"><h4>Student-visible progress updates</h4>{history.filter(h=>h.complaint_id===row.id&&h.note).slice(0,4).map(h=><div className="admin-saved-note" key={h.id}><p>{h.note}</p><small>{new Date(h.created_at).toLocaleString()}</small></div>)}<form onSubmit={e=>addProgressUpdate(e,row)}><textarea rows={2} maxLength={1000} value={progressDrafts[row.id]??""} onChange={e=>setProgressDrafts(current=>({...current,[row.id]:e.target.value}))} placeholder="Share a progress update with the student…"/><button className="secondary-button" disabled={saving==="progress-"+row.id||!progressDrafts[row.id]?.trim()}>{saving==="progress-"+row.id?<LoaderCircle className="spin" size={15}/>:null}Publish update</button></form></div>
      <div className="admin-note-area"><h4>Internal admin notes</h4>{notes.filter(n=>n.complaint_id===row.id).map(n=><div className="admin-saved-note" key={n.id}><p>{n.note}</p><small>{new Date(n.created_at).toLocaleString()}</small></div>)}<form onSubmit={e=>addNote(e,row)}><textarea rows={2} maxLength={2000} value={draftNotes[row.id]??""} onChange={e=>setDraftNotes(current=>({...current,[row.id]:e.target.value}))} placeholder="Record an internal update. Students will not see this note."/><button className="secondary-button" disabled={saving==="note-"+row.id||!draftNotes[row.id]?.trim()}>{saving==="note-"+row.id?<LoaderCircle className="spin" size={15}/>:null}Save note</button></form></div>
     </article>)}
     {filtered.length===0&&<div className="empty-state">No reports match these filters.</div>}
    </>}
    {section==="students"&&<section className="admin-panel"><div className="admin-panel-heading"><h3>Registered students</h3><span>{students.length} accounts</span></div><label className="admin-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search students by name, email or matric number"/></label><div className="admin-student-list">{students.filter(s=>[s.full_name,s.email,s.matric_number??""].some(v=>v.toLowerCase().includes(search.toLowerCase()))).map(s=><article key={s.id}><span className="student-initials">{s.full_name.slice(0,2).toUpperCase()}</span><div><b>{s.full_name}</b><small>{s.email} · {s.matric_number||"No matric number"}</small></div><span>{rows.filter(r=>r.user_id===s.id).length} reports</span></article>)}</div></section>}
    {section==="announcements"&&<><section className="admin-panel"><div className="admin-panel-heading"><h3>Publish campus update</h3></div><form className="admin-announcement-form" onSubmit={publishAnnouncement}><label>Title<input required maxLength={140} value={noticeTitle} onChange={e=>setNoticeTitle(e.target.value)} placeholder="e.g. Water supply maintenance"/></label><label>Message<textarea required rows={4} maxLength={3000} value={noticeBody} onChange={e=>setNoticeBody(e.target.value)} placeholder="Write an update for students…"/></label><button className="primary-button" disabled={saving==="announcement"}>{saving==="announcement"?<LoaderCircle className="spin" size={16}/>:<Megaphone size={16}/>}Publish announcement</button></form></section><section className="admin-panel"><div className="admin-panel-heading"><h3>Published and draft announcements</h3></div>{announcements.map(item=><article className="admin-announcement-row" key={item.id}><div><b>{item.title}</b><p>{item.body}</p><small>{new Date(item.created_at).toLocaleString()}</small></div><button className="secondary-button" onClick={()=>toggleAnnouncement(item)}>{item.is_published?"Unpublish":"Publish"}</button></article>)}{announcements.length===0&&<p className="muted-note">No announcements yet.</p>}</section></>}
    {section==="activity"&&<section className="admin-panel"><div className="admin-panel-heading"><h3>Recent status activity</h3><span>Latest 100 changes</span></div>{history.map(item=>{const row=rows.find(r=>r.id===item.complaint_id);return <article className="admin-activity-row" key={item.id}><CheckCircle2 size={17}/><div><b>{row?.tracking_code??"Report"} · {labels[item.new_status]}</b>{item.note&&<p>{item.note}</p>}<small>{new Date(item.created_at).toLocaleString()}</small></div></article>})}{history.length===0&&<p className="muted-note">Status changes will appear here.</p>}</section>}
   </div>
  </section>
 </main>;
}
