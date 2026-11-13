import Link from "next/link";
import { Activity, ArrowRight, Bell, BookOpen, CheckCircle2, ChevronRight, Droplets, Lightbulb, MapPin, MessageCircle, Plus, ShieldCheck, ThumbsUp, Wrench, Zap } from "lucide-react";

type DemoComplaint = {
  id: string;
  category: string;
  title: string;
  description: string;
  location: string;
  status: "under_review" | "in_progress" | "resolved" | "submitted";
  votes: number;
  comments: number;
  time: string;
};

const demoComplaints: DemoComplaint[] = [
  { id: "AF-1048", category: "Electricity", title: "Lights are not working in Lecture Hall B", description: "The lights at the back of the hall have been off since Monday. It gets difficult to take notes during evening lectures.", location: "Faculty of Computing · Hall B", status: "in_progress", votes: 24, comments: 8, time: "2 hours ago" },
  { id: "AF-1047", category: "Water & Plumbing", title: "No running water in Block C bathrooms", description: "Several taps have stopped working. Students in the block are all affected.", location: "Hostel · Block C", status: "under_review", votes: 18, comments: 5, time: "5 hours ago" },
  { id: "AF-1046", category: "Internet", title: "Campus Wi-Fi keeps disconnecting", description: "The connection drops repeatedly around the library reading area, especially in the afternoon.", location: "Main Library", status: "submitted", votes: 11, comments: 3, time: "Yesterday" },
];

const statusLabel: Record<DemoComplaint["status"], string> = {
  submitted: "Submitted", under_review: "Under review", in_progress: "In progress", resolved: "Resolved",
};

export default function Home() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Afitfix home"><span className="brand-mark"><Wrench size={19} strokeWidth={2.6} /></span>Afitfix</a>
        <div className="topbar-actions"><Link className="primary-button" href="/login">Sign in <ArrowRight size={15}/></Link></div>
      </header>

      <div className="page-wrap" id="home">
        <section className="welcome">
          <span className="eyebrow">Your campus, together</span>
          <h1>Good morning, student 👋</h1>
          <p>See what needs attention and help make campus better.</p>
        </section>

        <section className="hero-card" aria-labelledby="hero-title">
          <h2 id="hero-title">Notice a problem on campus?</h2>
          <p>Let the community know. Report an issue and follow it until it is fixed.</p>
          <Link className="primary-button" href="/report/new">Report an issue <ArrowRight size={16} /></Link>
        </section>

        <section className="stats-grid" aria-label="Campus report summary">
          <div className="stat-card"><strong>38</strong><span>Reports this week</span></div>
          <div className="stat-card"><strong>12</strong><span>Being worked on</span></div>
          <div className="stat-card"><strong>26</strong><span>Resolved</span></div>
        </section>

        <section id="reports">
          <div className="section-heading"><h2>Community reports</h2><span>Recent activity</span></div>
          <div className="feed-list">
            {demoComplaints.map((complaint) => (
              <article className="complaint-card" key={complaint.id}>
                <div className="card-meta"><span className="category-label">{complaint.category} · {complaint.id}</span><span className={`status-pill ${complaint.status}`}><Activity size={12} />{statusLabel[complaint.status]}</span></div>
                <h3>{complaint.title}</h3>
                <p>{complaint.description}</p>
                <div className="card-footer"><span className="engagement"><span><MapPin size={13} />{complaint.location}</span><span><ThumbsUp size={13} />{complaint.votes}</span><span><MessageCircle size={13} />{complaint.comments}</span></span><span>{complaint.time}</span></div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-heading"><h2>How Afitfix works</h2></section>
        <div className="feed-list">
          <article className="complaint-card"><div className="card-meta"><span className="category-label">01 · REPORT</span><Lightbulb size={18} color="#3157d5" /></div><h3>Tell us what needs fixing</h3><p>Share the issue, where it happened and a photo if you have one.</p></article>
          <article className="complaint-card"><div className="card-meta"><span className="category-label">02 · SUPPORT</span><BookOpen size={18} color="#3157d5" /></div><h3>Let others add their voice</h3><p>Students can support a report and add useful details in the comments.</p></article>
          <article className="complaint-card"><div className="card-meta"><span className="category-label">03 · TRACK</span><CheckCircle2 size={18} color="#13865b" /></div><h3>Follow progress to the finish</h3><p>Get status updates and confirm when the issue has actually been resolved.</p></article>
        </div>
      </div>

      <nav className="bottom-nav" aria-label="Main navigation">
        <Link className="nav-item active" href="/"><Activity size={19} />Home</Link>
        <Link className="nav-item" href="/dashboard"><BookOpen size={19} />Explore</Link>
        <Link className="nav-item" href="/report/new"><Plus size={20} />Report</Link>
        <Link className="nav-item" href="/dashboard"><ShieldCheck size={19} />My reports</Link>
      </nav>
      <Link className="fab" href="/report/new" aria-label="Create a report"><Plus size={23} /></Link>
    </main>
  );
}
