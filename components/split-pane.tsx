import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { ThemeType } from "./terminal"

interface SplitPaneProps {
  children: ReactNode[]
  theme: ThemeType
}

export default function SplitPane({ children, theme }: SplitPaneProps) {
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

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-hidden">{children[0]}</div>
      <div className={cn("border-l", getBorderColor())}></div>
      <div className="flex-1 overflow-hidden">{children[1]}</div>
    </div>
  )
}
