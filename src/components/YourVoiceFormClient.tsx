'use client';

import { useEffect } from 'react';

interface YourVoiceFormClientProps {
  formId: string;
  portalId: string;
  region: string;
}

export default function YourVoiceFormClient({ formId, portalId, region }: YourVoiceFormClientProps) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://js-${region}.hsforms.net/forms/embed/${portalId}.js`;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [portalId, region]);

  return (
    <div 
      className="hs-form-frame" 
      data-region={region}
      data-form-id={formId}
      data-portal-id={portalId}
    />
  );
}
