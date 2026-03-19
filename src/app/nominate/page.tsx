import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import NominateForm from '@/components/NominateForm';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Nominate an Ambassador',
  description: 'Know someone who should be a Schools Wellbeing Ambassador? Nominate them today.',
};

export default async function NominatePage() {
  const sb = await createClient();
  const { data: categories } = await sb
    .from('ambassador_categories')
    .select('id, name, slug, icon, color')
    .order('sort_order');

  return (
    <>
      <Nav />
      <main>
        {/* Hero */}
        <div className="page-hero page-hero--centered">
          <div className="page-hero__inner" style={{ textAlign: 'center' }}>
            <div className="hero-tag">
              <span>⭐</span> Recognise greatness
            </div>
            <h1 className="page-hero__title">Nominate an Ambassador</h1>
            <p className="page-hero__subtitle">
              Know a teacher, school leader, psychologist, or community champion who 
              inspires others and cares deeply about student wellbeing? Nominate them 
              to become a Schools Wellbeing Ambassador.
            </p>
          </div>
        </div>

        {/* Info strip */}
        <div className="info-note">
          <div className="info-note__inner">
            <span className="info-note__icon">🤝</span>
            <p>
              <strong>Who can you nominate?</strong> Anyone who demonstrates leadership 
              in student wellbeing — educators, mental health professionals, industry 
              leaders, researchers, or public figures. They don't need to know you're 
              nominating them, but a heads-up is always appreciated!
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="inner-content inner-content--narrow">
          <NominateForm categories={categories ?? []} />
        </div>
      </main>
      <Footer />
    </>
  );
}
