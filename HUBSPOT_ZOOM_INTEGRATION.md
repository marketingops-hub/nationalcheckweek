# HubSpot + Zoom Integration

This document explains how to integrate HubSpot form submissions with automatic Zoom webinar registration in the Next.js application.

## Overview

This integration replaces the WordPress PHP functionality (`lifeskills.php` and `live-events.php`) with a Next.js API route that:

1. Submits form data to HubSpot
2. Automatically registers users for Zoom webinars
3. Handles multiple webinar registrations in a single submission

## Setup

### 1. Environment Variables

Add the following to your `.env.local` file:

```bash
# HubSpot Configuration
HUBSPOT_PORTAL_ID=your_portal_id_here
HUBSPOT_ACCESS_TOKEN=your_access_token_here

# Zoom credentials are hardcoded in the API route
# If you need to change them, edit: src/app/api/hubspot-zoom-register/route.ts
```

### 2. API Endpoint

The integration is available at:
```
POST /api/hubspot-zoom-register
```

## Usage

### Option 1: Using the Utility Function (Recommended)

```typescript
import { submitHubSpotWithZoom, getHubSpotContext, mapFieldsToHubSpot } from '@/lib/hubspot-zoom-integration';

// Example: Event registration form
async function handleEventRegistration(formData: any) {
  try {
    const result = await submitHubSpotWithZoom({
      hubspot_form_id: '12345678', // Your HubSpot form ID
      zoom_webinar_ids: ['87654321', '87654322'], // Array of Zoom webinar IDs
      fields: mapFieldsToHubSpot({
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        school_id: formData.schoolId,
        manual_school: formData.schoolName,
      }),
      context: getHubSpotContext(),
    });

    if (result.success) {
      console.log('Registration successful!');
      console.log('HubSpot:', result.results.hubspot);
      console.log('Zoom registrations:', result.results.zoom);
    }
  } catch (error) {
    console.error('Registration failed:', error);
  }
}
```

### Option 2: Direct API Call

```typescript
async function registerUser(email: string, firstName: string, lastName: string, webinarIds: string[]) {
  const response = await fetch('/api/hubspot-zoom-register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      hubspot_form_id: '12345678',
      zoom_webinar_ids: webinarIds,
      fields: {
        email: email,
        firstname: firstName,
        lastname: lastName,
        role: 'Principal',
        school_name_2023: 'Example School',
      },
      context: {
        pageUri: window.location.href,
        pageName: document.title,
        hutk: getCookie('hubspotutk'),
      },
    }),
  });

  const result = await response.json();
  return result;
}
```

### Option 3: HubSpot Form Embed with Custom Handler

If you're using HubSpot's embedded forms, you can add a custom `onFormSubmit` handler:

```typescript
// In your component
useEffect(() => {
  if (typeof window !== 'undefined' && (window as any).hbspt) {
    (window as any).hbspt.forms.create({
      region: "na1",
      portalId: "YOUR_PORTAL_ID",
      formId: "YOUR_FORM_ID",
      target: "#hubspot-form",
      onFormSubmit: async function($form: any) {
        const formData = $form.serializeArray();
        const fields: any = {};
        
        formData.forEach((field: any) => {
          fields[field.name] = field.value;
        });

        // Register for Zoom webinars
        const webinarIds = ['87654321', '87654322'];
        
        try {
          await fetch('/api/hubspot-zoom-register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hubspot_form_id: 'YOUR_FORM_ID',
              zoom_webinar_ids: webinarIds,
              fields: fields,
              context: {
                pageUri: window.location.href,
                pageName: document.title,
              },
            }),
          });
        } catch (error) {
          console.error('Zoom registration failed:', error);
        }
      }
    });
  }
}, []);
```

## Field Mapping

The integration automatically maps common form fields to HubSpot properties:

| Form Field | HubSpot Property |
|------------|------------------|
| `email` | `email` |
| `first_name` | `firstname` |
| `last_name` | `lastname` |
| `sis_provider` | `school_sis___sms_provider` |
| `role` | `role` |
| `go_access` | `lsgo_access_pref` |
| `event_subscription` | `bulk_zoom_registration` |
| `school_id` | `lsgo_associated_company` |
| `manual_school` | `school_name_2023` |
| `newsletter_opt_in` | `subscribe_to_newsletter` |

See `HUBSPOT_FIELD_MAPPING` in `src/lib/hubspot-zoom-integration.ts` for the complete list.

## Response Format

```typescript
{
  success: true,
  message: "Registration completed",
  results: {
    hubspot: {
      // HubSpot API response
      inlineMessage: "Thanks for submitting the form."
    },
    zoom: [
      {
        webinar_id: "87654321",
        success: true,
        registration: {
          id: "...",
          join_url: "https://zoom.us/w/...",
          registrant_id: "..."
        }
      },
      {
        webinar_id: "87654322",
        success: true,
        registration: { ... }
      }
    ]
  }
}
```

## Error Handling

The API will return appropriate HTTP status codes:

- `400` - Bad request (missing required fields)
- `500` - Server error (HubSpot or Zoom API failure)

Example error response:
```json
{
  "error": "HubSpot submission failed",
  "details": "Invalid form ID"
}
```

## Zoom Credentials

The Zoom API credentials are currently hardcoded in the API route:

```typescript
// src/app/api/hubspot-zoom-register/route.ts
const ZOOM_ACCOUNT_ID = 'RDM4NbWnTBuok6yj0hn_lQ';
const ZOOM_CLIENT_ID = 'X99BptvrR2yeskwfG8H7Nw';
const ZOOM_CLIENT_SECRET = 'aLwCRqzzzvq59i922XSBJidVMv0T2I40';
```

**Security Note**: For production, consider moving these to environment variables.

## Testing

Test the integration with a simple curl command:

```bash
curl -X POST http://localhost:3000/api/hubspot-zoom-register \
  -H "Content-Type: application/json" \
  -d '{
    "hubspot_form_id": "12345678",
    "zoom_webinar_ids": ["87654321"],
    "fields": {
      "email": "test@example.edu.au",
      "firstname": "Test",
      "lastname": "User",
      "role": "Principal"
    }
  }'
```

## Migration from WordPress

This integration replaces the following WordPress files:
- `lifeskills.php` - General form submissions with Zoom registration
- `live-events.php` - Event-specific registrations with guest handling

Key differences:
1. **No WordPress dependencies** - Pure Next.js/TypeScript
2. **Serverless** - Runs as an API route on Vercel
3. **Type-safe** - Full TypeScript support
4. **Simplified** - Single endpoint for all registrations

## Troubleshooting

### Check server logs
```bash
# In Vercel dashboard or local terminal
# Look for logs prefixed with [HubSpot-Zoom]
```

### Common issues

1. **HubSpot submission fails**
   - Verify `HUBSPOT_PORTAL_ID` is set correctly
   - Check form ID is valid
   - Ensure required fields (email, firstname, lastname) are provided

2. **Zoom registration fails**
   - Verify webinar IDs are correct
   - Check Zoom credentials are valid
   - Ensure webinar registration is enabled in Zoom settings

3. **CORS errors**
   - The API route is on the same domain, so CORS shouldn't be an issue
   - If calling from external domain, add CORS headers to the API route

## Support

For issues or questions, check:
- API route: `src/app/api/hubspot-zoom-register/route.ts`
- Utility functions: `src/lib/hubspot-zoom-integration.ts`
- Server logs in Vercel dashboard
