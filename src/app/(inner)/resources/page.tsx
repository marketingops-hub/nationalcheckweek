import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resources — National Check-in Week",
  description:
    "Free tools, lesson plans, courses and fact sheets from our partners — designed to support student wellbeing in Australian schools.",
};

export const revalidate = 3600;

const PARTNERS = [
  {
    name: "Life Skills GO",
    sections: [
      {
        heading: "Gain access to the Life Skills GO Platform",
        body: "Access Life Skills GO for FREE for two weeks, utilise this check-in tool to access your whole-school wellbeing and evaluate the effectiveness of your current wellbeing programs today.",
        linkLabel: "Activate Life Skills GO here",
        href: "https://www.lifeskillsgroup.com.au/en-au/life-skills-go-free-trial",
      },
      {
        heading: "Access a range of resources from Life Skills GO",
        body: "Included are downloadable lesson plans, emotional literacy cards, colouring in books, start and end of term reflections for teachers.",
        linkLabel: "Access Here",
        href: "https://nationalcheckinweek.com/life-skills-go-resources/",
      },
    ],
  },
  {
    name: "headspace",
    sections: [
      {
        heading: "Access a range of resources from headspace",
        body: "headspace has a plethora of free resources and fact sheets available that are designed for educators and parents.",
        linkLabel: "Access Here",
        href: "https://nationalcheckinweek.com/headspace-resources/",
      },
    ],
  },
  {
    name: "Canvas Instructure",
    sections: [
      {
        heading: "Access a range of resources from Canvas Instructure",
        body: "Access a range of free courses from Canvas, designed for educators and students.",
        linkLabel: "Access Here",
        href: "https://nationalcheckinweek.com/canvas-instructure-resources/",
      },
    ],
  },
  {
    name: "Education Services Australia",
    sections: [
      {
        heading: "Access a range of resources from Education Services Australia",
        body: "Explore the ESA online resource suite to find digital resources, professional learning, webinars, lesson plans, assessment tools, apps and more for educators and parents.",
        linkLabel: "Access Here",
        href: "https://www.esa.edu.au/resources/online-resources",
      },
    ],
  },
  {
    name: "Together for Humanity",
    sections: [
      {
        heading: "Access a range of resources from Together for Humanity",
        body: "Included are free resources for teachers, classroom use and professional learning. These resources cover a range of topics; Aboriginal and Torres Strait Islander Perspectives, Beliefs and Faith, Bullying, Racism and Prejudice, Cultural Diversity, Identity and Values, Mindset and Resilience and Relationships and Belonging.",
        linkLabel: "Access Here",
        href: "https://togetherforhumanity.org.au/education/",
      },
    ],
  },
  {
    name: "Upschool",
    sections: [
      {
        heading: "Access a range of resources from Upschool",
        body: "Purposeful Education for a Better Tomorrow — Inspirational Courses, Resources and Tools for Teachers and Students, Everywhere. Explore the free Upschool online resources and courses suite to find digital courses for students and educators. Included are free one-week to ten-week courses on topics ranging from The Power of Positive Self-Talk for Students, Importance of Sleep, and Values for a Better Tomorrow.",
        linkLabel: "Access Here",
        href: "https://courses.upschool.co/",
      },
    ],
  },
  {
    name: "School Can't Australia",
    sections: [
      {
        heading: "Access a range of resources from School Can't Australia",
        body: "School Can't Australia (SCA) was established in 2014, in response to the lack of dedicated support services for families whose children and young people are experiencing school attendance difficulties. SCA provides peer support for parents and primary carers through a Facebook group. Access a range of free resources.",
        linkLabel: "Access Here",
        href: "https://nationalcheckinweek.com/school-cant-australia-resources/",
      },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <>
      <div className="page-hero page-hero--centered">
        <div className="page-hero__inner">
          <div className="hero-tag">📚 Partner Resources</div>
          <h1 className="page-hero__title">Resources</h1>
          <p className="page-hero__subtitle">
            Free tools, lesson plans, courses and fact sheets from our partners — designed to support student wellbeing in Australian schools.
          </p>
        </div>
      </div>

      <main className="inner-content" id="main-content">
        {PARTNERS.map((partner) => (
          <section key={partner.name} className="inner-section">
            <h2 className="section-heading">{partner.name}</h2>
            <div className="stack stack--gap-md">
              {partner.sections.map((s) => (
                <div key={s.heading} className="resource-card">
                  <h3 className="resource-card__heading">{s.heading}</h3>
                  <p className="resource-card__body">{s.body}</p>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resource-card__link"
                    aria-label={`${s.linkLabel} — ${partner.name}`}
                  >
                    {s.linkLabel} →
                  </a>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
