'use client';

export interface AmbassadorCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Ambassador {
  id: string;
  name: string;
  title?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  slug: string;
  sortOrder: number;
  active: boolean;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  categoryId?: string | null;
  comment?: string | null;
  event_link?: string | null;
  ambassador_categories?: AmbassadorCategory | null;
  createdAt: string;
  updatedAt: string;
}

export type AmbassadorFormData = {
  name: string; title: string; bio: string; photoUrl: string;
  slug: string; sortOrder: number; active: boolean;
  linkedinUrl: string; websiteUrl: string; categoryId: string; comment: string; event_link: string;
};

export const emptyForm: AmbassadorFormData = {
  name: '', title: '', bio: '', photoUrl: '', slug: '', sortOrder: 0,
  active: true, linkedinUrl: '', websiteUrl: '', categoryId: '', comment: '', event_link: '',
};

export function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
