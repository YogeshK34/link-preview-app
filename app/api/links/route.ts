import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
// import { resourceUsage } from "process";

export async function POST(request: NextRequest) {
    // I have to just get the link and display it to the user 
    try {
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

            image: getMeta("og:image", "twitter:image") || "",

            site_name: getMeta("og:site_name", "application-name") || ""
        };

        return NextResponse.json(
            { ogData },
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