import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Heart, 
  Users, 
  BarChart3, 
  Smile, 
  TrendingUp, 
  ShieldCheck, 
  Database, 
  MessageSquare,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  CheckCircle2,
  UserCircle
} from 'lucide-react';

// --- Components ---

const Navbar = () => (
  <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
        <CheckCircle2 size={20} />
      </div>
      <span className="font-bold text-lg leading-tight">National<br/>Check-In<br/>Week</span>
    </div>
    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
      <a href="#" className="hover:text-blue-600">Home</a>
      <a href="#" className="hover:text-blue-600">Products</a>
      <a href="#" className="hover:text-blue-600">Resources</a>
      <a href="#" className="hover:text-blue-600">Blog</a>
      <a href="#" className="hover:text-blue-600">Log In</a>
      <button className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition-colors">
        Register Now
      </button>
    </div>
  </nav>
);

const Hero = () => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="serif text-5xl md:text-6xl font-bold leading-tight mb-6">
            Empathy & Connection:<br/>
            <span className="text-blue-600">A National Check-In Week</span><br/>
            for Student Wellbeing.
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-lg">
            Join us in creating safe spaces and fostering community for all students. 
            Together, we can make a difference in mental health awareness.
          </p>
          
          <div className="flex flex-wrap gap-4 mb-10">
            <button className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
              Join the Movement
            </button>
          </div>

          <div className="flex gap-6 items-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800">04</div>
              <div className="text-xs uppercase tracking-widest text-gray-400 font-bold">Days</div>
            </div>
            <div className="text-2xl font-bold text-gray-300">:</div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800">06</div>
              <div className="text-xs uppercase tracking-widest text-gray-400 font-bold">Hours</div>
            </div>
            <div className="text-2xl font-bold text-gray-300">:</div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800">21</div>
              <div className="text-xs uppercase tracking-widest text-gray-400 font-bold">Minutes</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-400 italic">Until National Check-In Week 2024</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="rounded-3xl overflow-hidden shadow-2xl">
            <img 
              src="https://picsum.photos/seed/students-group/800/600" 
              alt="Diverse group of students" 
              className="w-full h-auto object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Decorative elements */}
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-green-100 rounded-full -z-10 blur-2xl opacity-60"></div>
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-100 rounded-full -z-10 blur-2xl opacity-60"></div>
        </motion.div>
      </div>
    </section>
  );
};

const Impact = () => {
  const stats = [
    { label: "Million Students", value: "15", sub: "Supporting urban & rural students impact", icon: <Heart className="text-red-400" />, color: "bg-red-50" },
    { label: "Children Supported", value: "1 in 7", sub: "Australian children in the education system", icon: <Users className="text-blue-400" />, color: "bg-blue-50" },
    { label: "of Children", value: "38%", sub: "Supporting children more than 38% of children", icon: <BarChart3 className="text-green-400" />, color: "bg-green-50" },
    { label: "of Children", value: "24%", sub: "Supporting children mental health 24% of children", icon: <Smile className="text-yellow-400" />, color: "bg-yellow-50" },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-gray-400 mb-12">Impact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              className={`${stat.color} p-8 rounded-3xl text-center flex flex-col items-center transition-all`}
            >
              <div className="bg-white p-3 rounded-2xl shadow-sm mb-6">
                {stat.icon}
              </div>
              <div className="text-4xl font-bold text-gray-800 mb-2">{stat.value}</div>
              <div className="text-sm font-bold text-gray-700 mb-4">{stat.label}</div>
              <p className="text-xs text-gray-500 leading-relaxed">{stat.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const WhyMatters = () => {
  const items = [
    { title: "Growing Challenges", desc: "Growing challenges in the current education landscape and student mental health.", icon: <TrendingUp className="text-orange-500" /> },
    { title: "Elevated Impact Needed", desc: "Elevated impact needed to address the increasing need for connection.", icon: <ShieldCheck className="text-blue-500" /> },
    { title: "Year of the Data", desc: "The role of data in understanding and improving student wellbeing outcomes.", icon: <Database className="text-purple-500" /> },
    { title: "Student Voice at the Centre", desc: "Centering student voices in the development of wellbeing programs.", icon: <MessageSquare className="text-green-500" /> },
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center text-xs uppercase tracking-[0.3em] font-bold text-gray-400 mb-16">Why This Matters</h2>
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-6 items-start">
              <div className="bg-white p-4 rounded-2xl shadow-sm flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HowToParticipate = () => {
  return (
    <section className="py-20 bg-[#d1e2d3] px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center text-xs uppercase tracking-[0.3em] font-bold text-gray-500 mb-16">How to Participate</h2>
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-10">
            {[
              { step: "1", title: "Connect", desc: "Join our leading student wellbeing event, National Check-In Week.", icon: <Users /> },
              { step: "2", title: "Check Routines", desc: "Create space for students on the regular items and routines at school.", icon: <UserCircle /> },
              { step: "3", title: "Registration", desc: "Register your school and role to be part of the movement.", icon: <CheckCircle2 /> },
              { step: "4", title: "Enter Data", desc: "Register to the online platform for data collection and insights.", icon: <Database /> },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-gray-600 flex-shrink-0 shadow-sm">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Step {item.step}: {item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#fdfbf7] p-10 rounded-[2.5rem] shadow-xl">
            <h3 className="text-2xl font-bold mb-8">Register Form</h3>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="First Name" className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                <input type="text" placeholder="Last Name" className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              </div>
              <input type="email" placeholder="Email" className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <input type="text" placeholder="School Name" className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              <select className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-400 appearance-none">
                <option>Role</option>
                <option>Teacher</option>
                <option>Student</option>
                <option>Parent</option>
              </select>
              
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 text-xs text-gray-500 cursor-pointer">
                  <input type="checkbox" className="mt-1" />
                  <span>I agree to the terms and conditions and privacy policy.</span>
                </label>
                <label className="flex items-start gap-3 text-xs text-gray-500 cursor-pointer">
                  <input type="checkbox" className="mt-1" />
                  <span>I want to stay updated with news and events.</span>
                </label>
              </div>

              <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold mt-6 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                Register
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeaturedSpeakers = () => {
  const speakers = [
    { name: "Andrew Smith", role: "Professor", desc: "Leading expert in student wellbeing and mental health education.", img: "https://picsum.photos/seed/speaker1/200/200" },
    { name: "Sally Webster", role: "Professor", desc: "Specialist in educational psychology and student connection.", img: "https://picsum.photos/seed/speaker2/200/200" },
    { name: "Dianne Giblin", role: "Professor", desc: "Advocate for parent and community engagement in schools.", img: "https://picsum.photos/seed/speaker3/200/200" },
    { name: "Dr Mark Williams", role: "Senior Lecturer", desc: "Researcher focusing on data-driven wellbeing interventions.", img: "https://picsum.photos/seed/speaker4/200/200" },
    { name: "Gemma McLean", role: "Professor", desc: "Expert in school leadership and wellbeing culture.", img: "https://picsum.photos/seed/speaker5/200/200" },
    { name: "Kate Xavier", role: "Professor", desc: "Clinical psychologist specializing in adolescent mental health.", img: "https://picsum.photos/seed/speaker6/200/200" },
    { name: "Niski Bonus", role: "Professor", desc: "Researcher in social-emotional learning and student voice.", img: "https://picsum.photos/seed/speaker7/200/200" },
    { name: "Corrie Auckland", role: "Professor", desc: "Advocate for inclusive education and student support systems.", img: "https://picsum.photos/seed/speaker8/200/200" },
  ];

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center text-xs uppercase tracking-[0.3em] font-bold text-gray-400 mb-16">Featured Speakers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {speakers.map((speaker, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              className="bg-[#fdfbf7] p-6 rounded-3xl text-center"
            >
              <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4 border-4 border-white shadow-sm">
                <img src={speaker.img} alt={speaker.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <h3 className="font-bold text-lg">{speaker.name}</h3>
              <p className="text-blue-500 text-xs font-bold mb-3">{speaker.role}</p>
              <p className="text-gray-500 text-xs leading-relaxed">{speaker.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-[#1e3a8a] text-white py-16 px-6">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
      <div>
        <h4 className="font-bold mb-6 text-sm uppercase tracking-widest opacity-60">Contact Us</h4>
        <ul className="space-y-3 text-sm opacity-80">
          <li>1800 123 456</li>
          <li>info@checkinweek.com</li>
          <li>123 Education Way, Sydney</li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold mb-6 text-sm uppercase tracking-widest opacity-60">Quick Links</h4>
        <ul className="space-y-3 text-sm opacity-80">
          <li><a href="#" className="hover:text-blue-300">About Us</a></li>
          <li><a href="#" className="hover:text-blue-300">Resources</a></li>
          <li><a href="#" className="hover:text-blue-300">Privacy Policy</a></li>
          <li><a href="#" className="hover:text-blue-300">Terms of Service</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold mb-6 text-sm uppercase tracking-widest opacity-60">Social Media</h4>
        <div className="flex gap-4">
          <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"><Facebook size={18} /></a>
          <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"><Twitter size={18} /></a>
          <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"><Instagram size={18} /></a>
          <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"><Linkedin size={18} /></a>
        </div>
      </div>
      <div className="flex flex-col items-start md:items-end">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-900">
            <CheckCircle2 size={20} />
          </div>
          <span className="font-bold text-lg leading-tight text-left">National<br/>Check-In<br/>Week</span>
        </div>
        <p className="text-xs opacity-40 text-left md:text-right">© 2024 National Check-In Week.<br/>All rights reserved.</p>
      </div>
    </div>
  </footer>
);

// --- Main App ---

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Impact />
        <WhyMatters />
        <HowToParticipate />
        <FeaturedSpeakers />
      </main>
      <Footer />
    </div>
  );
}
