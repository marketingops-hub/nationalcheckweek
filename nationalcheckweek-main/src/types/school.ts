/** Full school_profiles row — used by SchoolEditForm and the import/edit API routes */
export interface SchoolProfile {
  id: string;
  calendar_year: number | null;
  acara_sml_id: number | null;
  school_name: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  school_sector: string | null;
  school_type: string | null;
  school_url: string | null;
  governing_body: string | null;
  governing_body_url: string | null;
  year_range: string | null;
  geolocation: string | null;
  icsea: number | null;
  icsea_percentile: number | null;
  bottom_sea_quarter_pct: number | null;
  lower_middle_sea_quarter_pct: number | null;
  upper_middle_sea_quarter_pct: number | null;
  top_sea_quarter_pct: number | null;
  teaching_staff: number | null;
  fte_teaching_staff: number | null;
  non_teaching_staff: number | null;
  fte_non_teaching_staff: number | null;
  total_enrolments: number | null;
  girls_enrolments: number | null;
  boys_enrolments: number | null;
  fte_enrolments: number | null;
  indigenous_enrolments_pct: number | null;
  lbote_yes_pct: number | null;
  lbote_no_pct: number | null;
  lbote_not_stated_pct: number | null;
  created_at: string;
}
