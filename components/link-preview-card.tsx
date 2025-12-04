import { Check, Copy, ExternalLink, Share2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Toggle } from "./ui/toggle";
import { Spinner } from "./ui/spinner";

/* eslint-disable */
export function LinkPreviewCard({
  preview,
  onDelete,
  linkId,
  isListView = false,
}: {
  preview: any
  onDelete?: (id: string) => Promise<void>
  linkId?: string
  isListView?: boolean
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
    <div className={`group relative overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md ${isListView ? 'flex flex-row' : 'flex flex-col hover:scale-[1.02]'}`}>
      {/* Image Preview */}
      {preview.image && (
        <Link href={preview.url} rel="noopener noreferrer" target="_blank">
          <div className={`relative overflow-hidden bg-muted flex-shrink-0 ${isListView ? 'w-32 h-24 sm:w-48 sm:h-32' : 'h-40 w-full'}`}>
            <img
              src={preview.image || "/placeholder.png"}
              alt={preview.title}
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
          <Link href={preview.url} rel="noopener noreferrer" target="_blank" className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base leading-tight line-clamp-2 text-foreground hover:text-primary transition-colors">
              {preview.title || "No Title"}
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

            {/* Delete button */}
            {onDelete && linkId && (
              <Toggle
                onClick={handleDeleteClick}
                disabled={isDeleting}
                size="sm"
                variant="outline"
                className="h-8 w-8 sm:h-7 sm:w-auto sm:px-2 p-0 sm:p-2 hover:bg-destructive/10 hover:text-destructive"
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
        <div className="text-xs sm:text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
          </div>
          <span className="truncate">{preview.site_name || new URL(preview.url).hostname}</span>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
          {preview.description || "No description available"}
        </p>
      </div>
    </div>
  )
}