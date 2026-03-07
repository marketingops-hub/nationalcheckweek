"use client";

import { useState } from "react";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

const INPUT = "w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all";
const INPUT_STYLE = { background: "#fff", border: "1px solid #cbd5e1", color: "#0f172a", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" };

function fmt(d: string | null) {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function UsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function clearMessages() { setError(""); setSuccess(""); }

  async function handleCreate() {
    if (!newEmail || !newPassword) { setError("Email and password are required."); return; }
    setBusy(true); clearMessages();
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail, password: newPassword }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setBusy(false); return; }
    setUsers(u => [...u, { id: data.id, email: data.email, created_at: new Date().toISOString(), last_sign_in_at: null }]);
    setNewEmail(""); setNewPassword(""); setShowCreate(false);
    setSuccess(`User ${data.email} created.`);
    setBusy(false);
  }

  async function handleEdit() {
    if (!editUser) return;
    if (!editEmail && !editPassword) { setError("Provide a new email or password."); return; }
    setBusy(true); clearMessages();
    const body: Record<string, string> = {};
    if (editEmail) body.email = editEmail;
    if (editPassword) body.password = editPassword;
    const res = await fetch(`/api/admin/users/${editUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setBusy(false); return; }
    if (editEmail) {
      setUsers(u => u.map(u2 => u2.id === editUser.id ? { ...u2, email: editEmail } : u2));
    }
    setEditUser(null); setEditEmail(""); setEditPassword("");
    setSuccess("User updated successfully.");
    setBusy(false);
  }

  async function handleResetPassword(user: User) {
    setBusy(true); clearMessages();
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ send_reset: true, email: user.email }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setBusy(false); return; }
    setSuccess(`Password reset email sent to ${user.email}.`);
    setBusy(false);
  }

  async function handleDelete(user: User) {
    if (!confirm(`Delete user ${user.email}? This cannot be undone.`)) return;
    setBusy(true); clearMessages();
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setBusy(false); return; }
    setUsers(u => u.filter(u2 => u2.id !== user.id));
    setSuccess(`User ${user.email} deleted.`);
    setBusy(false);
  }

  const LABEL = "block text-xs font-semibold mb-1.5 uppercase tracking-wide";
  const LABEL_STYLE = { color: "var(--admin-text-subtle)" };

  const Modal = ({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(2px)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
        <h2 className="text-base font-bold mb-1" style={{ color: "var(--admin-text-primary)" }}>{title}</h2>
        {sub && <p className="text-xs mb-5" style={{ color: "var(--admin-text-subtle)" }}>{sub}</p>}
        {children}
      </div>
    </div>
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm" style={{ color: "var(--admin-text-subtle)" }}>{users.length} user{users.length !== 1 ? "s" : ""}</span>
        <button onClick={() => { setShowCreate(true); clearMessages(); }} className="admin-btn admin-btn-primary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New User
        </button>
      </div>

      {/* Feedback */}
      {!showCreate && !editUser && error   && <div className="admin-alert admin-alert-error mb-4">{error}</div>}
      {!showCreate && !editUser && success && <div className="admin-alert admin-alert-success mb-4">{success}</div>}

      {/* Create modal */}
      {showCreate && (
        <Modal title="Create New User" sub="The new user will be able to sign in immediately.">
          <div className="mb-4">
            <label className={LABEL} style={LABEL_STYLE}>Email</label>
            <input type="email" className={INPUT} style={INPUT_STYLE} value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@example.com" />
          </div>
          <div className="mb-5">
            <label className={LABEL} style={LABEL_STYLE}>Password</label>
            <input type="password" className={INPUT} style={INPUT_STYLE} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
          </div>
          {error && <div className="admin-alert admin-alert-error mb-4">{error}</div>}
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={busy} className="admin-btn admin-btn-primary flex-1" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? "Creating…" : "Create User"}
            </button>
            <button onClick={() => { setShowCreate(false); setNewEmail(""); setNewPassword(""); clearMessages(); }} className="admin-btn admin-btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {/* Edit modal */}
      {editUser && (
        <Modal title="Edit User" sub={`Editing ${editUser.email} — leave a field blank to keep it unchanged.`}>
          <div className="mb-4">
            <label className={LABEL} style={LABEL_STYLE}>New Email</label>
            <input type="email" className={INPUT} style={INPUT_STYLE} value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder={editUser.email} />
          </div>
          <div className="mb-5">
            <label className={LABEL} style={LABEL_STYLE}>New Password</label>
            <input type="password" className={INPUT} style={INPUT_STYLE} value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Leave blank to keep current" />
          </div>
          {error && <div className="admin-alert admin-alert-error mb-4">{error}</div>}
          <div className="flex gap-3 mb-3">
            <button onClick={handleEdit} disabled={busy} className="admin-btn admin-btn-primary flex-1" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? "Saving…" : "Save Changes"}
            </button>
            <button onClick={() => { setEditUser(null); setEditEmail(""); setEditPassword(""); clearMessages(); }} className="admin-btn admin-btn-secondary flex-1">
              Cancel
            </button>
          </div>
          <button onClick={() => handleResetPassword(editUser)} disabled={busy}
            className="admin-btn w-full text-xs"
            style={{ background: "var(--admin-accent-bg)", color: "var(--admin-accent)", border: "1px solid rgba(89,37,244,0.2)" }}>
            {busy ? "Sending…" : "✉ Send Password Reset Email"}
          </button>
        </Modal>
      )}

      {/* Users table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--admin-border)" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th className="hidden md:table-cell">Created</th>
              <th className="hidden md:table-cell">Last Sign In</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="text-[15px] font-semibold" style={{ color: "var(--admin-text-primary)" }}>{user.email}</div>
                  <div className="text-xs mt-0.5 font-mono" style={{ color: "var(--admin-text-faint)" }}>{user.id.slice(0, 8)}…</div>
                </td>
                <td className="hidden md:table-cell">
                  <span className="text-sm" style={{ color: "var(--admin-text-muted)" }}>{fmt(user.created_at)}</span>
                </td>
                <td className="hidden md:table-cell">
                  <span className="text-sm" style={{ color: "var(--admin-text-muted)" }}>{fmt(user.last_sign_in_at)}</span>
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => { setEditUser(user); setEditEmail(""); setEditPassword(""); clearMessages(); setShowCreate(false); }}
                      className="admin-icon-btn" title="Edit user">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(user)} disabled={busy}
                      className="admin-icon-btn" title="Delete user"
                      style={{ color: "var(--admin-danger)" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
