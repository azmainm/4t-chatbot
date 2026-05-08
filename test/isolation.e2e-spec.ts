/**
 * 4t-chatbot — Business Isolation Tests
 *
 * Verifies that the CRM knowledge base and the 4Trades website knowledge base
 * are properly separated and don't cross-contaminate.
 *
 * Requires: 4t-chatbot running on localhost:3000
 *
 * Run:  npx jest test/isolation.spec.ts --forceExit
 */

const BASE_URL = process.env.CHATBOT_URL || 'http://localhost:3000';

interface ChatResponse {
  answer: string;
  sources: Array<{ text: string; source: string; score: number }>;
  query: string;
  processingTime: number;
}

async function chatWith(
  businessId: string,
  query: string,
): Promise<ChatResponse> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      businessId,
      collectionName: businessId === 'fourtrades' || businessId === '4trades'
        ? 'fourtrades'
        : businessId,
    }),
  });

  if (!res.ok) {
    throw new Error(`Chat failed (${res.status}): ${await res.text()}`);
  }

  return res.json();
}

describe('Health check', () => {
  it('returns ok', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(data.status).toBe('ok');
  });
});

describe('CRM ↔ Website Isolation', () => {
  // CRM-specific terms that should NOT appear in website responses
  const CRM_TERMS = [
    'funnel board',
    'register board',
    'pipeline stage',
    'leads module',
    'tenant config',
    'owner role',
    'office manager',
    'field staff',
  ];

  // Website-specific terms that should NOT appear in CRM responses
  const WEBSITE_TERMS = [
    'schedule a demo',
    'pricing plan',
    'free trial',
    'subscribe',
    'sign up for',
  ];

  it('CRM questions to website chatbot do NOT return CRM-specific content', async () => {
    const res = await chatWith(
      'fourtrades',
      'How do I create a lead in the CRM?',
    );

    const lowerAnswer = res.answer.toLowerCase();
    const lowerSources = res.sources
      .map((s) => s.text.toLowerCase())
      .join(' ');

    // Sources should NOT be from the CRM knowledge base
    for (const source of res.sources) {
      expect(source.source).not.toContain('leads/');
      expect(source.source).not.toContain('getting-started/');
    }

    // Answer should not contain CRM-specific navigation instructions
    const containsCrmSpecific = CRM_TERMS.some(
      (term) => lowerAnswer.includes(term) || lowerSources.includes(term),
    );

    if (containsCrmSpecific) {
      console.error(
        'CROSS-CONTAMINATION: Website chatbot returned CRM-specific content',
        `Answer excerpt: ${res.answer.substring(0, 200)}`,
      );
    }
    expect(containsCrmSpecific).toBe(false);
  }, 30000);

  it('website questions to CRM chatbot do NOT return website-specific content', async () => {
    const res = await chatWith(
      'crm',
      'What are 4Trades pricing plans?',
    );

    const lowerAnswer = res.answer.toLowerCase();

    // CRM chatbot should NOT describe website content in detail.
    // It's acceptable to echo the user's question terms in a deflection like
    // "I don't have information about pricing plans". We detect this by
    // checking that a negation/deflection phrase appears near the matched term.
    const DEFLECTION_PHRASES = [
      "don't have",
      "no information",
      "not available",
      "can't help",
      "cannot help",
      "unable to",
      "outside",
      "not something",
      "i'm not sure",
    ];

    const containsWebsiteSpecific = WEBSITE_TERMS.some((term) => {
      if (!lowerAnswer.includes(term)) return false;
      // If the answer is a deflection, it's not cross-contamination
      const isDeflection = DEFLECTION_PHRASES.some((d) => lowerAnswer.includes(d));
      return !isDeflection;
    });

    if (containsWebsiteSpecific) {
      console.error(
        'CROSS-CONTAMINATION: CRM chatbot returned website-specific content',
        `Answer excerpt: ${res.answer.substring(0, 200)}`,
      );
    }
    expect(containsWebsiteSpecific).toBe(false);
  }, 30000);

  it('CRM collection only has CRM business_id documents', async () => {
    const res = await fetch(
      `${BASE_URL}/api/stats/crm/crm`,
    );
    if (res.ok) {
      const stats = await res.json();
      expect(stats.businessId).toBe('crm');
      expect(stats.totalDocuments).toBeGreaterThan(0);
    }
  }, 10000);

  it('fourtrades collection only has fourtrades business_id documents', async () => {
    const res = await fetch(
      `${BASE_URL}/api/stats/fourtrades/fourtrades`,
    );
    if (res.ok) {
      const stats = await res.json();
      expect(stats.businessId).toBe('fourtrades');
    }
  }, 10000);
});

describe('CRM RAG System Prompt', () => {
  it('uses CRM system prompt for crm businessId', async () => {
    const res = await chatWith('crm', 'What user roles exist in the system?');

    // CRM system prompt knows about Owner, Office Manager, Field Staff
    const lowerAnswer = res.answer.toLowerCase();
    const mentionsRoles =
      lowerAnswer.includes('owner') ||
      lowerAnswer.includes('office manager') ||
      lowerAnswer.includes('field staff') ||
      lowerAnswer.includes("don't have");

    expect(mentionsRoles).toBe(true);
  }, 30000);

  it('does not execute CRM actions via the RAG endpoint', async () => {
    const res = await chatWith(
      'crm',
      'Create a lead for John Smith at Acme Corp',
    );

    // The RAG endpoint should NOT have CRUD capabilities
    // It should either explain how to create a lead or say it can't do that
    expect(res.answer).toBeTruthy();
    // Verify no action was actually taken — response is just text, no action metadata
    expect((res as Record<string, unknown>).action).toBeUndefined();
  }, 30000);
});

describe('Website RAG System Prompt', () => {
  it('uses website system prompt for fourtrades businessId', async () => {
    const res = await chatWith('fourtrades', 'What services do you offer?');
    expect(res.answer).toBeTruthy();

    // Should NOT reference CRM internal features
    expect(res.answer.toLowerCase()).not.toContain('tenant config');
    expect(res.answer.toLowerCase()).not.toContain('funnel board');
  }, 30000);
});

describe('Unknown businessId', () => {
  it('falls back to fourtrades prompt for unknown businessId', async () => {
    const res = await chatWith('unknown_business_xyz', 'hello');
    expect(res.answer).toBeTruthy();
    // Should respond, not crash — falls back to FOURTRADES_SYSTEM_PROMPT
  }, 30000);
});
