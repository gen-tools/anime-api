const extractPathSlug = (href, section) => {
  if (!href) return null;

  try {
    const segments = new URL(href, "https://anime-api.invalid")
      .pathname
      .split("/")
      .filter(Boolean);
    const sectionIndex = section ? segments.lastIndexOf(section) : -1;

    return sectionIndex >= 0
      ? segments[sectionIndex + 1] || null
      : segments.at(-1) || null;
  } catch {
    return null;
  }
};

const upstreamError = (scraperName, requestUrl, error) => {
  const status = error.response?.status;
  const statusText = status ? `HTTP ${status}` : "network error";
  const message = error.message || "Unknown upstream error";
  return new Error(`${scraperName}: ${statusText} for ${requestUrl}: ${message}`);
};

module.exports = { extractPathSlug, upstreamError };
