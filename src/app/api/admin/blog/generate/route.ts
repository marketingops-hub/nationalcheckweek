import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { openaiService } from '@/lib/ai/openai-service';
import { OpenAIError } from '@/lib/ai/errors';
import { BLOG_SYSTEM_PROMPT, getBlogPrompt } from '@/lib/ai/prompts';
import { blogGenerateSchema, safeValidate } from '@/lib/adminSchemas';

export const runtime = 'edge';

/**
 * POST /api/admin/blog/generate
 * Generate blog post content using OpenAI
 * 
 * Request body:
 * - title: Blog post title (required)
 * - style: Writing style (professional/conversational/academic/storytelling, default: professional)
 * - length: Content length (short/medium/long, default: medium)
 * 
 * Response:
 * - content: Generated HTML content
 * - excerpt: Post summary
 * - metaTitle: SEO title
 * - metaDesc: SEO description
 */
export const POST = requireAdmin(async (req: NextRequest) => {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validation = safeValidate(blogGenerateSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    const { title, style, length } = validation.data;

    // Generate content using shared OpenAI service
    const userPrompt = getBlogPrompt(title, style, length);
    const result = await openaiService.generateContent(
      BLOG_SYSTEM_PROMPT,
      userPrompt,
      {
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 4000,
        timeout: 60000, // 60 seconds for longer content
      }
    );

    // Parse and validate generated content
    let generated: { content?: string; excerpt?: string; metaTitle?: string; metaDesc?: string };
    try {
      generated = JSON.parse(result.content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return NextResponse.json(
        { error: 'Invalid response from AI service' },
        { status: 500 }
      );
    }

    // Validate response structure
    if (!generated.content) {
      return NextResponse.json(
        { error: 'AI generated incomplete content. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      content: generated.content || '',
      excerpt: generated.excerpt || '',
      metaTitle: generated.metaTitle || title,
      metaDesc: generated.metaDesc || '',
    });
  } catch (error) {
    // Handle OpenAI-specific errors
    if (error instanceof OpenAIError) {
      console.error('[Blog Generation Error]', {
        code: error.code,
        message: error.message,
        statusCode: error.details?.statusCode,
      });
      return NextResponse.json(
        { error: error.message },
        { status: error.details?.statusCode || 500 }
      );
    }

    // Handle generic errors
    console.error('[Blog Generation Error]', error);
    return NextResponse.json(
      { error: 'Content generation failed. Please try again.' },
      { status: 500 }
    );
  }
});
