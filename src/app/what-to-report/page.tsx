import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck, Wrench, Zap, MapPin, Accessibility, Camera } from "lucide-react";
const categories=[
 {icon:Wrench,title:"Facilities and repairs",body:"Broken doors, damaged desks, leaking taps, faulty fittings and maintenance issues."},
 {icon:Zap,title:"Power and utilities",body:"Electricity, lighting, water supply and other essential campus services."},
 {icon:MapPin,title:"Campus environment",body:"Roads, walkways, drainage, waste disposal and shared outdoor spaces."},
 {icon:Accessibility,title:"Safety and accessibility",body:"Hazards, blocked routes, unsafe conditions and access problems that need attention."}
];
export default function WhatToReportPage(){
 return <main className="info-page">
  <header className="info-nav"><Link className="brand" href="/"><span className="brand-mark"><ShieldCheck size={19}/></span>Afitfix</Link><Link className="info-nav-action" href="/login?mode=signup">Report an issue <ArrowRight size={15}/></Link></header>
  <section className="info-hero"><Link href="/" className="info-back"><ArrowLeft size={15}/> Back home</Link><span className="section-eyebrow">CAMPUS REPORTS / CATEGORIES</span><h1>What needs attention<br/><em>around your campus?</em></h1><p>Use Afitfix for clear, factual reports about campus conditions that affect students and the wider community.</p></section>
  <section className="report-category-grid">{categories.map(({icon:Icon,title,body},i)=><article className="report-category" key={title}><span>0{i+1}</span><Icon size={25}/><h2>{title}</h2><p>{body}</p></article>)}</section>
  <section className="report-guidance"><div><Camera size={24}/><h2>Help people understand the issue</h2><p>Include the exact location, explain what you observed and add a clear photo when it is useful. Avoid sharing private information or making claims you cannot verify.</p></div><Link className="button button-orange" href="/login?mode=signup">Create a report <ArrowRight size={16}/></Link></section>
  <footer className="info-footer"><Link href="/">Afitfix</Link><span>Built for the AFIT community · Kaduna</span><Link href="/faq">FAQs</Link></footer>
 </main>;
}
