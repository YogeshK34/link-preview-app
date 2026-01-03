"use client"

import type React from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination"
import { HelpCircle, UserSearch as UserStar, LayoutGrid, List, RefreshCw, ArrowUp, ArrowDown, X, Calendar, Type, Layers, Plus, Pencil, Trash2, Check, NotebookPen } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/utils/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LinkPreviewCard } from "@/components/link-preview-card"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Command, CommandInput } from "@/components/ui/command"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

// creating outside to prevent multiple client creations
const supabase = createClient()

/* eslint-disable */
export default function Home() {
  const [input, setInput] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [preview, setPreview] = useState<any>(null)
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState<boolean>(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const [links, setLinks] = useState<any[]>([])
  const [linksLoading, setIsLinksLoading] = useState<boolean>(true)
  const [isFilteringLinks, setIsFilteringLinks] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const [isRefreshingCategories, setIsRefreshingCategories] = useState<boolean>(false)
  const [categoriesLoading, setIsCategoriesLoading] = useState<boolean>(true)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [sortLinksByCategoryId, setSortLinksByCategoryId] = useState<string | null>(null);
  const [isEditModeCategories, setIsEditModeCategories] = useState<boolean>(false);
  const router = useRouter()

  type Category = {
    id: string;
    name: string;
    isDefault: boolean;
    readOnly: boolean;
  };

  // ============ PAGINATION STATES ============
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [itemsPerPage, setItemsPerPage] = useState<number>(6)
  const [skeletonCount, setSkeletonCount] = useState<number>(6)

  // ============ SORTING STATES ============
  const [sortBy, setSortBy] = useState<'created_at' | 'title'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Helper function to get consistent emoji for each category
  const getCategoryEmoji = (categoryId: string, isReadOnly: boolean) => {
    if (isReadOnly) return '🔒'
    const emojis = ['📚', '🎯', '🚀', '💡', '🎨', '🔥', '⭐', '🌟', '💼', '🎵', '🎮', '🏆', '🌈', '🎪', '🎭', '🎬', '📱', '💻', '🖥️', '⚡']
    const index = categoryId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % emojis.length
    return emojis[index]
  }

  // ============ CATEGORY STATES ============
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState<string>("");
  const [editCategoryName, setEditCategoryName] = useState<string>("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);

  // Filter links based on search query
  const filteredLinks = searchQuery.trim()
    ? links.filter(link => {
      const query = searchQuery.toLowerCase()
      return (
        link.title?.toLowerCase().includes(query) ||
        link.description?.toLowerCase().includes(query) ||
        link.url?.toLowerCase().includes(query)
      )
    })
    : links

  // Calculate total pages
  const totalPages = Math.ceil(filteredLinks.length / itemsPerPage)

  // Calculate current items to display
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentLinks = filteredLinks.slice(indexOfFirstItem, indexOfLastItem)

  // Function to handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of links section when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      if (start > 2) {
        pages.push('ellipsis-start')
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages - 1) {
        pages.push('ellipsis-end')
      }

      pages.push(totalPages)
    }

    return pages
  }
  // ============================================

  // ============ RESPONSIVE ITEMS PER PAGE ============
  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth
      if (width < 640) {
        // Mobile: 1 column
        setItemsPerPage(3)
        setSkeletonCount(2)
      } else if (width < 1024) {
        // Tablet: 2 columns
        setItemsPerPage(4)
        setSkeletonCount(4)
      } else {
        // Desktop: 3 columns
        setItemsPerPage(6)
        setSkeletonCount(6)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev)
      }

      // close on escape key 
      if (e.key === 'Escape') {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    // Set initial value
    updateItemsPerPage()

    // Add resize listener
    window.addEventListener('resize', updateItemsPerPage)
    window.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateItemsPerPage)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Reset to page 1 when itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage])
  // ===================================================

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      setUser(user)
      setAuthLoading(false)
    }

    checkUser()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)

      if (!session?.user) {
        setLinks([])
        setPreview(null)
        setCurrentPage(1)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Reusable fetch function with sort/order parameters
  const fetchLinks = async () => {
    try {
      // Build URL with query parameters
      const params = new URLSearchParams({
        sort: sortBy,
        order: sortOrder,
      })
      if (sortLinksByCategoryId) {
        params.set('categoryId', sortLinksByCategoryId)
      }

      const res = await fetch(`/api/links?${params.toString()}`, { method: "GET" })

      if (res.status === 401 && !user) {
        return
      }

      if (res.status === 401 && user) {
        const err = await res.json()
        toast.error(err.error)
        return
      }

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error)
        return
      }

      const body = await res.json()
      setLinks(body.links)
      // Reset to page 1 when links are loaded
      setCurrentPage(1)

    } catch (error) {
      console.error(error)
      toast.error("Failed to load your links!")
    } finally {
      setIsLinksLoading(false)
      setIsFilteringLinks(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (user) {
      setIsFilteringLinks(true)
      fetchLinks()
      fetchCategories()
    }
  }, [authLoading, user, sortBy, sortOrder, sortLinksByCategoryId])

  const handleRefreshLinks = async () => {
    if (!user || isRefreshing) return

    setIsRefreshing(true)
    setIsLinksLoading(true)
    try {
      await fetchLinks()
      toast.success("Links refreshed successfully!")
    } catch (error) {
      console.error(error)
      toast.error("Failed to refresh links!")
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRefreshCategories = async () => {
    if (!user || isRefreshingCategories) return

    setIsRefreshingCategories(true)
    try {
      await fetchCategories()
      toast.success("Categories refreshed successfully!")
    } catch (error) {
      console.error(error)
      toast.error("Failed to refresh categories!")
    } finally {
      setIsRefreshingCategories(false)
    }
  }



  useEffect(() => {
    if (!authLoading && user) {
      inputRef.current?.focus()
    }
  }, [authLoading, user])

  // Close search only on Escape (handled in handleKeyDown)
  // Removed auto-close on outside click to prevent flicker when interacting with search results



  async function handleLinkSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (loading) return;

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

      setTimeout(() => {
        setLinks((prevLinks) => {
          const updatedLinks = [data.data, ...prevLinks]
          // Sort to maintain pinned-first order
          return updatedLinks.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1
            if (!a.pinned && b.pinned) return 1
            if (a.pinned && b.pinned) {
              return new Date(b.pinned_at).getTime() - new Date(a.pinned_at).getTime()
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          })
        })
        setInput("")
        setPreview(null)
        // Reset to page 1 when new link is added
        setCurrentPage(1)
      }, 3500)

    } catch (error) {
      toast.error("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setPreview(null)
    setLinks([])
    setCurrentPage(1)
    toast.success("Signed out successfully!")
  }

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

      // Adjust current page if needed after deletion
      const newTotalPages = Math.ceil((links.length - 1) / itemsPerPage)
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages)
      }

      return
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong")
      return
    }
  }

  const handlePinToggle = (linkId: string, pinned: boolean, pinned_at: string | null) => {
    setLinks((prevLinks) => {
      const updatedLinks = prevLinks.map((link) =>
        link.id === linkId ? { ...link, pinned, pinned_at } : link
      )
      // Re-sort: pinned items first, then by pinned_at or created_at
      return updatedLinks.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        if (a.pinned && b.pinned) {
          return new Date(b.pinned_at).getTime() - new Date(a.pinned_at).getTime()
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    })
  }

  // categories functions
  const fetchCategories = async () => {
    try {
      setIsCategoriesLoading(true);
      const res = await fetch("/api/categories");
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to fetch categories");
        return;
      }

      setCategories(data);
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const createCategories = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return toast.error("Name cannot be empty!");
    };

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error);
      };

      toast.success("Category created!");
      setName("");
      fetchCategories();

    } catch (error: any) {
      toast.error(error);
    }
  }

  const updateCategory = async (id: string) => {

    // find the current category 
    const currentCategory = categories.find(cat => cat.id === id);

    // verify if user actually updated the category
    if (editCategoryName.trim() === currentCategory?.name) {
      toast.message("No changes made!");
      setEditingCategoryId(null);
      setOpenCategoryId(null);
      return;
    }

    // name validation
    if (!editCategoryName.trim()) {
      return toast.error("Name cannot be empty!")
    }

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editCategoryName.trim() })
      })

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error);
      };

      toast.success("Categoy name updated successfully!");
      setEditingCategoryId(null);
      fetchCategories();

    } catch (error: any) {
      return toast.error(error)
    } finally {
      setOpenCategoryId(null);
    };
  };

  const deleteCategory = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      })

      const data = await res.json();

      if (!res.ok) {
        return toast.error(data.error);
      };

      toast.success("Category deleted successfully!");
      fetchCategories();
    } catch (error: any) {
      return toast.error(error)
    } finally {
      setOpenCategoryId(null);
    };
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
                      "Store your desired url's easily"
                    )}
                  </CardDescription>
                </div>

                <CardAction className="flex items-center gap-2">
                  {user ? (
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
                    <InputGroup className="[--radius:9999px]">
                      <InputGroupAddon className="pl-1.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-4 h-4 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>Add your social/profile links to get a preview card.</p>
                          </TooltipContent>
                        </Tooltip>
                        <span>https://</span>
                      </InputGroupAddon>
                      {!user || authLoading ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="w-full">
                              <InputGroupInput
                                id="input-secure-19"
                                type="text"
                                placeholder="github.com"
                                disabled
                                autoComplete="off"
                                className="pointer-events-none"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <span>
                              {authLoading ?
                                "Checking Authentication"
                                :
                                "Please sign in to submit links"}
                            </span>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <InputGroupInput
                          id="input-secure-19"
                          type="text"
                          ref={inputRef}
                          placeholder="github.com"
                          required
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          autoComplete="off"
                        />
                      )}
                    </InputGroup>
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

                  {!user ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <Button
                            variant="outline"
                            className="w-full h-10 cursor-not-allowed pointer-events-none"
                            disabled
                          >
                            {authLoading ?
                              (
                                <div className="flex items-center gap-2">
                                  <Spinner className="h-4 w-4" />
                                  <span>Loading...</span>
                                </div>
                              ) : (
                                "🚫 Sign in to submit"
                              )}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>
                          {authLoading ?
                            "Checking Authentication"
                            :
                            "Please sign in to submit links"}
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Button
                      variant="default"
                      type="submit"
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
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="w-full">
          {preview ? (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Latest Preview</h2>
              <LinkPreviewCard preview={preview} categories={categories} onCategoryChange={fetchLinks} />
            </div>
          ) : null}

          {linksLoading && user ? (
            <div className="w-full">
              {/* Toolbar Skeleton */}
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    {/* Refresh button */}
                    <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
                    {/* Categories button */}
                    <Skeleton className="h-10 w-10 sm:w-32 shrink-0 rounded-md" />
                    {/* Sorting toggle group (2 items) */}
                    <Skeleton className="h-10 w-20 sm:w-28 shrink-0 rounded-md" />
                    {/* Category filter button */}
                    <Skeleton className="h-10 w-10 sm:w-20 shrink-0 rounded-md" />
                    {/* Sort order button */}
                    <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
                    {/* View mode toggle group (2 items) */}
                    <Skeleton className="h-10 w-20 sm:w-28 shrink-0 rounded-md" />
                    {/* Search button */}
                    <Skeleton className="h-10 w-20 sm:w-32 shrink-0 rounded-md" />
                  </div>
                </div>
              </div>

              {/* Links Grid Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full">
                {Array.from({ length: skeletonCount }).map((_, i) => (
                  <div key={i} className="overflow-hidden h-full flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm">
                    {/* Image Skeleton */}
                    <Skeleton className="w-full h-40" />
                    <div className="flex-1 flex flex-col p-3 sm:p-4 gap-2 sm:gap-3">
                      {/* Title and Action Buttons */}
                      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-1 sm:mb-2">
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                          <Skeleton className="h-8 w-8 sm:h-7 sm:w-7 rounded-md" />
                          <Skeleton className="h-8 w-8 sm:h-7 sm:w-7 rounded-md" />
                          <Skeleton className="h-8 w-8 sm:h-7 sm:w-7 rounded-md" />
                          <Skeleton className="h-8 w-8 sm:h-7 sm:w-7 rounded-md" />
                          <Skeleton className="h-8 w-8 sm:h-7 sm:w-7 rounded-md" />
                        </div>
                      </div>
                      {/* Site info */}
                      <div className="flex items-center gap-1.5">
                        <Skeleton className="w-3 h-3 rounded-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      {/* Description */}
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-5/6" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          ) : user ? (
            <div className="w-full">
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Your Saved Links</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchQuery.trim() ? (
                        <span>Found {filteredLinks.length} result{filteredLinks.length !== 1 ? 's' : ''} for "{searchQuery}"</span>
                      ) : (
                        <span>Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, links.length)} of {links.length} links</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleRefreshLinks}
                          disabled={isRefreshing}
                          className="shrink-0"
                        >
                          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Refresh links</p>
                      </TooltipContent>
                    </Tooltip>

                    {/** Categories Section **/}
                    <Popover onOpenChange={(open) => open && fetchCategories()}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Layers className="h-4 w-4" />
                          <span className="hidden sm:inline">Categories</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 sm:w-96" align="end">
                        <div className="flex flex-col gap-4">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm">Manage Categories</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={handleRefreshCategories}
                              disabled={isRefreshingCategories}
                            >
                              <RefreshCw className={`h-4 w-4 ${isRefreshingCategories ? 'animate-spin' : ''}`} />
                            </Button>
                          </div>

                          <Separator className="-mx-3 w-[calc(100%+1.5rem)]" />

                          {/* Categories List */}
                          {categoriesLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 rounded-md border">
                                  <Skeleton className="h-4 flex-1" />
                                  <Skeleton className="h-6 w-6 shrink-0" />
                                </div>
                              ))}
                            </div>
                          ) : categories.length > 0 ? (
                            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">

                              {/* this button will open only those categories which are editable (!cat.readonly) */}
                              <Button
                                variant='secondary'
                                onClick={() => { setIsEditModeCategories(prev => !prev) }}
                                className="w-full shrink-0"
                              >
                                <NotebookPen />
                                {isEditModeCategories ? "View All Categories" : "Edit Categories"}
                              </Button>

                              {isEditModeCategories ? (
                                // Show only editable categories with edit/delete controls
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {categories.filter(cat => !cat.readOnly).map((cat) => (
                                    <div
                                      key={cat.id}
                                      className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                                    >
                                      {editingCategoryId === cat.id ? (
                                        <>
                                          <Input
                                            type="text"
                                            placeholder="Category name"
                                            value={editCategoryName}
                                            onChange={(e) => setEditCategoryName(e.target.value)}
                                            className="h-8 flex-1"
                                            autoFocus
                                            autoComplete='off'
                                          />
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 shrink-0"
                                            onClick={() => updateCategory(cat.id)}
                                          >
                                            <Check className="h-4 w-4 text-green-600" />
                                          </Button>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 shrink-0"
                                            onClick={() => setEditingCategoryId(null)}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </>
                                      ) : (
                                        <>
                                          <span className="flex-1 text-sm font-medium truncate flex items-center gap-1.5">
                                            <span className="text-xs">{getCategoryEmoji(cat.id, cat.readOnly)}</span>
                                            {cat.name}
                                          </span>
                                          {/* Edit and Delete buttons directly visible in edit mode */}
                                          <div className="flex items-center gap-1 shrink-0">
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  className="h-8 w-8"
                                                  onClick={() => {
                                                    setEditingCategoryId(cat.id)
                                                    setEditCategoryName(cat.name)
                                                  }}
                                                >
                                                  <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Edit category</p>
                                              </TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                              <AlertDialog>
                                                <TooltipTrigger asChild>
                                                  <AlertDialogTrigger asChild>
                                                    <Button
                                                      size="icon"
                                                      variant="ghost"
                                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                                    >
                                                      <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                  </AlertDialogTrigger>
                                                </TooltipTrigger>
                                                <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-lg">
                                                  <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-base sm:text-lg">Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription className="text-sm">
                                                      This action cannot be undone. This will permanently delete the category "{cat.name}" from your account.
                                                    </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter className="gap-2 sm:gap-2">
                                                    <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteCategory(cat.id)}>
                                                      Delete
                                                    </AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
                                              <TooltipContent>
                                                <p>Delete category</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                // Show all categories with settings button
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {categories.map((cat) => (
                                    <div
                                      key={cat.id}
                                      className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                                    >
                                      {editingCategoryId === cat.id ? (
                                        <>
                                          <Input
                                            type="text"
                                            placeholder="Category name"
                                            value={editCategoryName}
                                            onChange={(e) => setEditCategoryName(e.target.value)}
                                            className="h-8 flex-1"
                                            autoFocus
                                            autoComplete='off'
                                          />
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 shrink-0"
                                            onClick={() => updateCategory(cat.id)}
                                          >
                                            <Check className="h-4 w-4 text-green-600" />
                                          </Button>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 shrink-0"
                                            onClick={() => setEditingCategoryId(null)}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </>
                                      ) : (
                                        <>
                                          <span className="flex-1 text-sm font-medium truncate flex items-center gap-1.5">
                                            {cat.readOnly ? (
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <span className="text-xs">{getCategoryEmoji(cat.id, cat.readOnly)}</span>
                                                </TooltipTrigger>
                                                <TooltipContent>Default Category</TooltipContent>
                                              </Tooltip>
                                            ) : (
                                              <>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <span className="text-xs">{getCategoryEmoji(cat.id, cat.readOnly)}</span>
                                                </TooltipTrigger>
                                                <TooltipContent>Your created category</TooltipContent>
                                              </Tooltip>
                                              {/* <span className="text-xs">{getCategoryEmoji(cat.id, cat.readOnly)}</span> */}
                                              </>
                                            )}
                                            {cat.name}
                                          </span>
                                          {!cat.readOnly}
                                          <div>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-sm text-muted-foreground">
                              No categories yet
                            </div>
                          )}

                          <Separator className="-mx-3 w-[calc(100%+1.5rem)]" />

                          {/* Create New Category */}
                          <form onSubmit={createCategories} className="flex flex-col gap-3">
                            <Label htmlFor="new-category" className="text-xs font-medium text-muted-foreground">
                              Create New Category
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id="new-category"
                                type="text"
                                placeholder="Enter category name"
                                value={name}
                                required
                                onChange={(e) => setName(e.target.value)}
                                className="h-9 flex-1"
                                autoComplete='off'
                              />
                              <Button type="submit" size="sm" className="h-9 gap-1.5 shrink-0">
                                <Plus className="h-4 w-4" />
                                Add
                              </Button>
                            </div>
                          </form>
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Sorting Controls */}
                    <ToggleGroup
                      type="single"
                      value={sortBy}
                      onValueChange={(value) => value && setSortBy(value as 'created_at' | 'title')}
                      variant="outline"
                      spacing={0}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ToggleGroupItem
                            value="created_at"
                            aria-label="Sort by date"
                            className={cn(
                              sortBy === 'created_at' && "bg-secondary text-secondary-foreground"
                            )}
                          >
                            <Calendar className="h-4 w-4" />
                            <span className="ml-2 hidden md:inline">Date</span>
                          </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Sort by creation date</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ToggleGroupItem
                            value="title"
                            aria-label="Sort by title"
                            className={cn(
                              sortBy === 'title' && "bg-secondary text-secondary-foreground"
                            )}
                          >
                            <Type className="h-4 w-4" />
                            <span className="ml-2 hidden md:inline">Title</span>
                          </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Sort by title</p>
                        </TooltipContent>
                      </Tooltip>
                    </ToggleGroup>

                    {/* Category Filter - Integrated with sorting */}
                    {categories.length > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                              <Button 
                                variant={sortLinksByCategoryId ? 'secondary' : 'outline'}
                                className="gap-1.5 h-10"
                              >
                                <Layers className="h-4 w-4" />
                                <span className="hidden sm:inline">
                                  {sortLinksByCategoryId 
                                    ? categories.find(cat => cat.id === sortLinksByCategoryId)?.name 
                                    : "Filter"}
                                </span>
                              </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-72" align="end">
                          <div className="flex flex-col gap-3">
                            <h3 className="font-semibold text-sm">Filter by Category</h3>
                            <Separator className="-mx-3 w-[calc(100%+1.5rem)]" />
                            
                            {/* All Links Button */}
                            <Button
                              size="sm"
                              variant={sortLinksByCategoryId === null ? "default" : "outline"}
                              onClick={() => setSortLinksByCategoryId(null)}
                              className="w-full justify-start h-9"
                            >
                              All Links
                            </Button>
                            
                            {/* Categories List */}
                            <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
                              {categories.map((cat) => (
                                <Button
                                  key={cat.id}
                                  size="sm"
                                  variant={sortLinksByCategoryId === cat.id ? "default" : "outline"}
                                  onClick={() => setSortLinksByCategoryId(cat.id)}
                                  className="h-9 gap-1.5 justify-start"
                                >
                                  <span className="text-xs">{getCategoryEmoji(cat.id, cat.readOnly)}</span>
                                  <span className="truncate">{cat.name}</span>
                                </Button>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                          className="shrink-0"
                        >
                          {sortOrder === 'asc' ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* List & Grid view */}
                    <ToggleGroup
                      type="single"
                      value={viewMode}
                      onValueChange={(value) => value && setViewMode(value as "grid" | "list")}
                      variant="outline"
                      spacing={0}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ToggleGroupItem
                            value="grid"
                            aria-label="Grid view"
                            className={cn(
                              viewMode === 'grid' && "bg-secondary text-secondary-foreground"
                            )}
                          >
                            <LayoutGrid className="h-4 w-4" />
                            <span className="ml-2 hidden md:inline">Grid</span>
                          </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Grid view</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ToggleGroupItem
                            value="list"
                            aria-label="List view"
                            className={cn(
                              viewMode === 'list' && "bg-secondary text-secondary-foreground"
                            )}
                          >
                            <List className="h-4 w-4" />
                            <span className="ml-2 hidden md:inline">List</span>
                          </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>List view</p>
                        </TooltipContent>
                      </Tooltip>
                    </ToggleGroup>

                    {(sortBy !== 'created_at' || sortOrder !== 'desc' || viewMode !== 'grid') && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => {
                              setViewMode('grid');
                              setSortBy('created_at');
                              setSortOrder('desc');
                            }}
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Reset filters</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {!isOpen && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => setIsOpen(true)}
                            className="gap-1 sm:gap-2 shrink-0 px-3 sm:px-4"
                          >
                            <span className="text-sm">Search</span>
                            <KbdGroup className="gap-0.5 sm:gap-1">
                              <Kbd className="text-xs px-1 py-0.5 h-5 min-w-[18px]">⌘</Kbd>
                              <Kbd className="text-xs px-1 py-0.5 h-5 min-w-[18px]">K</Kbd>
                            </KbdGroup>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Search links (⌘K)</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="relative">
                    <Command ref={searchRef} className="rounded-lg border shadow-md w-full">
                      <CommandInput
                        value={searchQuery}
                        onValueChange={(value) => {
                          setSearchQuery(value)
                          setCurrentPage(1)
                        }}
                        placeholder="Search links..."
                        autoFocus
                        className="h-12 sm:h-11"
                      />
                    </Command>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setIsOpen(false)
                            setSearchQuery('')
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Esc or click to close the search box</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>

              {/* Show links or empty state based on whether there are links */}
              {isFilteringLinks ? (
                // Show only grid skeleton when filtering
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full">
                  {Array.from({ length: skeletonCount }).map((_, i) => (
                    <div key={i} className="overflow-hidden h-full flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm">
                      <Skeleton className="w-full h-40" />
                      <div className="flex-1 flex flex-col p-3 sm:p-4 gap-2 sm:gap-3">
                        <div className="flex items-start justify-between gap-2 sm:gap-3 mb-1 sm:mb-2">
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>
                          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                            <Skeleton className="h-8 w-8 sm:h-7 sm:w-7 rounded-md" />
                            <Skeleton className="h-8 w-8 sm:h-7 sm:w-7 rounded-md" />
                            <Skeleton className="h-8 w-8 sm:h-7 sm:w-7 rounded-md" />
                            <Skeleton className="h-8 w-8 sm:h-7 sm:w-7 rounded-md" />
                            <Skeleton className="h-8 w-8 sm:h-7 sm:w-7 rounded-md" />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Skeleton className="w-3 h-3 rounded-full" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-5/6" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : links.length > 0 ? (
                <>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full">
                      {currentLinks.map((link) => (
                        <LinkPreviewCard key={link.id} preview={link} linkId={link.id} onDelete={deleteLinks} onPin={handlePinToggle} categories={categories} onCategoryChange={fetchLinks} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:gap-4 w-full">
                      {currentLinks.map((link) => (
                        <LinkPreviewCard key={link.id} preview={link} linkId={link.id} onDelete={deleteLinks} onPin={handlePinToggle} categories={categories} isListView onCategoryChange={fetchLinks} />
                      ))}
                    </div>
                  )}

                  {/*PAGINATION COMPONENT*/}
                  {totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>

                          {getPageNumbers().map((page, index) => (
                            <PaginationItem key={index}>
                              {typeof page === 'number' ? (
                                <PaginationLink
                                  onClick={() => handlePageChange(page)}
                                  isActive={currentPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              ) : (
                                <PaginationEllipsis />
                              )}
                            </PaginationItem>
                          ))}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>
                      {sortLinksByCategoryId
                        ? `No links in "${categories.find(cat => cat.id === sortLinksByCategoryId)?.name}" category`
                        : "No link added yet"
                      }
                    </EmptyTitle>
                    <EmptyDescription>
                      {sortLinksByCategoryId
                        ? "Try adding links to this category or clear the filter to see all links"
                        : "Start by entering a link above"
                      }
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
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
        </Accordion>
      </div>
    </div>
  )
}