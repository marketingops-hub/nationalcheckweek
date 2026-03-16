interface Props {
  bg: string;
  color: string;
  label: string;
}

export default function BadgePill({ bg, color, label }: Props) {
  return (
    <span style={{
      background: bg,
      color,
      fontSize: "0.72rem",
      fontWeight: 700,
      padding: "3px 10px",
      borderRadius: 100,
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      display: "inline-block",
    }}>
      {label}
    </span>
  );
}
