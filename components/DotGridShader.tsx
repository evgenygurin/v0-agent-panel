"use client"
import { DotGrid } from "@paper-design/shaders-react"

type DotGridShaderProps = React.ComponentProps<typeof DotGrid>

export default function DotGridShader(props: DotGridShaderProps) {
  return (
    <DotGrid
      colorFill="#2a2a2a"
      colorStroke="#2a2a2a"
      colorBack="#0a0a0a"
      size={0.6}
      gapY={24}
      gapX={24}
      strokeWidth={0.2}
      sizeRange={0.05}
      opacityRange={0.08}
      shape="circle"
      {...props}
      style={{
        width: "100%",
        height: "100%",
        ...(props?.style || {}),
        backgroundColor: "#0a0a0a", // Must come AFTER spread to override any transparent values
      }}
    />
  )
}
