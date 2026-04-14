import StateGrid from "./StateGrid";

export default function MapSection() {
  return (
    <section className="section section-alt" id="map">
      <div className="section-inner">
        <div className="section-tag">Interactive Regional Data</div>
        <h2>Wellbeing Across Australia</h2>
        <p className="section-lead">
          Every state and territory faces a different mix of challenges. Select a state or territory below to see the specific wellbeing issues documented there — from the NT&apos;s attendance and self-harm crisis to the ACT&apos;s hidden anxiety burden.
        </p>
        <StateGrid />
      </div>
    </section>
  );
}
