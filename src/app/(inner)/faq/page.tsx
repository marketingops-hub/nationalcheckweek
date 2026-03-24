"use client";

import { useEffect, useState } from "react";

interface Faq {
  id: string;
  question: string;
  answer: string;
}

const STATIC_FAQS: Faq[] = [
  {
    id: "s1",
    question: "What is National Check-In Week (NCIW)?",
    answer: "NCIW is a free initiative aimed at improving student wellbeing in Australian schools by providing professional learning, webinars, tools, data, and resources to help school leaders assess current wellbeing programs and support student mental health.",
  },
  {
    id: "s2",
    question: "When is National Check-In Week?",
    answer: "National Check-In Week will be held between 25–29th May 2026, however there are many events you can be involved in leading up to NCIW. Check out the events page for more information.",
  },
  {
    id: "s3",
    question: "How can I participate in NCIW?",
    answer: "You can participate by registering and attending our online events and joining this crucial discussion with leading experts in wellbeing.",
  },
  {
    id: "s4",
    question: "Who can join NCIW?",
    answer: "NCIW is free and open to all Australian school leaders, educators, and wellbeing professionals who want to enhance student wellbeing and create a supportive, inclusive school environment.",
  },
  {
    id: "s5",
    question: "How do I sign up?",
    answer: "Simply sign up for free and gain access to webinars, panels, and resources designed to support your school community.",
  },
  {
    id: "s6",
    question: "Where does the NCIW data come from?",
    answer: "National Check-In Week utilised the almost 6 million student emotion check-ins recorded through the Life Skills GO platform in 2025 to generate insights on student wellbeing in Australia through student voice. This data will be used to inform discussions around the current gaps within student wellbeing.",
  },
  {
    id: "s7",
    question: "Do schools get access to Life Skills GO during NCIW?",
    answer: "Schools also have free two-week access to Life Skills GO for National Check-In Week to run wellbeing assessments through daily emotion check-ins to evaluate their current wellbeing practices and programs.",
  },
];

export default function FaqPage() {
  const [faqs, setFaqs] = useState<Faq[]>(STATIC_FAQS);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/faq")
      .then((r) => r.json())
      .then((d) => { if (d.faqs && d.faqs.length > 0) setFaqs(d.faqs); })
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="page-hero page-hero--centered">
        <div className="page-hero__inner">
          <div className="hero-tag">❓ Help Centre</div>
          <h1 className="page-hero__title">Frequently Asked Questions</h1>
          <p className="page-hero__subtitle">
            Find answers to common questions about National Check-In Week
          </p>
        </div>
      </div>

      <main className="inner-content" id="main-content">
        <div className="faq-list">
          {faqs.map((f) => {
            const isOpen = openId === f.id;
            return (
              <div key={f.id} className={`faq-item ${isOpen ? "faq-item--open" : ""}`}>
                <button
                  id={`faq-trigger-${f.id}`}
                  onClick={() => setOpenId(isOpen ? null : f.id)}
                  className="faq-item__trigger"
                  aria-expanded={isOpen}
                  aria-controls={`faq-body-${f.id}`}
                >
                  <span>{f.question}</span>
                  <span className={`faq-item__icon ${isOpen ? "faq-item__icon--open" : ""}`} aria-hidden="true">+</span>
                </button>
                {isOpen && (
                  <div
                    className="faq-item__body"
                    id={`faq-body-${f.id}`}
                    role="region"
                    aria-labelledby={`faq-trigger-${f.id}`}
                  >
                    {f.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
