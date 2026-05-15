import TypographyEditor from "@/components/admin/TypographyEditor";
import { TypographyErrorBoundary } from "@/components/admin/TypographyErrorBoundary";

export default function TypographyPage() {
  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Typography Settings</h1>
          <p className="swa-page-subtitle">
            Control font families, sizes, and weights across the entire site
          </p>
        </div>
      </div>
      <TypographyErrorBoundary>
        <TypographyEditor />
      </TypographyErrorBoundary>
    </div>
  );
}
