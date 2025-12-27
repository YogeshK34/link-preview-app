import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { createClient } from "@/utils/supabase/server";
import { sanitizeMetadata } from "@/lib/sanitize";

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    try {
        // 1. check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized. Please sign in" },
                { status: 401 }
            );
        };

        const body = await request.json(); // firstly parse the input
        const { link } = body;

        // verify if the link if provided in the input or not 
        if (!link) {
            return NextResponse.json(
                { error: "Input not provided" },
                { status: 401 }
            );
        };

        // here I'll be writing the function to avoid & add protocols
        let normalized = link.trim();

        // Add protocol if missing
        if (!/^https?:\/\//i.test(normalized)) {
            normalized = 'https://' + normalized;
        }

        // Remove www. from the URL
        normalized = normalized.replace(/^(https?:\/\/)www\./i, '$1');

        // Check if it's a YouTube URL and handle specially
        const isYouTube = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i.test(normalized);
        
        if (isYouTube) {
            console.log(`Detected YouTube URL: ${normalized}`);
            try {
                // Extract video ID
                const videoIdMatch = normalized.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
                const videoId = videoIdMatch ? videoIdMatch[1] : null;

                if (videoId) {
                    // Use YouTube oEmbed API (official and reliable)
                    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
                    const oembedResponse = await fetch(oembedUrl);
                    
                    if (oembedResponse.ok) {
                        const oembedData = await oembedResponse.json();
                        
                        const youtubeData = {
                            url: normalized,
                            title: oembedData.title || "YouTube Video",
                            description: `Watch ${oembedData.author_name || 'this video'} on YouTube`,
                            image: oembedData.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
                            site_name: "YouTube",
                            type: "video",
                            audio: "",
                        };

                        // XSS Protection: Sanitize scraped data before storing
                        const sanitized = sanitizeMetadata(youtubeData);

                        console.log(`YouTube data extracted:`, sanitized);

                        // Insert into database
                        const { data, error } = await supabase
                            .from('links')
                            .insert({
                                url: sanitized.url,
                                user_id: user.id,
                                title: sanitized.title,
                                description: sanitized.description,
                                image: sanitized.image,
                                site_name: sanitized.site_name,
                                type: sanitized.type,
                                audio: sanitized.audio
                            })
                            .select()
                            .single();

                        if (error) {
                            console.error('Database error for YouTube:', error);
                            return NextResponse.json(
                                { error: "Database Error" },
                                { status: 500 }
                            );
                        }

                        return NextResponse.json({ data }, { status: 200 });
                    }
                }
            } catch (youtubeError) {
                console.error('YouTube oEmbed fetch failed, falling back to standard scraping:', youtubeError);
                // Fall through to standard scraping if oEmbed fails
            }
        }

        // 1. fetch the webpage HTML with timeout and better error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        let response;
        try {
            response = await fetch(normalized, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Connection": "keep-alive",
                    "Upgrade-Insecure-Requests": "1",
                    "Cache-Control": "no-cache",
                    "Pragma": "no-cache",
                },
                signal: controller.signal,
                cache: "no-store",
                redirect: "follow",
                // Add next-specific config for better production performance
                next: { revalidate: 0 }
            });
        } catch (fetchError) {
            clearTimeout(timeoutId);
            const error = fetchError as Error;
            if (error.name === 'AbortError') {
                console.error(`Request timeout for ${normalized}`);
                return NextResponse.json(
                    { error: "Request timeout. The website took too long to respond." },
                    { status: 408 }
                );
            }
            console.error(`Fetch error for ${normalized}:`, error);
            return NextResponse.json(
                { error: `Failed to fetch URL: ${error.message}` },
                { status: 400 }
            );
        } finally {
            clearTimeout(timeoutId);
        }

        if (!response.ok) {
            console.error(`Failed to fetch ${normalized}: ${response.status} ${response.statusText}`);
            return NextResponse.json(
                { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
                { status: 400 }
            );
        };

        const html = await response.text();

        // Check if we actually got HTML content
        if (!html || html.trim().length === 0) {
            console.error(`Empty response from ${normalized}`);
            return NextResponse.json(
                { error: "The website returned empty content" },
                { status: 400 }
            );
        }

        const $ = cheerio.load(html);

        const getMeta = (...names: string[]) => {
            for (const name of names) {
                const byProperty = $(`meta[property="${name}"]`).attr("content");
                if (byProperty) return byProperty;

                const byName = $(`meta[name="${name}"]`).attr("content");
                if (byName) return byName;
            }
            return "";
        };

        // Helper to resolve relative URLs
        const resolveUrl = (urlString: string, baseUrl: string) => {
            if (!urlString) return "";
            try {
                // If it's already absolute, return as-is
                if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
                    return urlString;
                }
                // Resolve relative URL
                const base = new URL(baseUrl);
                return new URL(urlString, base.origin).href;
            } catch (error) {
                console.error(`Error resolving URL: ${urlString}`, error);
                return urlString;
            }
        };

        // Fallback images from public folder
        const fallbackImages = [
            "/image1.png",
            "/image2.png",
            "/image3.png",
            "/image4.png",
        ];

        // Get random fallback image
        const getRandomFallback = () => {
            return fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
        };

        // extract the data with better fallbacks
        const rawTitle = getMeta("og:title", "twitter:title") || $("title").text() || $("h1").first().text() || "";
        const rawDescription = getMeta("og:description", "twitter:description", "description") || $('meta[name="description"]').attr("content") || "";
        const rawImage = getMeta("og:image", "twitter:image", "twitter:image:src") || "";

        // Resolve image URL (handle relative URLs)
        const resolvedImage = rawImage ? resolveUrl(rawImage, normalized) : getRandomFallback();

        const ogData = {
            url: normalized,
            title: rawTitle.trim() || "Untitled",
            description: rawDescription.trim() || "No description available",
            image: resolvedImage,
            site_name: getMeta("og:site_name", "application-name") || new URL(normalized).hostname,
            type: getMeta("og:type") || "website",
            audio: getMeta("og:audio") || "",
        };

        // XSS Protection: Sanitize scraped data before storing
        const sanitized = sanitizeMetadata(ogData);

        // Log extracted data for debugging in production
        console.log(`Extracted OG data for ${normalized}:`, {
            title: sanitized.title,
            description: sanitized.description?.substring(0, 50),
            image: sanitized.image?.substring(0, 100),
            hasContent: html.length > 0
        });

        // insert into my supabase DB
        const { data, error } = await supabase
            .from('links')
            .insert({
                url: sanitized.url,
                user_id: user.id,
                title: sanitized.title,
                description: sanitized.description,
                image: sanitized.image,
                site_name: sanitized.site_name,
                type: sanitized.type,
                audio: sanitized.audio
            })
            .select()
            .single()

        // eslint-disable
        if (error) {
            console.error(error);
            return NextResponse.json(
                { error: "Database Error" },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { data },
            { status: 200 }
        );
        /*eslint-disable */
    } catch (err: any) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal Server error" },
            { status: 500 }
        );
    };
}


// GET all links for current user
export async function GET(request: Request) {
    const supabase = await createClient()
    try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch user's links (NO RLS!)
        const { data: links, error } = await supabase
            .from('links')
            .select('*')
            .eq('user_id', user.id)
            .order('pinned', {ascending: false})
            .order('pinned_at', {ascending: false, nullsFirst: false})
            .order('created_at', { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }
        return NextResponse.json({ links })
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Internal Server Error!" },
            { status: 500 }
        )
    }
}
