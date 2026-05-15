import Header from "@/components/Header";
import FooterModern from "@/components/FooterModern";

export default function InnerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="home1-root" style={{ minHeight: "100vh", background: "#fff" }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Header />
      {children}
      <FooterModern />
    </div>
  );
}
