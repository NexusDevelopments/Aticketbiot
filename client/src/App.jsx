import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import api from "./api.js";

const IMAGE_URL =
  "https://media.discordapp.net/attachments/1466953282004979735/1472360913733550204/b076c84d-b7fb-4e2e-8885-52c8b12331a9-138.png?ex=69924a74&is=6990f8f4&hm=43aab5f0071a2aa02541e5388557d3997bd1f2260af6ac884b022629c9cb9eab&=&format=webp&quality=lossless";

function useAuth() {
  const [user, setUser] = useState(() => {
    const userId = localStorage.getItem("userId");
    const role = localStorage.getItem("role");
    return userId && role ? { userId, role } : null;
  });

  const login = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("role", data.role);
    setUser({ userId: data.userId, role: data.role });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    setUser(null);
  };

  return { user, login, logout };
}

function Layout({ user, onLogout, inviteUrl, loading, children }) {
  return (
    <div className="app">
      <div className="background-anim" />
      <aside className="sidebar">
        <img className="logo" src={IMAGE_URL} alt="Logo" />
        <h1>Jace Ticket Bot</h1>
        {inviteUrl && (
          <a className="primary-button" href={inviteUrl} target="_blank">
            Add Bot
          </a>
        )}
        <nav>
          <Link className="tab" to="/">
            Dashboard
          </Link>
          <Link className="tab" to="/blacklist">
            Blacklist
          </Link>
          <Link className="tab" to="/panels">
            Panels
          </Link>
          <Link className="tab" to="/settings">
            Settings
          </Link>
          {user?.role === "OWNER" && (
            <>
              <Link className="tab" to="/bot-control">
                Bot Control
              </Link>
              <Link className="tab" to="/passwords">
                Password Generator
              </Link>
              <Link className="tab" to="/credentials">
                Owner Credentials
              </Link>
              <Link className="tab" to="/users">
                Users
              </Link>
            </>
          )}
        </nav>
        <button className="ghost" onClick={onLogout}>
          Logout
        </button>
      </aside>
      <main className="content">{children}</main>
      {loading && (
        <div className="loading-overlay">
          <div className="loader" />
          <span>Loading...</span>
        </div>
      )}
    </div>
  );
}

function Login({ onLogin }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/auth/login", { userId, password });
      onLogin(res.data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="login">
      <div className="card">
        <img className="logo" src={IMAGE_URL} alt="Logo" />
        <h2>Admin Login</h2>
        <form onSubmit={submit}>
          <label>
            Discord User ID
            <input value={userId} onChange={(e) => setUserId(e.target.value)} />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <section className="panel">
      <h2>Dashboard</h2>
      <p>Use the menu to configure tickets, panels, and blacklist.</p>
    </section>
  );
}

function Blacklist({ user }) {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({
    userId: "",
    reason: "",
    duration: ""
  });

  const load = async () => {
    const res = await api.get("/blacklist");
    setEntries(res.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    await api.post("/blacklist", { ...form, createdBy: user.userId });
    setForm({ userId: "", reason: "", duration: "" });
    await load();
  };

  return (
    <section className="panel">
      <h2>Blacklist</h2>
      <form className="grid" onSubmit={add}>
        <input
          placeholder="User ID"
          value={form.userId}
          onChange={(e) => setForm({ ...form, userId: e.target.value })}
        />
        <input
          placeholder="Reason"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        />
        <input
          placeholder="Duration"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: e.target.value })}
        />
        <button type="submit">Add</button>
      </form>
      <div className="list">
        {entries.map((entry) => (
          <div className="list-item" key={entry.id}>
            <strong>{entry.userId}</strong>
            <span>{entry.reason}</span>
            <span>{entry.duration}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Panels() {
  const [panels, setPanels] = useState([]);
  const [form, setForm] = useState({ name: "", channelId: "" });

  const load = async () => {
    const res = await api.get("/panels");
    setPanels(res.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    await api.post("/panels", form);
    setForm({ name: "", channelId: "" });
    await load();
  };

  return (
    <section className="panel">
      <h2>Ticket Panels</h2>
      <form className="grid" onSubmit={add}>
        <input
          placeholder="Panel name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Channel ID"
          value={form.channelId}
          onChange={(e) => setForm({ ...form, channelId: e.target.value })}
        />
        <button type="submit">Create</button>
      </form>
      <div className="list">
        {panels.map((panel) => (
          <div className="list-item" key={panel.id}>
            <strong>{panel.name}</strong>
            <span>{panel.channelId}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Settings() {
  const [settings, setSettings] = useState({
    websiteUrl: "",
    blacklistChannelId: "",
    panelChannelId: "",
    ticketLogChannelId: "",
    imageUrl: ""
  });

  useEffect(() => {
    api.get("/settings").then((res) => {
      if (res.data) setSettings((prev) => ({ ...prev, ...res.data }));
    });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    await api.put("/settings", settings);
  };

  return (
    <section className="panel">
      <h2>Settings</h2>
      <form className="grid" onSubmit={save}>
        <input
          placeholder="Website URL"
          value={settings.websiteUrl || ""}
          onChange={(e) => setSettings({ ...settings, websiteUrl: e.target.value })}
        />
        <input
          placeholder="Blacklist Channel ID"
          value={settings.blacklistChannelId || ""}
          onChange={(e) =>
            setSettings({ ...settings, blacklistChannelId: e.target.value })
          }
        />
        <input
          placeholder="Panel Channel ID"
          value={settings.panelChannelId || ""}
          onChange={(e) =>
            setSettings({ ...settings, panelChannelId: e.target.value })
          }
        />
        <input
          placeholder="Ticket Log Channel ID"
          value={settings.ticketLogChannelId || ""}
          onChange={(e) =>
            setSettings({ ...settings, ticketLogChannelId: e.target.value })
          }
        />
        <input
          placeholder="Image URL"
          value={settings.imageUrl || ""}
          onChange={(e) => setSettings({ ...settings, imageUrl: e.target.value })}
        />
        <button type="submit">Save</button>
      </form>
    </section>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ userId: "", role: "ADMIN" });
  const [masterPassword, setMasterPassword] = useState("");
  const [showMaster, setShowMaster] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const res = await api.get("/users");
    setUsers(res.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const verify = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/bot/verify", { masterPassword });
      setVerified(true);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid master password");
    }
  };

  const add = async (e) => {
    e.preventDefault();
    const ownerId = localStorage.getItem("userId");
    await api.post("/users", { ...form, addedBy: ownerId });
    setForm({ userId: "", role: "ADMIN" });
    await load();
  };

  return (
    <section className="panel">
      <h2>Users</h2>
      {!verified ? (
        <form className="grid" onSubmit={verify}>
          <input
            placeholder="Master password"
            type={showMaster ? "text" : "password"}
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
          />
          <label className="toggle">
            <input
              type="checkbox"
              checked={showMaster}
              onChange={(e) => setShowMaster(e.target.checked)}
            />
            Show password
          </label>
          <button type="submit">Unlock</button>
          {error && <p className="error">{error}</p>}
        </form>
      ) : (
        <form className="grid" onSubmit={add}>
          <input
            placeholder="User ID"
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="ADMIN">ADMIN</option>
            <option value="OWNER">OWNER</option>
          </select>
          <button type="submit">Add</button>
        </form>
      )}
      <div className="list">
        {users.map((user) => (
          <div className="list-item" key={user.id}>
            <strong>{user.id}</strong>
            <span>{user.role}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function BotControl() {
  const [masterPassword, setMasterPassword] = useState("");
  const [showMaster, setShowMaster] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [status, setStatus] = useState({ running: false });
  const [messageForm, setMessageForm] = useState({
    channelId: "",
    message: ""
  });
  const [botConfig, setBotConfig] = useState({
    botToken: "",
    botClientId: ""
  });
  const [consoleLines, setConsoleLines] = useState([]);

  const loadStatus = async () => {
    const res = await api.get("/bot/status");
    setStatus(res.data || { running: false });
  };

  useEffect(() => {
    loadStatus();
    api.get("/settings").then((res) => {
      if (res.data) {
        setBotConfig({
          botToken: res.data.botToken || "",
          botClientId: res.data.botClientId || ""
        });
      }
    });
  }, []);

  const verify = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    try {
      await api.post("/bot/verify", { masterPassword });
      setVerified(true);
      setConsoleLines((lines) => [
        ...lines,
        "Master password verified."
      ]);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid master password");
    }
  };

  const control = async (action) => {
    setError("");
    setInfo("");
    setConsoleLines((lines) => [...lines, `Executing ${action}...`]);
    try {
      const res = await api.post(`/bot/control/${action}`, { masterPassword });
      await loadStatus();
      setInfo(`Bot ${action} complete.`);
      setConsoleLines((lines) => [
        ...lines,
        `Response: ${JSON.stringify(res.data)}`
      ]);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action}`);
      setConsoleLines((lines) => [
        ...lines,
        `Error: ${err.response?.data?.error || err.message}`
      ]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setConsoleLines((lines) => [...lines, "Sending message..."]);
    try {
      await api.post("/bot/send", {
        masterPassword,
        channelId: messageForm.channelId,
        message: messageForm.message
      });
      setMessageForm({ channelId: "", message: "" });
      setInfo("Message sent.");
      setConsoleLines((lines) => [...lines, "Message sent."]);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send message");
      setConsoleLines((lines) => [
        ...lines,
        `Error: ${err.response?.data?.error || err.message}`
      ]);
    }
  };

  const saveBotConfig = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setConsoleLines((lines) => [...lines, "Saving bot config..."]);
    try {
      await api.put("/settings", botConfig);
      setInfo("Bot config saved.");
      setConsoleLines((lines) => [...lines, "Bot config saved."]);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save bot config");
      setConsoleLines((lines) => [
        ...lines,
        `Error: ${err.response?.data?.error || err.message}`
      ]);
    }
  };

  return (
    <section className="panel">
      <h2>Bot Control</h2>
      {!verified ? (
        <form className="grid" onSubmit={verify}>
          <input
            placeholder="Master password"
            type={showMaster ? "text" : "password"}
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
          />
          <label className="toggle">
            <input
              type="checkbox"
              checked={showMaster}
              onChange={(e) => setShowMaster(e.target.checked)}
            />
            Show password
          </label>
          <button type="submit">Unlock</button>
          {error && <p className="error">{error}</p>}
        </form>
      ) : (
        <>
          <form className="grid" onSubmit={saveBotConfig}>
            <input
              placeholder="Bot Token"
              value={botConfig.botToken}
              onChange={(e) =>
                setBotConfig({ ...botConfig, botToken: e.target.value })
              }
            />
            <input
              placeholder="Bot Client ID"
              value={botConfig.botClientId}
              onChange={(e) =>
                setBotConfig({ ...botConfig, botClientId: e.target.value })
              }
            />
            <button type="submit">Save Bot Config</button>
          </form>
          {error && <p className="error">{error}</p>}
          {info && <p className="success">{info}</p>}
          <div className="control-row">
            <span className="status-pill">
              {status.running ? "Running" : "Stopped"}
            </span>
            <div className="control-buttons">
              <button type="button" onClick={() => control("start")}>
                Start
              </button>
              <button type="button" onClick={() => control("restart")}>
                Restart
              </button>
              <button type="button" onClick={() => control("stop")}>
                Stop
              </button>
            </div>
          </div>
          <div className="console">
            <div className="console-title">Bot Console</div>
            <div className="console-body">
              {consoleLines.length === 0 && (
                <span className="muted">No activity yet.</span>
              )}
              {consoleLines.map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          </div>
          <form className="grid" onSubmit={sendMessage}>
            <input
              placeholder="Channel ID"
              value={messageForm.channelId}
              onChange={(e) =>
                setMessageForm({ ...messageForm, channelId: e.target.value })
              }
            />
            <input
              placeholder="Message"
              value={messageForm.message}
              onChange={(e) =>
                setMessageForm({ ...messageForm, message: e.target.value })
              }
            />
            <button type="submit">Send</button>
          </form>
        </>
      )}
    </section>
  );
}

function PasswordGenerator() {
  const [masterPassword, setMasterPassword] = useState("");
  const [showMaster, setShowMaster] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [generated, setGenerated] = useState(null);

  const verify = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/bot/verify", { masterPassword });
      setVerified(true);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid master password");
    }
  };

  const generate = async (e) => {
    e.preventDefault();
    setGenerated(null);
    setError("");
    try {
      const res = await api.post("/users/password", {
        userId,
        masterPassword,
        role
      });
      setGenerated(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Password generation failed");
    }
  };

  return (
    <section className="panel">
      <h2>Password Generator</h2>
      {!verified ? (
        <form className="grid" onSubmit={verify}>
          <input
            placeholder="Master password"
            type={showMaster ? "text" : "password"}
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
          />
          <label className="toggle">
            <input
              type="checkbox"
              checked={showMaster}
              onChange={(e) => setShowMaster(e.target.checked)}
            />
            Show password
          </label>
          <button type="submit">Unlock</button>
          {error && <p className="error">{error}</p>}
        </form>
      ) : (
        <form className="grid" onSubmit={generate}>
          <input
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="ADMIN">ADMIN</option>
            <option value="OWNER">OWNER</option>
          </select>
          <button type="submit">Generate</button>
        </form>
      )}
      {generated && (
        <div className="list">
          <div className="list-item">
            <strong>Password:</strong> {generated.password}
            <span>{generated.dmSent ? "DM sent" : "DM not sent"}</span>
          </div>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </section>
  );
}

function OwnerCredentials() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    const res = await api.get("/users/credentials");
    setUsers(res.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const selectUser = async (userId) => {
    const res = await api.get(`/users/${userId}`);
    setSelected(res.data);
  };

  return (
    <section className="panel">
      <h2>Owner Credentials</h2>
      <div className="credentials">
        <div className="list">
          {users.map((user) => (
            <button
              className="list-item clickable"
              key={user.id}
              type="button"
              onClick={() => selectUser(user.id)}
            >
              <strong>{user.id}</strong>
              <span>{user.role}</span>
              <span>{user.lastPassword || "No password"}</span>
            </button>
          ))}
        </div>
        {selected && (
          <div className="detail">
            <h3>User Details</h3>
            <p>
              <strong>ID:</strong> {selected.id}
            </p>
            <p>
              <strong>Role:</strong> {selected.role}
            </p>
            <p>
              <strong>Added By:</strong> {selected.addedBy || "Unknown"}
            </p>
            <p>
              <strong>Password:</strong> {selected.lastPassword || "Not set"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function App() {
  const { user, login, logout } = useAuth();
  const [inviteUrl, setInviteUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    api.get("/bot/invite").then((res) => {
      setInviteUrl(res.data?.url || null);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(timer);
  }, [location, user]);

  if (!user) return <Login onLogin={login} />;

  return (
    <Layout user={user} onLogout={logout} inviteUrl={inviteUrl} loading={loading}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/blacklist" element={<Blacklist user={user} />} />
        <Route path="/panels" element={<Panels />} />
        <Route path="/settings" element={<Settings />} />
        {user.role === "OWNER" && (
          <>
            <Route path="/bot-control" element={<BotControl />} />
            <Route path="/passwords" element={<PasswordGenerator />} />
            <Route path="/credentials" element={<OwnerCredentials />} />
            <Route path="/users" element={<Users />} />
          </>
        )}
      </Routes>
    </Layout>
  );
}
