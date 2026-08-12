export function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds || 0)));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

export function formatClock(timestamp) {
  if (!timestamp) return "—";
  return new Date(Number(timestamp)).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function categoryLabel(category) {
  const labels = {
    distracting: "Distracting",
    productive: "Productive",
    social: "Social",
    neutral: "Neutral",
    unknown: "Uncategorized",
  };
  return labels[category] || category || "Uncategorized";
}
