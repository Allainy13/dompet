import { useState } from "react";
import Icon from "../components/Icon.jsx";
import { Logo } from "../components/Sidebar.jsx";

export default function Login({ settings, isSupabaseReady, authMode, onLogin, error }) {
  const [email, setEmail] = useState("demo@dompet.local");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onLogin({ email, password });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function demoLogin() {
    setIsSubmitting(true);
    try {
      await onLogin({ email: "demo@dompet.local", password: "demo", demo: true });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="login-brand">
          <Logo settings={settings} />
          <div>
            <h1>{settings.appName}</h1>
            <p>{settings.tagline}</p>
          </div>
        </div>
        <div className="login-mode"><Icon name={isSupabaseReady ? "verified_user" : "science"} /> {authMode}</div>
        <form className="form-grid" onSubmit={submit}>
          <label className="field"><span>Email</span><input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@perusahaan.co.id" /></label>
          <label className="field"><span>Password</span><input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" /></label>
          {error ? <div className="login-error">{error}</div> : null}
          <button className="primary-button" type="submit" disabled={isSubmitting}><Icon name="login" /> {isSubmitting ? "Memproses..." : "Masuk"}</button>
          {!isSupabaseReady ? <button className="ghost-button" type="button" onClick={demoLogin} disabled={isSubmitting}><Icon name="play_circle" /> Masuk Demo</button> : null}
        </form>
      </section>
    </main>
  );
}
