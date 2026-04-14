'use client';

import { useState } from 'react';

export default function TestZoomIntegration() {
  const [formData, setFormData] = useState({
    hubspot_form_id: '',
    zoom_webinar_id: '',
    email: '',
    firstname: '',
    lastname: '',
    role: 'Principal',
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/hubspot-zoom-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hubspot_form_id: formData.hubspot_form_id,
          zoom_webinar_ids: formData.zoom_webinar_id ? [formData.zoom_webinar_id] : [],
          fields: {
            email: formData.email,
            firstname: formData.firstname,
            lastname: formData.lastname,
            role: formData.role,
          },
          context: {
            pageUri: window.location.href,
            pageName: 'Test Integration',
          },
        }),
      });

      const data = await response.json();
      setResult({ status: response.status, data });
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '50px auto', padding: 20, fontFamily: 'system-ui' }}>
      <h1>HubSpot + Zoom Integration Test</h1>
      <p style={{ color: '#666', marginBottom: 30 }}>
        Test the integration by submitting a form with HubSpot and Zoom webinar IDs.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>
            HubSpot Form ID *
          </label>
          <input
            type="text"
            value={formData.hubspot_form_id}
            onChange={(e) => setFormData({ ...formData, hubspot_form_id: e.target.value })}
            required
            placeholder="e.g., 12345678"
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>
            Zoom Webinar ID (optional)
          </label>
          <input
            type="text"
            value={formData.zoom_webinar_id}
            onChange={(e) => setFormData({ ...formData, zoom_webinar_id: e.target.value })}
            placeholder="e.g., 87654321"
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="test@example.edu.au"
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>First Name *</label>
          <input
            type="text"
            value={formData.firstname}
            onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
            required
            placeholder="John"
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>Last Name *</label>
          <input
            type="text"
            value={formData.lastname}
            onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
            required
            placeholder="Doe"
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 600 }}>Role *</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            required
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4 }}
          >
            <option value="Principal">Principal</option>
            <option value="Assistant Principal">Assistant Principal</option>
            <option value="Teacher">Teacher</option>
            <option value="Learning Support">Learning Support</option>
            <option value="Wellbeing Professional">Wellbeing Professional</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: loading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: 10,
          }}
        >
          {loading ? 'Testing...' : 'Test Integration'}
        </button>
      </form>

      {result && (
        <div
          style={{
            marginTop: 30,
            padding: 20,
            background: result.error ? '#fee' : '#efe',
            border: `1px solid ${result.error ? '#fcc' : '#cfc'}`,
            borderRadius: 4,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Result:</h3>
          <pre style={{ overflow: 'auto', fontSize: 12 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
