import { Check, Copy, ExternalLink, Pin, Share2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Toggle } from "./ui/toggle";
import { Spinner } from "./ui/spinner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Button } from "./ui/button";

/* eslint-disable */

// XSS Protection: URL sanitization utility
const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url) return "#";
  
  try {
    const urlStr = url.trim();
    // Block dangerous URL schemes
    const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
    const lowerUrl = urlStr.toLowerCase();
    
    if (dangerousSchemes.some(scheme => lowerUrl.startsWith(scheme))) {
      console.warn('Blocked dangerous URL scheme:', urlStr);
      return "#";
    }
    
    // Validate URL format
    const urlObj = new URL(urlStr, window.location.origin);
    
    // Only allow http, https, and relative URLs
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      return urlStr;
    }
    
    return "#";
  } catch (error) {
    console.warn('Invalid URL:', url);
    return "#";
  }
};

// XSS Protection: Image URL sanitization
const sanitizeImageUrl = (url: string | null | undefined): string => {
  if (!url) return "/image11.png";
  
  try {
    const urlStr = url.trim();
    // Block dangerous schemes
    const dangerousSchemes = ['javascript:', 'data:text', 'vbscript:'];
    const lowerUrl = urlStr.toLowerCase();
    
    if (dangerousSchemes.some(scheme => lowerUrl.startsWith(scheme))) {
      console.warn('Blocked dangerous image URL:', urlStr);
      return "/image11.png";
    }
    
    // Allow http, https, data:image (for base64 images), and relative URLs
    if (urlStr.startsWith('http://') || 
        urlStr.startsWith('https://') || 
        urlStr.startsWith('/') ||
        urlStr.startsWith('data:image/')) {
      return urlStr;
    }
    
    return "/image11.png";
  } catch (error) {
    console.warn('Invalid image URL:', url);
    return "/image11.png";
  }
};

export function LinkPreviewCard({
  preview,
  onDelete,
  onPin,
  linkId,
  isListView = false,
}: {
  preview: any
  onDelete?: (id: string) => Promise<void>
  onPin?: (id: string, pinned: boolean, pinned_at: string | null) => void
  linkId?: string
  isListView?: boolean
}) {
  const [isCopied, setIsCopied] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [isPinning, setIsPinning] = useState<boolean>(false)
  const [isPinned, setIsPinned] = useState<boolean>(preview.pinned || false)

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

  // pin links function
  const pinLinks = async () => {
    if (isPinning || !linkId) return

    setIsPinning(true)
    // Optimistic update
    const previousPinned = isPinned
    setIsPinned(!isPinned)

    try {
      const res = await fetch(`/api/links/${linkId}`, {
        method: 'PATCH',
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) {
        // Revert on error
        setIsPinned(previousPinned)
        const errorData = await res.json()
        toast.error(errorData.error || "Failed to update pin status")
        return
      }

      const data = await res.json()
      // Update parent component's state
      if (onPin && linkId && data.data) {
        onPin(linkId, data.data.pinned, data.data.pinned_at)
      }
      toast.success(data.message || (isPinned ? "Link unpinned!" : "Link pinned!"))

    } catch (error) {
      // Revert on error
      setIsPinned(previousPinned)
      console.error("Pin toggle failed:", error)
      toast.error("Unable to update pin status!")
    } finally {
      setIsPinning(false)
    }
  };

  // XSS Protection: Sanitize URLs before rendering
  const safeUrl = sanitizeUrl(preview.url);
  const safeImageUrl = sanitizeImageUrl(preview.image);

  return (
    <div className={`group relative overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md ${isListView ? 'flex flex-row' : 'flex flex-col hover:scale-[1.02]'}`}>
      {/* Image Preview */}
      {preview.image && (
        <Link href={safeUrl} rel="noopener noreferrer" target="_blank">
          <div className={`relative overflow-hidden bg-muted flex-shrink-0 ${isListView ? 'w-32 h-24 sm:w-48 sm:h-32' : 'h-40 w-full'}`}>
            <img
              src={safeImageUrl}
              alt={preview.title || "Link preview"}
              width={600}
              height={300}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-2 sm:p-3">
              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </div>
        </Link>
      )}

      {/* Content Section */}
      <div className={`p-3 sm:p-4 ${isListView ? 'flex-1 flex flex-col justify-between min-w-0' : ''}`}>
        <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
          <Link href={safeUrl} rel="noopener noreferrer" target="_blank" className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base leading-tight line-clamp-2 text-foreground hover:text-primary transition-colors">
              {preview.title || preview.site_name || new URL(safeUrl).hostname}
            </h3>
          </Link>

          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* Copy button */}
            <Toggle
              onClick={copyLink}
              size="sm"
              variant="outline"
              className="h-8 w-8 sm:h-7 sm:w-auto sm:px-2 p-0 sm:p-2"
              title={isCopied ? "Copied!" : "Copy link"}
            >
              {isCopied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Toggle>

            {/* Share button */}
            <Toggle onClick={shareLink} size="sm" variant="outline" className="h-8 w-8 sm:h-7 sm:w-auto sm:px-2 p-0 sm:p-2" title="Share link">
              <Share2 className="w-4 h-4" />
            </Toggle>

            {/* Pin button */}
            <Toggle
              onClick={pinLinks}
              disabled={isPinning}
              pressed={isPinned}
              size="sm"
              variant="outline"
              className="h-8 w-8 sm:h-7 sm:w-auto sm:px-2 p-0 sm:p-2"
              title={isPinned ? "Unpin link" : "Pin link"}
            >
              {isPinning ? (
                <Spinner className="w-4 h-4" />
              ) : (
                <Pin className={`w-4 h-4 ${isPinned ? 'fill-current text-primary' : ''}`} />
              )}
            </Toggle>

            {/* Delete button */}
            {onDelete && linkId && (
              <TooltipProvider>
                <Tooltip>
                  <AlertDialog>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isDeleting}
                          className="h-8 w-8 sm:h-7 sm:w-auto sm:px-2 p-0 sm:p-2 hover:bg-destructive/10 hover:text-destructive"
                        >
                          {isDeleting ? (
                            <Spinner className="w-4 h-4" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-base sm:text-lg">Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                          This action cannot be undone. This will permanently delete this link from your collection.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2 sm:gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteClick} className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <TooltipContent>
                    <p>Delete link</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Site info */}
        <div className="text-xs sm:text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
          </div>
          <span className="truncate">{preview.site_name || new URL(safeUrl).hostname}</span>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
          {preview.description || "No description available"}
        </p>
      </div>
    </div>
  )
}