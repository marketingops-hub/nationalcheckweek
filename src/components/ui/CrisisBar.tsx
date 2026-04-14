interface CrisisBarProps {
  variant?: "dark" | "light";
}

export default function CrisisBar({ variant = "dark" }: CrisisBarProps) {
  return (
    <div className={`crisis-footer ${variant === "light" ? "crisis-footer--light" : ""}`}>
      <p>
        <strong>If you or someone you know is in crisis:</strong>{" "}
        Lifeline <strong>13 11 14</strong> · Kids Helpline <strong>1800 55 1800</strong> · Beyond Blue <strong>1300 22 4636</strong>
      </p>
    </div>
  );
}
