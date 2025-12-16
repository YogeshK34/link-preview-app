# Production OG Tags Fix - Critical Issues Resolved

## Problems Identified

### 1. **No Timeout on Fetch Requests**
- Production servers have stricter timeout limits (10s on Vercel Hobby, 60s Pro)
- Without timeout, requests would hang indefinitely
- **Fixed**: Added 15-second timeout with AbortController

### 2. **Missing Error Handling**
- No handling for timeout errors
- No validation of response content
- **Fixed**: Added comprehensive error handling for timeouts, empty responses, and fetch errors

### 3. **Relative Image URLs Not Resolved**
- Some websites return relative URLs for OG images (e.g., `/images/og.png`)
- These don't work when stored in database
- **Fixed**: Added `resolveUrl()` helper to convert relative URLs to absolute

### 4. **Insufficient Fallbacks**
- OG tags extraction had weak fallbacks
- **Fixed**: Added multiple fallback strategies for title, description, and images

### 5. **Cache Issues in Production**
- Production environment caches differently than localhost
- **Fixed**: Added proper cache control headers and Next.js revalidation

## Changes Made

### File: `app/api/links/route.ts`

1. **Added Request Timeout**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 15000);
```

2. **Enhanced Headers**
```typescript
"Cache-Control": "no-cache",
"Pragma": "no-cache",
```

3. **Added URL Resolution**
```typescript
const resolveUrl = (urlString: string, baseUrl: string) => {
    // Converts relative URLs to absolute
}
```

4. **Better Fallbacks**
```typescript
const rawTitle = getMeta("og:title", "twitter:title") || $("title").text() || $("h1").first().text() || "";
```

5. **Production Logging**
```typescript
console.log(`Extracted OG data for ${normalized}:`, { ... });
```

## Deployment Checklist

### For Vercel Deployment:

1. **Check Function Timeout Settings**
   - Go to Vercel Dashboard → Project Settings → Functions
   - Ensure timeout is at least 15-20 seconds
   - Hobby plan: 10s max (consider upgrade if needed)

2. **Environment Variables**
   - Ensure all Supabase env vars are set in production:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Check Deployment Logs**
   - After deploying, test a few URLs
   - Check logs in Vercel dashboard for console.log outputs
   - Look for any blocked requests or timeouts

4. **Image Domain Configuration**
   - Verify `next.config.ts` has all necessary image domains
   - Add any new domains as needed

### Testing in Production

1. **Test with Various URLs**
   ```
   - GitHub repos (https://github.com/...)
   - YouTube videos (https://youtube.com/...)
   - Medium articles (https://medium.com/...)
   - Your own website
   ```

2. **Check Browser Console**
   - Open DevTools → Network tab
   - Monitor API calls to `/api/links`
   - Check response data

3. **Check Server Logs**
   - Vercel: Dashboard → Deployments → Functions
   - Look for the console.log outputs showing extracted data

## Common Production Issues & Solutions

### Issue: Still Getting Empty Data

**Possible Causes:**
1. **Website blocks server requests**
   - Some sites detect server-side scraping
   - Solution: Some sites require cookies or specific headers
   
2. **Cloudflare Protection**
   - Sites with Cloudflare may block automated requests
   - Solution: Consider using a proxy service or headless browser

3. **JavaScript-rendered Content**
   - Site content loads via JavaScript, not in HTML
   - Solution: Use Puppeteer or similar for dynamic sites

### Issue: Timeout Errors

**Solutions:**
1. Increase timeout to 20-25 seconds
2. Upgrade Vercel plan for longer function execution
3. Implement caching strategy for frequently accessed URLs

### Issue: Images Not Loading

**Solutions:**
1. Check `next.config.ts` has correct image domains
2. Verify image URLs are absolute (not relative)
3. Check if images require authentication/cookies

## Monitoring

Add these environment variables for better debugging:

```bash
# .env.local (for local testing)
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
```

Then in your code:
```typescript
if (process.env.NODE_ENV === 'production') {
    console.log('[PRODUCTION]', ...);
}
```

## Additional Improvements (Optional)

### 1. Add Caching Layer
```typescript
// Cache OG data for 24 hours to reduce fetches
const cacheKey = `og:${normalized}`;
// Use Redis, Vercel KV, or database caching
```

### 2. Use a Third-Party Service
Consider using services like:
- OpenGraph.io
- Microlink
- Linkpreview.net

### 3. Add Retry Logic
```typescript
let retries = 3;
while (retries > 0) {
    try {
        response = await fetch(...);
        break;
    } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}
```

## Next Steps

1. ✅ Code changes applied
2. ⏳ Test locally with `npm run dev`
3. ⏳ Deploy to production
4. ⏳ Test with real URLs in production
5. ⏳ Monitor logs for any issues
6. ⏳ Add additional domains to `next.config.ts` as needed

## Support

If issues persist:
1. Check Vercel function logs
2. Test specific URLs that fail
3. Verify the website isn't blocking your requests
4. Consider implementing fallback to third-party API for problematic sites
