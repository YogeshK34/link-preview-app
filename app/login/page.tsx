"use client"

import { LoginForm } from "./LoginForm"
import { SidebarIllustration } from "./sidebar-illustration"


export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-black p-10">
        {/* Brand Logo */}
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-white text-xs font-bold text-black">
              ⌘
            </div>
            <span className="text-lg font-semibold text-white">Link Storer</span>
          </div>
        </div>

        <SidebarIllustration />

        {/* Testimonial */}
        <div className="space-y-2">
          <blockquote className="text-sm text-gray-300">
            &quot;What started as a simple idea to save links has now become my go-to tool for keeping my research, inspiration, and workflow in one place
            — faster and cleaner than ever before&quot;
          </blockquote>
          <p className="text-xs text-gray-400">— Walter White</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-sm space-y-6">
          {/* Top right login link for mobile */}
          <div className="flex justify-between items-center lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-black text-xs font-bold text-white">
                ⌘
              </div>
              <span className="text-lg font-semibold">Link Storer</span>
            </div>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
              Login
            </a>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
