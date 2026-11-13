"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ArrowLeft, LoaderCircle, ShieldCheck, Wrench } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Complaint, ComplaintStatus } from "@/lib/types";

const statuses: ComplaintStatus[]=["submitted","under_review","assigned","in_progress","awaiting_confirmation","resolved","reopened"];
const labels:Record<ComplaintStatus,string>={submitted:"Submitted",under_review:"Under review",assigned:"Assigned",in_progress:"In progress",awaiting_confirmation:"Awaiting confirmation",resolved:"Resolved",reopened:"Reopened"};

export default function AdminPage(){
 const router=useRouter();
 const [rows,setRows]=useState<Complaint[]>([]);
 const [busy,setBusy]=useState(true);
 const [saving,setSaving]=useState<string|null>(null);
 const [notice,setNotice]=useState("");
 const [allowed,setAllowed]=useState(false);
 const [notes,setNotes]=useState<Record<string,string>>({});
 useEffect(()=>{let live=true;(async()=>{
  const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace("/login");return;}
  const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).single();
  if(profile?.role!=="admin"){router.replace("/dashboard");return;}
  const {data,error}=await supabase.from("complaints").select("*").order("created_at",{ascending:false}).limit(100);
  if(!live)return;
  if(error)setNotice(error.message);else setRows((data??[]) as Complaint[]);
  setAllowed(true);setBusy(false);
 })();return()=>{live=false}},[router]);
 async function changeStatus(row:Complaint,next:ComplaintStatus){
  setSaving(row.id);setNotice("");
  try{
   const supabase=createClient();
   const {data:{user}}=await supabase.auth.getUser();
   if(!user)throw new Error("Please sign in again.");
   const note=notes[row.id]?.trim()||null;
   const {error}=await supabase.from("complaints").update({status:next,...(next==="resolved"&&note?{resolution_note:note}:{})}).eq("id",row.id);
   if(error)throw error;
   const history=await supabase.from("complaint_status_history").insert({complaint_id:row.id,changed_by:user.id,old_status:row.status,new_status:next,note});
   if(history.error)throw history.error;
   setRows(current=>current.map(item=>item.id===row.id?{...item,status:next,updated_at:new Date().toISOString()}:item));
   setNotice(`${row.tracking_code} updated to ${labels[next]}.`);
  }catch(error){setNotice(error instanceof Error?error.message:"Could not update this report.");}
  finally{setSaving(null);}
 }
 if(busy)return <main className="auth-shell"><div className="empty-state"><LoaderCircle className="spin" size={20}/> Loading admin workspace…</div></main>;
 if(!allowed)return <main className="auth-shell"><div className="empty-state">Checking admin access…</div></main>;
 return <main className="app-shell">
  <header className="topbar"><Link className="brand" href="/dashboard"><span className="brand-mark"><Wrench size={19}/></span>Afitfix</Link><span className="status-pill"><ShieldCheck size={13}/> Admin</span></header>
  <div className="page-wrap"><section className="welcome"><span className="eyebrow">Administration</span><h1>Reports workspace</h1><p>Review student reports and keep progress up to date.</p></section>
   <div className="stats-grid"><div className="stat-card"><strong>{rows.length}</strong><span>Total reports</span></div><div className="stat-card"><strong>{rows.filter(r=>r.status!=="resolved").length}</strong><span>Open reports</span></div><div className="stat-card"><strong>{rows.filter(r=>r.status==="resolved").length}</strong><span>Resolved</span></div></div>
   {notice&&<p className="form-notice" role="status" style={{marginTop:16}}>{notice}</p>}
   <div className="section-heading"><h2>All reports</h2><span>Latest first</span></div>
   {rows.length===0?<div className="empty-state">There are no reports to review yet.</div>:<div className="feed-list">{rows.map(row=><article className="complaint-card" key={row.id}>
    <div className="card-meta"><span className="category-label">{row.category} · {row.tracking_code}</span><span className={`status-pill ${row.status}`}><Activity size={12}/>{labels[row.status]}</span></div>
    <h3>{row.title}</h3><p>{row.description}</p><div className="card-footer"><span>{row.location}</span><span>{new Date(row.created_at).toLocaleDateString()}</span></div>
    <label className="admin-note-label">Progress note (optional)<textarea rows={2} value={notes[row.id]??""} onChange={e=>setNotes(current=>({...current,[row.id]:e.target.value}))} placeholder="Add an update for the record…"/></label>
    <label className="admin-note-label">Update status<select value={row.status} disabled={saving===row.id} onChange={e=>changeStatus(row,e.target.value as ComplaintStatus)}>{statuses.map(status=><option key={status} value={status}>{labels[status]}</option>)}</select></label>
    {saving===row.id&&<span className="saving-label"><LoaderCircle className="spin" size={14}/> Saving update…</span>}
   </article>)}</div>}
   <p className="admin-link"><Link href="/dashboard"><ArrowLeft size={15}/> Back to student dashboard</Link></p>
  </div>
 </main>;
}