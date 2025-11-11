"use client"

import type { ReactNode } from "react"

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  type?: "button" | "submit" | "reset"
  variant?: "primary" | "secondary" | "destructive" | "outline"
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  className?: string
  isLoading?: boolean
}

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  isLoading = false,
}: ButtonProps) {
  const baseClasses = "font-medium rounded-lg transition-colors duration-200 inline-flex items-center justify-center"

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400",
    secondary: "bg-gray-700 text-white hover:bg-gray-600 disabled:bg-gray-500",
    destructive: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400",
    outline: "border border-gray-600 text-gray-100 hover:bg-gray-800 disabled:opacity-50",
  }

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
        disabled || isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      {isLoading && <span className="animate-spin mr-2">⚙️</span>}
      {children}
    </button>
  )
}
