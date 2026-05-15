import { NextRequest, NextResponse } from 'next/server';
import { hubspotZoomSchema, safeValidate } from '@/lib/adminSchemas';
import * as rateLimit from '@/lib/rateLimit';

const limiter = rateLimit.create('hubspot-zoom', { limit: 5, windowSeconds: 300 });

// Zoom API credentials — must be set as environment variables
const ZOOM_ACCOUNT_ID    = process.env.ZOOM_ACCOUNT_ID!;
const ZOOM_CLIENT_ID     = process.env.ZOOM_CLIENT_ID!;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET!;

// HubSpot credentials
const HUBSPOT_PORTAL_ID    = process.env.HUBSPOT_PORTAL_ID!;
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN; // Optional

interface ZoomTokenResponse {
  access_token: string;
  expires_in: number;
}

interface ZoomRegistrationResponse {
  id: string;
  join_url: string;
  registrant_id: string;
}

interface ParticipantData {
  email: string;
  first_name: string;
  last_name: string;
}

/**
 * Get Zoom OAuth access token
 */
async function getZoomAccessToken(): Promise<string> {
  const authToken = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');

  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'account_credentials',
      account_id: ZOOM_ACCOUNT_ID,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoom authentication failed: ${error}`);
  }

  const data: ZoomTokenResponse = await response.json();
  return data.access_token;
}

/**
 * Register participant for Zoom webinar
 */
async function registerForZoomWebinar(
  webinarId: string,
  participant: ParticipantData,
  accessToken: string
): Promise<ZoomRegistrationResponse> {
  const response = await fetch(`https://api.zoom.us/v2/webinars/${webinarId}/registrants`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: participant.email,
      first_name: participant.first_name,
      last_name: participant.last_name,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoom registration failed: ${error}`);
  }

  return await response.json();
}

/**
 * Submit form data to HubSpot
 */
async function submitToHubSpot(formId: string, fields: Record<string, any>, context: any) {
  if (!HUBSPOT_PORTAL_ID) {
    throw new Error('HubSpot Portal ID not configured');
  }

  const hubspotFields = Object.entries(fields).map(([name, value]) => ({
    name,
    value: Array.isArray(value) ? value.join(';') : String(value),
  }));

  const response = await fetch(
    `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${formId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: hubspotFields,
        context,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HubSpot submission failed: ${error}`);
  }

  return await response.json();
}

/**
 * POST /api/hubspot-zoom-register
 * 
 * Handles form submissions that need both HubSpot and Zoom registration
 * 
 * Request body:
 * {
 *   hubspot_form_id: string;
 *   zoom_webinar_ids?: string[]; // Optional array of webinar IDs
 *   fields: {
 *     email: string;
 *     firstname: string;
 *     lastname: string;
 *     [key: string]: any;
 *   };
 *   context?: {
 *     pageUri?: string;
 *     pageName?: string;
 *     hutk?: string;
 *   };
 * }
 */
export async function POST(request: NextRequest) {
  const blocked = limiter.check(request);
  if (blocked) return blocked;

  try {
    const body = await request.json();

    const parsed = safeValidate(hubspotZoomSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { hubspot_form_id, zoom_webinar_ids, fields, context } = parsed.data;

    console.log('[HubSpot-Zoom] Received request:', {
      hubspot_form_id,
      zoom_webinar_ids,
      fields: { ...fields, email: '***' },
    });

    const results: any = {
      hubspot: null,
      zoom: [],
    };

    // Submit to HubSpot
    try {
      console.log('[HubSpot-Zoom] Submitting to HubSpot form:', hubspot_form_id);
      results.hubspot = await submitToHubSpot(hubspot_form_id, fields, context || {});
      console.log('[HubSpot-Zoom] HubSpot submission successful');
    } catch (error: any) {
      console.error('[HubSpot-Zoom] HubSpot submission failed:', error.message);
      return NextResponse.json(
        { error: 'HubSpot submission failed', details: error.message },
        { status: 500 }
      );
    }

    // Register for Zoom webinars if provided
    if (zoom_webinar_ids && Array.isArray(zoom_webinar_ids) && zoom_webinar_ids.length > 0) {
      try {
        console.log('[HubSpot-Zoom] Getting Zoom access token...');
        const zoomToken = await getZoomAccessToken();
        console.log('[HubSpot-Zoom] Zoom authentication successful');

        const participant: ParticipantData = {
          email: fields.email,
          first_name: fields.firstname,
          last_name: fields.lastname,
        };

        for (const webinarId of zoom_webinar_ids) {
          try {
            console.log(`[HubSpot-Zoom] Registering for webinar: ${webinarId}`);
            const registration = await registerForZoomWebinar(webinarId, participant, zoomToken);
            results.zoom.push({
              webinar_id: webinarId,
              success: true,
              registration,
            });
            console.log(`[HubSpot-Zoom] Successfully registered for webinar: ${webinarId}`);
          } catch (error: any) {
            console.error(`[HubSpot-Zoom] Failed to register for webinar ${webinarId}:`, error.message);
            results.zoom.push({
              webinar_id: webinarId,
              success: false,
              error: error.message,
            });
          }
        }
      } catch (error: any) {
        console.error('[HubSpot-Zoom] Zoom authentication failed:', error.message);
        results.zoom_error = error.message;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Registration completed',
      results,
    });

  } catch (error: any) {
    console.error('[HubSpot-Zoom] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
