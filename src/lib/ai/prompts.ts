/**
 * AI prompt templates for content generation
 * Centralized prompts for consistency and easy maintenance
 */

/**
 * System prompt for area content generation
 */
export const AREA_SYSTEM_PROMPT = `You are an expert in Australian education policy, student wellbeing, and regional education data. 
You provide accurate, evidence-based content with specific statistics where possible.
Your responses are always in valid JSON format.`;

/**
 * Generate user prompt for area content
 */
export function getAreaPrompt(name: string, state: string, type: string): string {
  return `Generate comprehensive content for a National Check-in Week area page about ${name}, ${state}.

Area Type: ${type}

Please provide:
1. A compelling 2-3 paragraph overview about this area's education landscape and wellbeing challenges
2. 3-5 key statistics about the area (format: {"num": "value", "label": "description"})
3. 3-5 local wellbeing issues specific to this area (format: {"title": "issue name", "severity": "critical/high/notable", "stat": "key statistic", "desc": "2-3 sentence description"})

Focus on:
- Student mental health and wellbeing challenges
- Local education statistics
- Community-specific issues
- Regional disparities
- Evidence-based data

Return as JSON with keys: overview, keyStats (array), localIssues (array)`;
}

/**
 * System prompt for blog content generation
 */
export const BLOG_SYSTEM_PROMPT = `You are an expert writer specializing in Australian education policy, student wellbeing, and mental health for National Check-in Week. 
You write engaging, evidence-based content that is accessible to educators, parents, and policy makers.
Your responses are always in valid JSON format.`;

/**
 * Style-specific writing instructions
 */
const BLOG_STYLES = {
  professional: 'Write in a professional, authoritative tone suitable for education policy professionals.',
  conversational: 'Write in a friendly, conversational tone that is accessible to parents and general readers.',
  academic: 'Write in an academic, research-focused tone with citations and evidence-based arguments.',
  storytelling: 'Write in a narrative, storytelling style that engages readers emotionally.',
} as const;

/**
 * Length specifications
 */
const BLOG_LENGTHS = {
  short: '400-600 words',
  medium: '800-1200 words',
  long: '1500-2000 words',
} as const;

/**
 * Generate user prompt for blog content
 */
export function getBlogPrompt(
  title: string,
  style: keyof typeof BLOG_STYLES,
  length: keyof typeof BLOG_LENGTHS
): string {
  const stylePrompt = BLOG_STYLES[style] || BLOG_STYLES.professional;
  const wordCount = BLOG_LENGTHS[length] || BLOG_LENGTHS.medium;

  return `Write a comprehensive blog post about: "${title}"

Context: This is for National Check-in Week, focusing on student mental health, wellbeing, and education policy in Australia.

Requirements:
- Length: ${wordCount}
- Style: ${stylePrompt}
- Include specific Australian education statistics and data where relevant
- Focus on evidence-based insights
- Include actionable recommendations
- Use proper HTML formatting with <h2>, <h3>, <p>, <ul>, <li> tags
- Make it engaging and informative

Return as JSON with keys:
- content (HTML formatted blog post)
- excerpt (2-3 sentence summary)
- metaTitle (SEO optimized title, max 60 chars)
- metaDesc (SEO description, max 160 chars)`;
}
