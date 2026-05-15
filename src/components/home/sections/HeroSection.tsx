"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Users, ArrowRight } from "lucide-react";
import { Countdown } from "./Countdown";

const B6 = "#29B8E8";

interface HeroSectionProps {
  data: {
    event_badge_emoji: string;
    event_badge_date: string;
    event_badge_location: string;
    heading_line1: string;
    heading_line2: string;
    subheading: string;
    primary_cta_text: string;
    primary_cta_link: string;
    secondary_cta_text: string;
    secondary_cta_link: string;
    hero_image_url: string;
    countdown_target_date: string;
    countdown_label: string;
    show_countdown: boolean;
    stats_card_value: string;
    stats_card_label: string;
    show_stats_card: boolean;
    badge_text: string;
    show_badge: boolean;
  };
}

export function HeroSection({ data }: HeroSectionProps) {
  return (
    <section className="home1-hero">
      <div className="home1-hero-grid">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <div className="home1-hero-badge">
            <span>{data.event_badge_emoji}</span> {data.event_badge_date} · {data.event_badge_location}
          </div>
          <h1>
            {data.heading_line1}<br /><em>{data.heading_line2}</em>
          </h1>
          <p className="home1-hero-sub">{data.subheading}</p>
          <div className="home1-hero-ctas">
            <motion.a href={data.primary_cta_link} whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }} className="home1-btn-primary">
              {data.primary_cta_text} <ArrowRight size={18} />
            </motion.a>
            <motion.a href={data.secondary_cta_link} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="home1-btn-secondary">
              {data.secondary_cta_text}
            </motion.a>
          </div>
          {data.show_countdown && (
            <>
              <p className="home1-countdown-label">{data.countdown_label}</p>
              <Countdown targetDate={data.countdown_target_date} />
            </>
          )}
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="home1-hero-img-wrap hidden lg:block">
          <div className="home1-hero-img">
            <Image 
              src={data.hero_image_url} 
              alt="Students collaborating" 
              width={800} 
              height={600}
              priority
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          </div>
          {data.show_stats_card && (
            <div className="home1-hero-float-card">
              <div className="home1-hero-float-icon"><Users size={22} color={B6} /></div>
              <div>
                <div className="home1-hero-float-val">{data.stats_card_value}</div>
                <div className="home1-hero-float-sub">{data.stats_card_label}</div>
              </div>
            </div>
          )}
          {data.show_badge && (
            <div className="home1-hero-badge-top">{data.badge_text}</div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
