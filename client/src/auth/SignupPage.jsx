import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AuthShell,
  TextField,
  PasswordField,
  GoogleButton,
  AuthDivider,
} from "./AuthShell.jsx";
import { validateSignup } from "./validation.js";

export default function SignupPage() {
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function setField(key, val) {
    setValues((v) => ({ ...v, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
    // Re-check the confirm field live once the passwords have diverged.
    if (key === "password" && touched.confirm) {
      setErrors((e) => ({
        ...e,
        confirm: val === values.confirm ? "" : "The passwords do not match.",
      }));
    }
  }

  function handleBlur(key) {
    setTouched((t) => ({ ...t, [key]: true }));
    const fieldErrors = validateSignup(values);
    setErrors((e) => ({ ...e, [key]: fieldErrors[key] ?? "" }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const fieldErrors = validateSignup(values);
    setErrors(fieldErrors);
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (Object.keys(fieldErrors).length > 0) return;

    // Backend account creation is intentionally not wired up yet. This is where
    // the POST to the register endpoint will go in the next step.
    setSubmitting(true);
    setTimeout(() => setSubmitting(false), 600);
  }

  function handleGoogle() {
    // Placeholder — Google OAuth will be connected to the backend later.
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Take a seat in the stoa. Your conversations will be kept."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Full name"
          name="name"
          value={values.name}
          onChange={(v) => setField("name", v)}
          onBlur={() => handleBlur("name")}
          error={touched.name ? errors.name : ""}
          autoComplete="name"
          placeholder="Your name"
          autoFocus
        />

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
        />

        <PasswordField
          label="Password"
          name="password"
          value={values.password}
          onChange={(v) => setField("password", v)}
          onBlur={() => handleBlur("password")}
          error={touched.password ? errors.password : ""}
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />

        <PasswordField
          label="Confirm password"
          name="confirm"
          value={values.confirm}
          onChange={(v) => setField("confirm", v)}
          onBlur={() => handleBlur("confirm")}
          error={touched.confirm ? errors.confirm : ""}
          autoComplete="new-password"
          placeholder="Re-enter your password"
        />

        <button type="submit" className="primary-btn auth-submit" disabled={submitting}>
          {submitting ? "One moment…" : "Create Account"}
        </button>
      </form>

      <AuthDivider />

      <GoogleButton onClick={handleGoogle} />
    </AuthShell>
  );
}
