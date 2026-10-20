// Calls POST /api/claims/assess and returns { claim, assessment }.
// On failure throws an ApiError with a `kind` the UI can react to:
//   'validation'  → the form input was rejected (400)
//   'unavailable' → the AI did not answer (502 / timeout)
//   'offline'     → the backend could not be reached
//   'unknown'     → anything else
export class ApiError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind;
  }
}

export async function assessClaim(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000); // the AI can be slow; don't wait forever

  let res;
  try {
    res = await fetch('/api/claims/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw new ApiError('unavailable', 'The AI took too long to answer.');
    throw new ApiError('offline', 'The LorealClaim server could not be reached.');
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json().catch(() => null);
  if (res.ok) return data;

  // NestJS validation errors come back as an array of messages.
  const message = Array.isArray(data?.message) ? data.message.join('. ') : data?.message;
  if (res.status === 400) throw new ApiError('validation', message || 'Some fields need attention.');
  if (res.status === 502 || res.status === 503 || res.status === 504)
    throw new ApiError('unavailable', message || 'The AI service did not respond.');
  throw new ApiError('unknown', message || `Something went wrong (error ${res.status}).`);
}
