"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, MessageCircle, ThumbsUp, MapPin, Activity, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Complaint, ComplaintStatus } from "@/lib/types";

type CommentRow={id:string;content:string;created_at:string;user_id:string};
type HistoryRow={id:string;old_status:ComplaintStatus|null;new_status:ComplaintStatus;note:string|null;created_at:string};
const labels:Record<ComplaintStatus,string>={submitted:"Submitted",under_review:"Under review",assigned:"Assigned",in_progress:"In progress",awaiting_confirmation:"Awaiting confirmation",resolved:"Resolved",reopened:"Reopened"};

export default function ReportDetailPage(){
 const params=useParams<{id:string}>();
 const router=useRouter();
 const [report,setReport]=useState<Complaint|null>(null);
 const [comments,setComments]=useState<CommentRow[]>([]);
 const [history,setHistory]=useState<HistoryRow[]>([]);
 const [userId,setUserId]=useState("");
 const [voted,setVoted]=useState(false);
 const [votes,setVotes]=useState(0);
 const [comment,setComment]=useState("");
 const [busy,setBusy]=useState(true);
 const [sending,setSending]=useState(false);
 const [message,setMessage]=useState("");\n const [feedback,setFeedback]=useState("");\n const [confirming,setConfirming]=useState(false);
 useEffect(()=>{let active=true;(async()=>{
  const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace("/login");return;}
  setUserId(user.id);
  const [{data:r,error},{data:c},{data:v},{data:myVote},{data:h}]=await Promise.all([
   supabase.from("complaints").select("*").eq("id",params.id).single(),
   supabase.from("complaint_comments").select("id,content,created_at,user_id").eq("complaint_id",params.id).order("created_at",{ascending:true}),
   supabase.from("complaint_votes").select("id").eq("complaint_id",params.id),
   supabase.from("complaint_votes").select("id").eq("complaint_id",params.id).eq("user_id",user.id).maybeSingle(),
   supabase.from("complaint_status_history").select("id,old_status,new_status,note,created_at").eq("complaint_id",params.id).order("created_at",{ascending:false})
  ]);
  if(!active)return;
  if(error)setMessage(error.message);else setReport(r as Complaint);
  setComments((c??[]) as CommentRow[]);setVotes(v?.length??0);setVoted(Boolean(myVote));setHistory((h??[]) as HistoryRow[]);setBusy(false);
 })();return()=>{active=false}},[params.id,router]);
 async function toggleVote(){
  const supabase=createClient();setMessage("");
  const result=voted
   ? await supabase.from("complaint_votes").delete().eq("complaint_id",params.id).eq("user_id",userId)
   : await supabase.from("complaint_votes").insert({complaint_id:params.id,user_id:userId});
  if(result.error){setMessage(result.error.message);return;}
  setVoted(!voted);setVotes(value=>Math.max(0,value+(voted?-1:1)));
 }
 async function confirmResolution(confirm:boolean){\n  setConfirming(true);setMessage("");\n  const {error}=await createClient().rpc("student_confirm_resolution",{p_complaint_id:params.id,p_confirm:confirm,p_feedback:feedback.trim()||null});\n  if(error)setMessage(error.message);else{setReport(current=>current?{...current,status:confirm?"resolved":"reopened"}:current);setMessage(confirm?"Thanks for confirming this issue is fixed.":"This report has been reopened for further attention.");setFeedback("");}\n  setConfirming(false);\n }\n async function addComment(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!comment.trim())return;setSending(true);setMessage("");
  const supabase=createClient();
  const {data,error}=await supabase.from("complaint_comments").insert({complaint_id:params.id,user_id:userId,content:comment.trim()}).select("id,content,created_at,user_id").single();
  if(error)setMessage(error.message);else{setComments(current=>[...current,data as CommentRow]);setComment("");}
  setSending(false);
 }
 if(busy)return <main className="auth-shell"><div className="empty-state"><LoaderCircle className="spin" size={20}/> Loading report…</div></main>;
 if(!report)return <main className="auth-shell"><div className="empty-state">This report could not be found. <Link href="/dashboard">Return to dashboard</Link></div></main>;
 return <main className="auth-shell report-shell"><div className="report-card detail-card">
  <Link href="/dashboard" className="auth-back"><ArrowLeft size={17}/> Back to reports</Link>
  <div className="card-meta detail-meta"><span className="category-label">{report.category} · {report.tracking_code}</span><span className={`status-pill ${report.status}`}><Activity size={12}/>{labels[report.status]}</span></div>
  <h1>{report.title}</h1><p className="detail-description">{report.description}</p>
  <div className="card-footer"><span className="engagement"><span><MapPin size={14}/>{report.location}</span></span><span>{new Date(report.created_at).toLocaleDateString()}</span></div>
  {report.image_url&&<img className="report-photo" src={report.image_url} alt="Photo attached to this campus report"/>}
  <button className={`vote-button ${voted?"voted":""}`} onClick={toggleVote}><ThumbsUp size={17}/>{voted?"Supported":"Support this report"} · {votes}</button>
  {report.status==="awaiting_confirmation"&&report.user_id===userId&&<section className="resolution-confirmation"><h2>Has this issue been fixed?</h2><p>The admin has marked this report as awaiting your confirmation. Please let us know whether the problem is resolved.</p><textarea rows={2} maxLength={1000} value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Optional feedback about the repair…"/><div><button disabled={confirming} onClick={()=>confirmResolution(true)}>Yes, it is fixed</button><button disabled={confirming} onClick={()=>confirmResolution(false)}>No, reopen report</button></div></section>}\n  <div className="section-heading"><h2>Progress updates</h2></div>
  {history.length===0?<p className="muted-note">No status updates yet. Check back as the report is reviewed.</p>:<div className="timeline">{history.map(item=><div className="timeline-item" key={item.id}><strong>{labels[item.new_status]}</strong><span>{new Date(item.created_at).toLocaleString()}</span>{item.note&&<p>{item.note}</p>}</div>)}</div>}
  {report.status==="resolved"&&report.user_id===userId&&<p className="muted-note">This report is marked resolved. If the issue returns, contact an administrator so it can be reopened.</p>}\n  <div className="section-heading"><h2>Community discussion</h2><span><MessageCircle size={13}/> {comments.length}</span></div>
  <div className="comment-list">{comments.map(item=><article className="comment-item" key={item.id}><div className="comment-avatar">{item.user_id===userId?"You":"ST"}</div><div><p>{item.content}</p><span>{new Date(item.created_at).toLocaleString()}</span></div></article>)}</div>
  <form className="comment-form" onSubmit={addComment}><textarea rows={3} maxLength={1000} value={comment} onChange={e=>setComment(e.target.value)} placeholder="Add useful information or an update…"/><button className="primary-button" disabled={sending||!comment.trim()}>{sending?<LoaderCircle className="spin" size={16}/>:<Send size={16}/>} Comment</button></form>
  {message&&<p className="form-notice" role="status">{message}</p>}
 </div></main>;
}