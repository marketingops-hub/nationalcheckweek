"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Heart, Users, BarChart3, Smile, TrendingUp, ShieldCheck, Database,
  MessageSquare, CheckCircle2, UserCircle,
} from "lucide-react";

/* ── Tokens ──────────────────────────────────────────────────── */
const fi = "var(--font-inter), Inter, system-ui, sans-serif";
const fs = "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif";
const WARM   = "#fdfbf7";
const SAGE   = "#d1e2d3";
const BLUE   = "#3b82f6";
const BLUE_D = "#2563eb";
const NAVY   = "#1e3a8a";
const DARK   = "#1f2937";
const G6     = "#4b5563";
const G5     = "#6b7280";
const G4     = "#9ca3af";
const G3     = "#d1d5db";

/* ── Countdown ───────────────────────────────────────────────── */
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
  if (!ok) return <div style={{ height: 60 }} />;
  const box = (val: number, lbl: string) => (
    <div key={lbl} style={{ textAlign: "center" }}>
      <div style={{ fontFamily: fi, fontSize: "1.875rem", fontWeight: 700, color: DARK, lineHeight: 1 }}>{String(val).padStart(2, "0")}</div>
      <div style={{ fontFamily: fi, fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: G4, marginTop: 4 }}>{lbl}</div>
    </div>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      {box(t.d, "Days")}
      <span style={{ fontFamily: fi, fontSize: "1.5rem", fontWeight: 700, color: G3 }}>:</span>
      {box(t.h, "Hours")}
      <span style={{ fontFamily: fi, fontSize: "1.5rem", fontWeight: 700, color: G3 }}>:</span>
      {box(t.m, "Minutes")}
    </div>
  );
}

/* ── Shared input ────────────────────────────────────────────── */
const inp: React.CSSProperties = {
  fontFamily: fi, fontSize: "0.875rem", color: DARK,
  background: "#fff", border: "1px solid #f3f4f6",
  borderRadius: 12, padding: "12px 16px",
  width: "100%", boxSizing: "border-box", outline: "none",
};

/* ── Navbar ──────────────────────────────────────────────────── */
function Navbar() {
  return (
    <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", maxWidth: 1280, margin: "0 auto", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 32, height: 32, background: BLUE, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CheckCircle2 size={20} color="#fff" />
        </div>
        <span style={{ fontFamily: fi, fontWeight: 700, fontSize: "1.125rem", lineHeight: 1.25, color: DARK }}>
          National<br />Check-In<br />Week
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {["Home", "Products", "Resources", "Blog", "Log In"].map(l => (
          <a key={l} href="#" style={{ fontFamily: fi, fontSize: "0.875rem", fontWeight: 500, color: G6, textDecoration: "none" }}>{l}</a>
        ))}
        <a href="/events" style={{ fontFamily: fi, fontWeight: 600, fontSize: "0.875rem", color: "#fff", background: BLUE, padding: "8px 20px", borderRadius: 9999, textDecoration: "none" }}>
          Register Now
        </a>
      </div>
    </nav>
  );
}

/* ── Hero ────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{ position: "relative", overflow: "hidden", padding: "48px 24px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <h1 style={{ fontFamily: fs, fontSize: "3.75rem", fontWeight: 700, lineHeight: 1.2, color: DARK, marginBottom: 24 }}>
            Empathy &amp; Connection:<br />
            <span style={{ color: BLUE }}>A National Check-In Week</span><br />
            for Student Wellbeing.
          </h1>
          <p style={{ fontFamily: fi, fontSize: "1.125rem", color: G6, lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
            Join us in creating safe spaces and fostering community for all students.
            Together, we can make a difference in mental health awareness.
          </p>
          <div style={{ marginBottom: 40 }}>
            <a href="/events" style={{ fontFamily: fi, fontWeight: 600, fontSize: "1rem", color: "#fff", background: BLUE, padding: "16px 32px", borderRadius: 9999, textDecoration: "none", boxShadow: "0 10px 25px rgba(59,130,246,0.3)", display: "inline-block" }}>
              Join the Movement
            </a>
          </div>
          <Countdown />
          <p style={{ fontFamily: fi, fontSize: "0.875rem", color: G4, fontStyle: "italic", marginTop: 16 }}>
            Until National Check-In Week 2026
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} style={{ position: "relative" }}>
          <div style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 25px 50px rgba(0,0,0,0.15)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://picsum.photos/seed/students-group/800/600" alt="Diverse group of students" style={{ width: "100%", height: "auto", objectFit: "cover", display: "block" }} referrerPolicy="no-referrer" />
          </div>
          <div aria-hidden="true" style={{ position: "absolute", bottom: -24, left: -24, width: 96, height: 96, background: "#d1fae5", borderRadius: "50%", zIndex: -1, filter: "blur(24px)", opacity: 0.6 }} />
          <div aria-hidden="true" style={{ position: "absolute", top: -24, right: -24, width: 128, height: 128, background: "#dbeafe", borderRadius: "50%", zIndex: -1, filter: "blur(24px)", opacity: 0.6 }} />
        </motion.div>
      </div>
    </section>
  );
}

/* ── Impact ──────────────────────────────────────────────────── */
function Impact() {
  const stats = [
    { label: "Million Students",   value: "15",    sub: "Supporting urban & rural students impact",           Icon: Heart,    iconColor: "#f87171", bg: "#fef2f2" },
    { label: "Children Supported", value: "1 in 7", sub: "Australian children in the education system",        Icon: Users,    iconColor: "#60a5fa", bg: "#eff6ff" },
    { label: "of Children",        value: "38%",   sub: "Supporting children more than 38% of children",       Icon: BarChart3, iconColor: "#4ade80", bg: "#f0fdf4" },
    { label: "of Children",        value: "24%",   sub: "Supporting children mental health 24% of children",   Icon: Smile,    iconColor: "#facc15", bg: "#fefce8" },
  ];
  return (
    <section style={{ padding: "80px 0", background: "#fff" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
        <p style={{ fontFamily: fi, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3em", color: G4, marginBottom: 48 }}>Impact</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 32 }}>
          {stats.map((s, i) => (
            <motion.div key={i} whileHover={{ y: -5 }}
              style={{ background: s.bg, padding: 32, borderRadius: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ background: "#fff", padding: 12, borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", marginBottom: 24 }}>
                <s.Icon size={24} color={s.iconColor} />
              </div>
              <div style={{ fontFamily: fi, fontSize: "2.25rem", fontWeight: 700, color: DARK, marginBottom: 8, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: fi, fontSize: "0.875rem", fontWeight: 700, color: "#374151", marginBottom: 16 }}>{s.label}</div>
              <p style={{ fontFamily: fi, fontSize: "0.75rem", color: G5, lineHeight: 1.6, margin: 0 }}>{s.sub}</p>
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
    { title: "Growing Challenges",          desc: "Growing challenges in the current education landscape and student mental health.",    Icon: TrendingUp,  iconColor: "#f97316" },
    { title: "Elevated Impact Needed",       desc: "Elevated impact needed to address the increasing need for connection.",               Icon: ShieldCheck, iconColor: "#3b82f6" },
    { title: "Year of the Data",             desc: "The role of data in understanding and improving student wellbeing outcomes.",          Icon: Database,    iconColor: "#a855f7" },
    { title: "Student Voice at the Centre",  desc: "Centering student voices in the development of wellbeing programs.",                  Icon: MessageSquare, iconColor: "#22c55e" },
  ];
  return (
    <section style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <p style={{ fontFamily: fi, textAlign: "center", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3em", color: G4, marginBottom: 64 }}>Why This Matters</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 64, rowGap: 48 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
              <div style={{ background: "#fff", padding: 16, borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", flexShrink: 0 }}>
                <item.Icon size={24} color={item.iconColor} />
              </div>
              <div>
                <h3 style={{ fontFamily: fi, fontSize: "1.25rem", fontWeight: 700, color: DARK, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontFamily: fi, fontSize: "0.875rem", color: G5, lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How to Participate ──────────────────────────────────────── */
function HowToParticipate() {
  const steps = [
    { step: "1", title: "Connect",          desc: "Join our leading student wellbeing event, National Check-In Week.",               Icon: Users },
    { step: "2", title: "Check Routines",   desc: "Create space for students on the regular items and routines at school.",           Icon: UserCircle },
    { step: "3", title: "Registration",     desc: "Register your school and role to be part of the movement.",                       Icon: CheckCircle2 },
    { step: "4", title: "Enter Data",       desc: "Register to the online platform for data collection and insights.",               Icon: Database },
  ];
  return (
    <section style={{ padding: "80px 24px", background: SAGE }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <p style={{ fontFamily: fi, textAlign: "center", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3em", color: G5, marginBottom: 64 }}>How to Participate</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                <div style={{ width: 48, height: 48, background: "#fff", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", color: G6 }}>
                  <s.Icon size={20} color={G6} />
                </div>
                <div>
                  <h3 style={{ fontFamily: fi, fontWeight: 700, fontSize: "1.125rem", color: DARK, marginBottom: 4 }}>Step {s.step}: {s.title}</h3>
                  <p style={{ fontFamily: fi, fontSize: "0.875rem", color: G6, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: WARM, padding: 40, borderRadius: 40, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}>
            <h3 style={{ fontFamily: fi, fontSize: "1.5rem", fontWeight: 700, color: DARK, marginBottom: 32 }}>Register Form</h3>
            <form style={{ display: "flex", flexDirection: "column", gap: 16 }} onSubmit={e => e.preventDefault()}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <input type="text" placeholder="First Name" style={inp} />
                <input type="text" placeholder="Last Name"  style={inp} />
              </div>
              <input type="email" placeholder="Email"       style={inp} />
              <input type="text"  placeholder="School Name" style={inp} />
              <select style={{ ...inp, color: G4 }}>
                <option>Role</option><option>Teacher</option><option>Student</option><option>Parent</option>
              </select>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
                {["I agree to the terms and conditions and privacy policy.", "I want to stay updated with news and events."].map(lbl => (
                  <label key={lbl} style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                    <input type="checkbox" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontFamily: fi, fontSize: "0.75rem", color: G5, lineHeight: 1.5 }}>{lbl}</span>
                  </label>
                ))}
              </div>
              <button type="submit" style={{ fontFamily: fi, fontWeight: 700, fontSize: "1rem", color: "#fff", background: BLUE, padding: "16px", borderRadius: 12, border: "none", cursor: "pointer", boxShadow: "0 8px 20px rgba(59,130,246,0.25)", marginTop: 8 }}>
                Register
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Featured Speakers ───────────────────────────────────────── */
function FeaturedSpeakers() {
  const speakers = [
    { name: "Andrew Smith",    role: "Professor",       desc: "Leading expert in student wellbeing and mental health education.",           img: "https://picsum.photos/seed/speaker1/200/200" },
    { name: "Sally Webster",   role: "Professor",       desc: "Specialist in educational psychology and student connection.",              img: "https://picsum.photos/seed/speaker2/200/200" },
    { name: "Dianne Giblin",   role: "Professor",       desc: "Advocate for parent and community engagement in schools.",                 img: "https://picsum.photos/seed/speaker3/200/200" },
    { name: "Dr Mark Williams",role: "Senior Lecturer", desc: "Researcher focusing on data-driven wellbeing interventions.",              img: "https://picsum.photos/seed/speaker4/200/200" },
    { name: "Gemma McLean",    role: "Professor",       desc: "Expert in school leadership and wellbeing culture.",                       img: "https://picsum.photos/seed/speaker5/200/200" },
    { name: "Kate Xavier",     role: "Professor",       desc: "Clinical psychologist specialising in adolescent mental health.",          img: "https://picsum.photos/seed/speaker6/200/200" },
    { name: "Niski Bonus",     role: "Professor",       desc: "Researcher in social-emotional learning and student voice.",               img: "https://picsum.photos/seed/speaker7/200/200" },
    { name: "Corrie Auckland", role: "Professor",       desc: "Advocate for inclusive education and student support systems.",            img: "https://picsum.photos/seed/speaker8/200/200" },
  ];
  return (
    <section style={{ padding: "80px 24px", background: "#fff" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <p style={{ fontFamily: fi, textAlign: "center", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3em", color: G4, marginBottom: 64 }}>Featured Speakers</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 32 }}>
          {speakers.map((s, i) => (
            <motion.div key={i} whileHover={{ y: -5 }}
              style={{ background: WARM, padding: 24, borderRadius: 24, textAlign: "center" }}>
              <div style={{ width: 96, height: 96, borderRadius: "50%", overflow: "hidden", margin: "0 auto 16px", border: "4px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.img} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} referrerPolicy="no-referrer" />
              </div>
              <h3 style={{ fontFamily: fi, fontWeight: 700, fontSize: "1.125rem", color: DARK, marginBottom: 4 }}>{s.name}</h3>
              <p style={{ fontFamily: fi, fontSize: "0.75rem", fontWeight: 700, color: BLUE, marginBottom: 12 }}>{s.role}</p>
              <p style={{ fontFamily: fi, fontSize: "0.75rem", color: G5, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────────── */
function Footer() {
  const lnk: React.CSSProperties = { fontFamily: fi, fontSize: "0.875rem", color: "rgba(255,255,255,0.8)", textDecoration: "none" };
  return (
    <footer style={{ background: NAVY, color: "#fff", padding: "64px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 48 }}>
        <div>
          <h4 style={{ fontFamily: fi, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.6, marginBottom: 24 }}>Contact Us</h4>
          {["1800 123 456", "info@checkinweek.com", "123 Education Way, Sydney"].map(t => (
            <p key={t} style={{ fontFamily: fi, fontSize: "0.875rem", opacity: 0.8, marginBottom: 12 }}>{t}</p>
          ))}
        </div>
        <div>
          <h4 style={{ fontFamily: fi, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.6, marginBottom: 24 }}>Quick Links</h4>
          {[["About Us","#"],["Resources","#"],["Privacy Policy","#"],["Terms of Service","#"]].map(([l,h]) => (
            <p key={l} style={{ marginBottom: 12 }}><a href={h} style={lnk}>{l}</a></p>
          ))}
        </div>
        <div>
          <h4 style={{ fontFamily: fi, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.6, marginBottom: 24 }}>Social Media</h4>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { label: "Facebook",  d: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" },
              { label: "LinkedIn",  d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" },
            ].map(({ label, d }) => (
              <a key={label} href="#" aria-label={label} style={{ background: "rgba(255,255,255,0.1)", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>
              </a>
            ))}
            <a href="#" aria-label="Instagram" style={{ background: "rgba(255,255,255,0.1)", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="white"/></svg>
            </a>
            <a href="#" aria-label="Twitter / X" style={{ background: "rgba(255,255,255,0.1)", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, background: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={20} color={NAVY} />
            </div>
            <span style={{ fontFamily: fi, fontWeight: 700, fontSize: "1.125rem", lineHeight: 1.25, color: "#fff" }}>
              National<br />Check-In<br />Week
            </span>
          </div>
          <p style={{ fontFamily: fi, fontSize: "0.75rem", opacity: 0.4, textAlign: "right", margin: 0 }}>
            © 2026 National Check-In Week.<br />All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ── Root ────────────────────────────────────────────────────── */
export default function Home2Client() {
  return (
    <div style={{ minHeight: "100vh", background: WARM, display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Hero />
        <Impact />
        <WhyMatters />
        <HowToParticipate />
        <FeaturedSpeakers />
      </main>
      <Footer />
    </div>
  );
}
