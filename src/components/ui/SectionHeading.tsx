interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
}

export default function SectionHeading({ children, className }: SectionHeadingProps) {
  return <h2 className={`section-heading ${className ?? ""}`}>{children}</h2>;
}
