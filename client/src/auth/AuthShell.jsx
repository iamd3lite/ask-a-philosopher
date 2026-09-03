import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { GoogleLogo, EyeIcon, EyeOffIcon, BackArrow } from "./icons.jsx";

// The framing chrome shared by both auth pages: centered parchment card,
// laurel motif, title + italic subtitle, and a quiet link back to the app.
// Mirrors the masthead/panel language already used across the app.
export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-stage">
      <div className="auth-card">
        <Link to="/" className="auth-back" aria-label="Back to the stoa">
          <BackArrow />
          <span>The stoa</span>
        </Link>

        <header className="auth-head">
          <div className="auth-laurel" aria-hidden="true">
            <svg viewBox="0 0 120 24" width="120" height="24">
              <path
                d="M10 12 Q 30 4, 56 12 Q 30 20, 10 12 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.8"
              />
              <path
                d="M110 12 Q 90 4, 64 12 Q 90 20, 110 12 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.8"
              />
              <circle cx="60" cy="12" r="1.4" fill="currentColor" />
            </svg>
          </div>
          <h1 className="auth-title">{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </header>

        {children}

        {footer && <p className="auth-footer">{footer}</p>}
      </div>
    </div>
  );
}

// A labelled text/email input with inline error messaging. Wires up
// aria-invalid / aria-describedby for accessibility.
export function TextField({
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  autoComplete,
  placeholder,
  autoFocus,
  name,
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={"field" + (error ? " field-invalid" : "")}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        className="field-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        autoComplete={autoComplete}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// Password input with a show/hide visibility toggle. The toggle button is
// keyboard-focusable and announces its purpose.
export function PasswordField({
  label,
  value,
  onChange,
  onBlur,
  error,
  autoComplete,
  placeholder,
  name,
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const [visible, setVisible] = useState(false);
  return (
    <div className={"field" + (error ? " field-invalid" : "")}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="field-password">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          className="field-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <button
          type="button"
          className="field-reveal"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          title={visible ? "Hide password" : "Show password"}
          tabIndex={0}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error && (
        <p id={errorId} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// "Continue with Google" button. Presentational only for now — the onClick is
// a placeholder to be connected to the backend OAuth flow later.
export function GoogleButton({ onClick, label = "Continue with Google" }) {
  return (
    <button type="button" className="google-btn" onClick={onClick}>
      <GoogleLogo />
      <span>{label}</span>
    </button>
  );
}

// A labelled horizontal divider ("or") between the credential form and the
// Google option.
export function AuthDivider({ children = "or" }) {
  return (
    <div className="auth-divider" role="separator" aria-hidden="true">
      <span>{children}</span>
    </div>
  );
}
