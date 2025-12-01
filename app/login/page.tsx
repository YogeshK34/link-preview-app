"use client"

import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const redirectTo = "/"

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        router.push(redirectTo)
      }
    }
    checkUser()
  }, [supabase, router, redirectTo])

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    })
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-muted px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-primary mb-4">
            <svg
              className="w-8 h-8 text-primary-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10 19H5c-1 0-2-1-2-2V7c0-1 1-2 2-2h14c1 0 2 1 2 2v10" />
              <polyline points="13 13 19 7" />
              <polyline points="19 7 19 1 13 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Link Storer</h1>
          <p className="text-muted-foreground mt-2 text-sm">Save, organize, and share your favorite links</p>
        </div>

        {/* Main Card */}
        <div className="relative rounded-2xl bg-card border border-border/40 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

          <div className="relative p-8 sm:p-10">
            {/* Sign in heading */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground text-balance">Welcome back</h2>
              <p className="text-muted-foreground text-sm mt-1">Sign in to access your saved links</p>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full h-12 flex items-center justify-center gap-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 hover:shadow-md active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-7">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium">OR</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Info section */}
            <div className="rounded-lg bg-muted/30 border border-border/40 p-4 mb-6">
              <p className="text-xs text-muted-foreground leading-relaxed text-center">
                Secure authentication powered by Google Sign-In. Your data stays encrypted and private.
              </p>
            </div>

            {/* Footer text */}
            <p className="text-xs text-muted-foreground text-center">
              By continuing, you agree to our{" "}
              <a href="#" className="text-primary hover:underline font-medium">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary hover:underline font-medium">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>

        {/* Additional info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have a Google account?{" "}
            <a href="https://accounts.google.com/signup" className="text-primary hover:underline font-medium">
              Create one for free
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
