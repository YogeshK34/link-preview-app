/**
 * XSS Protection Utilities
 * Sanitizes user input and scraped content to prevent XSS attacks
 */

/**
 * Strips HTML tags and dangerous characters from text
 * Prevents script injection in title, description, and other text fields
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return "";
  
  return text
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers (onclick, onerror, etc.)
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Decode HTML entities to prevent double encoding attacks
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    // Remove any remaining < > characters
    .replace(/[<>]/g, '')
    // Trim whitespace
    .trim()
    // Limit length to prevent DOS attacks
    .substring(0, 1000);
}

/**
 * Validates and sanitizes URLs
 * Only allows http and https protocols
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return "";
  
  try {
    const urlStr = url.trim();
    
    // Block dangerous URL schemes
    const dangerousSchemes = [
      'javascript:',
      'data:',
      'vbscript:',
      'file:',
      'about:',
      'blob:',
    ];
    
    const lowerUrl = urlStr.toLowerCase();
    if (dangerousSchemes.some(scheme => lowerUrl.startsWith(scheme))) {
      console.warn('[XSS] Blocked dangerous URL scheme:', urlStr);
      return "";
    }
    
    // Validate URL format
    const urlObj = new URL(urlStr);
    
    // Only allow http and https
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      console.warn('[XSS] Blocked non-http(s) protocol:', urlObj.protocol);
      return "";
    }
    
    return urlStr;
  } catch (error) {
    console.warn('[XSS] Invalid URL format:', url);
    return "";
  }
}

/**
 * Validates and sanitizes image URLs
 * Allows http, https, and data:image URIs
 */
export function sanitizeImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  
  try {
    const urlStr = url.trim();
    
    // Block dangerous schemes but allow data:image/
    const dangerousSchemes = [
      'javascript:',
      'data:text',
      'data:application',
      'vbscript:',
      'file:',
    ];
    
    const lowerUrl = urlStr.toLowerCase();
    if (dangerousSchemes.some(scheme => lowerUrl.startsWith(scheme))) {
      console.warn('[XSS] Blocked dangerous image URL scheme:', urlStr);
      return "";
    }
    
    // Allow http, https, and data:image URLs
    if (
      urlStr.startsWith('http://') || 
      urlStr.startsWith('https://') || 
      urlStr.startsWith('data:image/')
    ) {
      // For data URIs, validate it's actually an image
      if (urlStr.startsWith('data:image/')) {
        // Basic validation of data URI format
        const dataUriPattern = /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/i;
        if (!dataUriPattern.test(urlStr)) {
          console.warn('[XSS] Invalid data URI format:', urlStr.substring(0, 50));
          return "";
        }
      }
      return urlStr;
    }
    
    console.warn('[XSS] Invalid image URL format:', urlStr);
    return "";
  } catch (error) {
    console.warn('[XSS] Error validating image URL:', url);
    return "";
  }
}

/**
 * Sanitizes scraped metadata before storing in database
 */
export interface ScrapedMetadata {
  url: string;
  title: string;
  description: string;
  image: string;
  site_name: string;
  type: string;
  audio: string;
}

export function sanitizeMetadata(data: ScrapedMetadata): ScrapedMetadata {
  return {
    url: sanitizeUrl(data.url) || data.url, // Keep original if sanitization fails for debugging
    title: sanitizeText(data.title) || "Untitled",
    description: sanitizeText(data.description) || "No description available",
    image: sanitizeImageUrl(data.image) || "",
    site_name: sanitizeText(data.site_name) || "Unknown",
    type: sanitizeText(data.type) || "website",
    audio: sanitizeUrl(data.audio) || "",
  };
}
