const KEY = "aap.saved.v1";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // quota or unavailable — silently ignore
  }
}

export function loadSaved() {
  return read();
}

export function saveQuote(quote) {
  const list = read();
  if (list.some((q) => q.id === quote.id)) return list;
  const next = [quote, ...list];
  write(next);
  return next;
}

export function removeQuote(id) {
  const next = read().filter((q) => q.id !== id);
  write(next);
  return next;
}

export function quoteIdFor(message) {
  return `${message.philosopher}::${message.text}`;
}
