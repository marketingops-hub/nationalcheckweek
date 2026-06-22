import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/adminClient';
import { requireAdmin } from '@/lib/auth';
import { anthropicService } from '@/lib/ai/anthropic-service';

export const runtime = 'nodejs';

/**
 * POST /api/admin/areas/rewrite-issues
 * Rewrites the local issues array for an area using a vault document.
 * Returns the rewritten issues array — does NOT save automatically.
 */
export const POST = requireAdmin(async (req: NextRequest) => {
  const { area_id, vault_document_id } = await req.json() as {
    area_id: string;
    vault_document_id: string;
  };

  if (!area_id || !vault_document_id) {
    return NextResponse.json({ error: 'area_id and vault_document_id are required' }, { status: 400 });
  }

  const sb = adminClient();

  // Fetch vault document + chunks
  const { data: doc } = await sb
    .from('vault_documents')
    .select('id, title, status')
    .eq('id', vault_document_id)
    .single();

  if (!doc) return NextResponse.json({ error: 'Vault document not found' }, { status: 404 });
  if (doc.status !== 'ready') {
    return NextResponse.json({ error: `Document not ready yet (status: ${doc.status})` }, { status: 409 });
  }

  const { data: chunks } = await sb
    .from('vault_chunks')
    .select('chunk_index, content')
    .eq('document_id', vault_document_id)
    .order('chunk_index');

  const docText = (chunks ?? []).map((c: { content: string }) => c.content).join('\n\n');
  if (!docText.trim()) {
    return NextResponse.json({ error: 'Document has no text content' }, { status: 422 });
  }

  // Fetch the area + its current local issues
  const { data: area } = await sb
    .from('areas')
    .select('name, state, issues')
    .eq('id', area_id)
    .single();

  if (!area) return NextResponse.json({ error: 'Area not found' }, { status: 404 });

  const currentIssues = Array.isArray(area.issues) ? area.issues : [];

  if (currentIssues.length === 0) {
    return NextResponse.json({ error: 'This area has no local issues to rewrite. Add at least one issue first.' }, { status: 422 });
  }

  const systemPrompt = `You are a professional content writer for a mental health awareness website focused on young Australians in schools.
Write in clear, empathetic, evidence-based language.
CITATION RULE: Whenever you use a specific statistic, figure, percentage, or factual claim drawn from the source document, you MUST append an inline citation "(Source: ${doc.title})" immediately after that sentence or phrase.
Do not fabricate statistics not present in the document.`;

  const userPrompt = `SOURCE DOCUMENT: "${doc.title}"

${docText}

---

AREA: ${area.name}, ${area.state}

CURRENT LOCAL ISSUES:
${JSON.stringify(currentIssues, null, 2)}

---

Rewrite the "stat" and "desc" fields for each local issue above using the source document as your primary reference.
Keep the existing "title", "severity", and "slug" fields exactly as they are — do not change them.

For each issue:
- "stat": a single striking local statistic or figure (1 line, e.g. "1 in 4 students"). Draw from the document if relevant data exists.
- "desc": 2–3 sentences describing how this issue manifests specifically in ${area.name}. Cite from the document where applicable.

Return ONLY a JSON array with the same number of objects as the input, preserving all original fields but with updated stat and desc values.`;

  try {
    const result = await anthropicService.generateContent(systemPrompt, userPrompt, {
      model: 'gpt-4o',
      temperature: 0.4,
      maxTokens: 2000,
      timeout: 90000,
    });

    let rewritten: unknown[];
    try {
      rewritten = JSON.parse(result.content);
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON — try again' }, { status: 500 });
    }

    if (!Array.isArray(rewritten) || rewritten.length !== currentIssues.length) {
      return NextResponse.json({ error: 'AI returned wrong number of issues — try again' }, { status: 500 });
    }

    return NextResponse.json({ issues: rewritten, document_title: doc.title });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'AI generation failed' }, { status: 500 });
  }
});
