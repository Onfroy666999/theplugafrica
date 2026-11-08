// Calling a server action from the browser without breaking the page when the request fails (issue #65), for example
// when the host cuts a request off. Returns the action's own result, or { ok: false, error } if it never arrived.

export const NETWORK_ERROR = "We couldn't reach the server. Check your connection and try again.";

export async function call<T>(action: Promise<T>): Promise<T | { ok: false; error: string }> {
  try {
    return await action;
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }
}
