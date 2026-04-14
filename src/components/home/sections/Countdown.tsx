"use client";

import { useState, useEffect } from "react";

interface CountdownProps {
  targetDate: string;
}

export function Countdown({ targetDate }: CountdownProps) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  
  useEffect(() => {
    const target = new Date(targetDate);
    const tick = () => {
      const ms = Math.max(0, target.getTime() - Date.now());
      setT({ 
        d: Math.floor(ms / 86400000), 
        h: Math.floor((ms % 86400000) / 3600000), 
        m: Math.floor((ms % 3600000) / 60000), 
        s: Math.floor((ms % 60000) / 1000) 
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  
  return (
    <div className="home1-countdown">
      {([[t.d, "Days"], [t.h, "Hrs"], [t.m, "Min"], [t.s, "Sec"]] as [number, string][]).map(([v, l]) => (
        <div key={l} className="home1-cd-box">
          <div className="home1-cd-num">{String(v as number).padStart(2, "0")}</div>
          <div className="home1-cd-lbl">{l}</div>
        </div>
      ))}
    </div>
  );
}
