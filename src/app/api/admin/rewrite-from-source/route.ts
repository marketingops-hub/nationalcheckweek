import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireStaff } from '@/lib/auth';
import { anthropicService } from '@/lib/ai/anthropic-service';

// Node.js runtime — Anthropic SDK requires it
export const runtime = 'nodejs';

const ISSUE_FIELDS = ['short_desc', 'definition', 'australian_data', 'mechanisms', 'anchor_stat'] as const;
const AREA_FIELDS  = ['overview', 'prevention', 'key_stats'] as const;

function buildIssuePrompt(issue: Record<string, unknown>, docTitle: string, docText: string): string {
  return `SOURCE DOCUMENT TITLE: "${docTitle}"

SOURCE DOCUMENT CONTENT:
${docText}

---

CURRENT ISSUE: ${issue.title ?? '(untitled)'}

CURRENT CONTENT:
${JSON.stringify({
  short_desc:      issue.short_desc,
  definition:      issue.definition,
  australian_data: issue.australian_data,
  mechanisms:      issue.mechanisms,
  anchor_stat:     issue.anchor_stat,
}, null, 2)}

---

Rewrite these 5 fields for the issue using the source document above as your primary reference.

Field definitions:
- short_desc: 1–2 sentence plain-English summary of the issue
- definition: 2–3 paragraphs explaining what the issue is and how it presents
- australian_data: 2–3 paragraphs of Australian statistics and research data. USE THE DOCUMENT as the main source.
- mechanisms: 2 paragraphs explaining the psychological/social mechanisms that cause or worsen the issue
- anchor_stat: ONE single striking statistic (e.g. "1 in 5 young Australians") — draw from the document if possible

CITATION RULE: Whenever you use a specific statistic, figure, percentage, or direct factual claim drawn from the source document, you MUST append an inline citation "(Source: ${docTitle})" immediately after that sentence or phrase.

Return ONLY a JSON object with these exact keys: short_desc, definition, australian_data, mechanisms, anchor_stat`;
}

function buildAreaPrompt(area: Record<string, unknown>, docTitle: string, docText: string): string {
  return `SOURCE DOCUMENT TITLE: "${docTitle}"

SOURCE DOCUMENT CONTENT:
${docText}

---

CURRENT AREA: ${area.name ?? '(unnamed)'}, ${area.state ?? ''}

CURRENT CONTENT:
${JSON.stringify({
  overview:   area.overview,
  key_stats:  area.key_stats,
  prevention: area.prevention,
}, null, 2)}

---

Rewrite these 3 fields for the area using the source document above as your primary reference.

Field definitions:
- overview: 2–3 paragraphs about the mental health landscape in this area (schools, young people focus)
- key_stats: array of up to 6 statistics relevant to this area, each as {"num": "X,XXX", "label": "short label"}. Prefer stats from the document; supplement with plausible area-level estimates only if the document provides no local data.
- prevention: 2 paragraphs about prevention and support in this area

CITATION RULE: Whenever you use a specific statistic, figure, percentage, or direct factual claim drawn from the source document, you MUST append an inline citation "(Source: ${docTitle})" immediately after that sentence or phrase.

Return ONLY a JSON object with these exact keys: overview, key_stats (array), prevention`;
}

export const POST = requireStaff(async (req: NextRequest) => {
  const { record_type, record_id, vault_document_id } = await req.json() as {
    record_type: 'issue' | 'area';
    record_id: string;
    vault_document_id: string;
  };

  if (!record_type || !record_id || !vault_document_id) {
    return NextResponse.json({ error: 'record_type, record_id, and vault_document_id are required' }, { status: 400 });
  }

  const sb = adminClient();

  // 1. Fetch vault document metadata + chunks
  const { data: doc, error: docErr } = await sb
    .from('vault_documents')
    .select('id, title, status, chunk_count')
    .eq('id', vault_document_id)
    .single();

  if (docErr || !doc) {
    return NextResponse.json({ error: 'Vault document not found' }, { status: 404 });
  }
  if (doc.status !== 'ready') {
    return NextResponse.json({ error: `Document is not ready yet (status: ${doc.status}). Wait for indexing to complete.` }, { status: 409 });
  }

  const { data: chunks, error: chunkErr } = await sb
    .from('vault_chunks')
    .select('chunk_index, content')
    .eq('document_id', vault_document_id)
    .order('chunk_index');

  if (chunkErr) {
    return NextResponse.json({ error: 'Failed to read document content' }, { status: 500 });
  }

  const docText = (chunks ?? []).map(c => c.content).join('\n\n');
  if (!docText.trim()) {
    return NextResponse.json({ error: 'Document has no text content' }, { status: 422 });
  }

  // 2. Fetch the current record
  const table = record_type === 'issue' ? 'issues' : 'areas';
  const { data: record, error: recErr } = await sb
    .from(table)
    .select('*')
    .eq('id', record_id)
    .single();

  if (recErr || !record) {
    return NextResponse.json({ error: `${record_type} not found` }, { status: 404 });
  }

  // 3. Build prompt and call Claude
  const systemPrompt = `You are a professional content writer for a mental health awareness website focused on young Australians. You write in clear, empathetic, evidence-based language. You always cite sources when using specific statistics from a provided document.`;

  const userPrompt = record_type === 'issue'
    ? buildIssuePrompt(record as Record<string, unknown>, doc.title, docText)
    : buildAreaPrompt(record as Record<string, unknown>, doc.title, docText);

  try {
    const result = await anthropicService.generateContent(systemPrompt, userPrompt, {
      model: 'claude-sonnet-4-6',
      temperature: 0.4,
      maxTokens: 3000,
      timeout: 90000,
    });

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(result.content);
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON — try again' }, { status: 500 });
    }

    // Validate expected keys exist
    const expectedKeys = record_type === 'issue' ? ISSUE_FIELDS : AREA_FIELDS;
    const missing = expectedKeys.filter(k => !(k in parsed));
    if (missing.length) {
      return NextResponse.json({ error: `AI response missing fields: ${missing.join(', ')}` }, { status: 500 });
    }

    return NextResponse.json({
      fields: parsed,
      document_title: doc.title,
      vault_document_id,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'AI generation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
