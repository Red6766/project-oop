interface Props { username: string; email: string; onBack: () => void; onLogout: () => void; onDashboard?: () => void; onProjects?: () => void }

export function ProfilePage({ username, email, onBack, onLogout, onDashboard, onProjects }: Props) {
  return (
    <div>
      {/* Navigation — full width */}
      <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid #eee" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {onDashboard && <button onClick={onDashboard} className="keycap-btn keycap-btn-outline">Home</button>}
            {onProjects && <button onClick={onProjects} className="keycap-btn keycap-btn-outline">My Projects</button>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="keycap-btn keycap-btn-solid" style={{ cursor: "default" }}>Profile</button>
            <button onClick={onLogout} className="keycap-btn keycap-btn-ghost">Logout</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>
        <div style={{ maxWidth: 500, margin: "40px auto", padding: 32, border: "1px solid #e0e0e0", background: "#fafafa", boxShadow: "0 2px 0 #d0d0d0, 0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#222", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: "bold", margin: "0 auto 24px" }}>
            {username.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ textAlign: "center", margin: "0 0 24px" }}>{username}</h2>
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "#fff", border: "1px solid #e0e0e0" }}>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>USERNAME</div>
            <div style={{ fontSize: 16 }}>{username}</div>
          </div>
          <div style={{ marginBottom: 24, padding: "12px 16px", background: "#fff", border: "1px solid #e0e0e0" }}>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>EMAIL</div>
            <div style={{ fontSize: 16 }}>{email}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onBack} className="keycap-btn keycap-btn-ghost" style={{ flex: 1 }}>← Back</button>
            <button onClick={onLogout} className="keycap-btn keycap-btn-solid" style={{ flex: 1, padding: "10px 0", fontSize: 15 }}>Logout</button>
          </div>
        </div>
      </div>
    </div>
  );
}
