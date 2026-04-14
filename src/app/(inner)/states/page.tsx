import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Explore Your State | National Check-in Week",
  description: "Discover student wellbeing data, programs, and resources for your state across Australia.",
};

interface StateData {
  id: string;
  name: string;
  slug: string;
  code: string;
  color: string;
  description: string;
  published: boolean;
}

export default async function StatesPage() {
  const sb = await createClient();
  
  const { data: states, error } = await sb
    .from("states")
    .select("id, name, slug, code, color, description, published")
    .eq("published", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching states:", error);
    throw new Error(error.message);
  }

  return (
    <>
      {/* Hero */}
      <div className="page-hero">
        <div className="page-hero__inner">
          <div className="page-hero__breadcrumb">
            <Link href="/">Home</Link> / States
          </div>
          <h1 className="page-hero__title">Explore Your State</h1>
          <p className="page-hero__subtitle">
            Discover student wellbeing data, programs, and resources for your state across Australia.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main id="main-content" className="inner-content">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* States Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
              marginBottom: "60px",
            }}
          >
            {states && states.length > 0 ? (
              states.map((state) => (
                <Link
                  key={state.id}
                  href={`/states/${state.slug}`}
                  className="state-card"
                >
                  {/* Color Bar */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "4px",
                      background: state.color || "var(--primary)",
                    }}
                  />

                  {/* State Code Badge */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "56px",
                      height: "56px",
                      borderRadius: "12px",
                      background: `${state.color || "var(--primary)"}15`,
                      marginBottom: "16px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: 700,
                        color: state.color || "var(--primary)",
                      }}
                    >
                      {state.code}
                    </span>
                  </div>

                  {/* State Name */}
                  <h2
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "var(--dark)",
                      marginBottom: "12px",
                      lineHeight: 1.3,
                    }}
                  >
                    {state.name}
                  </h2>

                  {/* Description */}
                  {state.description && (
                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: "var(--text-mid)",
                        lineHeight: 1.6,
                        marginBottom: "16px",
                      }}
                    >
                      {state.description}
                    </p>
                  )}

                  {/* Learn More Link */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: state.color || "var(--primary)",
                    }}
                  >
                    View state data
                    <span style={{ fontSize: "1rem" }}>→</span>
                  </div>
                </Link>
              ))
            ) : (
              <div
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  padding: "80px 20px",
                  color: "var(--text-light)",
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "16px", opacity: 0.5 }}>
                  🗺️
                </div>
                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: "var(--dark)",
                    marginBottom: "8px",
                  }}
                >
                  No states available
                </h3>
                <p style={{ fontSize: "0.9rem" }}>
                  State data will be available soon.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
