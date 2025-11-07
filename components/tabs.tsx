"use client"

import { X, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ThemeType } from "./terminal"

interface TabsProps {
  activeTab: number
  setActiveTab: (index: number) => void
  theme: ThemeType
}

export default function Tabs({ activeTab, setActiveTab, theme }: TabsProps) {
  const tabs = [
    { name: "Terminal", path: "~/projects" },
    { name: "SSH", path: "user@remote-server" },
  ]

  const getTabClasses = (isActive: boolean) => {
    const baseClasses = "group relative flex cursor-pointer items-center gap-2 border-r px-4 py-2 text-sm"

    if (isActive) {
      switch (theme) {
        case "purple":
          return cn(baseClasses, "border-purple-800 bg-[#15101e] text-purple-100")
        case "ocean":
          return cn(baseClasses, "border-blue-800 bg-[#0a1525] text-blue-100")
        case "midnight":
          return cn(baseClasses, "border-gray-700 bg-[#0d0e15] text-gray-100")
        case "darker":
          return cn(baseClasses, "border-gray-800 bg-black text-gray-100")
        default:
          return cn(baseClasses, "border-gray-800 bg-gray-950 text-white")
      }
    } else {
      switch (theme) {
        case "purple":
          return cn(baseClasses, "border-purple-800 bg-[#1a1025] text-gray-400 hover:bg-[#15101e]")
        case "ocean":
          return cn(baseClasses, "border-blue-800 bg-[#0a192f] text-gray-400 hover:bg-[#0a1525]")
        case "midnight":
          return cn(baseClasses, "border-gray-700 bg-[#161827] text-gray-400 hover:bg-[#0d0e15]")
        case "darker":
          return cn(baseClasses, "border-gray-800 bg-gray-900 text-gray-400 hover:bg-gray-850")
        default:
          return cn(baseClasses, "border-gray-800 bg-gray-900 text-gray-400 hover:bg-gray-850")
      }
    }
  }

  const getHeaderClasses = () => {
    switch (theme) {
      case "purple":
        return "border-purple-800 bg-[#1a1025]"
      case "ocean":
        return "border-blue-800 bg-[#0a192f]"
      case "midnight":
        return "border-gray-700 bg-[#161827]"
      case "darker":
        return "border-gray-800 bg-gray-900"
      default:
        return "border-gray-800 bg-gray-900"
    }
  }

  return (
    <div className={cn("flex border-b", getHeaderClasses())}>
      {tabs.map((tab, index) => (
        <div key={index} className={getTabClasses(activeTab === index)} onClick={() => setActiveTab(index)}>
          <span>{tab.name}</span>
          <span className="text-xs text-gray-500">{tab.path}</span>
          <button className="ml-2 hidden rounded-sm p-0.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 group-hover:block">
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        className={cn(
          "px-3 text-gray-500 hover:text-gray-300",
          theme === "purple"
            ? "hover:bg-purple-800/50"
            : theme === "ocean"
              ? "hover:bg-blue-800/50"
              : "hover:bg-gray-800",
        )}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
