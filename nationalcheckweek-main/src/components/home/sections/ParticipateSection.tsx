"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";

const ff = "var(--font-montserrat), Montserrat, sans-serif";
const B6 = "#29B8E8", S6 = "#475569", S9 = "#3D3D3D";

export function ParticipateSection() {
  const [done, setDone] = useState(false);
  
  const steps = [
    { title: "Register Your School", desc: "Join the leading student wellbeing event, National Check-In Week." },
    { title: "Review Resources", desc: "Access toolkits, guides, and best practices for implementing wellbeing programs." },
    { title: "Engage Students", desc: "Use our frameworks to gather student voice and feedback on wellbeing." },
    { title: "Share Insights", desc: "Contribute to the national conversation on student mental health and wellbeing." },
  ];
  
  return (
    <section className="home1-participate" style={{ padding: "5rem 0", background: "var(--color-bg-subtle)" }} data-testid="participate-section">
      <div className="home1-participate-inner">
        <div>
          <div className="section-header fade-up" style={{ textAlign: "left", marginBottom: "3rem" }}>
            <span className="section-eyebrow">How to Participate</span>
            <h2 className="section-h2">Get Started in 4 Steps</h2>
            <p className="section-desc" style={{ marginLeft: 0 }}>Simple process to join Australia&rsquo;s largest wellbeing initiative.</p>
          </div>
          <div className="home1-steps">
            {steps.map((s, i) => (
              <div key={i} className={`home1-step fade-up fade-up-delay-${i + 1}`}>
                <div className="home1-step-num">{i + 1}</div>
                <div>
                  <h3 className="home1-step-title">{s.title}</h3>
                  <p className="home1-step-desc">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="home1-form-card fade-up fade-up-delay-2">
          <h3 className="home1-form-title">Register Your School</h3>
          <p className="home1-form-subtitle">Join 1,200+ schools already participating</p>
          {done ? (
            <div className="text-center py-8">
              <CheckCircle size={52} className="mx-auto mb-4" color={B6} />
              <h3 style={{ fontFamily: ff, fontSize: "1.5rem", fontWeight: 800, color: S9, marginBottom: 8 }}>You&rsquo;re registered!</h3>
              <p style={{ color: S6 }}>We&rsquo;ll be in touch with details before May 2026.</p>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); setDone(true); }}>
              <div className="home1-form-row">
                <div className="home1-form-field">
                  <label htmlFor="fname">First Name</label>
                  <input id="fname" type="text" placeholder="Jane" className="home1-form-input" required />
                </div>
                <div className="home1-form-field">
                  <label htmlFor="lname">Last Name</label>
                  <input id="lname" type="text" placeholder="Smith" className="home1-form-input" required />
                </div>
              </div>
              <div className="home1-form-field">
                <label htmlFor="email">Email Address</label>
                <input id="email" type="email" placeholder="jane.smith@school.edu.au" className="home1-form-input" required />
              </div>
              <div className="home1-form-field">
                <label htmlFor="school">School Name</label>
                <input id="school" type="text" placeholder="Your School" className="home1-form-input" required />
              </div>
              <div className="home1-form-field">
                <label htmlFor="role">Your Role</label>
                <select id="role" className="home1-form-select" required>
                  <option value="">Select your role</option>
                  <option>Teacher</option>
                  <option>Principal</option>
                  <option>Wellbeing Coordinator</option>
                  <option>Parent</option>
                </select>
              </div>
              <label className="home1-checkbox-row">
                <input type="checkbox" required />
                <span style={{ fontSize: "0.875rem", color: S9 }}>I agree to the <a href="/privacy">Privacy Policy</a> and <a href="/terms">Terms of Service</a></span>
              </label>
              <motion.button type="submit" whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }} className="home1-btn-submit">
                Register Now <ArrowRight size={18} />
              </motion.button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
