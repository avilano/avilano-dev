const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LINEAR_GRAPHQL_URL = 'https://api.linear.app/graphql';
const RESEND_API_URL = 'https://api.resend.com/emails';

const CREATE_ISSUE_MUTATION = `
  mutation CreateDiagnosticLead($input: IssueCreateInput!) {
    issueCreate(input: $input) {
      success
      issue {
        id
        identifier
      }
    }
  }
`;

interface DiagnosticPayload {
  name: string;
  company: string;
  email: string;
  notes: string;
  totalScore: number;
  tier: string;
  ciScore: number;
  ciLabel: string;
  gateScore: number;
  gateLabel: string;
  wcagScore: number;
  wcagLabel: string;
  primaryFriction: string;
  teamScale: string;
  weeklyHoursLost: number;
  recommendedSprint: string;
}

function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function sanitizeNumber(value: unknown, min: number, max: number): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, Math.round(num)));
}

function parseBody(body: unknown): Record<string, unknown> | null {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    return body as Record<string, unknown>;
  }
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function buildMarkdownDescription(lead: DiagnosticPayload): string {
  const lines = [
    '## QA & CI Pipeline Diagnostic Lead',
    '',
    '### Contact',
    `- **Name:** ${lead.name}`,
    `- **Company:** ${lead.company}`,
    `- **Work Email:** ${lead.email}`,
    '',
    '### Scorecard Summary',
    `- **Total Score:** ${lead.totalScore}/100 (${lead.tier || 'Unrated'})`,
    `- **CI Speed & Determinism:** ${lead.ciScore}/40 (${lead.ciLabel || 'N/A'})`,
    `- **Pre-Merge Release Gating:** ${lead.gateScore}/35 (${lead.gateLabel || 'N/A'})`,
    `- **WCAG 2.1 AA & AI Safety Gates:** ${lead.wcagScore}/25 (${lead.wcagLabel || 'N/A'})`,
    `- **Estimated Weekly Eng Hours Lost:** ~${lead.weeklyHoursLost} hrs/wk`,
    `- **Primary Friction:** ${lead.primaryFriction || 'N/A'}`,
    `- **Engineering Scale:** ${lead.teamScale || 'N/A'}`,
    `- **Recommended Engagement:** ${lead.recommendedSprint || 'N/A'}`,
  ];

  if (lead.notes) {
    lines.push('', '### Stack / Bottleneck Notes', lead.notes);
  }

  return lines.join('\n');
}

async function sendOptionalAlerts(lead: DiagnosticPayload, description: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const webhookUrl = process.env.LEAD_WEBHOOK_URL?.trim();

  const tasks: Promise<void>[] = [];

  if (resendApiKey) {
    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || 'diagnostic@avilano.dev';
    const toEmail = process.env.RESEND_TO_EMAIL?.trim() || 'contact@avilano.dev';
    tasks.push(
      fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject: `[QA Diagnostic] ${lead.company} (${lead.totalScore}/100)`,
          text: description,
        }),
      })
        .then(() => undefined)
        .catch((err) => {
          console.error('[diagnostic] Optional Resend alert failed:', err instanceof Error ? err.message : String(err));
        })
    );
  }

  if (webhookUrl && webhookUrl.startsWith('https://')) {
    tasks.push(
      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'qa_diagnostic_submitted',
          lead,
        }),
      })
        .then(() => undefined)
        .catch((err) => {
          console.error('[diagnostic] Optional webhook alert failed:', err instanceof Error ? err.message : String(err));
        })
    );
  }

  if (tasks.length > 0) {
    await Promise.allSettled(tasks);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader?.('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const body = parseBody(req.body);
  if (!body) {
    return res.status(400).json({ ok: false, error: 'Invalid JSON payload' });
  }

  const honeypot = typeof body.website === 'string' ? body.website.trim() : '';
  if (honeypot.length > 0) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  const rawName = typeof body.name === 'string' ? body.name.trim() : '';
  const rawCompany = typeof body.company === 'string' ? body.company.trim() : '';
  const rawEmail = typeof body.email === 'string' ? body.email.trim() : '';
  const rawNotes = typeof body.notes === 'string' ? body.notes.trim() : '';

  if (rawName.length < 1 || rawName.length > 120) {
    return res.status(400).json({ ok: false, error: 'Name must be between 1 and 120 characters.' });
  }

  if (rawCompany.length < 1 || rawCompany.length > 120) {
    return res.status(400).json({ ok: false, error: 'Company must be between 1 and 120 characters.' });
  }

  if (rawEmail.length < 1 || rawEmail.length > 254 || !EMAIL_REGEX.test(rawEmail)) {
    return res.status(400).json({ ok: false, error: 'A valid work email address is required.' });
  }

  if (rawNotes.length > 1000) {
    return res.status(400).json({ ok: false, error: 'Notes must be 1000 characters or fewer.' });
  }

  const lead: DiagnosticPayload = {
    name: sanitizeText(rawName, 120),
    company: sanitizeText(rawCompany, 120),
    email: sanitizeText(rawEmail, 254),
    notes: sanitizeText(rawNotes, 1000),
    totalScore: sanitizeNumber(body.totalScore, 0, 100),
    tier: sanitizeText(body.tier, 80),
    ciScore: sanitizeNumber(body.ciScore, 0, 40),
    ciLabel: sanitizeText(body.ciLabel, 120),
    gateScore: sanitizeNumber(body.gateScore, 0, 35),
    gateLabel: sanitizeText(body.gateLabel, 120),
    wcagScore: sanitizeNumber(body.wcagScore, 0, 25),
    wcagLabel: sanitizeText(body.wcagLabel, 120),
    primaryFriction: sanitizeText(body.primaryFriction, 160),
    teamScale: sanitizeText(body.teamScale, 40),
    weeklyHoursLost: sanitizeNumber(body.weeklyHoursLost, 0, 10000),
    recommendedSprint: sanitizeText(body.recommendedSprint, 120),
  };

  const description = buildMarkdownDescription(lead);
  const linearApiKey = process.env.LINEAR_API_KEY?.trim();
  const linearTeamId = process.env.LINEAR_TEAM_ID?.trim();
  const linearProjectId = process.env.LINEAR_PROJECT_ID?.trim();

  if (!linearApiKey || !linearTeamId) {
    console.info(
      '[diagnostic] Log-only mode (LINEAR_API_KEY or LINEAR_TEAM_ID not configured):',
      JSON.stringify({
        name: lead.name,
        company: lead.company,
        email: lead.email,
        totalScore: lead.totalScore,
        tier: lead.tier,
        recommendedSprint: lead.recommendedSprint,
      })
    );
    await sendOptionalAlerts(lead, description);
    return res.status(200).json({ ok: true, mode: 'log-only' });
  }

  const title = sanitizeText(
    `[QA Diagnostic] ${lead.company} (${lead.name}) - ${lead.totalScore}/100`,
    200
  );

  const issueInput: Record<string, string> = {
    teamId: linearTeamId,
    title,
    description,
  };

  if (linearProjectId) {
    issueInput.projectId = linearProjectId;
  }

  try {
    const linearRes = await fetch(LINEAR_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Authorization: linearApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: CREATE_ISSUE_MUTATION,
        variables: {
          input: issueInput,
        },
      }),
    });

    if (!linearRes.ok) {
      console.error('[diagnostic] Linear API returned HTTP', linearRes.status);
      return res.status(502).json({ ok: false, error: 'Failed to record diagnostic submission.' });
    }

    const linearJson = (await linearRes.json()) as {
      data?: { issueCreate?: { success?: boolean; issue?: { identifier?: string } } };
      errors?: Array<{ message?: string }>;
    };

    if (linearJson.errors?.length || !linearJson.data?.issueCreate?.success) {
      console.error('[diagnostic] Linear GraphQL error:', linearJson.errors?.[0]?.message || 'Unknown error');
      return res.status(502).json({ ok: false, error: 'Failed to record diagnostic submission.' });
    }

    await sendOptionalAlerts(lead, description);

    return res.status(200).json({
      ok: true,
      mode: 'linear',
      issueIdentifier: linearJson.data.issueCreate.issue?.identifier || null,
    });
  } catch (err) {
    console.error('[diagnostic] Linear request error:', err instanceof Error ? err.message : String(err));
    return res.status(502).json({ ok: false, error: 'Failed to record diagnostic submission.' });
  }
}
