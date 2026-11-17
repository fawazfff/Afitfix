import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ChevronDown, ShieldCheck } from "lucide-react";

const questions = [
  ["Who can submit a report?","AFIT students with an Afitfix account can submit campus issue reports and follow the reports they create."],
  ["What should I include in a report?","Add a clear title, choose the closest category, describe what is wrong and include the campus location. You can attach a photo when it helps explain the issue."],
  ["Can I see what happens after I report something?","Yes. Sign in to view the report, its current status, comments and status history."],
  ["Does submitting a report mean it has been fixed?","No. A report records an issue for review. Its status is updated as administrators review and work on it."],
  ["Can I report an issue someone else has already mentioned?","Check the campus feed first. If a similar report exists, you can add a comment to provide more detail rather than creating a duplicate."],
  ["What happens to inappropriate reports?","Reports should be accurate, respectful and related to campus conditions. Administrators can review reports and take appropriate moderation action."],
];

export default function FAQPage() {
 return <main className="info-page">
  <header className="info-nav"><Link className="brand" href="/"><span className="brand-mark brand-mark-crest"><Image src="/afit-crest.png" alt="AFIT crest" width={34} height={34} /></span>Afitfix</Link><Link className="info-nav-action" href="/login">Sign in <ArrowRight size={15}/></Link></header>
  <section className="info-hero"><Link href="/" className="info-back"><ArrowLeft size={15}/> Back home</Link><span className="section-eyebrow">HELP CENTRE / FAQS</span><h1>Good questions.<br/><em>Clear answers.</em></h1><p>Everything you need to know about reporting and following campus issues with Afitfix.</p></section>
  <section className="info-content"><div className="info-side"><span>FREQUENTLY ASKED</span><h2>Before you<br/>get started.</h2><p>We want the reporting process to be straightforward and easy to follow.</p><Link href="/how-it-works" className="text-cta">How Afitfix works <ArrowRight size={16}/></Link></div><div className="faq-list">{questions.map(([q,a])=><details className="faq-item" key={q}><summary>{q}<ChevronDown size={18}/></summary><p>{a}</p></details>)}</div></section>
  <section className="info-bottom"><h2>Still have a question?</h2><p>Sign in to your account and use the report comments to share context with the campus community.</p><Link className="button button-orange" href="/login">Go to Afitfix <ArrowRight size={16}/></Link></section>
  <footer className="info-footer"><Link href="/">Afitfix</Link><span>Built for the AFIT community · Kaduna</span><Link href="/what-to-report">What to report</Link></footer>
 </main>;
}
