/**
 * Input Sanitization Utilities
 * 
 * Security: Prevents XSS attacks by sanitizing user input
 * 
 * Note: For production, consider using DOMPurify library:
 * npm install dompurify isomorphic-dompurify
 */

// Simple HTML tag removal (basic XSS prevention)
// For production, replace with DOMPurify
function removeHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

// Basic HTML entity decoding
function decodeHtmlEntities(input: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
  };
  
  return input.replace(/&[#\w]+;/g, (entity) => {
    return entities[entity] || entity;
  });
}

/**
 * Sanitize HTML content - allows safe HTML tags
 * Use for rich text content like descriptions, comments, etc.
 * 
 * TODO: Install DOMPurify for production: npm install dompurify isomorphic-dompurify
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Basic sanitization - remove script tags and dangerous attributes
  let cleaned = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, ''); // Remove javascript: protocol

  // For production, use DOMPurify:
  // import DOMPurify from 'isomorphic-dompurify';
  // return DOMPurify.sanitize(cleaned, {
  //   ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  //   ALLOWED_ATTR: ['href', 'title'],
  // });

  return cleaned;
}

/**
 * Sanitize plain text - strips all HTML
 * Use for names, titles, and other plain text fields
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove all HTML tags and decode entities
  let cleaned = removeHtmlTags(input);
  cleaned = decodeHtmlEntities(cleaned);
  
  // Remove any remaining script-like content
  cleaned = cleaned
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  return cleaned.trim();
}

/**
 * Sanitize URL - validates and sanitizes URLs
 */
export function sanitizeUrl(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  // Remove any HTML/script content first
  const cleaned = sanitizeText(input).trim();
  
  if (!cleaned) {
    return null;
  }

  try {
    // Add protocol if missing (default to https)
    let urlString = cleaned;
    if (!cleaned.match(/^https?:\/\//i)) {
      urlString = `https://${cleaned}`;
    }
    
    const url = new URL(urlString);
    
    // Only allow http and https protocols
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    
    // Block javascript: and data: protocols
    if (url.protocol === 'javascript:' || url.protocol === 'data:') {
      return null;
    }
    
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize email - basic email validation
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove any HTML and trim
  const cleaned = sanitizeText(input).trim().toLowerCase();
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(cleaned)) {
    return cleaned;
  }
  
  return '';
}

/**
 * Sanitize phone number - removes non-digit characters except + at start
 */
export function sanitizePhone(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove all HTML
  let cleaned = sanitizeText(input).trim();
  
  // Allow + at start, then only digits
  if (cleaned.startsWith('+')) {
    cleaned = '+' + cleaned.slice(1).replace(/\D/g, '');
  } else {
    cleaned = cleaned.replace(/\D/g, '');
  }
  
  return cleaned;
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: string | number): number | null {
  if (typeof input === 'number') {
    return isNaN(input) ? null : input;
  }

  if (!input || typeof input !== 'string') {
    return null;
  }

  const cleaned = sanitizeText(input).trim();
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? null : num;
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: {
    htmlFields?: (keyof T)[];
    textFields?: (keyof T)[];
    urlFields?: (keyof T)[];
    emailFields?: (keyof T)[];
    phoneFields?: (keyof T)[];
    numberFields?: (keyof T)[];
  }
): T {
  const sanitized = { ...obj };

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (options.htmlFields?.includes(key as keyof T)) {
      sanitized[key] = sanitizeHtml(String(value)) as any;
    } else if (options.textFields?.includes(key as keyof T)) {
      sanitized[key] = sanitizeText(String(value)) as any;
    } else if (options.urlFields?.includes(key as keyof T)) {
      sanitized[key] = sanitizeUrl(String(value)) as any;
    } else if (options.emailFields?.includes(key as keyof T)) {
      sanitized[key] = sanitizeEmail(String(value)) as any;
    } else if (options.phoneFields?.includes(key as keyof T)) {
      sanitized[key] = sanitizePhone(String(value)) as any;
    } else if (options.numberFields?.includes(key as keyof T)) {
      sanitized[key] = sanitizeNumber(value) as any;
    } else if (typeof value === 'string') {
      // Default: sanitize as text if no specific field type
      sanitized[key] = sanitizeText(value) as any;
    }
  }

  return sanitized;
}

