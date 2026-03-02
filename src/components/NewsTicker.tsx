"use client";
import { useEffect, useRef } from "react";

const STATS = [
  { stat: "SUICIDE", detail: "is the #1 cause of death for Australians aged 15–24" },
  { stat: "1 in 7", detail: "children has a diagnosable mental disorder — most go undetected" },
  { stat: "580,000+", detail: "Australian children aged 4–17 have a diagnosable mental disorder" },
  { stat: "38%", detail: "of young Australians experienced cyberbullying in the past 12 months · eSafety 2024" },
  { stat: "46,000+", detail: "bullying incidents in Queensland schools in 2023 alone · QLD Auditor-General" },
  { stat: "72%", detail: "of all lifetime mental health conditions emerge before age 25" },
  { stat: "1 in 5", detail: "young Australians felt lonely most or all of the time · Mission Australia 2024" },
  { stat: "57%", detail: "average attendance in very remote NT/WA schools vs 93% in cities · RoGS 2026" },
  { stat: "40%", detail: "of school refusal cases are driven by anxiety disorders · CAMHS Australia" },
  { stat: "65%", detail: "of LGBTQ+ students report feeling unsafe at school · Writing Themselves In 4" },
  { stat: "8×", detail: "more cost-effective to intervene early than treat crisis later · Productivity Commission" },
  { stat: "50%", detail: "of 16–17 year olds don't meet sleep guidelines on school nights · AIHW" },
  { stat: "3×", detail: "higher mental illness risk in children experiencing food insecurity · ACOSS 2024" },
  { stat: "1 in 14", detail: "Australian children aged 4–17 has ADHD, affecting daily learning · AIHW 2023" },
];

export default function NewsTicker() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let x = 0;
    let raf: number;
    const speed = 0.5;

    function animate() {
      x -= speed;
      const totalWidth = track!.scrollWidth / 2;
      if (Math.abs(x) >= totalWidth) x = 0;
      track!.style.transform = `translateX(${x}px)`;
      raf = requestAnimationFrame(animate);
    }

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  const items = [...STATS, ...STATS];

  return (
    <div className="news-ticker" aria-label="Wellbeing statistics ticker">
      <div className="news-ticker-label">ALERT</div>
      <div className="news-ticker-viewport">
        <div className="news-ticker-track" ref={trackRef}>
          {items.map((item, i) => (
            <span key={i} className="news-ticker-item">
              <span className="news-ticker-stat">{item.stat}</span>
              <span className="news-ticker-detail">{item.detail}</span>
              <span className="news-ticker-sep" aria-hidden="true">◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
