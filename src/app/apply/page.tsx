import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ApplyForm from '@/components/ApplyForm';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Apply to be an Ambassador',
  description: 'Apply to become a Schools Wellbeing Ambassador and help shape student wellbeing across Australia.',
};

export default async function ApplyPage() {
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
              <span>✦</span> Join the movement
            </div>
            <h1 className="page-hero__title">Apply to be an Ambassador</h1>
            <p className="page-hero__subtitle">
              Are you passionate about student wellbeing? We're looking for educators, 
              school leaders, health professionals, and community figures to join our 
              Ambassador program and help shape the future of student wellbeing in Australia.
            </p>
          </div>
        </div>

        {/* Info strip */}
        <div className="info-note">
          <div className="info-note__inner">
            <span className="info-note__icon">💡</span>
            <p>
              <strong>What does an Ambassador do?</strong> Ambassadors champion student 
              wellbeing in their community, participate in events and panels, share their 
              expertise, and help amplify our national message. All backgrounds welcome.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="inner-content inner-content--narrow">
          <ApplyForm categories={categories ?? []} />
        </div>
      </main>
      <Footer />
    </>
  );
}
