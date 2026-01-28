import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatNumber(num: number | undefined): string {
  if (!num) return 'N/A';
  return new Intl.NumberFormat('en-GB').format(num);
}

export function formatCurrency(amount: number | undefined): string {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function getFriendlyStatus(status: string | undefined): string {
  if (!status) return 'Unknown';
  
  const statusMap: Record<string, string> = {
    'Proposed': 'Pre-Planning',
    'Pending completion - Planning': 'In Planning',
    'Pending completion - Construction': 'Under Construction',
    'Under Construction': 'Under Construction',
    'Complete - Operational': 'Operational',
    'Stabilised': 'Operational',
    'Completed': 'Operational',
    'Lease-up': 'Under Construction',
  };
  
  return statusMap[status] || status;
}

export function getStatusColor(status: string | undefined): string {
  const friendlyStatus = getFriendlyStatus(status);

  const colorMap: Record<string, string> = {
    'Pre-Planning': 'bg-blue-50 text-primary-blue',
    'In Planning': 'bg-primary-blue-light text-primary-blue',
    'Under Construction': 'bg-orange-100 text-orange-700',
    'Operational': 'bg-green-100 text-green-700',
  };

  return colorMap[friendlyStatus] || 'bg-blue-50 text-primary-blue';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function formatVerifiedDate(timestamp: string | null | undefined): string | null {
  if (!timestamp) return null;

  const date = new Date(timestamp);
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const year = date.getFullYear();

  return `Verified ${month} ${year}`;
}
