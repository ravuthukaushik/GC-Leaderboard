export function cx(...values) {
  return values.filter(Boolean).join(" ");
}

export function formatDelta(value) {
  if (!Number.isFinite(value)) return "0.0";
  if (value > 0) return `+${value.toFixed(1)}`;
  return value.toFixed(1);
}

export function formatTimestamp(timestamp) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(timestamp));
}

export function round(value, places = 2) {
  return Number(value.toFixed(places));
}
