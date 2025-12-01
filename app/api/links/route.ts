import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { createClient } from "@/utils/supabase/server";

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

        // 1. fetch the webpage HTML 
        const response = await fetch(link, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "text/html,application/xhtml+xml",
                "Accept-Language": "en-US,en;q=0.9",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: "Failed to fetch URL" },
                { status: 400 }
            );
        };

        const html = await response.text();

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

        // extract the data 
        const ogData = {
            url: link,
            title: getMeta("og:title", "twitter:title", "title") || $("title").text || "",

            description: getMeta("og:description", "twitter:description", "description") || "",

            image: getMeta("og:image", "twitter:image") || "/placeholder.png",

            site_name: getMeta("og:site_name", "application-name") || "",

            type: getMeta("og:type", "type") || "",

            audio: getMeta("og:audio", "audio") || "",
        };

        // insert into my supabase DB
        const { data, error } = await supabase
            .from('links')
            .insert({
                url: link,
                user_id: user.id,
                title: ogData.title,
                description: ogData.description,
                image: ogData.image,
                site_name: ogData.site_name,
                type: ogData.type,
                audio: ogData.audio
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