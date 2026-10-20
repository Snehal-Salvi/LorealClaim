import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, assessClaim } from './api.js';

const payload = { productName: 'P', claimType: 'EFFICACY', claimText: 'Claim', evidence: 'x'.repeat(60) };
const respond = (status, body) =>
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body }));

afterEach(() => vi.unstubAllGlobals());

describe('assessClaim', () => {
  it('POSTs the form as JSON to /api/claims/assess and returns the result', async () => {
    respond(201, { claim: { id: '1' }, assessment: { id: 'a' } });

    await expect(assessClaim(payload)).resolves.toEqual({ claim: { id: '1' }, assessment: { id: 'a' } });
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('/api/claims/assess');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(options.body)).toEqual(payload);
  });

  it('turns a 400 into a validation error and joins the field messages', async () => {
    respond(400, { message: ['evidence is too short', 'claimType is invalid'] });
    await expect(assessClaim(payload)).rejects.toMatchObject({
      kind: 'validation',
      message: 'evidence is too short. claimType is invalid',
    });
  });

  it.each([502, 503, 504])('treats %i as "AI unavailable"', async (status) => {
    respond(status, { message: 'AI service is unavailable right now. Please try again.' });
    await expect(assessClaim(payload)).rejects.toMatchObject({ kind: 'unavailable' });
  });

  it('treats other server errors as unknown', async () => {
    respond(500, { message: 'Internal server error' });
    await expect(assessClaim(payload)).rejects.toMatchObject({ kind: 'unknown', message: 'Internal server error' });
  });

  it('reports "offline" when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(assessClaim(payload)).rejects.toMatchObject({ kind: 'offline' });
  });

  it('reports "unavailable" when the request times out', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' })));
    await expect(assessClaim(payload)).rejects.toMatchObject({ kind: 'unavailable' });
  });

  it('throws ApiError instances', async () => {
    respond(500, null);
    await expect(assessClaim(payload)).rejects.toBeInstanceOf(ApiError);
  });
});
