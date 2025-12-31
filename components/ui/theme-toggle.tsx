"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"
// import { Tooltip } from "@radix-ui/react-tooltip"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    /* eslint-disable */
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="rounded-lg"
                >
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
            </TooltipTrigger>
            {theme === 'dark' ? (
                <TooltipContent> Swtich to light mode</TooltipContent>
            ) : (
                <TooltipContent> Swtich to dark mode</TooltipContent>
            )}
        </Tooltip>
    )
}
