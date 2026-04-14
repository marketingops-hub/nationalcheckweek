'use client';

import { useEffect } from 'react';

export default function ApplyFormClient() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js-ap1.hsforms.net/forms/embed/4596264.js';
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div 
      className="hs-form-frame" 
      data-region="ap1" 
      data-form-id="18a4add9-d715-4d94-8e65-a24ee4926afa" 
      data-portal-id="4596264"
    />
  );
}
