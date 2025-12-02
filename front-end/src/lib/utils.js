// Utility functions for the app
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Combines multiple CSS class names and merges Tailwind classes properly
// This prevents conflicts when combining Tailwind utility classes
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Format a number as USD currency
export function formatCurrency(amount) {
  if (!amount) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Format a date string to locale string
export function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}

// Copy text to clipboard and return success status
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}
