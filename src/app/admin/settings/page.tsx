export default function AdminSettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold mb-1" style={{ color: '#E6EDF3' }}>Settings</h1>
        <p className="text-sm" style={{ color: '#6E7681' }}>
          Site configuration and API integrations.
        </p>
      </div>
      <div
        className="rounded-xl p-8 text-center"
        style={{ background: '#161B22', border: '1px solid #21262D' }}
      >
        <div className="text-4xl mb-3">⚙️</div>
        <p className="text-sm font-medium mb-1" style={{ color: '#C9D1D9' }}>Coming soon</p>
        <p className="text-xs" style={{ color: '#484F58' }}>
          Settings including OpenAI API key configuration will be added in the next phase.
        </p>
      </div>
    </div>
  );
}
