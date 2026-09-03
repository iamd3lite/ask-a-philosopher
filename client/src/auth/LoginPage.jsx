import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AuthShell,
  TextField,
  PasswordField,
  GoogleButton,
  AuthDivider,
} from "./AuthShell.jsx";
import { validateLogin } from "./validation.js";

export default function LoginPage() {
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function setField(key, val) {
    setValues((v) => ({ ...v, [key]: val }));
    // Clear a field's error as the user corrects it.
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  function handleBlur(key) {
    setTouched((t) => ({ ...t, [key]: true }));
    const fieldErrors = validateLogin(values);
    setErrors((e) => ({ ...e, [key]: fieldErrors[key] ?? "" }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const fieldErrors = validateLogin(values);
    setErrors(fieldErrors);
    setTouched({ email: true, password: true });
    if (Object.keys(fieldErrors).length > 0) return;

    // Backend authentication is intentionally not wired up yet. This is where
    // the POST to the login endpoint will go in the next step.
    setSubmitting(true);
    setTimeout(() => setSubmitting(false), 600);
  }

  function handleGoogle() {
    // Placeholder — Google OAuth will be connected to the backend later.
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Return to the stoa and resume the conversation."
      footer={
        <>
          Don&rsquo;t have an account? <Link to="/signup">Sign up</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email"
          type="email"
          name="email"
          value={values.email}
          onChange={(v) => setField("email", v)}
          onBlur={() => handleBlur("email")}
          error={touched.email ? errors.email : ""}
          autoComplete="email"
          placeholder="you@example.com"
          autoFocus
        />

        <PasswordField
          label="Password"
          name="password"
          value={values.password}
          onChange={(v) => setField("password", v)}
          onBlur={() => handleBlur("password")}
          error={touched.password ? errors.password : ""}
          autoComplete="current-password"
          placeholder="Your password"
        />

        <div className="auth-row-end">
          <Link to="/forgot-password" className="auth-inline-link">
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="primary-btn auth-submit" disabled={submitting}>
          {submitting ? "One moment…" : "Log In"}
        </button>
      </form>

      <AuthDivider />

      <GoogleButton onClick={handleGoogle} />
    </AuthShell>
  );
}
