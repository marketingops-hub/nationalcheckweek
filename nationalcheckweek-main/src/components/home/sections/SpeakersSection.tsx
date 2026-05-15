import Image from "next/image";

export function SpeakersSection() {
  const list = [
    { name: "Andrew Smith", role: "Wellbeing Researcher", img: "https://i.pravatar.cc/150?u=andrew1", bio: "Leading expert in student wellbeing and educational data analysis with over 20 years experience." },
    { name: "Sally Webster", role: "Educational Psychologist", img: "https://i.pravatar.cc/150?u=sally2", bio: "Specializes in psychological safety in schools and developing resilience programs for youth." },
    { name: "Dianne Giblin", role: "Community Advocate", img: "https://i.pravatar.cc/150?u=dianne3", bio: "Advocate for parent engagement and community-driven wellbeing initiatives in regional areas." },
    { name: "Dr Mark Williams", role: "Cognitive Researcher", img: "https://i.pravatar.cc/150?u=mark4", bio: "Renowned researcher in cognitive development and the impact of digital environments on learning." },
    { name: "Gemma McLean", role: "Early Childhood Lead", img: "https://i.pravatar.cc/150?u=gemma5", bio: "Focuses on early childhood development and the transition to primary education systems." },
    { name: "Kate Xavier", role: "Trauma Specialist", img: "https://i.pravatar.cc/150?u=kate6", bio: "Expert in trauma-informed practice and supporting vulnerable student populations." },
    { name: "Nikki Bonus", role: "Platform Founder", img: "https://i.pravatar.cc/150?u=nikki7", bio: "Founder of several wellbeing platforms used by thousands of schools across Australia." },
    { name: "Corrie Ackland", role: "Mental Health Lead", img: "https://i.pravatar.cc/150?u=corrie8", bio: "Dedicated to improving mental health outcomes through peer-to-peer support networks." },
  ];
  
  return (
    <section className="home1-speakers" style={{ padding: "5rem 0" }} data-testid="speakers-section">
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2rem" }}>
        <div className="section-header fade-up">
          <span className="section-eyebrow">Featured Speakers</span>
          <h2 className="section-h2">Learn from the Experts</h2>
          <p className="section-desc">Hear from Australia&rsquo;s leading voices in student wellbeing and mental health.</p>
        </div>
        <div className="home1-speakers-grid">
          {list.map((s, i) => (
            <div key={i} className={`home1-speaker-card fade-up fade-up-delay-${(i % 4) + 1}`}>
              <div className="home1-speaker-avatar">
                <Image 
                  src={s.img} 
                  alt={s.name} 
                  width={150} 
                  height={150}
                  style={{ borderRadius: '50%', objectFit: 'cover' }}
                />
              </div>
              <h3 className="home1-speaker-name">{s.name}</h3>
              <span className="home1-speaker-role">{s.role}</span>
              <p className="home1-speaker-bio">{s.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
