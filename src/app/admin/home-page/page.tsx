import HomePageManager from "@/components/admin/HomePageManager";

export default function HomePageAdminPage() {
  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Site Settings</h1>
          <p className="swa-page-subtitle">
            Manage homepage content, site-wide header/footer, logos, and global styling
          </p>
        </div>
        <a 
          href="/" 
          target="_blank"
          className="swa-btn"
          style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)', textDecoration: 'none' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span>
          Preview Homepage
        </a>
      </div>
      <HomePageManager />
    </div>
  );
}
