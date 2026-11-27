/** Strip HTML tags so snippets are always shown as plain text. */
export function plainText(html) {
  return String(html || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

/** Human readable message from an axios error. */
export function apiError(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.canceled) return 'Cancelled.';
  if (err?.response?.data?.message) return err.response.data.message;
  if (!err?.response) return 'No connection to the server. Check your internet connection and try again.';
  return fallback;
}
