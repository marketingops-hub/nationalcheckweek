'use client';

import { useState } from 'react';

interface Faq {
  id: string;
  question: string;
  answer: string;
}

export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="faq-list">
      {faqs.map((f) => {
        const isOpen = openId === f.id;
        return (
          <div key={f.id} className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}>
            <button
              id={`faq-trigger-${f.id}`}
              onClick={() => setOpenId(isOpen ? null : f.id)}
              className="faq-item__trigger"
              aria-expanded={isOpen}
              aria-controls={`faq-body-${f.id}`}
            >
              <span>{f.question}</span>
              <span className={`faq-item__icon ${isOpen ? 'faq-item__icon--open' : ''}`} aria-hidden="true">+</span>
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
  );
}
