// Shared formatting helpers used across pages.

// Message `content` is stored as JSONB and varies by channel
// ({ text } for SMS, { subject, body } for email, or arbitrary objects).
// Pull a human-readable string out of whatever shape the backend returns.
export function contentPreview(content) {
  if (!content) return ''
  if (typeof content === 'string') return content
  return content.text || content.body || content.subject || content.message || JSON.stringify(content)
}
