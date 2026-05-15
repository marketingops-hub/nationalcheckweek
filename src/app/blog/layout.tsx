import Header from "@/components/Header";
import FooterModern from "@/components/FooterModern";

export default function BlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="home1-root" style={{ minHeight: "100vh", background: "#fff" }}>
      <Header />
      {children}
      <FooterModern />
    </div>
  );
}
