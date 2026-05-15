interface LogosSectionProps {
  logos: Array<{
    id: string;
    organization_name: string;
    logo_url: string | null;
  }>;
}

export function LogosSection({ logos }: LogosSectionProps) {
  if (!logos || logos.length === 0) return null;
  
  return (
    <section className="home1-logos fade-up">
      <div className="home1-logos-label">Trusted by leading organisations</div>
      <div className="home1-logos-row">
        {logos.map(logo => (
          <div key={logo.id} className="home1-logo-badge">
            {logo.organization_name}
          </div>
        ))}
      </div>
    </section>
  );
}
