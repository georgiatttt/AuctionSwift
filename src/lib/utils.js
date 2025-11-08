// Utility functions for the app
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Combines multiple CSS class names and merges Tailwind classes properly
// This prevents conflicts when combining Tailwind utility classes
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
