import Link from "next/link";
import { ArrowRight, CheckCircle2, Lightbulb, MessageCircle, ShieldCheck, Wrench } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Lightbulb,
    title: "Report the issue",
    description: "Describe what needs attention and where it happened. Add a photo if it helps explain the problem.",
  },
  {
    number: "02",
    icon: MessageCircle,
    title: "Bring attention to it",
    description: "Other students can support a report and add useful details so the right people understand the issue.",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Follow the progress",
    description: "See when a report is reviewed, assigned, worked on or marked as resolved.",
  },
];

export default function Home() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Afitfix home">
          <span className="brand-mark"><Wrench size={19} strokeWidth={2.6} /></span>
          Afitfix
        </Link>
        <div className="topbar-actions">
          <Link className="icon-button" href="/login">Sign in</Link>
          <Link className="primary-button" href="/register">Get started <ArrowRight size={15} /></Link>
        </div>
      </header>

      <div className="page-wrap" id="home">
        <section className="welcome">
          <span className="eyebrow">Your campus, together</span>
          <h1>Make campus issues easier to solve.</h1>
          <p>Afitfix gives students one place to report problems, support each other and follow updates from campus administrators.</p>
        </section>

        <section className="hero-card" aria-labelledby="hero-title">
          <h2 id="hero-title">See something that needs fixing?</h2>
          <p>Send a report with the location and details. You can follow its progress from your account.</p>
          <Link className="primary-button" href="/register">Report an issue <ArrowRight size={16} /></Link>
        </section>

        <section aria-labelledby="how-it-works">
          <div className="section-heading">
            <h2 id="how-it-works">How Afitfix works</h2>
            <span>Three simple steps</span>
          </div>
          <div className="feed-list">
            {steps.map(({ number, icon: Icon, title, description }) => (
              <article className="complaint-card" key={number}>
                <div className="card-meta">
                  <span className="category-label">{number} · STEP</span>
                  <Icon size={18} color="#3157d5" aria-hidden="true" />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="complaint-card" aria-label="Afitfix account privacy">
          <div className="card-meta">
            <span className="category-label">BUILT FOR CAMPUS COMMUNITIES</span>
            <ShieldCheck size={18} color="#13865b" aria-hidden="true" />
          </div>
          <h3>Reports and updates in one place</h3>
          <p>Sign in to view the campus report feed, support reports and keep track of the issues you submit. Administrators have a separate workspace for reviewing and updating reports.</p>
          <Link className="text-link" href="/login">Sign in to view campus reports <ArrowRight size={15} /></Link>
        </section>
      </div>

      <nav className="bottom-nav" aria-label="Main navigation">
        <Link className="nav-item active" href="/"><Wrench size={19} />Home</Link>
        <Link className="nav-item" href="/login"><MessageCircle size={19} />Reports</Link>
        <Link className="nav-item" href="/register"><CheckCircle2 size={19} />Get started</Link>
      </nav>
    </main>
  );
}
