"use client"

import { LoginForm } from "./LoginForm"

export default function LoginPage() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-foreground text-sm font-bold text-background">
              ⌘
            </div>
            <span className="text-xl font-semibold tracking-tight">Link Storer</span>
          </div>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}
