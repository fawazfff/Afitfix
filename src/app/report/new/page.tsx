"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, LoaderCircle, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const categories = ["Electricity","Water & Plumbing","Classroom","Hostel","Laboratory","Cleanliness","Internet","Other"];

export default function NewReportPage() {
  const router=useRouter();
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [category,setCategory]=useState("Electricity");
  const [location,setLocation]=useState("");
  const [photo,setPhoto]=useState<File|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const supabase=createClient();
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){router.push("/login");return;}
      let image_url:string|null=null;
      if(photo){
        const ext=photo.name.split(".").pop()?.toLowerCase()||"jpg";
        const path=`${user.id}/${crypto.randomUUID()}.${ext}`;
        const {error:uploadError}=await supabase.storage.from("complaint-images").upload(path,photo,{upsert:false,contentType:photo.type});
        if(uploadError) throw uploadError;
        const {data}=supabase.storage.from("complaint-images").getPublicUrl(path);
        image_url=data.publicUrl;
      }
      const {data,error}=await supabase.from("complaints").insert({
        user_id:user.id,title:title.trim(),description:description.trim(),category,location:location.trim(),image_url
      }).select("tracking_code").single();
      if(error) throw error;
      setMessage(`Report submitted. Your tracking code is ${data.tracking_code}.`);
      setTimeout(()=>router.push("/dashboard"),1200);
    } catch(error) {
      setMessage(error instanceof Error?error.message:"Could not submit your report. Please try again.");
    } finally {setBusy(false);}
  }

  return <main className="auth-shell report-shell">
    <Link href="/dashboard" className="auth-back"><ArrowLeft size={17}/> Back to dashboard</Link>
    <section className="report-card">
      <span className="eyebrow">Help improve your campus</span><h1>Report an issue</h1><p className="auth-copy">Give enough detail so the right people can understand and address the problem.</p>
      <form className="auth-form" onSubmit={submit}>
        <label>Issue title<input required minLength={5} maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="What needs fixing?"/></label>
        <label>Category<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(item=><option key={item}>{item}</option>)}</select></label>
        <label>Campus location<span className="field-icon"><MapPin size={15}/></span><input required minLength={2} maxLength={160} value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Library, Block C, Lecture Hall"/></label>
        <label>Description<textarea required minLength={10} maxLength={3000} rows={5} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Explain what happened, where and when..."/></label>
        <label className="upload-label"><ImagePlus size={18}/> Add a photo <span className="optional">Optional · JPG, PNG or WebP · max 5 MB</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setPhoto(e.target.files?.[0]??null)}/></label>
        {photo && <p className="file-name">{photo.name}</p>}
        {message && <p className="form-notice" role="status">{message}</p>}
        <button className="primary-button auth-submit" disabled={busy}>{busy&&<LoaderCircle className="spin" size={17}/>}Submit report</button>
      </form>
    </section>
  </main>;
}