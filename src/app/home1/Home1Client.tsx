"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, BarChart3, Lightbulb, ClipboardCheck, Users, Calendar, MessageSquare, Database, Menu, X } from "lucide-react";

/* ── Design tokens ─────────────────────────────────────────── */
const B6 = "#2563EB", B7 = "#1D4ED8", B9 = "#1E3A8A", B8 = "#1E40AF";
const B50 = "#EFF6FF", B100 = "#DBEAFE", B200 = "#BFDBFE";
const S9 = "#0F172A", S6 = "#475569", S5 = "#64748B", S4 = "#94A3B8";
const S3 = "#CBD5E1", S2 = "#E2E8F0", S1 = "#F1F5F9", S0 = "#F8FAFC";
const ff = "var(--font-inter), Inter, system-ui, sans-serif";

/* ── Inline Countdown ───────────────────────────────────────── */
const TARGET = new Date("2026-05-25T00:00:00+10:00");
function Countdown() {
  const [t, setT] = useState({ d: 0, h: 0, m: 0 });
  const [ok, setOk] = useState(false);
  useEffect(() => {
    setOk(true);
    const tick = () => {
      const diff = Math.max(0, TARGET.getTime() - Date.now());
      setT({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000) });
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);
  if (!ok) return <div style={{ height: 68 }} />;
  const box = (val: number, lbl: string) => (
    <div key={lbl} style={{ textAlign: "center" }}>
      <div style={{ fontSize: "2.25rem", fontWeight: 900, color: B9, fontFamily: ff, lineHeight: 1 }}>{String(val).padStart(2,"0")}</div>
      <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: S4, fontFamily: ff, marginTop: 4 }}>{lbl}</div>
    </div>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      {box(t.d, "Days")}
      <span style={{ fontSize: "1.875rem", fontWeight: 300, color: S3, fontFamily: ff }}>:</span>
      {box(t.h, "Hours")}
      <span style={{ fontSize: "1.875rem", fontWeight: 300, color: S3, fontFamily: ff }}>:</span>
      {box(t.m, "Minutes")}
    </div>
  );
}

/* ── Shared input style ──────────────────────────────────────── */
const inp: React.CSSProperties = { fontFamily: ff, fontSize: "0.875rem", color: S9, background: S0, border: `1px solid ${S2}`, borderRadius: 12, padding: "12px 16px", width: "100%", boxSizing: "border-box", outline: "none" };

/* ── Header ─────────────────────────────────────────────────── */
function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${S1}` }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", height: 80 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{ background: B6, padding: 6, borderRadius: 8, display: "flex" }}>
            <CheckCircle size={24} color="#fff" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ fontFamily: ff, fontWeight: 800, color: B9, fontSize: "1.125rem", letterSpacing: "-0.025em" }}>National</span>
            <span style={{ fontFamily: ff, fontWeight: 700, color: B6, fontSize: "0.875rem" }}>Check-In Week</span>
          </div>
        </a>
        <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {["Home","Products","Resources","Blog"].map(l => (
            <a key={l} href="#" style={{ fontFamily: ff, fontSize: "0.875rem", fontWeight: 500, color: S6, textDecoration: "none" }}>{l}</a>
          ))}
          <a href="/login" style={{ fontFamily: ff, fontSize: "0.875rem", fontWeight: 500, color: S6, textDecoration: "none" }}>Log In</a>
          <a href="/events" style={{ fontFamily: ff, fontSize: "0.875rem", fontWeight: 600, color: "#fff", background: B6, padding: "10px 24px", borderRadius: 9999, textDecoration: "none", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}>Register Now</a>
        </nav>
        <button onClick={() => setOpen(!open)} style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 8 }} aria-label="menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ background: "#fff", borderBottom: `1px solid ${S1}`, overflow: "hidden" }}>
            <div style={{ padding: "8px 32px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {["Home","Products","Resources","Blog","Log In"].map(l => (
                <a key={l} href="#" style={{ fontFamily: ff, fontSize: "1rem", fontWeight: 500, color: S6, textDecoration: "none" }}>{l}</a>
              ))}
              <a href="/events" style={{ fontFamily: ff, textAlign: "center", fontWeight: 600, color: "#fff", background: B6, padding: "12px 24px", borderRadius: 9999, textDecoration: "none" }}>Register Now</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ── Hero ────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{ background: "#fff", padding: "64px 0 96px", overflow: "hidden" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <h1 style={{ fontFamily: ff, fontSize: "3.75rem", fontWeight: 800, color: S9, lineHeight: 1.1, marginBottom: 24 }}>
            Student Wellbeing: <br />
            <span style={{ color: B6 }}>A National Priority.</span>
          </h1>
          <p style={{ fontFamily: ff, fontSize: "1.125rem", color: S6, lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
            Join Australia&rsquo;s leading student wellbeing event, National Check-In Week,
            bridging data, experts, and schools.
          </p>
          <a href="/events" style={{ display: "inline-block", fontFamily: ff, fontWeight: 700, fontSize: "1.125rem", color: "#fff", background: B6, padding: "16px 32px", borderRadius: 9999, textDecoration: "none", marginBottom: 48, boxShadow: "0 20px 40px rgba(37,99,235,0.3)" }}>
            Register Now
          </a>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Countdown />
            <p style={{ fontFamily: ff, fontSize: "0.875rem", fontWeight: 500, color: S5, margin: 0 }}>Until National Check-In Week 2026</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} style={{ position: "relative" }}>
          <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 25px 60px rgba(0,0,0,0.2)", position: "relative", zIndex: 1 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000" alt="Students collaborating" style={{ width: "100%", height: 480, objectFit: "cover", display: "block" }} referrerPolicy="no-referrer" />
          </div>
          <div aria-hidden="true" style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, background: B100, borderRadius: "50%", filter: "blur(40px)", opacity: 0.7 }} />
          <div aria-hidden="true" style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, background: "#FCE7F3", borderRadius: "50%", filter: "blur(40px)", opacity: 0.7 }} />
        </motion.div>
      </div>
    </section>
  );
}

/* ── Impact ──────────────────────────────────────────────────── */
function Impact() {
  const stats = [
    { value: "15",     label: "Million Students",    sub: "Supporting students across Australian schools through the initiative" },
    { value: "1 in 7", label: "Australian Children", sub: "Have a diagnosable mental disorder — most go undetected" },
    { value: "38%",    label: "of Children",         sub: "Experienced bullying at school in the past 12 months" },
    { value: "24%",    label: "of Children",         sub: "Supporting children across every state and territory" },
  ];
  return (
    <section style={{ background: S0, padding: "80px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem" }}>
        <p style={{ fontFamily: ff, textAlign: "center", fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: S4, marginBottom: 64 }}>Impact</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 48, textAlign: "center" }}>
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div style={{ fontFamily: ff, fontSize: "3rem", fontWeight: 900, color: B6, lineHeight: 1, marginBottom: 16 }}>{s.value}</div>
              <div style={{ fontFamily: ff, fontSize: "1.125rem", fontWeight: 700, color: S9, marginBottom: 8 }}>{s.label}</div>
              <p style={{ fontFamily: ff, fontSize: "0.875rem", color: S5, lineHeight: 1.6, margin: 0 }}>{s.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Why This Matters ────────────────────────────────────────── */
function WhyMatters() {
  const items = [
    { Icon: BarChart3,     title: "Growing Challenges",         desc: "Growing challenges in their environment, including changes and pressure in academic needs and connection lags." },
    { Icon: Lightbulb,    title: "Elevated Impact Needed",      desc: "Elevated impact needed to counteract increasing pressure on environments and students, helping to overcome challenges." },
    { Icon: ClipboardCheck,title: "Year of the Data",           desc: "This year of data will provide insights needed to improve student wellbeing in early years as the foundation of the data." },
    { Icon: Users,         title: "Student Voice at the Centre",desc: "Student voice is incorporated into the centre of planning, ensuring their voice is a priority in your strategy." },
  ];
  return (
    <section style={{ background: "#fff", padding: "96px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem" }}>
        <p style={{ fontFamily: ff, textAlign: "center", fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: S4, marginBottom: 64 }}>Why This Matters</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 64, rowGap: 48 }}>
          {items.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ display: "flex", gap: 24 }}>
              <div style={{ flexShrink: 0, width: 56, height: 56, background: B50, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <item.Icon size={24} color={B6} />
              </div>
              <div>
                <h3 style={{ fontFamily: ff, fontSize: "1.25rem", fontWeight: 700, color: S9, marginBottom: 12 }}>{item.title}</h3>
                <p style={{ fontFamily: ff, fontSize: "1rem", color: S5, lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How to Participate ──────────────────────────────────────── */
function HowToParticipate() {
  const steps = [
    { Icon: Calendar,      title: "Step 1. Online Challenge", desc: "Join the leading student wellbeing event, National Check-In Week." },
    { Icon: Users,         title: "Step 2. Check Positions",  desc: "Case study for schools on the insights from the data collected at National Check-In Week." },
    { Icon: MessageSquare, title: "Step 3. Registration",     desc: "Register for and comments and roles to be placed of your treatment or schools." },
    { Icon: Database,      title: "Step 4. Enter Data",       desc: "Registration to the data and insights derived from the national measurement." },
  ];
  return (
    <section style={{ background: "rgba(239,246,255,0.5)", padding: "96px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem" }}>
        <p style={{ fontFamily: ff, textAlign: "center", fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: S4, marginBottom: 64 }}>How to Participate</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 24 }}>
                <div style={{ flexShrink: 0, width: 48, height: 48, background: "#fff", borderRadius: 12, border: `1px solid ${S1}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: B6 }}>
                  <s.Icon size={20} color={B6} />
                </div>
                <div>
                  <h3 style={{ fontFamily: ff, fontSize: "1.125rem", fontWeight: 700, color: S9, marginBottom: 4 }}>{s.title}</h3>
                  <p style={{ fontFamily: ff, fontSize: "0.875rem", color: S5, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: "#fff", padding: 40, borderRadius: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.08)", border: `1px solid ${S1}` }}>
            <h3 style={{ fontFamily: ff, fontSize: "1.5rem", fontWeight: 700, color: S9, marginBottom: 32 }}>Register Form</h3>
            <form style={{ display: "flex", flexDirection: "column", gap: 20 }} onSubmit={e => e.preventDefault()}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <input type="text" placeholder="First Name" style={inp} />
                <input type="text" placeholder="Last Name"  style={inp} />
              </div>
              <input type="email" placeholder="Email"       style={inp} />
              <input type="text"  placeholder="School Name" style={inp} />
              <select style={{ ...inp, color: S5 }}>
                <option>Role</option><option>Teacher</option><option>Principal</option><option>Student</option><option>Parent</option>
              </select>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[["I agree to the terms of our ", "Privacy Policy", "/privacy"],["I agree with our ","Cookie Policy","/terms"]].map(([pre,lbl,href]) => (
                  <label key={lbl} style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                    <input type="checkbox" style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0 }} />
                    <span style={{ fontFamily: ff, fontSize: "0.75rem", color: S5, lineHeight: 1.5 }}>{pre}<a href={href} style={{ color: B6 }}>{lbl}</a></span>
                  </label>
                ))}
              </div>
              <button type="submit" style={{ fontFamily: ff, fontWeight: 700, fontSize: "1rem", color: "#fff", background: B6, padding: "16px", borderRadius: 12, border: "none", cursor: "pointer", boxShadow: "0 8px 20px rgba(37,99,235,0.3)" }}>
                Register
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Speakers ────────────────────────────────────────────────── */
function Speakers() {
  const list = [
    { name: "Andrew Smith",    role: "Professor", img: "https://i.pravatar.cc/150?u=andrew1", bio: "Leading expert in student wellbeing and educational data analysis with over 20 years experience." },
    { name: "Sally Webster",   role: "Professor", img: "https://i.pravatar.cc/150?u=sally2",  bio: "Specializes in psychological safety in schools and developing resilience programs for youth." },
    { name: "Dianne Giblin",   role: "Professor", img: "https://i.pravatar.cc/150?u=dianne3", bio: "Advocate for parent engagement and community-driven wellbeing initiatives in regional areas." },
    { name: "Dr Mark Williams",role: "Professor", img: "https://i.pravatar.cc/150?u=mark4",   bio: "Renowned researcher in cognitive development and the impact of digital environments on learning." },
    { name: "Gemma McLean",    role: "Professor", img: "https://i.pravatar.cc/150?u=gemma5",  bio: "Focuses on early childhood development and the transition to primary education systems." },
    { name: "Kate Xavier",     role: "Professor", img: "https://i.pravatar.cc/150?u=kate6",   bio: "Expert in trauma-informed practice and supporting vulnerable student populations." },
    { name: "Nikki Bonus",     role: "Professor", img: "https://i.pravatar.cc/150?u=nikki7",  bio: "Founder of several wellbeing platforms used by thousands of schools across Australia." },
    { name: "Corrie Ackland",  role: "Professor", img: "https://i.pravatar.cc/150?u=corrie8", bio: "Dedicated to improving mental health outcomes through peer-to-peer support networks." },
  ];
  return (
    <section style={{ background: "#fff", padding: "96px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem" }}>
        <p style={{ fontFamily: ff, textAlign: "center", fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: S4, marginBottom: 64 }}>Featured Speakers</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 32 }}>
          {list.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              style={{ background: "#fff", padding: 24, borderRadius: 24, border: `1px solid ${S1}`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", textAlign: "center" }}>
              <div style={{ width: 96, height: 96, borderRadius: "50%", overflow: "hidden", margin: "0 auto 24px", outline: `4px solid ${B50}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.img} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} referrerPolicy="no-referrer" />
              </div>
              <h3 style={{ fontFamily: ff, fontSize: "1.125rem", fontWeight: 700, color: S9, marginBottom: 4 }}>{s.name}</h3>
              <p style={{ fontFamily: ff, fontSize: "0.75rem", fontWeight: 700, color: B6, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>{s.role}</p>
              <p style={{ fontFamily: ff, fontSize: "0.75rem", color: S5, lineHeight: 1.6, margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.bio}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────────── */
function Home1Footer() {
  const fLink: React.CSSProperties = { fontFamily: ff, fontSize: "0.875rem", color: "rgba(219,234,254,0.7)", textDecoration: "none" };
  return (
    <footer style={{ background: B9, color: "#fff", padding: "80px 0 40px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 48, marginBottom: 80 }}>
          <div>
            <h4 style={{ fontFamily: ff, fontSize: "1.125rem", fontWeight: 700, marginBottom: 24 }}>Contact Us</h4>
            {["+61 02 555 505","Fax: 100 888 992","events@nationalcheckinweek.com"].map(t => (
              <p key={t} style={{ fontFamily: ff, fontSize: "0.875rem", color: "rgba(219,234,254,0.7)", marginBottom: 16 }}>{t}</p>
            ))}
          </div>
          <div>
            <h4 style={{ fontFamily: ff, fontSize: "1.125rem", fontWeight: 700, marginBottom: 24 }}>Quick Links</h4>
            {[["Contact Us","/contact"],["Privacy Policy","/privacy"],["Terms and Conditions","/terms"]].map(([l,h]) => (
              <p key={l} style={{ marginBottom: 16 }}><a href={h} style={fLink}>{l}</a></p>
            ))}
          </div>
          <div>
            <h4 style={{ fontFamily: ff, fontSize: "1.125rem", fontWeight: 700, marginBottom: 24 }}>Social Media</h4>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "Facebook",  path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z", fill: true },
                { label: "LinkedIn",  path: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z", fill: true },
              ].map(({ label, path, fill }) => (
                <a key={label} href="#" aria-label={label} style={{ width: 40, height: 40, background: B8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"} strokeWidth="2"><path d={path}/></svg>
                </a>
              ))}
              <a href="#" aria-label="Instagram" style={{ width: 40, height: 40, background: B8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="white"/></svg>
              </a>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircle size={32} color="#fff" />
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                <span style={{ fontFamily: ff, fontWeight: 800, fontSize: "1.25rem", color: "#fff" }}>National</span>
                <span style={{ fontFamily: ff, fontWeight: 700, fontSize: "0.875rem", color: B200 }}>Check-In Week</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${B8}`, paddingTop: 40, textAlign: "center" }}>
          <p style={{ fontFamily: ff, fontSize: "0.75rem", color: "rgba(219,234,254,0.4)", margin: 0 }}>Copyright &copy; 2026 National Check-In Week. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

/* ── Root ────────────────────────────────────────────────────── */
export default function Home1Client() {
  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Header />
      <main id="main-content">
        <Hero />
        <Impact />
        <WhyMatters />
        <HowToParticipate />
        <Speakers />
      </main>
      <Home1Footer />
    </div>
  );
}
