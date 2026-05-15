"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface CTASectionProps {
  data: {
    eyebrow_text: string;
    heading_text: string;
    description_text: string;
    primary_cta_text: string;
    primary_cta_link: string;
    secondary_cta_text: string;
    secondary_cta_link: string;
  };
}

export function CTASection({ data }: CTASectionProps) {
  return (
    <section className="home1-cta-banner">
      <div className="home1-cta-inner fade-up">
        <span className="section-eyebrow">{data.eyebrow_text}</span>
        <h2>{data.heading_text}</h2>
        <p>{data.description_text}</p>
        <div className="home1-cta-btns">
          <motion.a href={data.primary_cta_link} whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }} className="home1-btn-primary">
            {data.primary_cta_text} <ArrowRight size={18} />
          </motion.a>
          <motion.a href={data.secondary_cta_link} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="home1-btn-secondary">
            {data.secondary_cta_text}
          </motion.a>
        </div>
      </div>
    </section>
  );
}
