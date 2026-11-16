const SERVER_WAIT_MS = 60000;
const SERVER_ERROR = "The server did not respond. Check that it is running, then try again.";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
    const error = new Error(SERVER_ERROR);
    error.serverDown = true;
    throw error;
  }
  return body;
}

async function fetchJson(url) {
  const started = Date.now();
  while (Date.now() - started < SERVER_WAIT_MS) {
    const remaining = SERVER_WAIT_MS - (Date.now() - started);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remaining);
    try {
      const response = await fetch(url, { signal: controller.signal });
      return await readJson(response);
    } catch (err) {
      const down = !err || err.serverDown || err.name === "AbortError" || err.message === "Failed to fetch";
      if (!down || Date.now() - started >= SERVER_WAIT_MS) {
        if (down) throw new Error(SERVER_ERROR);
        throw err;
      }
      await delay(1500);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(SERVER_ERROR);
}

export function investigate(query) {
  const params = new URLSearchParams(query);
  return fetchJson(`/api/investigate?${params.toString()}`);
}

export function compare(query) {
  const params = new URLSearchParams(query);
  return fetchJson(`/api/compare?${params.toString()}`);
}

export function friendlyError(err) {
  if (!err || err.message === "Failed to fetch" || err.name === "AbortError") {
    return SERVER_ERROR;
  }
  return err.message;
}
