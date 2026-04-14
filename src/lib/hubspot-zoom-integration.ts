/**
 * HubSpot + Zoom Integration Utility
 * 
 * This utility helps integrate HubSpot form submissions with automatic Zoom webinar registration.
 * It replaces the WordPress PHP functionality from the previous site.
 */

export interface HubSpotZoomRegistrationData {
  hubspot_form_id: string;
  zoom_webinar_ids?: string[];
  fields: {
    email: string;
    firstname: string;
    lastname: string;
    [key: string]: any;
  };
  context?: {
    pageUri?: string;
    pageName?: string;
    hutk?: string;
  };
}

export interface HubSpotZoomRegistrationResult {
  success: boolean;
  message: string;
  results: {
    hubspot: any;
    zoom: Array<{
      webinar_id: string;
      success: boolean;
      registration?: any;
      error?: string;
    }>;
    zoom_error?: string;
  };
}

/**
 * Submit form data to HubSpot and optionally register for Zoom webinars
 * 
 * @param data Registration data including HubSpot form ID, fields, and optional Zoom webinar IDs
 * @returns Promise with registration results
 * 
 * @example
 * ```typescript
 * const result = await submitHubSpotWithZoom({
 *   hubspot_form_id: '12345678',
 *   zoom_webinar_ids: ['87654321', '87654322'],
 *   fields: {
 *     email: 'user@example.edu.au',
 *     firstname: 'John',
 *     lastname: 'Doe',
 *     role: 'Principal',
 *     school_name_2023: 'Example School'
 *   },
 *   context: {
 *     pageUri: window.location.href,
 *     pageName: document.title,
 *     hutk: getCookie('hubspotutk')
 *   }
 * });
 * ```
 */
export async function submitHubSpotWithZoom(
  data: HubSpotZoomRegistrationData
): Promise<HubSpotZoomRegistrationResult> {
  try {
    const response = await fetch('/api/hubspot-zoom-register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return await response.json();
  } catch (error: any) {
    console.error('[HubSpot-Zoom Integration] Error:', error);
    throw error;
  }
}

/**
 * Get HubSpot tracking cookie (hutk)
 */
export function getHubSpotTrackingCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const name = 'hubspotutk=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  
  for (let cookie of cookieArray) {
    cookie = cookie.trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length);
    }
  }
  
  return null;
}

/**
 * Helper to prepare context object for HubSpot submission
 */
export function getHubSpotContext() {
  if (typeof window === 'undefined') {
    return {};
  }

  return {
    pageUri: window.location.href,
    pageName: document.title,
    hutk: getHubSpotTrackingCookie(),
  };
}

/**
 * Field mapping from your form fields to HubSpot properties
 * Based on the WordPress PHP implementation
 */
export const HUBSPOT_FIELD_MAPPING: Record<string, string> = {
  email: 'email',
  first_name: 'firstname',
  last_name: 'lastname',
  sis_provider: 'school_sis___sms_provider',
  role: 'role',
  go_access: 'lsgo_access_pref',
  event_subscription: 'bulk_zoom_registration',
  school_id: 'lsgo_associated_company',
  manual_school: 'school_name_2023',
  newsletter_opt_in: 'subscribe_to_newsletter',
  number_of_guests: 'lsgo_number_of_additional_guests',
  event_to_attend: 'lsgo_form_event_to_attend',
  dietary_requirements: 'attendee_dietary_requirements',
  allergy_details: 'attendee_dietary_requirements_allergies',
  other_dietary_details: 'attendee_dietary_requirements_other',
};

/**
 * Map form fields to HubSpot property names
 */
export function mapFieldsToHubSpot(formData: Record<string, any>): Record<string, any> {
  const mappedFields: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(formData)) {
    const hubspotField = HUBSPOT_FIELD_MAPPING[key] || key;
    mappedFields[hubspotField] = value;
  }
  
  return mappedFields;
}
