"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, CheckCheck, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Notice={id:string;message:string;is_read:boolean;created_at:string;complaint_id:string|null};

export default function NotificationsPage(){
 const router=useRouter();
 const [items,setItems]=useState<Notice[]>([]);
 const [busy,setBusy]=useState(true);
 const [message,setMessage]=useState("");
 const [userId,setUserId]=useState("");
 useEffect(()=>{let active=true;(async()=>{
  const supabase=createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){router.replace("/login");return;}
  setUserId(user.id);
  const {data,error}=await supabase.from("notifications").select("id,message,is_read,created_at,complaint_id").eq("user_id",user.id).order("created_at",{ascending:false}).limit(50);
  if(!active)return;
  if(error)setMessage(error.message);else setItems((data??[]) as Notice[]);
  setBusy(false);
 })();return()=>{active=false}},[router]);
 async function markAll(){
  const supabase=createClient();
  const {error}=await supabase.from("notifications").update({is_read:true}).eq("user_id",userId).eq("is_read",false);
  if(error)setMessage(error.message);else setItems(current=>current.map(item=>({...item,is_read:true})));
 }
 return <main className="auth-shell report-shell"><section className="report-card">
  <Link href="/dashboard" className="auth-back"><ArrowLeft size={17}/> Back to dashboard</Link>
  <div className="notification-heading"><div><span className="eyebrow">Stay in the loop</span><h1>Notifications</h1></div><button className="text-action" onClick={markAll}><CheckCheck size={15}/> Mark all read</button></div>
  {busy?<div className="empty-state"><LoaderCircle className="spin" size={19}/> Loading notifications…</div>:items.length===0?<div className="empty-state"><Bell size={22}/><p>You’re all caught up. Updates about your reports will appear here.</p></div>:<div className="notification-list">{items.map(item=><Link className={`notification-item ${item.is_read?"read":""}`} href={item.complaint_id?`/report/${item.complaint_id}`:"/dashboard"} key={item.id}><span className="notification-dot"/><span><strong>{item.message}</strong><small>{new Date(item.created_at).toLocaleString()}</small></span></Link>)}</div>}
  {message&&<p className="form-notice">{message}</p>}
 </section></main>;
}