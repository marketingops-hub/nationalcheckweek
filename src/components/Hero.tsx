"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

export default function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);

  const words = useMemo(
    () => ["suicide", "anxiety", "self-harm", "loneliness", "burnout"],
    []
  );

  useEffect(() => {
    const id = setTimeout(() => {
      setTitleNumber(n => (n === words.length - 1 ? 0 : n + 1));
    }, 2200);
    return () => clearTimeout(id);
  }, [titleNumber, words]);

  const stats = [
    { num: "Suicide", suffix: "", label: "is the leading cause of death for Australians aged 15–24" },
    { num: "1 in 7", suffix: "", label: "children has a diagnosable mental disorder — most go undetected" },
    { num: "72%", suffix: "", label: "of all lifetime mental health conditions begin before age 25" },
    { num: "8×", suffix: "", label: "more cost-effective to intervene early than treat a crisis later" },
  ];

  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-tag">
          <span className="hero-tag-dot" />
          Australian Schools Wellbeing Monitor · 2024–25
        </div>

        <h1>
          Data is how we understand
          <br />
          <span
            style={{
              position: "relative",
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              height: "1.2em",
              overflow: "hidden",
              verticalAlign: "bottom",
              width: "clamp(180px, 50vw, 380px)",
            }}
          >
            &nbsp;
            {words.map((word, index) => (
              <motion.span
                key={index}
                style={{
                  position: "absolute",
                  fontStyle: "italic",
                  color: "var(--teal-light)",
                }}
                initial={{ opacity: 0, y: 80 }}
                transition={{ type: "spring", stiffness: 60, damping: 18 }}
                animate={
                  titleNumber === index
                    ? { y: 0, opacity: 1 }
                    : { y: titleNumber > index ? -80 : 80, opacity: 0 }
                }
              >
                {word}
              </motion.span>
            ))}
          </span>
          <br />
          before it becomes a tragedy
        </h1>

        <p className="hero-sub">
          Suicide. Anxiety. Self-harm. These are not school failures — they are complex challenges that schools, families and communities face together. What makes the difference is having the right data, early enough to act. This monitor exists to make that data visible.
        </p>

        <div className="hero-cta-row">
          <a href="#issues" className="hero-btn-primary">Explore the Issues</a>
          <a href="#prevention" className="hero-btn-secondary">How Data Helps →</a>
        </div>

        <div className="hero-stats">
          {stats.map((s) => (
            <div key={s.label} className="hero-stat">
              <div className="hero-stat-num">
                {s.num}<span>{s.suffix}</span>
              </div>
              <div className="hero-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
