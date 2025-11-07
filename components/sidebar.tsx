"use client"

import {
  Code,
  FileText,
  FolderOpen,
  GitBranch,
  Home,
  Settings,
  Moon,
  Split,
  TerminalIcon,
  Search,
  Keyboard,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ThemeType } from "./terminal"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarProps {
  theme: ThemeType
  onThemeToggle: () => void
  onFileBrowserToggle: () => void
  onSplitViewToggle: () => void
  onKeyboardShortcutsToggle: () => void
  showFileBrowser: boolean
  splitView: boolean
}

export default function Sidebar({
  theme,
  onThemeToggle,
  onFileBrowserToggle,
  onSplitViewToggle,
  onKeyboardShortcutsToggle,
  showFileBrowser,
  splitView,
}: SidebarProps) {
  const getIconColor = () => {
    switch (theme) {
      case "purple":
        return "text-purple-400 hover:bg-purple-800"
      case "ocean":
        return "text-blue-400 hover:bg-blue-800"
      default:
        return "text-gray-400 hover:bg-gray-800"
    }
  }

  const getActiveIconColor = () => {
    switch (theme) {
      case "purple":
        return "bg-purple-800 text-purple-200"
      case "ocean":
        return "bg-blue-800 text-blue-200"
      default:
        return "bg-gray-800 text-white"
    }
  }

  const getLogoColor = () => {
    switch (theme) {
      case "purple":
        return "bg-purple-600"
      case "ocean":
        return "bg-blue-600"
      default:
        return "bg-purple-600"
    }
  }

  const getBorderColor = () => {
    switch (theme) {
      case "purple":
        return "border-purple-800"
      case "ocean":
        return "border-blue-800"
      case "midnight":
        return "border-gray-700"
      default:
        return "border-gray-800"
    }
  }

  const getBackgroundColor = () => {
    switch (theme) {
      case "purple":
        return "bg-[#15101e]"
      case "ocean":
        return "bg-[#0a1525]"
      case "midnight":
        return "bg-[#0d0e15]"
      case "darker":
        return "bg-black"
      default:
        return "bg-gray-900"
    }
  }

  return (
    <TooltipProvider>
      <div className={cn("flex w-12 flex-col items-center border-r py-4", getBorderColor(), getBackgroundColor())}>
        <div className={cn("mb-6 flex h-8 w-8 items-center justify-center rounded-md text-white", getLogoColor())}>
          <Code className="h-5 w-5" />
        </div>
        <div className="flex flex-col items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn("flex h-8 w-8 items-center justify-center rounded-md transition-colors", getIconColor())}
              >
                <Home className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Home</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                  showFileBrowser ? getActiveIconColor() : getIconColor(),
                )}
                onClick={onFileBrowserToggle}
              >
                <FolderOpen className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">File Browser (Ctrl+B)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn("flex h-8 w-8 items-center justify-center rounded-md transition-colors", getIconColor())}
              >
                <FileText className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Editor</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn("flex h-8 w-8 items-center justify-center rounded-md transition-colors", getIconColor())}
              >
                <GitBranch className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Git</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn("flex h-8 w-8 items-center justify-center rounded-md transition-colors", getIconColor())}
              >
                <TerminalIcon className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Terminal</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                  splitView ? getActiveIconColor() : getIconColor(),
                )}
                onClick={onSplitViewToggle}
              >
                <Split className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Split View (Ctrl+\)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn("flex h-8 w-8 items-center justify-center rounded-md transition-colors", getIconColor())}
              >
                <Search className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Search (type 'search &lt;term&gt;')</TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-auto flex flex-col gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn("flex h-8 w-8 items-center justify-center rounded-md transition-colors", getIconColor())}
                onClick={onKeyboardShortcutsToggle}
              >
                <Keyboard className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Keyboard Shortcuts (Ctrl+K)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn("flex h-8 w-8 items-center justify-center rounded-md transition-colors", getIconColor())}
                onClick={onThemeToggle}
              >
                <Moon className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Theme (Ctrl+T)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={cn("flex h-8 w-8 items-center justify-center rounded-md transition-colors", getIconColor())}
              >
                <Settings className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
