import type { ReactNode } from "react"

interface CardProps {
  children: ReactNode
  className?: string
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 shadow-lg shadow-black/20 ${className}`}
    >
      {children}
    </div>
  )
}
