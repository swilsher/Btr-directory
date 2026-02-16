// Slug generation - identical to lib/utils.ts in the main project
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// SQL value helpers
export function sqlString(value: string | undefined | null): string {
  if (value === undefined || value === null || value === '') return 'NULL';
  return `'${value.replace(/'/g, "''")}'`;
}

export function sqlBool(value: boolean | undefined | null): string {
  if (value === undefined || value === null) return 'false';
  return value ? 'true' : 'false';
}

export function sqlInt(value: number | undefined | null): string {
  if (value === undefined || value === null) return 'NULL';
  return String(Math.round(value));
}

// Extract domain from URL
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Truncate text safely
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

// Clean text: collapse whitespace, trim
export function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

// Format date for SQL (YYYY-MM-DD or NULL)
export function sqlDate(value: string | undefined | null): string {
  if (!value) return 'NULL';
  // Try to parse various date formats
  const date = new Date(value);
  if (isNaN(date.getTime())) return 'NULL';
  return `'${date.toISOString().split('T')[0]}'`;
}
