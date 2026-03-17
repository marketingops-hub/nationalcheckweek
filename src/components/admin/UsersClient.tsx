"use client";

import { useState, useMemo } from "react";
import {
  AdminField,
  DangerConfirm,
  FormPanelHeader,
  INPUT_CLS,
  INPUT_STYLE,
  inputStyle,
  fmtDateTime,
  type AdminUser,
  type FieldErrors,
} from "@/components/admin/ui";

// ---------------------------------------------------------------------------
// Module-level validators
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCreate(email: string, password: string): FieldErrors {
  const errs: FieldErrors = {};
  if (!email.trim()) errs.newEmail = "Email is required.";
  else if (!EMAIL_RE.test(email)) errs.newEmail = "Enter a valid email address.";
  if (!password) errs.newPassword = "Password is required.";
  else if (password.length < 6) errs.newPassword = "Password must be at least 6 characters.";
  return errs;
}

function validateEdit(email: string, password: string): FieldErrors {
  const errs: FieldErrors = {};
  if (!email && !password) {
    errs.editEmail = "Provide a new email or new password.";
  } else {
    if (email && !EMAIL_RE.test(email)) errs.editEmail = "Enter a valid email address.";
    if (password && password.length < 6) errs.editPassword = "Password must be at least 6 characters.";
  }
  return errs;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UsersClient({ initialUsers }: { initialUsers: AdminUser[] }) {
  // ── State ──
  const [users, setUsers]             = useState<AdminUser[]>(initialUsers);
  const [showCreate, setShowCreate]   = useState(false);
  const [editUser, setEditUser]       = useState<AdminUser | null>(null);
  const [newEmail, setNewEmail]       = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [editEmail, setEditEmail]     = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [busy, setBusy]               = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const [search, setSearch]           = useState("");

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return !q ? users : users.filter(u => u.email.toLowerCase().includes(q));
  }, [users, search]);

  // ── Helpers ──

  function clearMessages() { setError(""); setSuccess(""); }

  function clearFieldError(key: string) {
    setFieldErrors(prev => prev[key] ? { ...prev, [key]: "" } : prev);
  }

  function closeCreatePanel() {
    setShowCreate(false);
    setNewEmail(""); setNewPassword("");
    setFieldErrors({}); clearMessages();
  }

  function closeEditPanel() {
    setEditUser(null);
    setEditEmail(""); setEditPassword("");
    setFieldErrors({}); clearMessages();
  }

  function openEditPanel(user: AdminUser) {
    setEditUser(user);
    setEditEmail(""); setEditPassword("");
    setFieldErrors({}); clearMessages();
    setShowCreate(false); setConfirmDelete(null);
  }

  // ── Mutation handlers ──

  async function handleCreate() {
    const errs = validateCreate(newEmail, newPassword);
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setBusy(true); clearMessages();
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create user."); return; }
      setUsers(u => [...u, { id: data.id, email: data.email, created_at: new Date().toISOString(), last_sign_in_at: null }]);
      setSuccess(`User ${data.email} created successfully.`);
      closeCreatePanel();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleEdit() {
    if (!editUser) return;
    const errs = validateEdit(editEmail, editPassword);
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setBusy(true); clearMessages();
    try {
      const body: Record<string, string> = {};
      if (editEmail) body.email = editEmail;
      if (editPassword) body.password = editPassword;
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to update user."); return; }
      if (editEmail) setUsers(u => u.map(u2 => u2.id === editUser.id ? { ...u2, email: editEmail } : u2));
      setSuccess("User updated successfully.");
      closeEditPanel();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(user: AdminUser) {
    setBusy(true); clearMessages();
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ send_reset: true, email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to send reset email."); return; }
      setSuccess(`Password reset email sent to ${user.email}.`);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(user: AdminUser) {
    setBusy(true); clearMessages();
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to delete user."); setConfirmDelete(null); return; }
      setUsers(u => u.filter(u2 => u2.id !== user.id));
      setSuccess(`User ${user.email} deleted.`);
      setConfirmDelete(null);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  // ── Render ──

  return (
    <div className="space-y-8">
      {/* Global feedback (hidden while a panel is open) */}
      {!showCreate && !editUser && error   && <div className="admin-alert admin-alert-error"  role="alert">{error}</div>}
      {!showCreate && !editUser && success && <div className="admin-alert admin-alert-success" role="status">{success}</div>}

      {/* ── Create inline panel ── */}
      {showCreate && (
        <div className="admin-form-panel" role="region" aria-label="Create new user">
          <FormPanelHeader
            title="Create New User"
            subtitle="The new user will be able to sign in immediately."
            onClose={closeCreatePanel}
            closeLabel="Close create user form"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <AdminField id="new-user-email" label="Email" error={fieldErrors.newEmail}>
              <input
                id="new-user-email"
                type="email"
                className={INPUT_CLS}
                style={inputStyle(!!fieldErrors.newEmail)}
                value={newEmail}
                onChange={e => { setNewEmail(e.target.value); clearFieldError("newEmail"); }}
                placeholder="user@example.com"
                autoComplete="email"
              />
            </AdminField>
            <AdminField id="new-user-password" label="Password" error={fieldErrors.newPassword}>
              <input
                id="new-user-password"
                type="password"
                className={INPUT_CLS}
                style={inputStyle(!!fieldErrors.newPassword)}
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); clearFieldError("newPassword"); }}
                placeholder="Min 6 characters"
                autoComplete="new-password"
              />
            </AdminField>
          </div>
          {error && <div className="admin-alert admin-alert-error mb-6" role="alert">{error}</div>}
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={busy} className="admin-btn admin-btn-primary" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? "Creating…" : "Create User"}
            </button>
            <button onClick={closeCreatePanel} className="admin-btn admin-btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* ── Edit inline panel ── */}
      {editUser && (
        <div className="admin-form-panel" role="region" aria-label={`Edit user ${editUser.email}`}>
          <FormPanelHeader
            title="Edit User"
            subtitle={
              <>Editing <strong style={{ color: "var(--admin-text-primary)" }}>{editUser.email}</strong> — leave a field blank to keep it unchanged.</>
            }
            onClose={closeEditPanel}
            closeLabel="Close edit user form"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <AdminField id="edit-user-email" label="New Email" error={fieldErrors.editEmail}>
              <input
                id="edit-user-email"
                type="email"
                className={INPUT_CLS}
                style={inputStyle(!!fieldErrors.editEmail)}
                value={editEmail}
                onChange={e => { setEditEmail(e.target.value); clearFieldError("editEmail"); }}
                placeholder={editUser.email}
                autoComplete="email"
              />
            </AdminField>
            <AdminField id="edit-user-password" label="New Password" error={fieldErrors.editPassword}>
              <input
                id="edit-user-password"
                type="password"
                className={INPUT_CLS}
                style={inputStyle(!!fieldErrors.editPassword)}
                value={editPassword}
                onChange={e => { setEditPassword(e.target.value); clearFieldError("editPassword"); }}
                placeholder="Leave blank to keep current"
                autoComplete="new-password"
              />
            </AdminField>
          </div>
          {error && <div className="admin-alert admin-alert-error mb-6" role="alert">{error}</div>}
          <div className="flex flex-wrap gap-3">
            <button onClick={handleEdit} disabled={busy} className="admin-btn admin-btn-primary" style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? "Saving…" : "Save Changes"}
            </button>
            <button onClick={closeEditPanel} className="admin-btn admin-btn-secondary">Cancel</button>
            <button
              onClick={() => handleResetPassword(editUser)}
              disabled={busy}
              className="admin-btn"
              style={{ background: "var(--admin-accent-bg)", color: "var(--admin-accent)", border: "1px solid rgba(89,37,244,0.2)" }}
            >
              {busy ? "Sending…" : "Send Password Reset Email"}
            </button>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      {!showCreate && !editUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 17, color: '#9CA3AF', pointerEvents: 'none' }}>search</span>
            <input
              type="search"
              placeholder="Search users…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={INPUT_CLS}
              style={{ paddingLeft: 34, ...INPUT_STYLE }}
            />
          </div>
          <span className="text-sm" style={{ color: "var(--admin-text-subtle)", whiteSpace: 'nowrap' }}>
            {filteredUsers.length}{search ? ` of ${users.length}` : ''} user{users.length !== 1 ? "s" : ""}
          </span>
          <button onClick={() => { setShowCreate(true); clearMessages(); }} className="admin-btn admin-btn-primary" style={{ marginLeft: 'auto' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New User
          </button>
        </div>
      )}

      {/* ── Users table ── */}
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
            {filteredUsers.length === 0 && search && (
              <tr>
                <td colSpan={4} className="text-center py-12 text-sm" style={{ color: "var(--admin-text-faint)" }}>
                  No users match &ldquo;{search}&rdquo;.
                </td>
              </tr>
            )}
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>
                  <div className="text-[15px] font-semibold" style={{ color: "var(--admin-text-primary)" }}>{user.email}</div>
                  <div className="text-xs mt-0.5 font-mono" style={{ color: "var(--admin-text-faint)" }}>{user.id.slice(0, 8)}…</div>
                </td>
                <td className="hidden md:table-cell">
                  <span className="text-sm" style={{ color: "var(--admin-text-muted)" }}>{fmtDateTime(user.created_at)}</span>
                </td>
                <td className="hidden md:table-cell">
                  <span className="text-sm" style={{ color: user.last_sign_in_at ? "var(--admin-text-muted)" : "var(--admin-text-faint)" }}>
                    {fmtDateTime(user.last_sign_in_at)}
                  </span>
                </td>
                <td>
                  {confirmDelete?.id === user.id ? (
                    <DangerConfirm
                      message={<>Delete <strong>{user.email}</strong>? This cannot be undone.</>}
                      onConfirm={() => handleDelete(user)}
                      onCancel={() => setConfirmDelete(null)}
                      busy={busy}
                    />
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEditPanel(user)} className="admin-icon-btn" aria-label={`Edit ${user.email}`}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => { setConfirmDelete(user); clearMessages(); }}
                        disabled={busy}
                        className="admin-icon-btn"
                        aria-label={`Delete ${user.email}`}
                        style={{ color: "var(--admin-danger)" }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
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
