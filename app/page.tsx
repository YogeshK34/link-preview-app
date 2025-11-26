"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, UserStar } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/*eslint-disable*/
export function LinkPreviewCard({ preview }: { preview: any }) {
  if (!preview) return null;

  return (
    <Card className="w-full max-w-md mt-6 overflow-hidden border border-border rounded-xl shadow-sm">
      {preview.image && (
        <Link href={preview.url} rel='noopener norefferer' target='_blank'>
          <img
            src={preview.image}
            alt={preview.title}
            width={600}
            height={300}
            className='w-full h-48 object-cover cursor-pointer hover-opacity-90 transition'
          />
        </Link>
      )}

      <CardHeader>
        <CardTitle className="text-lg">
          {preview.title || "No Title"}
        </CardTitle>
        <CardDescription>
          {preview.site_name || new URL(preview.url).hostname}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">
          {preview.description || "No description available"}
        </p>
        <p className="text-sm text-muted-foreground">
          {preview?.type}
        </p>
        <Link href={preview.audio}>
        <p className="text-sm text-muted-foreground">
          {preview?.audio}
        </p>
        </Link>
      </CardContent>
    </Card>
  );
}


/* eslint-disable */
export default function Home() {
  const [input, setInput] = useState<string>("");
  const [returnedLink, setReturnedLink] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [preview, setPreview] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [])

  async function handleLinkSubmit() {
    if (input.trim() === "") {
      toast.warning("Input cannot be empty!");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: input }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error);
        return;
      }

      const body = await res.json();
      setPreview(body.ogData);
      toast.success("Link submitted successfully!");
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/20 px-4 py-6">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <Card className="w-full shadow-lg border border-border/40 rounded-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Link Storer</CardTitle>
                <CardDescription className="mt-1 flex items-center gap-1.5">
                  Store your desired GitHub links easily
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* <Button variant='outline'>Hover</Button> */}
                      <HelpCircle />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add your social/profile links to get a preview card.</p>
                    </TooltipContent>
                  </Tooltip>
                </CardDescription>
              </div>

              <CardAction>
                {preview ? (
                  <Link href={preview.url} target="_blank">
                    <Avatar>
                      <AvatarImage src={preview.image} alt={preview.title} />
                      <AvatarFallback>
                        <UserStar />
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                ) : (
                  <Avatar>
                    <AvatarFallback>
                      <UserStar />
                    </AvatarFallback>
                  </Avatar>
                )}
              </CardAction>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <div className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Enter the Link
                </Label>
                <Input
                  ref={inputRef}
                  placeholder="https://github.com"
                  required
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <Button
                variant="default"
                type="button"
                onClick={handleLinkSubmit}
                className="w-full h-10 font-medium"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    <span>Submitting...</span>
                  </div>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </CardContent>

          <Separator />

          <CardFooter className="py-6">
            {preview ? (
              <LinkPreviewCard preview={preview} />
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No link added yet</EmptyTitle>
                  <EmptyDescription>Start by entering a link above</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}

          </CardFooter>
        </Card>

        <Accordion
          type='single'
          collapsible
          className='w-full rounded-lg border border-border/40 p-4 bg-card'
          defaultValue='item-1'
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>Application Information</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              Link Storer allows you to paste any supported link, and instantly generates
              a clean, beautiful preview card using OpenGraph metadata.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Supported Websites</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p>
                Link previews currently work best for websites that provide OpenGraph
                metadata, such as GitHub, YouTube, Spotify, Medium, Substack, and most
                blogs or news websites.
              </p>
              <p>
                Some platforms like X (Twitter) and LinkedIn limit metadata for profile
                links, so previews may be limited or unavailable.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>How Link Previews Work</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p>
                When you submit a link, our backend fetches the page HTML, extracts
                metadata such as title, description, and images using OpenGraph tags,
                and sends the preview back to your browser.
              </p>
              <p>
                This ensures fast, secure, and accurate previews without exposing your
                browser to CORS issues.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>Privacy & Security</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p>
                All link processing happens securely on the server. Your submitted links
                are never shared with third-party services.
              </p>
              <p>
                We only extract publicly available metadata — no login or personal data
                is required or collected.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>Why Some Links Don't Show Previews?</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p>
                Some websites intentionally block metadata scraping to protect their
                content. For example:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>X/Twitter profile URLs</li>
                <li>LinkedIn user profile URLs</li>
                <li>Sites requiring login before viewing</li>
              </ul>
              <p>
                In such cases, a fallback preview is shown using the domain name.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger>Upcoming Features</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p>Here are some features planned for future releases:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Save and organize links permanently</li>
                <li>Custom categories and tags</li>
                <li>Dark/light mode support</li>
                <li>Favicon and platform detection</li>
                <li>Grid view for multiple previews</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-7">
            <AccordionTrigger>Troubleshooting</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p>If a preview doesn't load, try these steps:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Check if the website exposes OpenGraph tags</li>
                <li>Ensure the URL starts with http:// or https://</li>
                <li>Try refreshing the page and submitting again</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}