import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '../../api/diagnostic';

function createMockRes() {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let jsonBody: unknown = null;

  const res = {
    setHeader(key: string, value: string) {
      headers[key] = value;
    },
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(body: unknown) {
      jsonBody = body;
      return res;
    },
    getStatus: () => statusCode,
    getBody: () => jsonBody,
    getHeaders: () => headers,
  };

  return res;
}

const VALID_BODY = {
  name: 'Alex Rivera',
  company: 'Acme Engineering',
  email: 'alex@acme.com',
  website: '',
  notes: 'Next.js + Playwright migration',
  totalScore: 62,
  tier: 'Scaling Bottleneck',
  ciScore: 24,
  ciLabel: '10-30 min, occasional reruns',
  gateScore: 20,
  gateLabel: 'Automated suite runs nightly / post-merge only',
  wcagScore: 18,
  wcagLabel: 'Periodic manual audits / ad-hoc checks',
  primaryFriction: 'Flaky tests blocking PR merges',
  teamScale: '11-40',
  weeklyHoursLost: 37,
  recommendedSprint: 'AI-Ready Playwright Foundation',
};

describe('POST /api/diagnostic', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.LINEAR_API_KEY;
    delete process.env.LINEAR_TEAM_ID;
    delete process.env.LINEAR_PROJECT_ID;
    delete process.env.RESEND_API_KEY;
    delete process.env.LEAD_WEBHOOK_URL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('rejects non-POST requests with 405', async () => {
    const res = createMockRes();
    await handler({ method: 'GET' }, res);
    expect(res.getStatus()).toBe(405);
    expect(res.getHeaders().Allow).toBe('POST');
  });

  it('silently skips honeypot submissions with 200 without calling fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const res = createMockRes();
    await handler({ method: 'POST', body: { ...VALID_BODY, website: 'https://spam.example' } }, res);
    expect(res.getStatus()).toBe(200);
    expect(res.getBody()).toEqual({ ok: true, skipped: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns 400 on invalid email or oversized notes', async () => {
    const resBadEmail = createMockRes();
    await handler({ method: 'POST', body: { ...VALID_BODY, email: 'not-an-email' } }, resBadEmail);
    expect(resBadEmail.getStatus()).toBe(400);

    const resLongNotes = createMockRes();
    await handler({ method: 'POST', body: { ...VALID_BODY, notes: 'x'.repeat(1001) } }, resLongNotes);
    expect(resLongNotes.getStatus()).toBe(400);
  });

  it('returns log-only 200 when Linear env vars are not configured', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const res = createMockRes();
    await handler({ method: 'POST', body: VALID_BODY }, res);
    expect(res.getStatus()).toBe(200);
    expect(res.getBody()).toEqual({ ok: true, mode: 'log-only' });
    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  it('sends a parameterized GraphQL mutation to Linear when configured', async () => {
    process.env.LINEAR_API_KEY = 'lin_api_test_key';
    process.env.LINEAR_TEAM_ID = 'team-123';
    process.env.LINEAR_PROJECT_ID = 'proj-456';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          issueCreate: {
            success: true,
            issue: { id: 'issue-1', identifier: 'AVL-42' },
          },
        },
      }),
    } as Response);

    const res = createMockRes();
    await handler({ method: 'POST', body: VALID_BODY }, res);

    expect(res.getStatus()).toBe(200);
    expect(res.getBody()).toEqual({ ok: true, mode: 'linear', issueIdentifier: 'AVL-42' });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.linear.app/graphql');
    const parsedPayload = JSON.parse(String(init?.body));
    expect(parsedPayload.query).toContain('issueCreate(input: $input)');
    expect(parsedPayload.query).not.toContain('Alex Rivera');
    expect(parsedPayload.variables.input.teamId).toBe('team-123');
    expect(parsedPayload.variables.input.projectId).toBe('proj-456');
    expect(parsedPayload.variables.input.title).toContain('Acme Engineering');
  });
});
