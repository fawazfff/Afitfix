import Link from "next/link";
import {
  ArrowDown, ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronDown,
  ClipboardList, GraduationCap, MapPin, MessageCircle, ShieldCheck, Wrench, Zap,
} from "lucide-react";

const issueTypes = [
  { icon: Wrench, title: "Facilities & repairs", detail: "Broken doors, damaged desks, faulty fittings and other campus facilities." },
  { icon: Zap, title: "Power & utilities", detail: "Lighting, electricity, water supply and other essential services." },
  { icon: MapPin, title: "Campus environment", detail: "Roads, walkways, drainage, waste and shared spaces." },
  { icon: ShieldCheck, title: "Safety & accessibility", detail: "Hazards and access issues that need attention around campus." },
];

const steps = [
  { number: "01", icon: ClipboardList, title: "Tell us what happened", detail: "Choose a category, describe the issue and add the campus location. A photo can help too." },
  { number: "02", icon: MessageCircle, title: "Keep the conversation useful", detail: "Students can support reports and add context so important issues are easier to understand." },
  { number: "03", icon: CheckCircle2, title: "Follow every update", detail: "Check the report timeline as its status changes from submitted to in progress and resolved." },
];

const faqs = [
  { question: "Who can submit a report?", answer: "AFIT students with an Afitfix account can submit campus issue reports and follow the reports they create." },
  { question: "What should I include in a report?", answer: "Add a clear title, choose the closest category, describe what is wrong and include the campus location. You can attach a photo when it helps explain the issue." },
  { question: "Can I see what happens after I report something?", answer: "Yes. Sign in to view the report, its current status, comments and status history." },
  { question: "Does submitting a report mean it has been fixed?", answer: "No. A report records an issue for review. Its status is updated as administrators review and work on it." },
];

function AfitfixMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`afitfix-mark ${small ? "afitfix-mark-small" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none">
        <path d="M24 3.5 42 10v13.1c0 10.7-7.3 17.6-18 21.4C13.3 40.7 6 33.8 6 23.1V10L24 3.5Z" fill="currentColor" />
        <path d="m16.2 24.4 5.2 5.1 10.7-11.1" stroke="#F8F3E8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M32.8 9.4 37 10.9v4.3" stroke="#F07832" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    </span>
  );
}

function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link href="/" className={`site-brand ${footer ? "site-brand-footer" : ""}`} aria-label="Afitfix home">
      <AfitfixMark />
      <span className="site-brand-copy"><strong>Afitfix</strong><small>AFIT · KADUNA</small></span>
    </Link>
  );
}

export default function Home() {
  return (
    <main className="marketing-shell">
      <header className="marketing-nav">
        <Brand />
        <nav className="desktop-links" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#what-to-report">What to report</a>
          <Link href="/faq">FAQs</Link>
        </nav>
        <div className="nav-cta">
          <Link href="/login" className="nav-signin">Sign in</Link>
          <Link href="/register" className="button button-dark button-nav">Get started <ArrowUpRight size={16}/></Link>
        </div>
      </header>

      <section className="marketing-hero">
        <div className="hero-copy">
          <div className="hero-kicker"><span className="kicker-dot"/> A student-built campus reporting platform</div>
          <h1>A better campus starts with <em>speaking up.</em></h1>
          <p className="hero-description">See something around AFIT that needs attention? Report it, bring it to the community’s attention and follow what happens next.</p>
          <div className="hero-actions">
            <Link href="/register" className="button button-orange">Report an issue <ArrowRight size={17}/></Link>
            <Link href="/how-it-works" className="button button-outline">See how it works <ArrowDown size={16}/></Link>
          </div>
          <div className="hero-note"><ShieldCheck size={16}/> Clear reports. Visible progress. One campus community.</div>
        </div>
        <div className="hero-art" aria-label="Illustration of a campus issue being reported and tracked">
          <div className="art-sun"/>
          <div className="art-orbit art-orbit-one"/>
          <div className="art-orbit art-orbit-two"/>
          <div className="campus-building">
            <div className="building-roof"/>
            <div className="building-sign">AFIT <span>·</span> CAMPUS</div>
            <div className="building-columns"><i/><i/><i/><i/><i/></div>
            <div className="building-base"/>
          </div>
          <div className="art-path"/>
          <div className="report-float report-float-top"><span className="float-icon"><ClipboardList size={17}/></span><span><b>Issue submitted</b><small>Location added</small></span><Check size={17} className="float-check"/></div>
          <div className="report-float report-float-bottom"><span className="float-icon float-icon-green"><CheckCircle2 size={17}/></span><span><b>Progress you can follow</b><small>Updates in one place</small></span></div>
          <span className="art-spark art-spark-one">✳</span><span className="art-spark art-spark-two">✳</span>
          <div className="art-caption">Small reports can lead to meaningful improvements.</div>
        </div>
        <Link href="/how-it-works" className="scroll-cue"><span/> Explore Afitfix</Link>
      </section>

      <section className="intro-strip">
        <span className="intro-label">MADE FOR THE AFIT COMMUNITY</span>
        <p>A simple place to raise campus concerns and keep track of the response.</p>
        <span className="intro-stamp"><GraduationCap size={18}/> Air Force Institute of Technology</span>
      </section>

      <section className="content-section issue-section" id="what-to-report">
        <div className="section-topline"><span>01 / WHAT CAN BE REPORTED</span><span>Campus life, made easier</span></div>
        <div className="section-heading-large">
          <h2>Notice something<br/><em>that needs fixing?</em></h2>
          <p>From everyday maintenance to shared campus spaces, Afitfix gives students a clear way to document issues that deserve attention.</p>
        </div>
        <div className="issue-grid">
          {issueTypes.map(({icon: Icon, title, detail}, index) => (
            <article className="issue-tile" key={title}>
              <div className="tile-top"><span>0{index + 1}</span><Icon size={21}/></div>
              <h3>{title}</h3><p>{detail}</p><span className="tile-arrow"><ArrowUpRight size={17}/></span>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="how-inner">
          <div className="section-topline section-topline-light"><span>02 / HOW IT WORKS</span><span>Three clear steps</span></div>
          <div className="how-heading">
            <h2>From “someone should fix this” to <em>a report that can be followed.</em></h2>
            <p>No complicated process. Just useful information, shared in one place.</p>
          </div>
          <div className="steps-grid">
            {steps.map(({number, icon: Icon, title, detail}) => (
              <article className="step-card" key={number}>
                <div className="step-number">{number}<Icon size={21}/></div>
                <h3>{title}</h3><p>{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="progress-section">
        <div className="progress-visual">
          <div className="progress-paper">
            <div className="paper-top"><span>REPORT TIMELINE</span><span className="paper-live"><i/> EXAMPLE</span></div>
            <h3>Damaged walkway light</h3>
            <p className="paper-location"><MapPin size={13}/> Campus location</p>
            <div className="timeline-demo">
              <div className="timeline-line"/>
              <div className="timeline-row"><span className="timeline-dot done"/><span><b>Report submitted</b><small>Issue details received</small></span><Check size={15}/></div>
              <div className="timeline-row"><span className="timeline-dot done"/><span><b>Under review</b><small>Report reviewed by admin</small></span><Check size={15}/></div>
              <div className="timeline-row"><span className="timeline-dot current"/><span><b>In progress</b><small>Latest status is visible</small></span><span className="progress-tag">ACTIVE</span></div>
            </div>
            <div className="paper-foot"><ShieldCheck size={14}/> Example timeline, not a live campus report</div>
          </div>
          <span className="progress-scribble">Keep an eye<br/>on the progress.</span>
        </div>
        <div className="progress-copy">
          <span className="section-eyebrow">03 / FOLLOW THE UPDATE</span>
          <h2>Know what’s happening after you hit <em>submit.</em></h2>
          <p>Every report has a place for its status, comments and update history. Students can check progress instead of wondering whether anyone has seen the issue.</p>
          <ul className="check-list">
            <li><CheckCircle2 size={17}/> See the current report status</li>
            <li><CheckCircle2 size={17}/> Read updates and add useful context</li>
            <li><CheckCircle2 size={17}/> Keep your submitted reports together</li>
          </ul>
          <Link href="/login" className="text-cta">View your reports <ArrowRight size={16}/></Link>
        </div>
      </section>

      <section className="community-band">
        <div className="community-mark"><AfitfixMark/></div>
        <div><span>BETTER INFORMATION. BETTER FOLLOW-THROUGH.</span><h2>One campus. A clearer way to speak up.</h2></div>
        <Link href="/register" className="button button-cream">Create your account <ArrowUpRight size={16}/></Link>
      </section>

      <section className="faq-section" id="faq">
        <div className="section-topline"><span>04 / GOOD TO KNOW</span><span>Questions, answered</span></div>
        <div className="faq-layout">
          <div><span className="section-eyebrow">AFITFIX, EXPLAINED</span><h2>A few things<br/><em>you might wonder.</em></h2><p>Here’s what to know before you submit your first report.</p></div>
          <div className="faq-list">
            {faqs.map(({question, answer}) => (
              <details className="faq-item" key={question}><summary>{question}<ChevronDown size={18}/></summary><p>{answer}</p></details>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <span className="section-eyebrow">YOUR CAMPUS. YOUR VOICE.</span>
        <h2>See an issue?<br/><em>Let’s get it on the record.</em></h2>
        <p>Join the AFIT student community on Afitfix and help make campus concerns easier to follow.</p>
        <Link href="/register" className="button button-orange">Get started with Afitfix <ArrowRight size={17}/></Link>
      </section>

      <footer className="marketing-footer">
        <div className="footer-main"><div><Brand footer/><p>A student-built platform for reporting and following campus issues at the Air Force Institute of Technology, Kaduna.</p></div><div className="footer-links"><a href="#how-it-works">How it works</a><a href="#what-to-report">What to report</a><Link href="/faq">FAQs</Link><Link href="/login">Sign in</Link><Link href="/register">Create account</Link></div></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Afitfix · Student project</span><span>Built for the AFIT community <GraduationCap size={14}/></span></div>
      </footer>
    </main>
  );
}
