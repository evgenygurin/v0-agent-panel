"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Command, X } from "lucide-react"
import { cn } from "@/lib/utils"
import CommandInput from "./command-input"
import CommandBlock from "./command-block"
import Sidebar from "./sidebar"
import Tabs from "./tabs"
import CommandSuggestions from "./command-suggestions"
import ThemeSelector from "./theme-selector"
import FileBrowser from "./file-browser"
import KeyboardShortcuts from "./keyboard-shortcuts"
import SplitPane from "./split-pane"

export type CommandType = {
  id: string
  command: string
  output: string
  timestamp: Date
  status: "success" | "error" | "warning" | "info"
  inlinePreview?: string
}

export type ThemeType = "dark" | "darker" | "midnight" | "purple" | "ocean"

export default function Terminal() {
  const [commands, setCommands] = useState<CommandType[]>([])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showThemeSelector, setShowThemeSelector] = useState(false)
  const [showFileBrowser, setShowFileBrowser] = useState(false)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [theme, setTheme] = useState<ThemeType>("dark")
  const [splitView, setSplitView] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const terminalRef = useRef<HTMLDivElement | null>(null)

  const themeClasses = {
    dark: "bg-gray-950 text-gray-200 border-gray-800",
    darker: "bg-black text-gray-200 border-gray-800",
    midnight: "bg-[#0f101a] text-gray-200 border-gray-700",
    purple: "bg-[#1a1025] text-purple-5 border-purple-900",
    ocean: "bg-[#0a192f] text-blue-50 border-blue-900",
  }

  const addCommand = (command: string) => {
    // Add to command history
    setCommandHistory((prev) => [...prev, command])

    // Simulate command execution
    let output = ""
    let status: "success" | "error" | "warning" | "info" = "success"
    let inlinePreview: string | undefined = undefined

    if (command.startsWith("ls")) {
      output = "Documents  Downloads  Pictures  Music  Videos  Projects  .git  .config  package.json"
    } else if (command.startsWith("cd")) {
      output = ""
    } else if (command.startsWith("echo")) {
      output = command.substring(5)
    } else if (command.startsWith("cat")) {
      output =
        "File contents would appear here\nWith multiple lines\nAnd proper formatting\n# This is a heading\n\nfunction example() {\n  console.log('Hello world');\n}"
      inlinePreview = "Text file preview"
    } else if (command.startsWith("git")) {
      if (command.includes("status")) {
        output =
          "On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean"
      } else if (command.includes("log")) {
        output =
          "commit a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0\nAuthor: Developer <dev@example.com>\nDate:   Mon May 4 11:53:09 2025 -0700\n\n    Initial commit"
      } else {
        output = "git command executed"
      }
    } else if (command.startsWith("npm")) {
      if (command.includes("install")) {
        output =
          "added 1256 packages, and audited 1257 packages in 3s\n\n133 packages are looking for funding\n  run `npm fund` for details\n\nfound 0 vulnerabilities"
        inlinePreview = "Package installation complete"
      } else {
        output = "npm command executed successfully"
      }
    } else if (command === "help") {
      output = "Available commands: ls, cd, echo, cat, git, npm, clear, help, theme, split, files, shortcuts, search"
    } else if (command === "clear") {
      setCommands([])
      return
    } else if (command === "theme") {
      setShowThemeSelector(true)
      output = "Opening theme selector..."
    } else if (command === "split") {
      setSplitView(!splitView)
      output = splitView ? "Split view disabled" : "Split view enabled"
    } else if (command === "files") {
      setShowFileBrowser(true)
      output = "Opening file browser..."
    } else if (command === "shortcuts") {
      setShowKeyboardShortcuts(true)
      output = "Opening keyboard shortcuts..."
    } else if (command.startsWith("search")) {
      const term = command.substring(7).trim()
      if (term) {
        setSearchTerm(term)
        output = `Searching for "${term}" in command history...`
      } else {
        output = "Usage: search <term>"
        status = "warning"
      }
    } else {
      output = `Command not found: ${command}`
      status = "error"
    }

    const newCommand: CommandType = {
      id: Date.now().toString(),
      command,
      output,
      timestamp: new Date(),
      status,
      inlinePreview,
    }

    setCommands((prev) => [...prev, newCommand])
  }

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [commands])

  // Filter commands based on search term
  const filteredCommands = searchTerm
    ? commands.filter(
        (cmd) =>
          cmd.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cmd.output.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : commands

  const handleKeyDown = (e: KeyboardEvent) => {
    // Global keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "k") {
        e.preventDefault()
        setShowKeyboardShortcuts(true)
      } else if (e.key === "b") {
        e.preventDefault()
        setShowFileBrowser(!showFileBrowser)
      } else if (e.key === "\\") {
        e.preventDefault()
        setSplitView(!splitView)
      } else if (e.key === "t") {
        e.preventDefault()
        setShowThemeSelector(true)
      }
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [showFileBrowser, splitView])

  return (
    <div
      className={cn(
        "flex h-[600px] w-full max-w-6xl overflow-hidden rounded-lg border shadow-2xl",
        themeClasses[theme],
      )}
    >
      <Sidebar
        theme={theme}
        onThemeToggle={() => setShowThemeSelector(true)}
        onFileBrowserToggle={() => setShowFileBrowser(!showFileBrowser)}
        onSplitViewToggle={() => setSplitView(!splitView)}
        onKeyboardShortcutsToggle={() => setShowKeyboardShortcuts(true)}
        showFileBrowser={showFileBrowser}
        splitView={splitView}
      />

      {showFileBrowser && <FileBrowser theme={theme} onClose={() => setShowFileBrowser(false)} />}

      <div className="flex flex-1 flex-col">
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />

        {splitView ? (
          <SplitPane theme={theme}>
            <TerminalContent
              commands={filteredCommands.slice(0, Math.ceil(filteredCommands.length / 2))}
              theme={theme}
              terminalRef={terminalRef}
              showSuggestions={showSuggestions}
              setShowSuggestions={setShowSuggestions}
              addCommand={addCommand}
              commandHistory={commandHistory}
              searchTerm={searchTerm}
            />
            <TerminalContent
              commands={filteredCommands.slice(Math.ceil(filteredCommands.length / 2))}
              theme={theme}
              showSuggestions={showSuggestions}
              setShowSuggestions={setShowSuggestions}
              addCommand={addCommand}
              commandHistory={commandHistory}
              searchTerm={searchTerm}
            />
          </SplitPane>
        ) : (
          <TerminalContent
            commands={filteredCommands}
            theme={theme}
            terminalRef={terminalRef}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
            addCommand={addCommand}
            commandHistory={commandHistory}
            searchTerm={searchTerm}
          />
        )}

        <StatusBar theme={theme} searchTerm={searchTerm} onClearSearch={() => setSearchTerm("")} />
      </div>

      {showThemeSelector && (
        <ThemeSelector currentTheme={theme} onThemeChange={setTheme} onClose={() => setShowThemeSelector(false)} />
      )}

      {showKeyboardShortcuts && <KeyboardShortcuts onClose={() => setShowKeyboardShortcuts(false)} theme={theme} />}
    </div>
  )
}

interface TerminalContentProps {
  commands: CommandType[]
  theme: ThemeType
  terminalRef?: React.RefObject<HTMLDivElement | null>
  showSuggestions: boolean
  setShowSuggestions: (show: boolean) => void
  addCommand: (command: string) => void
  commandHistory: string[]
  searchTerm: string
}

function TerminalContent({
  commands,
  theme,
  terminalRef,
  showSuggestions,
  setShowSuggestions,
  addCommand,
  commandHistory,
  searchTerm,
}: TerminalContentProps) {
  return (
    <div
      ref={terminalRef}
      className={cn(
        "flex-1 overflow-y-auto p-4 font-mono text-sm scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent",
        theme === "purple" && "scrollbar-thumb-purple-800",
        theme === "ocean" && "scrollbar-thumb-blue-800",
      )}
    >
      {searchTerm ? (
        <div
          className={cn(
            "mb-4 flex items-center gap-2 rounded-md p-3",
            theme === "purple"
              ? "bg-purple-900/30 text-purple-200"
              : theme === "ocean"
                ? "bg-blue-900/30 text-blue-200"
                : "bg-gray-900/50 text-gray-300",
          )}
        >
          Showing results for: <span className="font-bold">{searchTerm}</span>
        </div>
      ) : (
        <div
          className={cn(
            "mb-4 flex items-center gap-2 rounded-md p-3",
            theme === "dark" && "bg-gray-900/50",
            theme === "darker" && "bg-gray-900/30",
            theme === "midnight" && "bg-[#161827]/50",
            theme === "purple" && "bg-purple-900/30",
            theme === "ocean" && "bg-blue-900/30",
          )}
        >
          <Command
            className={cn(
              "h-5 w-5",
              theme === "purple" && "text-purple-400",
              theme === "ocean" && "text-blue-400",
              theme !== "purple" && theme !== "ocean" && "text-purple-400",
            )}
          />
          <span
            className={cn(
              theme === "purple" && "text-purple-400",
              theme === "ocean" && "text-blue-400",
              theme !== "purple" && theme !== "ocean" && "text-purple-400",
            )}
          >
            Welcome to Warp-inspired Terminal
          </span>
        </div>
      )}

      {commands.map((cmd) => (
        <CommandBlock key={cmd.id} command={cmd} theme={theme} />
      ))}

      <div className="relative mt-2">
        <CommandInput
          onSubmit={addCommand}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
          commandHistory={commandHistory}
          theme={theme}
        />
        {showSuggestions && <CommandSuggestions onSelect={addCommand} theme={theme} />}
      </div>
    </div>
  )
}

interface StatusBarProps {
  theme: ThemeType
  searchTerm: string
  onClearSearch: () => void
}

function StatusBar({ theme, searchTerm, onClearSearch }: StatusBarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-t px-4 py-1 text-xs text-gray-400",
        theme === "dark" && "border-gray-800 bg-gray-900",
        theme === "darker" && "border-gray-800 bg-gray-900/80",
        theme === "midnight" && "border-gray-700 bg-[#161827]",
        theme === "purple" && "border-purple-900 bg-purple-900/50 text-purple-200",
        theme === "ocean" && "border-blue-900 bg-blue-900/50 text-blue-200",
      )}
    >
      <div className="flex items-center gap-4">
        <span>main</span>
        <span>utf-8</span>
        {searchTerm && (
          <span className="flex items-center gap-1">
            <span>Search: {searchTerm}</span>
            <button onClick={onClearSearch} className="rounded-sm p-0.5 hover:bg-gray-700">
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span>v1.0.0</span>
        <span>11:53 PM</span>
      </div>
    </div>
  )
}
