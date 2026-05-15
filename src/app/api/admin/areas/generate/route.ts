import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { openaiService } from '@/lib/ai/openai-service';
import { OpenAIError } from '@/lib/ai/errors';
import { AREA_SYSTEM_PROMPT, getAreaPrompt } from '@/lib/ai/prompts';
import { areaGenerateSchema, safeValidate } from '@/lib/adminSchemas';

export const runtime = 'edge';

/**
 * POST /api/admin/areas/generate
 * Generate area content using OpenAI
 * 
 * Request body:
 * - name: Area name (required)
 * - state: State name (required)
 * - type: Area type (city/region/lga, default: city)
 * 
 * Response:
 * - overview: Generated overview text
 * - keyStats: Array of key statistics
 * - localIssues: Array of local issues
 */
export const POST = requireAdmin(async (req: NextRequest) => {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validation = safeValidate(areaGenerateSchema, body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    const { name, state, type } = validation.data;

    // Generate content using shared OpenAI service
    const userPrompt = getAreaPrompt(name, state, type);
    const result = await openaiService.generateContent(
      AREA_SYSTEM_PROMPT,
      userPrompt,
      {
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 2000,
        timeout: 45000, // 45 seconds
      }
    );

    // Parse and validate generated content
    let generated: { overview?: string; keyStats?: unknown[]; localIssues?: unknown[] };
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
    if (!generated.overview || !Array.isArray(generated.keyStats) || !Array.isArray(generated.localIssues)) {
      return NextResponse.json(
        { error: 'AI generated incomplete content. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      overview: generated.overview || '',
      keyStats: generated.keyStats || [],
      localIssues: generated.localIssues || [],
    });
  } catch (error) {
    // Handle OpenAI-specific errors
    if (error instanceof OpenAIError) {
      console.error('[Area Generation Error]', {
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
    console.error('[Area Generation Error]', error);
    return NextResponse.json(
      { error: 'Content generation failed. Please try again.' },
      { status: 500 }
    );
  }
});
