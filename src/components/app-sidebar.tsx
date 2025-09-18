"use client"

import {
  Home,
  Search,
  Compass,
  Play,
  MessageCircle,
  Heart,
  Plus,
  User,
  Menu,
  Grid3X3,
  Camera,
} from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

// Instagram-style menu items (show 4 for now)
const items = [
  { title: "Home", icon: Home, active: true },
  { title: "Explore", icon: Compass, active: false },
  { title: "Reels", icon: Play, active: false },
  { title: "Grid", icon: Grid3X3, active: false },
]

export function AppSidebar() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div className="fixed left-3 top-3 bottom-3 w-16 z-50 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg" suppressHydrationWarning>
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-white/10">
        <div className="w-8 h-8 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <Camera className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col items-center py-6 space-y-6">
        {items.map((item) => (
          <button
            key={item.title}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group relative",
              item.active ? "bg-white/15" : "hover:bg-white/10",
            )}
            title={item.title}
          >
            <item.icon
              className={cn(
                "w-6 h-6 transition-colors",
                item.active ? "text-white" : "text-white/80 group-hover:text-white",
              )}
            />
            <div className="absolute left-full ml-2 px-2 py-1 bg-black/70 backdrop-blur-md text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-white/10">
              {item.title}
            </div>
          </button>
        ))}
      </nav>

      {/* User profile at bottom */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        {isMounted ? (
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
                userButtonPopoverCard: "bg-black/70 backdrop-blur-md border-white/10",
                userButtonPopoverActionButton: "text-gray-100 hover:bg-white/10",
              },
            }}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse" />
        )}
      </div>
    </div>
  )
}
