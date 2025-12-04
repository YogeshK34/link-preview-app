"use client"

import type React from "react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { HelpCircle, UserSearch as UserStar, ExternalLink, Trash2, Copy, Check, Share2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Toggle } from "@/components/ui/toggle"
import { ThemeToggle } from "@/components/ui/theme-toggle"

/*eslint-disable */
export function LinkPreviewCard({
  preview,
  onDelete,
  linkId,
}: {
  preview: any
  onDelete?: (id: string) => Promise<void>
  linkId?: string
}) {
  const [isCopied, setIsCopied] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // wrap the onDelete inside a helper function 
const handleDeleteClick = async () => {
  if (isDeleting || !linkId || !onDelete) return;

  setIsDeleting(true);
  try {
    await onDelete(linkId);
  } catch (error) {
    console.error("Delete failed:", error);
  } finally {
    setIsDeleting(false);
  }
};

  if (!preview) return null

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(preview.url)
      setIsCopied(true)
      toast.success("Link copied!");
      setTimeout(() => setIsCopied(false), 1500)
    } catch (error) {
      console.error(error)
      toast.error("Unable to copy link!")
    }
  }

  const shareLink = async () => {
    if (
      navigator.share &&
      navigator.canShare?.({
        title: preview.title,
        text: preview.description,
        url: preview.url,
      })
    ) {
      try {
        await navigator.share({
          title: preview.title,
          text: preview.description,
          url: preview.url,
        })
        toast.success("Link shared successfully!");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return
        }
        console.error(error)
        await copyLinkFallback()
      }
    } else {
      await copyLinkFallback()
    }
  }

  const copyLinkFallback = async () => {
    try {
      await navigator.clipboard.writeText(preview.url)
      toast.info("Sharing not supported on this browser. Link copied to clipboard!");
    } catch (error) {
      toast.error("Unable to copy link!");
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md hover:scale-[1.02]">
      {/* Image Preview */}
      {preview.image && (
        <Link href={preview.url} rel="noopener noreferrer" target="_blank">
          <div className="relative h-40 overflow-hidden bg-muted">
            <img
              src={preview.image || "/placeholder.png"}
              alt={preview.title}
              width={600}
              height={300}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-3">
              <ExternalLink className="w-5 h-5 text-white" />
            </div>
          </div>
        </Link>
      )}

      {/* Content Section */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <Link href={preview.url} rel="noopener noreferrer" target="_blank">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground hover:text-primary transition-colors">
              {preview.title || "No Title"}
            </h3>
          </Link>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Copy button */}
            <Toggle
              onClick={copyLink}
              size="sm"
              variant="outline"
              className="h-7 px-2"
              title={isCopied ? "Copied!" : "Copy link"}
            >
              {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Toggle>

            {/* Share button */}
            <Toggle onClick={shareLink} size="sm" variant="outline" className="h-7 px-2" title="Share link">
              <Share2 className="w-4 h-4" />
            </Toggle>

            {/* Delete button */}
            {onDelete && linkId && (
              <Toggle
                onClick={handleDeleteClick}
                disabled={isDeleting}
                size="sm"
                variant="outline"
                className="h-7 px-2 hover:bg-destructive/10 hover:text-destructive"
                title="Delete link"
              >
                {isDeleting ? (
                  <Spinner className="w-4 h-4" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Toggle>
            )}
          </div>
        </div>

        {/* Site info */}
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
          </div>
          <span className="truncate">{preview.site_name || new URL(preview.url).hostname}</span>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {preview.description || "No description available"}
        </p>
      </div>
    </div>
  )
}


const supabase = createClient()

/* eslint-disable */
export default function Home() {
  const [input, setInput] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [preview, setPreview] = useState<any>(null)
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState<boolean>(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const [links, setLinks] = useState<any[]>([])
  const [linksLoading, setIsLinksLoading] = useState<boolean>(true)
  const router = useRouter()

  // 1️⃣ Load user on first render + listen for auth changes
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      setUser(user)
      setAuthLoading(false)
    }

    checkUser()

    // Listen for login/logout events
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])



  // 2️⃣ Fetch links — only after we KNOW auth state
  useEffect(() => {
    if (authLoading) return  // Wait until auth is fully checked

    const fetchData = async () => {
      try {
        const res = await fetch("/api/links", { method: "GET" })

        // 🟦 Case A: 401 but user is NOT logged in → ignore silently
        if (res.status === 401 && !user) {
          return
        }

        // 🟥 Case B: 401 AND user IS logged in → real auth error
        if (res.status === 401 && user) {
          const err = await res.json()
          toast.error(err.error)
          return
        }

        // ⛔ Any other non-OK error
        if (!res.ok) {
          const err = await res.json()
          toast.error(err.error)
          return
        }

        // 🟢 Success
        const body = await res.json()
        setLinks(body.links)
      } catch (error) {
        console.error(error)
        toast.error("Failed to load your links!")
      } finally {
        setIsLinksLoading(false)
      }
    }

    fetchData()
  }, [authLoading, user])


  // 3️⃣ Auto-focus input when user is authenticated
  useEffect(() => {
    if (!authLoading && user) {
      inputRef.current?.focus()
    }
  }, [authLoading, user])


  async function handleLinkSubmit(e: React.FormEvent) {
    e.preventDefault()

    // this'll prevent double-submission 
    if (loading) return;

    // Check if user is authenticated
    if (!user) {
      toast.error("Please sign in to submit links", {
        action: {
          label: "Sign In",
          onClick: () => router.push("/login"),
        },
      })
      return;
    }

    if (input.trim() === "") {
      toast.warning("Input cannot be empty!")
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: input }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error)
        return
      }

      setPreview(data.data)
      toast.success("Link submitted successfully!")
    } catch (error) {
      toast.error("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setPreview(null)
    toast.success("Signed out successfully!")
  }

  // delete links function
const deleteLinks = async (linkId: string): Promise<void> => {
  try {
    const res = await fetch(`/api/links/${linkId}`, {
      method: "DELETE",
    })

    if (!res.ok) {
      const error = await res.json()
      toast.error(error.error || "Failed to delete link!")
      return 
    }

    setLinks(links.filter((link) => link.id !== linkId))
    toast.success("Link deleted successfully!")
    return
  } catch (error) {
    console.error(error)
    toast.error("Something went wrong")
    return  // ← Change: return false instead of throwing
  }
}

  return (
    <div className="min-h-screen w-full flex flex-col bg-background px-4 py-8">
      <div className="flex-1 max-w-7xl mx-auto w-full">
        <div className="mb-12">
          <Card className="w-full shadow-lg border border-border/40 rounded-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Link Storer</CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-1.5">
                    {user ? (
                      <span className="flex items-center gap-2">Signed in as {user.email}</span>
                    ) : (
                      "Store your desired GitHub links easily"
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add your social/profile links to get a preview card.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardDescription>
                </div>

                <CardAction className="flex items-center gap-2">
                  {user ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleSignOut}
                            className="rounded-full"
                          >
                            <Avatar>
                              <AvatarImage
                                src={user.user_metadata?.avatar_url || "/placeholder.svg"}
                                alt={user.email || "User"}
                              />
                              <AvatarFallback>
                                {user.email?.[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click to sign out</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Avatar>
                      <AvatarFallback>
                        <UserStar />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <ThemeToggle />
                </CardAction>

              </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6">
              <form onSubmit={handleLinkSubmit}>
                <div className="flex flex-col gap-5">
                  <div className="grid gap-2">
                    <Label className="text-sm font-medium text-muted-foreground">Enter the Link</Label>
                    <Input
                      type="text"
                      ref={inputRef}
                      placeholder="https://github.com"
                      required
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="focus:ring-2 focus:ring-primary/50"
                      disabled={!user}
                    />
                  </div>

                  {!user && !authLoading && (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                      Please{" "}
                      <Button
                        variant="link"
                        type="button"
                        className="p-0 h-auto font-semibold"
                        onClick={() => router.push("/login")}
                      >
                        sign in
                      </Button>{" "}
                      to submit links
                    </div>
                  )}

                  <Button
                    variant="default"
                    type="submit"
                    className="w-full h-10 font-medium"
                    disabled={loading || !user || authLoading}
                  >
                    {authLoading ? (
                      <div className="flex items-center gap-2">
                        <Spinner className="h-4 w-4" />
                        <span>Loading...</span>
                      </div>
                    ) : loading ? (
                      <div className="flex items-center gap-2">
                        <Spinner className="h-4 w-4" />
                        <span>Submitting...</span>
                      </div>
                    ) : !user ? (
                      "Sign in to Submit"
                    ) : (
                      "Submit"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="w-full">
          {preview ? (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Latest Preview</h2>
              <LinkPreviewCard preview={preview} />
            </div>
          ) : null}

          {linksLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
              {[1, 2, 3].map((i) => (
                <div key={i} className="overflow-hidden h-full flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm">
                  {/* Image skeleton */}
                  <Skeleton className="w-full h-40" />

                  {/* Content */}
                  <div className="flex-1 flex flex-col p-4 gap-3">
                    {/* Title skeleton */}
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>

                    {/* Site name skeleton */}
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="w-4 h-4 rounded-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>

                    {/* Description skeleton */}
                    <div className="space-y-2 mt-1">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-5/6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

          ) : links.length > 0 ? (
            <div className="w-full">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Your Saved Links</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                {links.map((link) => (
                  <LinkPreviewCard key={link.id} preview={link} linkId={link.id} onDelete={deleteLinks} />
                ))}
              </div>
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No link added yet</EmptyTitle>
                <EmptyDescription>
                  {user ? "Start by entering a link above" : "Sign in to start adding links"}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </div>

      <div className="mt-16 w-full max-w-7xl mx-auto">
        <Accordion
          type="single"
          collapsible
          className="w-full rounded-lg border border-border/40 p-4 bg-card"
          defaultValue="item-1"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>Application Information</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              Link Storer allows you to paste any supported link, and instantly generates a clean, beautiful preview
              card using OpenGraph metadata.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Supported Websites</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p>
                Link previews currently work best for websites that provide OpenGraph metadata, such as GitHub, YouTube,
                Spotify, Medium, Substack, and most blogs or news websites.
              </p>
              <p>
                Some platforms like X (Twitter) and LinkedIn limit metadata for profile links, so previews may be
                limited or unavailable.
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>How Link Previews Work</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p>
                When you submit a link, our backend fetches the page HTML, extracts metadata such as title, description,
                and images using OpenGraph tags, and sends the preview back to your browser.
              </p>
              <p>This ensures fast, secure, and accurate previews without exposing your browser to CORS issues.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>Privacy & Security</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p>
                All link processing happens securely on the server. Your submitted links are never shared with
                third-party services.
              </p>
              <p>We only extract publicly available metadata — no login or personal data is required or collected.</p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>Why Some Links Don't Show Previews?</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p>Some websites intentionally block metadata scraping to protect their content. For example:</p>
              <ul className="list-disc ml-6 space-y-2">
                <li>X/Twitter profile URLs</li>
                <li>LinkedIn user profile URLs</li>
                <li>Sites requiring login before viewing</li>
              </ul>
              <p>In such cases, a fallback preview is shown using the domain name.</p>
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
  )
}