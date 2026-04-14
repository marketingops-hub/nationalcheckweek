'use client';

import { useEffect } from 'react';

export default function NominateFormClient() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '//js-ap1.hsforms.net/forms/embed/v2.js';
    script.charset = 'utf-8';
    script.type = 'text/javascript';
    script.onload = () => {
      if (window.hbspt) {
        window.hbspt.forms.create({
          portalId: "4596264",
          formId: "3b69e636-532a-49e4-8a56-5752b70de2a9",
          region: "ap1",
          target: "#hubspot-nominate-form"
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return <div id="hubspot-nominate-form" />;
}
