import Link from "next/link";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: string;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
}

export default function PageHero({ eyebrow, title, subtitle, icon, backHref, backLabel, children }: PageHeroProps) {
  return (
    <div className="page-hero">
      {backHref && (
        <div className="page-hero__breadcrumb">
          <Link href={backHref}>← {backLabel || "Back"}</Link>
        </div>
      )}
      {eyebrow && <div className="eyebrow-tag">{eyebrow}</div>}
      {icon && <div className="page-hero__icon">{icon}</div>}
      <h1 className="page-hero__title">{title}</h1>
      {subtitle && <p className="page-hero__subtitle">{subtitle}</p>}
      {children}
    </div>
  );
}
