import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, MessageCircle, ShieldCheck, MapPin } from "lucide-react";

const steps = [
 {n:"01",icon:ClipboardList,title:"Create a clear report",body:"Choose the category, write a useful title and explain what you noticed. Add a photo if it helps show the problem."},
 {n:"02",icon:MapPin,title:"Add the location",body:"Tell other students and the administrators where the issue is on campus. A specific location makes a report easier to understand."},
 {n:"03",icon:MessageCircle,title:"Add context and support",body:"Students can comment with helpful details. Supporting an existing report can help the community understand an issue without creating duplicates."},
 {n:"04",icon:CheckCircle2,title:"Follow the progress",body:"Check the report's status and update history. Administrators can add progress notes as the issue is reviewed and handled."}
];
export default function HowItWorksPage(){
 return <main className="info-page">
  <header className="info-nav"><Link className="brand" href="/"><span className="brand-mark"><ShieldCheck size={19}/></span>Afitfix</Link><Link className="info-nav-action" href="/login?mode=signup">Create account <ArrowRight size={15}/></Link></header>
  <section className="info-hero"><Link href="/" className="info-back"><ArrowLeft size={15}/> Back home</Link><span className="section-eyebrow">THE PROCESS / HOW IT WORKS</span><h1>From a campus concern<br/><em>to a report you can follow.</em></h1><p>Afitfix gives students one clear process for sharing campus issues and checking what happens next.</p></section>
  <section className="how-steps">{steps.map(({n,icon:Icon,title,body})=><article className="how-step" key={n}><span>{n}</span><Icon size={24}/><div><h2>{title}</h2><p>{body}</p></div></article>)}</section>
  <section className="info-bottom"><h2>Ready to report an issue?</h2><p>Create an account and let the campus community know what needs attention.</p><Link className="button button-orange" href="/login?mode=signup">Create your account <ArrowRight size={16}/></Link></section>
  <footer className="info-footer"><Link href="/">Afitfix</Link><span>Built for the AFIT community · Kaduna</span><Link href="/faq">FAQs</Link></footer>
 </main>;
}
