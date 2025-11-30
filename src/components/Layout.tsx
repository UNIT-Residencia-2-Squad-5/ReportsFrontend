"use client"

import type { ReactNode } from "react"

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-slate-100">
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 px-4">
        {children}
      </main>
    </div>
  )
}
