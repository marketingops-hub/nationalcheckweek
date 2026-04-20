import { describe, it, expect } from 'vitest';
import {
  CreateDocumentSchema,
  PasteDocumentSchema,
  UrlDocumentSchema,
  PatchDocumentSchema,
  FileUploadMetaSchema,
  UPLOAD_LIMITS,
  MIME_TO_KIND,
} from '../schemas';

describe('PasteDocumentSchema', () => {
  it('accepts a minimal valid paste', () => {
    const r = PasteDocumentSchema.safeParse({
      kind: 'paste',
      title: 'AIHW Report 2023',
      content: 'Key findings: 1 in 7 Australian young people experienced a mental disorder.',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.category).toBe('general');  // default
      expect(r.data.tags).toEqual([]);
    }
  });

  it('rejects empty title', () => {
    const r = PasteDocumentSchema.safeParse({ kind: 'paste', title: '', content: 'x' });
    expect(r.success).toBe(false);
  });

  it('rejects empty content', () => {
    const r = PasteDocumentSchema.safeParse({ kind: 'paste', title: 'Hi', content: '' });
    expect(r.success).toBe(false);
  });

  it('rejects content over 500 KB chars', () => {
    const r = PasteDocumentSchema.safeParse({
      kind: 'paste',
      title: 'big',
      content: 'a'.repeat(500_001),
    });
    expect(r.success).toBe(false);
  });
});

describe('UrlDocumentSchema', () => {
  it('accepts a valid URL', () => {
    const r = UrlDocumentSchema.safeParse({
      kind: 'url',
      url: 'https://aihw.gov.au/reports/mental-health/2023',
    });
    expect(r.success).toBe(true);
  });

  it('rejects garbage URLs', () => {
    const r = UrlDocumentSchema.safeParse({ kind: 'url', url: 'not-a-url' });
    expect(r.success).toBe(false);
  });
});

describe('CreateDocumentSchema discriminated union', () => {
  it('routes on kind=paste', () => {
    const r = CreateDocumentSchema.safeParse({ kind: 'paste', title: 'x', content: 'y' });
    expect(r.success).toBe(true);
  });
  it('routes on kind=url', () => {
    const r = CreateDocumentSchema.safeParse({ kind: 'url', url: 'https://x.com' });
    expect(r.success).toBe(true);
  });
  it('rejects unknown kind', () => {
    const r = CreateDocumentSchema.safeParse({ kind: 'pdf', file: 'x' } as unknown);
    expect(r.success).toBe(false);
  });
});

describe('PatchDocumentSchema', () => {
  it('accepts partial title updates', () => {
    const r = PatchDocumentSchema.safeParse({ title: 'New title' });
    expect(r.success).toBe(true);
  });

  it('accepts tag arrays', () => {
    const r = PatchDocumentSchema.safeParse({ tags: ['mental-health', 'research'] });
    expect(r.success).toBe(true);
  });

  it('rejects extra keys (strict mode)', () => {
    const r = PatchDocumentSchema.safeParse({ title: 'x', status: 'ready' });
    expect(r.success).toBe(false);
  });

  it('accepts empty patch (route layer should reject)', () => {
    // Schema allows {} — route layer enforces at least one field.
    const r = PatchDocumentSchema.safeParse({});
    expect(r.success).toBe(true);
  });
});

describe('FileUploadMetaSchema', () => {
  it('defaults category to general', () => {
    const r = FileUploadMetaSchema.safeParse({});
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.category).toBe('general');
  });
});

describe('UPLOAD_LIMITS + MIME_TO_KIND', () => {
  it('limits are sane', () => {
    expect(UPLOAD_LIMITS.MAX_FILE_BYTES).toBe(100 * 1024 * 1024);
    expect(UPLOAD_LIMITS.MAX_FILES_PER_REQ).toBe(10);
  });

  it('maps PDFs correctly', () => {
    expect(MIME_TO_KIND['application/pdf']).toBe('pdf');
  });

  it('maps DOCX correctly', () => {
    expect(MIME_TO_KIND['application/vnd.openxmlformats-officedocument.wordprocessingml.document']).toBe('docx');
  });

  it('treats markdown as txt', () => {
    expect(MIME_TO_KIND['text/markdown']).toBe('txt');
  });
});
