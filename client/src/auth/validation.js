// Client-side validation helpers for the authentication screens.
// Pure functions only — no side effects, no network. Backend validation
// will be added separately and is the real source of truth.

// A pragmatic email shape check: something@something.tld with no spaces.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateName(name) {
  if (!name || !name.trim()) return "Please tell us your name.";
  if (name.trim().length < 2) return "That name seems a little short.";
  return "";
}

export function validateEmail(email) {
  if (!email || !email.trim()) return "An email is required.";
  if (!EMAIL_RE.test(email.trim())) return "That doesn't look like an email.";
  return "";
}

export function validatePassword(password, { require = true } = {}) {
  if (!password) return require ? "A password is required." : "";
  if (password.length < 8) return "Use at least 8 characters.";
  return "";
}

export function validateConfirm(password, confirm) {
  if (!confirm) return "Please confirm your password.";
  if (password !== confirm) return "The passwords do not match.";
  return "";
}

// Validate the full sign-up form. Returns a map of field -> error message,
// omitting fields that pass. An empty object means the form is valid.
export function validateSignup({ name, email, password, confirm }) {
  const errors = {};
  const nameErr = validateName(name);
  const emailErr = validateEmail(email);
  const passErr = validatePassword(password);
  const confirmErr = validateConfirm(password, confirm);
  if (nameErr) errors.name = nameErr;
  if (emailErr) errors.email = emailErr;
  if (passErr) errors.password = passErr;
  if (confirmErr) errors.confirm = confirmErr;
  return errors;
}

// Validate the log-in form. Password presence only — length rules belong to
// sign-up, since existing accounts may predate any rule change.
export function validateLogin({ email, password }) {
  const errors = {};
  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;
  if (!password) errors.password = "A password is required.";
  return errors;
}
