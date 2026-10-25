import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import RegisterPageClient from '@/components/register/RegisterPageClient';
import { applyEventYear, getEventYear } from '@/lib/eventDate';

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

  const year = await getEventYear();
  return {
    title: applyEventYear(data?.seo_title, year) || 'Register — National Check-in Week',
    description:
      applyEventYear(data?.seo_description, year) ||
      `Register your school for National Check-in Week ${year}`,
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

  // Keep "National Check-in Week 20xx" copy in step with the next event year
  // (the hero countdown date) so it never needs a manual edit each year.
  const year = await getEventYear();
  const page = pageData as RegisterPageData;
  const withYear: RegisterPageData = {
    ...page,
    heading: applyEventYear(page.heading, year),
    subheading: applyEventYear(page.subheading, year),
    description: applyEventYear(page.description, year),
    right_column_content: (page.right_column_content ?? []).map((block) => ({
      ...block,
      content: applyEventYear(block.content, year),
      items: block.items?.map((item) => applyEventYear(item, year)),
    })),
  };

  return <RegisterPageClient pageData={withYear} />;
}
