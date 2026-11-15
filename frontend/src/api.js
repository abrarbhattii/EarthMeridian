async function readJson(response) {
  let body = null;
  try {
    body = await response.json();
  } catch (err) {
    body = null;
  }
  if (!response.ok) {
    const detail = body && body.detail;
    if (typeof detail === "string") {
      throw new Error(detail);
    }
    throw new Error("Check the place and the years, then try again.");
  }
  return body;
}

export function getCatalog() {
  return fetch("/api/catalog").then(readJson);
}

export function investigate(query) {
  const params = new URLSearchParams(query);
  return fetch(`/api/investigate?${params.toString()}`).then(readJson);
}

export function compare(query) {
  const params = new URLSearchParams(query);
  return fetch(`/api/compare?${params.toString()}`).then(readJson);
}

export function friendlyError(err) {
  if (!err || err.message === "Failed to fetch") {
    return "Could not reach the Meridian server. Start the backend and try again.";
  }
  return err.message;
}
