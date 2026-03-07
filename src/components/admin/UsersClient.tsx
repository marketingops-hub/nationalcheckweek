"use client";

import { useState } from "react";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

const INPUT = "w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all";
const INPUT_STYLE = { background: "#fff", border: "1px solid var(--admin-border-strong)", color: "var(--admin-text-primary)", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" };
const INPUT_ERR = { background: "#fff", border: "1px solid var(--admin-danger)", color: "var(--admin-text-primary)", boxShadow: "0 0 0 3px rgba(220,38,38,0.12)" };
const LABEL = "block text-xs font-semibold mb-2 uppercase tracking-wide";
const LS = { color: "var(--admin-text-subtle)" };

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  function clearMessages() { setError(""); setSuccess(""); setFieldErrors({}); }

  function validateCreate() {
    const errs: Record<string, string> = {};
    if (!newEmail.trim()) errs.newEmail = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) errs.newEmail = "Enter a valid email address.";
    if (!newPassword) errs.newPassword = "Password is required.";
    else if (newPassword.length < 6) errs.newPassword = "Password must be at least 6 characters.";
    return errs;
  }

  async function handleCreate() {
    const errs = validateCreate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setBusy(true); clearMessages();
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail, password: newPassword }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to create user."); setBusy(false); return; }
    setUsers(u => [...u, { id: data.id, email: data.email, created_at: new Date().toISOString(), last_sign_in_at: null }]);
    setNewEmail(""); setNewPassword(""); setShowCreate(false);
    setSuccess(`User ${data.email} created successfully.`);
    setBusy(false);
  }

  async function handleEdit() {
    if (!editUser) return;
    const errs: Record<string, string> = {};
    if (!editEmail && !editPassword) {
      errs.editEmail = "Provide a new email or password.";
    } else if (editEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) {
      errs.editEmail = "Enter a valid email address.";
    } else if (editPassword && editPassword.length < 6) {
      errs.editPassword = "Password must be at least 6 characters.";
    }
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
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
    if (!res.ok) { setError(data.error ?? "Failed to update user."); setBusy(false); return; }
    if (editEmail) setUsers(u => u.map(u2 => u2.id === editUser.id ? { ...u2, email: editEmail } : u2));
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
    if (!res.ok) { setError(data.error ?? "Failed to send reset email."); setBusy(false); return; }
    setSuccess(`Password reset email sent to ${user.email}.`);
    setBusy(false);
  }

  async function handleDelete(user: User) {
    setBusy(true); clearMessages();
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to delete user."); setBusy(false); setConfirmDelete(null); return; }
    setUsers(u => u.filter(u2 => u2.id !== user.id));
    setSuccess(`User ${user.email} deleted.`);
    setConfirmDelete(null);
    setBusy(false);
  }

  return (
    <div className="space-y-8">
      {/* Global feedback */}
      {!showCreate && !editUser && error   && <div className="admin-alert admin-alert-error" role="alert">{error}</div>}
      {!showCreate && !editUser && success && <div className="admin-alert admin-alert-success" role="status">{success}</div>}

      {/* Create inline panel */}
      {showCreate && (
        <div className="admin-form-panel" role="region" aria-label="Create new user">
          <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: "1px solid var(--admin-border)" }}>
            <div>
              <h2 style={{ color: "var(--admin-text-primary)", margin: 0, border: "none", padding: 0 }}>Create New User</h2>
              <p className="text-sm mt-1" style={{ color: "var(--admin-text-subtle)" }}>The new user will be able to sign in immediately.</p>
            </div>
            <button onClick={() => { setShowCreate(false); setNewEmail(""); setNewPassword(""); clearMessages(); }}
              className="admin-icon-btn" aria-label="Close create user form">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="new-user-email" className={LABEL} style={LS}>Email</label>
              <input id="new-user-email" type="email" className={INPUT}
                style={fieldErrors.newEmail ? INPUT_ERR : INPUT_STYLE}
                value={newEmail} onChange={e => { setNewEmail(e.target.value); setFieldErrors(f => ({ ...f, newEmail: "" })); }}
                placeholder="user@example.com" autoComplete="email" />
              {fieldErrors.newEmail && <p className="admin-field-error" role="alert"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{fieldErrors.newEmail}</p>}
            </div>
            <div>
              <label htmlFor="new-user-password" className={LABEL} style={LS}>Password</label>
              <input id="new-user-password" type="password" className={INPUT}
                style={fieldErrors.newPassword ? INPUT_ERR : INPUT_STYLE}
                value={newPassword} onChange={e => { setNewPassword(e.target.value); setFieldErrors(f => ({ ...f, newPassword: "" })); }}
                placeholder="Min 6 characters" autoComplete="new-password" />
              {fieldErrors.newPassword && <p className="admin-field-error" role="alert"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{fieldErrors.newPassword}</p>}
            </div>
          </div>
          {error && <div className="admin-alert admin-alert-error mb-6" role="alert">{error}</div>}
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={busy} className="admin-btn admin-btn-primary" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? "Creating…" : "Create User"}
            </button>
            <button onClick={() => { setShowCreate(false); setNewEmail(""); setNewPassword(""); clearMessages(); }} className="admin-btn admin-btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit inline panel */}
      {editUser && (
        <div className="admin-form-panel" role="region" aria-label={`Edit user ${editUser.email}`}>
          <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: "1px solid var(--admin-border)" }}>
            <div>
              <h2 style={{ color: "var(--admin-text-primary)", margin: 0, border: "none", padding: 0 }}>Edit User</h2>
              <p className="text-sm mt-1" style={{ color: "var(--admin-text-subtle)" }}>
                Editing <strong style={{ color: "var(--admin-text-primary)" }}>{editUser.email}</strong> — leave a field blank to keep it unchanged.
              </p>
            </div>
            <button onClick={() => { setEditUser(null); setEditEmail(""); setEditPassword(""); clearMessages(); }}
              className="admin-icon-btn" aria-label="Close edit user form">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="edit-user-email" className={LABEL} style={LS}>New Email</label>
              <input id="edit-user-email" type="email" className={INPUT}
                style={fieldErrors.editEmail ? INPUT_ERR : INPUT_STYLE}
                value={editEmail} onChange={e => { setEditEmail(e.target.value); setFieldErrors(f => ({ ...f, editEmail: "" })); }}
                placeholder={editUser.email} autoComplete="email" />
              {fieldErrors.editEmail && <p className="admin-field-error" role="alert"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{fieldErrors.editEmail}</p>}
            </div>
            <div>
              <label htmlFor="edit-user-password" className={LABEL} style={LS}>New Password</label>
              <input id="edit-user-password" type="password" className={INPUT}
                style={fieldErrors.editPassword ? INPUT_ERR : INPUT_STYLE}
                value={editPassword} onChange={e => { setEditPassword(e.target.value); setFieldErrors(f => ({ ...f, editPassword: "" })); }}
                placeholder="Leave blank to keep current" autoComplete="new-password" />
              {fieldErrors.editPassword && <p className="admin-field-error" role="alert"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{fieldErrors.editPassword}</p>}
            </div>
          </div>
          {error && <div className="admin-alert admin-alert-error mb-6" role="alert">{error}</div>}
          <div className="flex flex-wrap gap-3">
            <button onClick={handleEdit} disabled={busy} className="admin-btn admin-btn-primary" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? "Saving…" : "Save Changes"}
            </button>
            <button onClick={() => { setEditUser(null); setEditEmail(""); setEditPassword(""); clearMessages(); }} className="admin-btn admin-btn-secondary">
              Cancel
            </button>
            <button onClick={() => handleResetPassword(editUser)} disabled={busy} className="admin-btn"
              style={{ background: "var(--admin-accent-bg)", color: "var(--admin-accent)", border: "1px solid rgba(89,37,244,0.2)" }}>
              {busy ? "Sending…" : "Send Password Reset Email"}
            </button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      {!showCreate && !editUser && (
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: "var(--admin-text-subtle)" }}>{users.length} user{users.length !== 1 ? "s" : ""}</span>
          <button onClick={() => { setShowCreate(true); clearMessages(); }} className="admin-btn admin-btn-primary">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New User
          </button>
        </div>
      )}

      {/* Users table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Email</th>
              <th scope="col" className="hidden md:table-cell">Created</th>
              <th scope="col" className="hidden md:table-cell">Last Sign In</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-12 text-sm" style={{ color: "var(--admin-text-faint)" }}>
                  No users yet. Create the first admin user above.
                </td>
              </tr>
            )}
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
                  <span className="text-sm" style={{ color: user.last_sign_in_at ? "var(--admin-text-muted)" : "var(--admin-text-faint)" }}>
                    {fmt(user.last_sign_in_at)}
                  </span>
                </td>
                <td>
                  {confirmDelete?.id === user.id ? (
                    <div className="admin-danger-confirm">
                      <span>Delete <strong>{user.email}</strong>? This cannot be undone.</span>
                      <button onClick={() => handleDelete(user)} disabled={busy}
                        className="admin-btn admin-btn-danger" style={{ padding: "4px 10px", fontSize: "0.75rem", opacity: busy ? 0.6 : 1 }}>
                        {busy ? "Deleting…" : "Yes, delete"}
                      </button>
                      <button onClick={() => setConfirmDelete(null)} className="admin-btn admin-btn-secondary" style={{ padding: "4px 10px", fontSize: "0.75rem" }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditUser(user); setEditEmail(""); setEditPassword(""); clearMessages(); setShowCreate(false); setConfirmDelete(null); }}
                        className="admin-icon-btn" aria-label={`Edit ${user.email}`}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button onClick={() => { setConfirmDelete(user); clearMessages(); }} disabled={busy}
                        className="admin-icon-btn" aria-label={`Delete ${user.email}`}
                        style={{ color: "var(--admin-danger)" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
