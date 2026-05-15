import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import RegisterPageClient from '@/components/register/RegisterPageClient';

interface RegisterPageData {
  id: string;
  heading: string;
  subheading: string | null;
  description: string | null;
  right_column_content: Array<{
    type: 'heading' | 'paragraph' | 'list';
    content?: string;
    items?: string[];
  }>;
  hubspot_form_id: string | null;
  hubspot_portal_id: string | null;
  background_color: string;
}

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('register_page')
    .select('seo_title, seo_description')
    .single();

  return {
    title: data?.seo_title || 'Register — National Check-in Week',
    description: data?.seo_description || 'Register your school for National Check-in Week 2026',
  };
}

export default async function RegisterPage() {
  const supabase = await createClient();
  
  const { data: pageData, error } = await supabase
    .from('register_page')
    .select('*')
    .single();

  if (error || !pageData) {
    return (
      <>
        <div className="page-hero page-hero--centered">
          <div className="page-hero__inner">
            <h1 className="page-hero__title">Registration</h1>
            <p className="page-hero__subtitle">Unable to load page content. Please try again later.</p>
          </div>
        </div>
      </>
    );
  }

  return <RegisterPageClient pageData={pageData as RegisterPageData} />;
}
