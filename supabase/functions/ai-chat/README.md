# AI Chat Edge Function

A Supabase Edge Function that integrates with Anthropic's Claude API for AI-powered chat functionality.

## Features

- ✅ Claude 3.5 Sonnet integration
- ✅ Conversation history support
- ✅ Custom system prompts
- ✅ User authentication required
- ✅ Usage tracking and logging
- ✅ CORS enabled
- ✅ Configurable temperature and max tokens

## Setup

### 1. Environment Variables

Add to your Supabase project secrets:

```bash
supabase secrets set ANTHROPIC_API_KEY=your_api_key_here
```

Or in the Supabase Dashboard: Settings → Edge Functions → Add Secret

### 2. Deploy

```bash
supabase functions deploy ai-chat
```

## Usage

### Basic Request

```typescript
const { data, error } = await supabase.functions.invoke('ai-chat', {
  body: {
    message: 'Hello, how can you help me?'
  }
})
```

### With Conversation History

```typescript
const conversationHistory = [
  { role: 'user', content: 'What is React?' },
  { role: 'assistant', content: 'React is a JavaScript library...' }
]

const { data, error } = await supabase.functions.invoke('ai-chat', {
  body: {
    message: 'Can you explain hooks?',
    conversationHistory: conversationHistory
  }
})
```

### With Custom System Prompt

```typescript
const { data, error } = await supabase.functions.invoke('ai-chat', {
  body: {
    message: 'Write a haiku about coding',
    systemPrompt: 'You are a creative poet who specializes in technical haikus.',
    maxTokens: 200,
    temperature: 1.2
  }
})
```

## Request Schema

```typescript
interface ChatRequest {
  message: string                    // Required: User's message
  conversationHistory?: Array<{      // Optional: Previous messages
    role: 'user' | 'assistant'
    content: string
  }>
  systemPrompt?: string              // Optional: Custom system prompt
  maxTokens?: number                 // Optional: Max response tokens (default: 1024)
  temperature?: number               // Optional: 0-2, higher = more creative (default: 1.0)
}
```

## Response Schema

```typescript
interface ChatResponse {
  message: string                    // Claude's response
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  stopReason: string                 // Why generation stopped
  conversationHistory: Array<{       // Updated conversation history
    role: 'user' | 'assistant'
    content: string
  }>
}
```

## Example: React Component

```tsx
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function ChatComponent() {
  const [message, setMessage] = useState('')
  const [conversation, setConversation] = useState([])
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!message.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: message,
          conversationHistory: conversation,
          systemPrompt: 'You are a helpful assistant for a school website.'
        }
      })

      if (error) throw error

      setConversation(data.conversationHistory)
      setMessage('')
    } catch (error) {
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="messages">
        {conversation.map((msg, i) => (
          <div key={i} className={msg.role}>
            {msg.content}
          </div>
        ))}
      </div>
      
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        disabled={loading}
      />
      
      <button onClick={sendMessage} disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  )
}
```

## Error Handling

The function returns appropriate HTTP status codes:

- `200` - Success
- `400` - Bad request (missing message)
- `401` - Unauthorized (not authenticated)
- `500` - Server error (Anthropic API error, etc.)

```typescript
const { data, error } = await supabase.functions.invoke('ai-chat', {
  body: { message: 'Hello' }
})

if (error) {
  if (error.message.includes('Unauthorized')) {
    // Redirect to login
  } else {
    // Show error message
    console.error('Chat error:', error)
  }
}
```

## Logging

All interactions are logged to the `generation_log` table with:
- User ID
- Prompt
- Response
- Model used
- Token usage
- Metadata (input/output tokens, stop reason)

## Rate Limiting

Consider implementing rate limiting to prevent abuse:

```sql
-- Add to your database
CREATE TABLE IF NOT EXISTS user_rate_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  requests_count INT DEFAULT 0,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_requests CHECK (requests_count >= 0)
);
```

## Cost Monitoring

Monitor costs via the `generation_log` table:

```sql
-- Total tokens used today
SELECT 
  SUM((metadata->>'input_tokens')::int + (metadata->>'output_tokens')::int) as total_tokens
FROM generation_log
WHERE created_at >= CURRENT_DATE;

-- Cost estimation (Claude 3.5 Sonnet pricing)
-- Input: $3 per million tokens
-- Output: $15 per million tokens
SELECT 
  SUM((metadata->>'input_tokens')::int) * 3.0 / 1000000 +
  SUM((metadata->>'output_tokens')::int) * 15.0 / 1000000 as estimated_cost_usd
FROM generation_log
WHERE created_at >= CURRENT_DATE;
```

## Security Notes

- ✅ Requires authentication (checks JWT token)
- ✅ ANTHROPIC_API_KEY stored as secret (not in code)
- ✅ CORS configured for your domain
- ⚠️ Consider adding rate limiting
- ⚠️ Consider adding input validation/sanitization
- ⚠️ Monitor costs via generation_log

## Troubleshooting

### "ANTHROPIC_API_KEY is not set"
- Verify secret is set: `supabase secrets list`
- Redeploy function after setting secret

### "Unauthorized"
- User must be logged in
- Check `Authorization` header is being sent

### High latency
- Consider streaming responses for better UX
- Reduce `maxTokens` if responses are too long
- Check Anthropic API status

## Advanced: Streaming Responses

For real-time streaming (future enhancement):

```typescript
// In edge function
const stream = await anthropic.messages.stream({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: messages,
})

// Return as Server-Sent Events
```

## License

MIT
