"use client";

import { useState } from "react";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
}

const INPUT = "w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500";
const INPUT_STYLE = { background: "#0D1117", border: "1px solid #30363D", color: "#C9D1D9" };

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

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm" style={{ color: "#6E7681" }}>{users.length} user{users.length !== 1 ? "s" : ""}</span>
        <button
          onClick={() => { setShowCreate(true); clearMessages(); }}
          className="text-sm font-semibold px-4 py-2 rounded-lg"
          style={{ background: "#238636", color: "#FFFFFF" }}
        >
          + New User
        </button>
      </div>

      {/* Feedback — only when no modal is open */}
      {!showCreate && !editUser && error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "#3D1515", color: "#F87171", border: "1px solid #7F1D1D" }}>{error}</div>}
      {!showCreate && !editUser && success && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: "#0D2D1A", color: "#6EE7B7", border: "1px solid #166534" }}>{success}</div>}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-md rounded-xl p-6" style={{ background: "#161B22", border: "1px solid #30363D" }}>
            <h2 className="text-base font-semibold mb-5" style={{ color: "#E6EDF3" }}>Create New User</h2>
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#6E7681" }}>Email</label>
              <input type="email" className={INPUT} style={INPUT_STYLE} value={newEmail}
                onChange={e => setNewEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="mb-6">
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#6E7681" }}>Password</label>
              <input type="password" className={INPUT} style={INPUT_STYLE} value={newPassword}
                onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
            </div>
            {error && <div className="mb-4 px-3 py-2 rounded text-xs" style={{ background: "#3D1515", color: "#F87171" }}>{error}</div>}
            <div className="flex gap-3">
              <button onClick={handleCreate} disabled={busy}
                className="flex-1 text-sm font-semibold py-2 rounded-lg"
                style={{ background: "#238636", color: "#FFFFFF", opacity: busy ? 0.6 : 1 }}>
                {busy ? "Creating…" : "Create User"}
              </button>
              <button onClick={() => { setShowCreate(false); setNewEmail(""); setNewPassword(""); clearMessages(); }}
                className="flex-1 text-sm font-semibold py-2 rounded-lg"
                style={{ background: "#21262D", color: "#C9D1D9" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-md rounded-xl p-6" style={{ background: "#161B22", border: "1px solid #30363D" }}>
            <h2 className="text-base font-semibold mb-1" style={{ color: "#E6EDF3" }}>Edit User</h2>
            <p className="text-xs mb-1 font-mono" style={{ color: "#484F58" }}>{editUser.email}</p>
            <p className="text-xs mb-5" style={{ color: "#6E7681" }}>Leave a field blank to keep it unchanged.</p>
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#6E7681" }}>New Email</label>
              <input type="email" className={INPUT} style={INPUT_STYLE} value={editEmail}
                onChange={e => setEditEmail(e.target.value)} placeholder={editUser.email} />
            </div>
            <div className="mb-6">
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#6E7681" }}>New Password</label>
              <input type="password" className={INPUT} style={INPUT_STYLE} value={editPassword}
                onChange={e => setEditPassword(e.target.value)} placeholder="Leave blank to keep current" />
            </div>
            {error && <div className="mb-4 px-3 py-2 rounded text-xs" style={{ background: "#3D1515", color: "#F87171" }}>{error}</div>}
            <div className="flex gap-3 mb-3">
              <button onClick={handleEdit} disabled={busy}
                className="flex-1 text-sm font-semibold py-2 rounded-lg"
                style={{ background: "#238636", color: "#FFFFFF", opacity: busy ? 0.6 : 1 }}>
                {busy ? "Saving…" : "Save Changes"}
              </button>
              <button onClick={() => { setEditUser(null); setEditEmail(""); setEditPassword(""); clearMessages(); }}
                className="flex-1 text-sm font-semibold py-2 rounded-lg"
                style={{ background: "#21262D", color: "#C9D1D9" }}>
                Cancel
              </button>
            </div>
            <button
              onClick={() => handleResetPassword(editUser)}
              disabled={busy}
              className="w-full text-xs font-semibold py-2 rounded-lg"
              style={{ background: "#1C2A3A", color: "#58A6FF", border: "1px solid #1E3A5F" }}>
              {busy ? "Sending…" : "✉ Send Password Reset Email"}
            </button>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #21262D" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#161B22", borderBottom: "1px solid #21262D" }}>
              <th className="text-left px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Email</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: "#6E7681" }}>Created</th>
              <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: "#6E7681" }}>Last Sign In</th>
              <th className="text-right px-4 py-3 font-semibold" style={{ color: "#6E7681" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={user.id} style={{ background: idx % 2 === 0 ? "#0D1117" : "#161B22", borderBottom: "1px solid #21262D" }}>
                <td className="px-4 py-3">
                  <span className="font-medium" style={{ color: "#C9D1D9" }}>{user.email}</span>
                  <div className="text-xs mt-0.5 font-mono" style={{ color: "#484F58" }}>{user.id.slice(0, 8)}…</div>
                </td>
                <td className="px-4 py-3 text-xs hidden md:table-cell" style={{ color: "#6E7681" }}>{fmt(user.created_at)}</td>
                <td className="px-4 py-3 text-xs hidden md:table-cell" style={{ color: "#6E7681" }}>{fmt(user.last_sign_in_at)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => { setEditUser(user); setEditEmail(""); setEditPassword(""); clearMessages(); setShowCreate(false); }}
                      className="text-xs font-semibold px-3 py-1.5 rounded"
                      style={{ background: "#21262D", color: "#C9D1D9" }}>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      disabled={busy}
                      className="text-xs font-semibold px-3 py-1.5 rounded"
                      style={{ background: "#3D1515", color: "#F87171", border: "1px solid #7F1D1D" }}>
                      Delete
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
