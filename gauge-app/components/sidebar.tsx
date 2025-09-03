// components/sidebar.tsx

"use client"

import { Users, Search, BarChart3, Star, Zap, Brain, Building2, List, PieChart } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Image from "next/image"

export function Sidebar() {
  const pathname = usePathname()

  const mainNavItems = [
    { href: "/companies", label: "Companies", icon: Building2 },
    { href: "/people", label: "People", icon: Users },
    { href: "/analytics", label: "Analytics", icon: Search, comingSoon: false }
  ]

  const favoriteItems = [
    { href: "/favorites/bookmarked", label: "Bookmarked top talent", icon: Star, comingSoon: true },
    { href: "/favorites/ai", label: "Agent Engineers in NYC", icon: Brain, comingSoon: true },
    { href: "/favorites/ex", label: "ex-Big Tech", icon: Zap, comingSoon: true },
    { href: "/favorites/curated", label: "Curated for you", icon: Star, comingSoon: true },
    { href: "/favorites/portfolios", label: "Portfolios", icon: PieChart, comingSoon: true },
    { href: "/favorites/pipeline", label: "Pipeline", icon: BarChart3, comingSoon: true },
  ]

  return (
    <div className="w-64 border-r h-screen flex flex-col bg-white">
      <div className="p-4 border-b flex items-center">
        <Image
          src="/images/logo.png"
          alt="Gauge Logo"
          width={108}
          height={108}
          className="mr-2"
        />
      </div>

      <div className="p-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Coming Soon</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <nav className="flex-1 overflow-auto">
        <ul className="px-3 py-2">
          {mainNavItems.map((item) => (
            <li key={item.href}>
              {item.comingSoon ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-sm rounded-md cursor-pointer",
                          pathname === item.href ? "bg-gray-100 font-medium" : "text-gray-600 hover:bg-gray-50",
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Coming Soon</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm rounded-md",
                    pathname === item.href ? "bg-gray-100 font-medium" : "text-gray-600 hover:bg-gray-50",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <div className="px-6 py-2 text-xs font-medium text-gray-500">Favorites</div>
        <ul className="px-3 pb-4">
          {favoriteItems.map((item) => (
            <li key={item.href}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm rounded-md cursor-pointer",
                        pathname === item.href ? "bg-gray-100 font-medium" : "text-gray-600 hover:bg-gray-50",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Coming Soon</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}