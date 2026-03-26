"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { BarChart3, Lightbulb, ClipboardCheck, Users, Calendar, MessageSquare, Database, Menu, X, CheckCircle } from "lucide-react";

/* ── Design tokens ─────────────────────────────────────────── */
const B6 = "#29B8E8", B7 = "#1A9DCA", B9 = "#3D3D3D", B8 = "#1A9DCA";
const B50 = "#E6F7FD", B100 = "#E6F7FD", B200 = "#C7EEFB";
const S9 = "#3D3D3D", S6 = "#475569", S5 = "#64748B", S4 = "#94A3B8";
const S3 = "#CBD5E1", S2 = "#E2E8F0", S1 = "#F1F5F9", S0 = "#F8F4F7";
const ff = "var(--font-montserrat), Montserrat, sans-serif";
const fb = "var(--font-poppins), Poppins, sans-serif";

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
      <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: S5, fontFamily: fb, marginTop: 4 }}>{lbl}</div>
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
const inp: React.CSSProperties = { fontFamily: fb, fontSize: "0.875rem", color: S9, background: S0, border: `1px solid ${S2}`, borderRadius: 12, padding: "12px 16px", width: "100%", boxSizing: "border-box", outline: "none" };

/* ── Header ─────────────────────────────────────────────────── */
function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${S1}` }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", height: 80 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <Image
            src="/logo/nciw_no_background-1024x577.png"
            alt="National Check-in Week"
            height={64}
            width={114}
            style={{ objectFit: "contain" }}
            priority
          />
        </a>
        <nav className="hidden md:flex items-center gap-8">
          {["Home","Products","Resources","Blog"].map(l => (
            <a key={l} href="#" className="text-sm font-medium text-slate-500 hover:text-[#29B8E8] transition-colors" style={{ textDecoration: "none" }}>{l}</a>
          ))}
          <a href="/login" style={{ fontFamily: ff, fontSize: "0.875rem", fontWeight: 500, color: S6, textDecoration: "none" }}>Log In</a>
          <a href="/events" className="text-sm font-semibold text-white px-6 py-2.5 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200" style={{ background: B6, textDecoration: "none" }}>Register Now</a>
        </nav>
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ background: "none", border: "none", cursor: "pointer" }} aria-label={open ? "Close menu" : "Open menu"}>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem" }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6" style={{ color: B6, background: B50 }}>
            <span aria-hidden>📅</span> 25 May 2026 &middot; Australia
          </div>
          <h1 className="text-5xl lg:text-[3.75rem] font-black leading-[1.07] tracking-tight mb-5" style={{ color: S9 }}>
            Student Wellbeing:<br />
            <span style={{ color: B6 }}>A National Priority.</span>
          </h1>
          <p className="text-lg leading-relaxed mb-8 max-w-lg" style={{ color: S6 }}>
            Join Australia&rsquo;s leading student wellbeing event — bridging data, experts and schools to create lasting change.
          </p>
          <div className="flex flex-wrap gap-3 mb-10">
            <a href="/events" className="inline-flex items-center gap-2 text-base font-bold text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200" style={{ background: B6, textDecoration: "none" }}>Register Now</a>
            <a href="/about" className="inline-flex items-center text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 px-8 py-4 rounded-full transition-all duration-200" style={{ textDecoration: "none" }}>Learn More</a>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Countdown to the event</p>
          <Countdown />
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative hidden lg:block">
          <div className="rounded-3xl overflow-hidden shadow-2xl relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000" alt="Students collaborating" className="w-full block object-cover" style={{ height: 520 }} referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
          <div aria-hidden="true" className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-60" style={{ background: B100 }} />
          <div aria-hidden="true" className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-60" style={{ background: "#FCEEF6" }} />
          <div className="absolute bottom-8 left-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: B50 }}><Users size={22} color={B6} /></div>
            <div>
              <div className="text-2xl font-black leading-none" style={{ color: S9 }}>15M+</div>
              <div className="text-xs text-slate-500 mt-0.5">Students reached annually</div>
            </div>
          </div>
          <div className="absolute top-8 right-8 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-3 py-2 text-xs font-bold" style={{ color: B6 }}>✓ 1,200+ Schools</div>
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
        <p style={{ fontFamily: ff, textAlign: "center", fontSize: "0.85rem", fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: "#475569", marginBottom: 64 }}>Impact</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="group bg-white rounded-3xl p-6 lg:p-8 text-center shadow-sm hover:shadow-xl border border-slate-100 hover:border-[#29B8E8]/30 transition-all duration-300 cursor-default">
              <div className="text-4xl lg:text-5xl font-black leading-none mb-3 group-hover:scale-105 transition-transform duration-200" style={{ color: B6 }}>{s.value}</div>
              <div className="text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: S9 }}>{s.label}</div>
              <p className="text-sm leading-relaxed text-slate-500">{s.sub}</p>
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
        <p style={{ fontFamily: ff, textAlign: "center", fontSize: "0.85rem", fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: "#475569", marginBottom: 64 }}>Why This Matters</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-x-16 lg:gap-y-10">
          {items.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="flex gap-5 p-6 rounded-2xl hover:bg-slate-50 transition-colors duration-200 group -mx-6">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200" style={{ background: B50 }}>
                <item.Icon size={24} color={B6} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2" style={{ color: S9 }}>{item.title}</h3>
                <p className="text-base leading-relaxed text-slate-500">{item.desc}</p>
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
  const [done, setDone] = useState(false);
  const steps = [
    { Icon: Calendar,      title: "Step 1. Online Challenge", desc: "Join the leading student wellbeing event, National Check-In Week." },
    { Icon: Users,         title: "Step 2. Check Positions",  desc: "Case study for schools on the insights from the data collected at National Check-In Week." },
    { Icon: MessageSquare, title: "Step 3. Registration",     desc: "Register for and comments and roles to be placed of your treatment or schools." },
    { Icon: Database,      title: "Step 4. Enter Data",       desc: "Registration to the data and insights derived from the national measurement." },
  ];
  return (
    <section style={{ background: B50, padding: "96px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem" }}>
        <p style={{ fontFamily: ff, textAlign: "center", fontSize: "0.85rem", fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: "#475569", marginBottom: 64 }}>How to Participate</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 24 }}>
                <div style={{ flexShrink: 0, width: 48, height: 48, background: "#fff", borderRadius: 12, border: `1px solid ${S1}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: B6 }}>
                  <s.Icon size={20} color={B6} />
                </div>
                <div>
                  <h3 style={{ fontFamily: ff, fontSize: "1.125rem", fontWeight: 700, color: S9, marginBottom: 4 }}>{s.title}</h3>
                  <p style={{ fontFamily: fb, fontSize: "1rem", color: S9, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: "#fff", padding: 40, borderRadius: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.08)", border: `1px solid ${S1}` }}>
            <h3 style={{ fontFamily: ff, fontSize: "1.5rem", fontWeight: 700, color: S9, marginBottom: 32 }}>Register Form</h3>
            {done ? (
              <div className="text-center py-8">
                <CheckCircle size={52} className="mx-auto mb-4" color={B6} />
                <h3 style={{ fontFamily: ff, fontSize: "1.5rem", fontWeight: 800, color: S9, marginBottom: 8 }}>You&rsquo;re registered!</h3>
                <p style={{ fontFamily: fb, color: S5 }}>We&rsquo;ll be in touch with details before May 2026.</p>
              </div>
            ) : (
            <form style={{ display: "flex", flexDirection: "column", gap: 20 }} onSubmit={e => { e.preventDefault(); setDone(true); }}>
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
                    <span style={{ fontFamily: ff, fontSize: "0.875rem", color: S9, lineHeight: 1.5 }}>{pre}<a href={href} style={{ color: B6 }}>{lbl}</a></span>
                  </label>
                ))}
              </div>
              <button type="submit" className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200" style={{ fontFamily: ff, fontWeight: 700, fontSize: "1rem", color: "#fff", background: B6, padding: "16px", borderRadius: 12, border: "none", cursor: "pointer", boxShadow: "0 8px 20px rgba(41,184,232,0.3)" }}>
                Register
              </button>
            </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Speakers ────────────────────────────────────────────────── */
function Speakers() {
  const list = [
    { name: "Andrew Smith",    role: "Wellbeing Researcher",    img: "https://i.pravatar.cc/150?u=andrew1", bio: "Leading expert in student wellbeing and educational data analysis with over 20 years experience." },
    { name: "Sally Webster",   role: "Educational Psychologist", img: "https://i.pravatar.cc/150?u=sally2",  bio: "Specializes in psychological safety in schools and developing resilience programs for youth." },
    { name: "Dianne Giblin",   role: "Community Advocate",       img: "https://i.pravatar.cc/150?u=dianne3", bio: "Advocate for parent engagement and community-driven wellbeing initiatives in regional areas." },
    { name: "Dr Mark Williams",role: "Cognitive Researcher",     img: "https://i.pravatar.cc/150?u=mark4",   bio: "Renowned researcher in cognitive development and the impact of digital environments on learning." },
    { name: "Gemma McLean",    role: "Early Childhood Lead",     img: "https://i.pravatar.cc/150?u=gemma5",  bio: "Focuses on early childhood development and the transition to primary education systems." },
    { name: "Kate Xavier",     role: "Trauma Specialist",        img: "https://i.pravatar.cc/150?u=kate6",   bio: "Expert in trauma-informed practice and supporting vulnerable student populations." },
    { name: "Nikki Bonus",     role: "Platform Founder",         img: "https://i.pravatar.cc/150?u=nikki7",  bio: "Founder of several wellbeing platforms used by thousands of schools across Australia." },
    { name: "Corrie Ackland",  role: "Mental Health Lead",       img: "https://i.pravatar.cc/150?u=corrie8", bio: "Dedicated to improving mental health outcomes through peer-to-peer support networks." },
  ];
  return (
    <section style={{ background: "#fff", padding: "96px 0" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem" }}>
        <p style={{ fontFamily: ff, textAlign: "center", fontSize: "0.85rem", fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: "#475569", marginBottom: 64 }}>Featured Speakers</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
          {list.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="group bg-white rounded-3xl p-6 text-center border border-slate-100 hover:border-[#29B8E8]/30 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-[#E6F7FD] group-hover:ring-[#29B8E8]/40 transition-all duration-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.img} alt={s.name} className="w-full h-full object-cover block" referrerPolicy="no-referrer" />
              </div>
              <h3 className="text-base font-bold mb-1" style={{ color: S9 }}>{s.name}</h3>
              <span className="inline-block text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-3" style={{ color: B6, background: B50 }}>{s.role}</span>
              <p className="text-sm leading-relaxed text-slate-500 line-clamp-3">{s.bio}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Footer ──────────────────────────────────────────────────── */
function Home1Footer() {
  const fLink: React.CSSProperties = { fontFamily: ff, fontSize: "0.875rem", color: "rgba(255,255,255,0.85)", textDecoration: "none" };
  return (
    <footer style={{ background: B9, color: "#fff", padding: "80px 0 40px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-20">
          <div>
            <h4 style={{ fontFamily: ff, fontSize: "1.125rem", fontWeight: 700, marginBottom: 24 }}>Contact Us</h4>
            {["+61 02 555 505","Fax: 100 888 992","events@nationalcheckinweek.com"].map(t => (
              <p key={t} style={{ fontFamily: ff, fontSize: "0.875rem", color: "rgba(255,255,255,0.85)", marginBottom: 16 }}>{t}</p>
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
          <div className="flex lg:justify-end">
            <Image
              src="/logo/nciw_no_background-1024x577.png"
              alt="National Check-in Week"
              width={160}
              height={90}
              style={{ objectFit: "contain", filter: "brightness(0) invert(1)", opacity: 0.8 }}
            />
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${B8}`, paddingTop: 40, textAlign: "center" }}>
          <p style={{ fontFamily: ff, fontSize: "0.75rem", color: "rgba(255,255,255,0.65)", margin: 0 }}>Copyright &copy; 2026 National Check-In Week. All rights reserved.</p>
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
