"use client"

import type React from "react"

interface InputProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  error?: string
  className?: string
  label?: string
  required?: boolean
}

export default function Input({
  type = "text",
  placeholder,
  value,
  onChange,
  disabled = false,
  error,
  className = "",
  label,
  required = false,
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-2.5 bg-slate-700/50 border ${
          error ? "border-red-500" : "border-slate-600"
        } rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${className}`}
      />
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
    </div>
  )
}
