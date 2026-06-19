import { useState } from "react";
import { authApi } from "./api";
import { UserRole } from "./gen/TaskManagement";

interface Props {
  onLogin: (userId: number, username: string) => void;
}

export function LoginPage({ onLogin }: Props) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setError("");
      const { response } = await authApi.login({ email, password });
      if (response.user) {
        onLogin(response.user.id, response.user.username);
      }
    } catch (e: any) {
      setError(e.message || "Login failed");
    }
  };

  const handleRegister = async () => {
    try {
      setError("");
      const { response } = await authApi.register({
        username,
        email,
        password,
        role: UserRole.EXECUTOR,
      });
      onLogin(response.id, response.username);
    } catch (e: any) {
      setError(e.message || "Registration failed");
    }
  };

  const formStyle: React.CSSProperties = {
    maxWidth: 400,
    margin: "80px auto",
    padding: 32,
    border: "1px solid #ddd",
    borderRadius: 8,
  };

  const btnStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 0",
    marginTop: 16,
    background: "#1677ff",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontSize: 16,
    cursor: "pointer",
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "10px 0",
    border: "none",
    background: active ? "#1677ff" : "#f5f5f5",
    color: active ? "#fff" : "#333",
    fontSize: 16,
    cursor: "pointer",
    borderRadius: active ? "6px 6px 0 0" : 0,
  });

  return (
    <div style={formStyle}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>
        Task Management
      </h2>
      <div style={{ display: "flex", marginBottom: 24 }}>
        <button style={tabStyle(tab === "login")} onClick={() => setTab("login")}>
          Login
        </button>
        <button style={tabStyle(tab === "register")} onClick={() => setTab("register")}>
          Register
        </button>
      </div>

      {tab === "register" && (
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
        />
      )}
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />

      {error && <p style={{ color: "red", fontSize: 14 }}>{error}</p>}

      <button
        style={btnStyle}
        onClick={tab === "login" ? handleLogin : handleRegister}
      >
        {tab === "login" ? "Login" : "Register"}
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  marginBottom: 12,
  border: "1px solid #ddd",
  borderRadius: 6,
  fontSize: 15,
  boxSizing: "border-box",
};
