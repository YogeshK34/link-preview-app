# Building a Link-Saving Application: A Complete Technical Journey

## Table of Contents
1. [Motivation](#motivation)
2. [Understanding OpenGraph Tags](#understanding-opengraph-tags)
3. [Building the Backend](#building-the-backend)
4. [HTTP Headers Deep Dive](#http-headers-deep-dive)
5. [Frontend Implementation](#frontend-implementation)
6. [UI/UX Design & User Experience](#uiux-design--user-experience)
7. [XSS Protection](#xss-protection---a-critical-security-implementation)
8. [Deployment Details](#deployment-details)
9. [User Onboarding & Call-to-Actions](#user-onboarding--clear-call-to-actions)
10. [Lessons Learned](#lessons-learned)

---

## Motivation

The whole idea of making this project was that it could benefit more than any other thing in the world, and also that I could apply my programming skills in a meaningful way.

I wasn't having problems as such; rather, I was missing a platform to store links for later access. In the tech industry, we consume a lot of content—news articles, UI stack posts on X, motivational YouTube videos, and more. I found many use cases for such a platform.

Initially, I built a decent "kaam chalau" (functional) application just for myself. But then I thought: why not polish it and make it production-worthy like other apps out there? That's when I decided to productionize it.

---

## Understanding OpenGraph Tags

**Stack learned along the way:**

When I started pasting Git URLs while designing the UI, I noticed something cool—a beautiful preview image appeared with the URL. This piqued my curiosity, so I researched what these "wildcards" were.

The answer: **OpenGraph (OG) tags**.

When you paste a URL in WhatsApp or any other platform, you often see a rich preview with:
- An image
- A title
- A description
- Other metadata

This happens because of OpenGraph tags. They act like metadata that crawlers and platforms use to fetch and display previews.

I was amazed and wanted to implement this myself. After researching, I found that almost every professional app includes OG tags in their codebase. I added these tags to my `layout.tsx`:

```tsx
<meta property="og:title" content="Link Saver" />
<meta property="og:description" content="Save and organize your links" />
<meta property="og:image" content="/og-image.png" />
```

Boom! My application now displays a beautiful preview with a nice image, title, and description.

---

## Building the Backend

### The Challenge

Now the question was: **How do I write a backend that scrapes these tags?** How do I make my server act like a crawler to extract OG tags from any URL?

The answer seemed weird at first: I needed to make a `fetch` request from inside my `POST` request handler. Yes, that's exactly how we do it!

Here's the key: **We need to disguise our server as a browser, not as a bot.** Websites block bots because they want to protect their content. By adding the right headers, we can make our server look like a legitimate browser request.

Without proper headers, websites won't send us data with the information we need to extract OG tags.

---

## HTTP Headers Deep Dive

When making a request to fetch data, servers expect specific headers. These tell the server who is requesting the data and what format we can accept.

### User-Agent Header

```
"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
```

**Breakdown:**
- `Mozilla/5.0`: Tells the server the request is from a browser (not a bot)
- `Windows NT 10.0; Win64; x64`: Client device specifications
  - `Windows NT` → Windows operating system
  - `Win64` → 64-bit device architecture
  - `x64` → 64-bit CPU architecture
- `AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`: Browser rendering engine details (makes it look like Chrome)

**Note:** These specs don't have to match the actual user's device. A Mac user could send these headers too—it's just to mimic a real browser and bypass bot detection.

### Accept Header

```
"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
```

**Purpose:** Tells the server which content types we can accept.

- `text/html` → Standard HTML pages
- `application/xhtml+xml` → XHTML format
- `application/xml;q=0.9` → XML with quality factor 0.9 (lower priority)
- `image/webp` → WebP image format
- `*/*;q=0.8` → Any other format (lowest priority)

The `q=` values indicate preference (higher = more preferred).

### Accept-Language Header

```
"Accept-Language": "en-US,en;q=0.9"
```

Specifies which languages the client can understand:
- `en-US` → US English (highest priority, q=1.0 by default)
- `en;q=0.9` → Generic English (slightly lower priority)

### Accept-Encoding Header

```
"Accept-Encoding": "gzip, deflate, br"
```

Tells the server we can accept compressed responses:
- `gzip` → GZip compression
- `deflate` → Deflate compression
- `br` → Brotli compression (modern, better compression)

Some websites send compressed data to reduce bandwidth. This header tells them we can decompress it.

### Connection Header

```
"Connection": "keep-alive"
```

Keeps the TCP connection open after the current request completes, allowing multiple requests to use the same connection (more efficient).

### Upgrade-Insecure-Requests Header

```
"Upgrade-Insecure-Requests": "1"
```

Tells the server: "If you have an HTTPS version of this resource, send me that instead of HTTP."

This security feature:
- Signals the client prefers secure (HTTPS) connections
- Helps servers automatically upgrade HTTP requests to HTTPS
- Prevents downgrade attacks
- Makes the client look like a modern, security-aware browser

Since we normalize URLs to HTTPS, this is somewhat redundant but still good practice for bot detection avoidance.

### Cache Option

```
cache: "no-store"
```

Don't cache the response—always fetch fresh data from the server. This ensures we always get the latest version of the page content.

---

## Extracting Meta Tags with Cheerio.js

After fetching the response, we get an HTML document that we can't easily search. We need to extract the `<meta>` tags from the HTML.

For this, I use **Cheerio.js**, a lightweight library for parsing and manipulating HTML in JavaScript.

### Meta Tag Structure

Websites include meta tags like this:

```html
<meta property="og:url" content="https://cheerio.js.org/" />
<meta property="og:title" content="The industry standard for working with HTML in JavaScript | cheerio"/>
<meta property="og:description" content="The fast, flexible & elegant library for parsing and manipulating HTML and XML."/>
```

### Extraction Function

```javascript
const getMeta = (...names: string[]) => {
  for (const name of names) {
    const byProperty = $(`meta[property="${name}"]`).attr("content");
    if (byProperty) return byProperty;

    const byName = $(`meta[name="${name}"]`).attr("content");
    if (byName) return byName;
  }
  return "";
};
```

**Why this approach?**
- Some websites use `property` selector for meta tags
- Others use `name` selector
- We check both and return the first match
- If nothing is found, we return an empty string

This gracefully handles edge cases where websites structure their meta tags differently.

---

## How Users Save Links

### The Flow

1. **User authenticates** (required for security and data ownership)
2. **User pastes a URL** in the input box
3. **Backend fetches the URL** and extracts OG tags
4. **Sanitized data is stored** in the database
5. **User sees the link preview** instantly

### URL Format Flexibility

Users can enter URLs in various formats, and our backend handles all of them:

- `github.com`
- `www.github.com`
- `https://github.com`
- `http://github.com`

The backend normalizes all of these to `https://github.com` before making the request.

### Edge Cases

#### What if some links don't show preview?

Some websites don't share meta tags, even to browsers. Some require login. No problem! We've added fallback images for these cases.

#### What if a site blocks your requests despite proper headers?

Multiple scenarios could occur:

1. **Sensitive URL** → Returns HTTP 403 (Forbidden)
2. **Requires explicit sign-in** → Site won't share data without authentication
3. **Server down** → Our app's server or the target server is experiencing issues
4. **Rate Limiting** → Making too many requests too quickly; the site throttles or blocks your IP temporarily
5. **Cloudflare/DDoS Protection** → Site uses services that require JavaScript execution or browser challenges
6. **Advanced Bot Detection** → Despite proper headers, sophisticated systems (DataDome, PerimeterX) detect scraping patterns
7. **Geographic Restrictions** → Site blocks requests from certain countries/regions
8. **IP Reputation Issues** → Server's IP might be flagged or blacklisted
9. **CAPTCHA Requirements** → Site requires CAPTCHA which automated scraping can't handle
10. **Robots.txt Restrictions** → Site explicitly disallows scraping
11. **Request Timeout** → Site takes too long to respond (we have a 15-second timeout)
12. **Missing Required Headers** → Some sites need specific custom headers like `Referer` or `Origin`

---

## Frontend Implementation

### Technology Stack

- **Framework:** Next.js (my go-to library for displaying rich UIs)
- **Components:** Inspired by and built with shadcn/ui
- **Styling:** Tailwind CSS with Shadcn components

### Key Features

- **Dark/Light Theme:** Supporting both dark mode for developers and light mode for the "Muggles" (non-technical users)
- **Accordion Component:** For FAQs and frequently asked questions
- **Pagination:** Added for a professional touch and better performance
- **Responsive Design:** Works seamlessly across all devices

---

## UI/UX Design & User Experience

### Component Library & Design System

I used **shadcn/ui** as my component library—it's fantastic! The components are:
- Accessible out of the box
- Customizable to match any design
- Modern and professional looking
- Built on Radix UI primitives for keyboard navigation and ARIA attributes

### Dark/Light Theme

Implemented theme switching with `next-themes`:
- Theme persists across sessions
- Respects user's system preferences
- Smooth theme toggle button with clear icons
- Both themes carefully designed—dark for us developers at 2 AM, light for normal people

### Responsive Design Philosophy

**Mobile-first approach:**
- Tested on multiple devices
- Grid layout automatically adjusts:
  - 1 column on mobile
  - 2 columns on tablet
  - 3 columns on desktop
- Items per page changes based on viewport:
  - 3 on mobile
  - 4 on tablet
  - 6 on desktop
- All buttons have proper touch targets for mobile

### User Feedback & Loading States

- **Toast notifications** using Sonner (non-intrusive and beautiful)
- **Every action provides feedback:** success messages, error handling, loading spinners
- **Skeleton loaders** while data fetches—users always know something is happening
- **Tooltips everywhere** to guide users

### Interactive Elements

- **Pin functionality:** Users can pin important links to the top with visual indicators
- **Category system:** Organized with emojis for fun visual organization
- **CMD+K search:** Keyboard shortcut for advanced users
- **Smooth animations:** Using Tailwind CSS transitions

### Smart Pagination

- Responsive pagination showing appropriate page counts
- Scroll to top on page change
- Current page highlighting with proper ellipsis for large page counts

### View Modes

- **Grid view** (default) for visual browsing
- **List view** for information-dense display
- Toggle between them with beautiful icons
- State persists during the session

### Accessibility Considerations

- Proper semantic HTML structure
- Keyboard navigation support (Tab, Enter, Escape, CMD+K)
- Focus indicators on all interactive elements
- ARIA labels and proper form labels
- Screen reader friendly with heading hierarchy

### Visual Hierarchy

- Clear separation between header, content, and footer
- Card-based design for link previews with proper spacing
- Consistent color scheme using CSS variables
- Visual feedback for hover, active, and focus states

### Empty States

- Meaningful empty states instead of blank screens
- Different messages based on context
- Carousel for non-authenticated users showcasing features

### Micro-interactions

- Hover effects on cards and buttons
- Smooth color transitions
- Loading states with spinners
- Copy-to-clipboard with visual confirmation

### Performance Considerations

- Lazy loading of images in link previews
- Optimized re-renders with proper React hooks
- Debounced search to avoid excessive filtering
- Client-side caching where appropriate

---

## XSS Protection - A Critical Security Implementation

When you're scraping content from random websites and displaying it to users, you're opening yourself up to **XSS (Cross-Site Scripting) attacks**.

Malicious websites could inject harmful scripts through their metadata that would execute in your users' browsers.

### What is XSS and Why Should You Care?

XSS is when an attacker injects malicious JavaScript into your application. In a link preview app, this could happen if:

- A malicious website puts `<script>alert('hacked')</script>` in their og:title
- Someone creates a profile with `javascript:void(0)` in their og:url
- A site uses event handlers like `onclick` in their metadata

If you display this content without sanitization, the malicious code executes in your user's browser—game over!

### Multi-Layer XSS Protection Strategy

#### 1. Dedicated Sanitization Library (`lib/sanitize.ts`)

Created a comprehensive sanitization library with three main functions:

- **`sanitizeText()`:** Strips HTML tags, removes scripts, removes event handlers, blocks javascript: protocol
- **`sanitizeUrl()`:** Validates URLs and only allows http/https protocols
- **`sanitizeImageUrl()`:** Special handling for images; allows data:image for base64 but blocks data:text
- **`sanitizeMetadata()`:** Wraps all scraped data through appropriate sanitizers

#### 2. Server-Side Sanitization (API Route)

Before storing ANY scraped metadata in the database, I sanitize it. This is crucial—never trust scraped content!

```javascript
const sanitized = sanitizeMetadata({
  url,
  title,
  description,
  image,
  site_name,
  type,
  audio,
});
// Only THEN insert into database
await supabase.from("links").insert(sanitized);
```

#### 3. Client-Side Sanitization (Double Protection)

Even though data is sanitized on the server, I also sanitize on the client before rendering.

Defense in depth: If somehow unsanitized data makes it to the client, we catch it.

#### 4. Specific Attack Vectors Blocked

**HTML Tag Injection:**
- Regex: `/<[^>]*>/g` removes all HTML tags
- Prevents: `<script>malicious()</script>` or `<img onerror="hack()">`

**Script Tag Injection:**
- Regex: `/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi`
- Removes entire script blocks with their content

**Event Handler Injection:**
- Regex: `/on\w+\s*=\s*["'][^"']*["']/gi`
- Blocks: `onclick`, `onerror`, `onload`, and all other event handlers

**JavaScript Protocol:**
- Check: `javascript:`, `data:`, `vbscript:`, `file:`, `about:`, `blob:`
- Prevents: `<a href="javascript:alert('xss')">click me</a>`

**URL Validation:**
- Use native `URL()` constructor to parse and validate
- Only allow `http:` and `https:` protocols
- Block all other protocols including `file:`, `data:`, etc.

**HTML Entity Decoding:**
- Decode entities like `&lt;` `&gt;` `&quot;` to prevent double-encoding attacks
- Then strip the actual `< >` characters

**Content Length Limits:**
- Limit text to 1000 characters to prevent DOS attacks
- Prevents someone from sending gigabytes of text

#### 5. Special Cases Handled

**YouTube Links:**
- Use official YouTube oEmbed API (trusted source)
- Still sanitize the response because never trust ANY external data

**Fallback Images:**
- If image URL is invalid/dangerous, fall back to safe local images
- Never break the UI due to security checks

**Data URIs for Images:**
- Allow `data:image/` for base64 encoded images (needed for some sites)
- Validate format: `/^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/i`
- Block `data:text` and `data:application` (dangerous!)

#### 6. Logging and Debugging

Added `console.warn()` for all blocked attempts.

Helps with debugging and can be monitored in production:

```javascript
console.warn("[XSS] Blocked dangerous URL scheme:", urlStr);
```

#### 7. Testing Approach

Tested with intentionally malicious URLs:
- `javascript:alert('xss')`
- `<script>alert('xss')</script>` in titles
- Event handlers in descriptions
- Invalid URL protocols

All blocked successfully!

### Why This Matters

One XSS vulnerability can compromise ALL your users. Attackers could:
- Steal session tokens
- Redirect to phishing sites
- Inject crypto miners
- Deface the entire application

Having this protection means users can safely save links from ANY website.

### The Bottom Line

- **NEVER trust external data.** Always sanitize before storage and rendering.
- **Implement defense in depth** - sanitize multiple times at different layers.
- **Use whitelist approach** (allow only safe things) rather than blacklist (block known bad things).

---

## Deployment Details

- **Frontend & API:** Hosted on Vercel (easy to manage, debug, and deploy)
- **Authentication & Database:** Supabase
- **Version Control:** Git (private repository)
- **Fallback Images:** Self-hosted within the app

### Performance & Scalability

- Backend is live on Supabase's free plan (very generous)
- Can handle ~1K users monthly
- Good for a side-project or personal app
- Ready to upgrade if needed

---

## User Onboarding & Clear Call-to-Actions

### The Challenge

When non-authenticated users land on the application, how do you engage them and guide them toward signing in?

**The answer:** Make the value proposition crystal clear and guide them naturally.

### First Impression Matters

When a non-authenticated user lands on the app, they see:
- A clean, professional link input interface (disabled with a helpful tooltip)
- A prominent "Sign in" button right in the header
- An avatar icon with UserRoundPlus that's clickable
- Tooltip that says "Click to Login" on hover

### Progressive Disclosure

Instead of a blank page or login wall, the app shows:

1. The main interface so users can see what they'll get
2. Disabled input with tooltip: "Sign in to submit links"
3. A carousel showcasing three key features/benefits
4. FAQ section at the bottom answering common questions

### The Carousel Approach (Feature Showcase)

Non-logged-in users see an interactive carousel with:
- Feature explanations
- Use case examples
- Visual demonstrations
- Navigation arrows to explore all benefits

This lets users understand the value before committing to sign up.

### Strategic CTA Placement

**Primary CTA:** Large "Sign in" button below the input (impossible to miss)
- Uses secondary variant for better visibility
- Has an icon (UserRoundPlus) making it obvious
- Loading state when clicked

**Secondary CTA:** Avatar in the header
- Always visible as user scrolls
- Consistent placement across the app
- Same function for consistency

### Visual Cues

- Input field is visibly disabled (grayed out)
- Cursor shows "not-allowed" when hovering disabled elements
- Tooltips explain WHY features are disabled

### The Authentication Flow

1. User clicks "Sign in" → `redirectUser()` function triggers
2. Shows loading state with spinner and "Loading..." text
3. Redirects to `/login` page
4. Offers Google and GitHub OAuth (no password fatigue!)
5. After auth, redirects back to main page
6. All features unlock automatically
7. Input gets focus automatically (ready to paste links)

### Post-Authentication Experience

Once logged in, the experience transforms:
- Input becomes active and gets auto-focus
- "Sign in" button changes to "Submit" button
- User email displays in the header
- Saved links appear (or empty state with guidance)
- All features unlock: categories, search, sort, filters

### Empty State Design

For new users with no links, they see:
- Clear heading: "No link added yet"
- Actionable description: "Start by entering a link above"
- NOT a dead-end, but an invitation to act

### Tooltips Everywhere

- Help icon next to input explaining its purpose
- Hover on disabled input shows "Sign in to submit links"
- During auth check shows "Checking Authentication"
- Every icon button has a tooltip explaining its function

### Zero Friction Authentication

- Only OAuth (Google/GitHub) - no forms to fill
- No email verification loops
- Instant access after successful OAuth
- Session persists across visits

### Conversion Funnel

1. Land on page (see the interface)
2. Try to interact (realize they need to sign in)
3. See carousel (understand the value)
4. Click "Sign in" (frictionless OAuth)
5. Return to app (everything works now)
6. Add first link (immediate value)
7. Become regular user

### Accessibility in Onboarding

- Keyboard navigation works for all CTAs
- Screen readers announce disabled states
- Focus indicators make the path clear

### Mobile Experience

- All CTAs are thumb-friendly (proper touch targets)
- Responsive text and button sizes
- Carousel works with swipe gestures

### What I Learned

- Don't hide your app behind a login wall
- Show value before asking for commitment
- Make sign-in obvious but not annoying
- Every state should guide the user forward
- Loading states are as important as the content
- OAuth is way better than email/password in 2025!

---

## What I Avoided (Instead of Challenges Faced)

Rather than listing challenges, here's what I actively avoided:

- **Vibe coding** without proper architecture
- Being **fearful to modify** the original codebase
- Following a **fixed path**—I made errors, learned, and iterated
- **Rushed implementations** without understanding

### What I Did Right

- **Spent time exploring** concepts and going into component internals
- Learned about **HTTP status codes** and error handling properly
- Used the correct HTTP methods (**PATCH** instead of PUT)
- **Stayed consistent** and avoided burnout
- **Wrote things down thoroughly** before implementing
- Did everything with **100% energy**, not just for the sake of it

### Biggest Challenge

Surprisingly, the biggest challenge was **adding authentication**. The routes logic and RLS policies tripped me up initially, but I pushed through and learned the concepts deeply.

---

## Lessons Learned

1. **Ideas don't matter; working on them does.**
2. **All features aren't meant to be added in a day.**
3. **Be accountable** to yourself and your commitments.
4. **Document your experience**—it helps you and others.
5. **With each feature, you grow** as a developer.
6. **One feature a day keeps burnout away.**
7. **Every day is different—forget yesterday's work, focus today.**
8. **Work in chunks of time** to maintain focus.
9. **Take a walk**—stepping away helps clarity.
10. **Start fresh** when you're stuck.
11. **Read a lot** to expand your knowledge.
12. **Don't hesitate to tweak your codebase** as you learn.
13. **"Get your hands dirty"**—the best learning comes from doing.

---

## Conclusion

Building this link-saving application taught me that production-worthy apps aren't just about features—they're about thoughtful design, robust security, and smooth user experiences. Every decision, from HTTP headers to XSS protection to onboarding flows, matters.

Thank you for reading! If you have feedback or want to discuss any aspect of this project, feel free to reach out.
