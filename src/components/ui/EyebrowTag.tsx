interface EyebrowTagProps {
  children: React.ReactNode;
  variant?: "dark" | "light";
}

export default function EyebrowTag({ children, variant = "dark" }: EyebrowTagProps) {
  return <div className={`eyebrow-tag ${variant === "light" ? "eyebrow-tag--light" : ""}`}>{children}</div>;
}
