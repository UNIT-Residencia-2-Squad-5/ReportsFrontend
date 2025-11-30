"use client"

import type React from "react"
import { useState, useEffect } from "react"
import ReportsDashboard from "@/components/ReportsDashboard"
import { useReportsStore } from "@/stores/reportsStore"
import { useTurmasStore } from "@/stores/turmasStore"
import { Loader, Check, X, Clock } from "lucide-react"

export default function ReportsPage() {
  const { createReport, getReportStatus, fetchReports, reports, isLoading, error, clearError } = useReportsStore()
  const { turmas, fetchTurmas } = useTurmasStore()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ turmaId: "", tipoRelatorio: "pdf" })
  const [formError, setFormError] = useState("")
  const [pollIntervals, setPollIntervals] = useState<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    fetchTurmas()
    fetchReports()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")

    if (!formData.turmaId) {
      setFormError("Selecione uma turma")
      return
    }

    try {
      const reportId = await createReport(formData.turmaId, formData.tipoRelatorio)
      setFormData({ turmaId: "", tipoRelatorio: "pdf" })
      setShowForm(false)
      fetchReports()

      // Start polling
      const interval = setInterval(async () => {
        const updated = await getReportStatus(reportId)
        if (updated.status === "completed" || updated.status === "failed") {
          clearInterval(interval)
          setPollIntervals((prev) => {
            const newIntervals = { ...prev }
            delete newIntervals[reportId]
            return newIntervals
          })
          fetchReports()
        }
      }, 2000)

      setPollIntervals((prev) => ({ ...prev, [reportId]: interval }))
    } catch (err) {
      setFormError(String(err))
    }
  }

  const handleDownload = async (reportId: string) => {
    try {
      const downloadUrl = await useReportsStore.getState().getDownloadUrl(reportId)
      window.open(downloadUrl, "_blank")
    } catch (err) {
      console.error("Download error:", err)
    }
  }

  const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    pending: { color: "bg-slate-600", icon: Clock, label: "Pendente" },
    processing: { color: "bg-blue-600", icon: Loader, label: "Processando" },
    completed: { color: "bg-green-600", icon: Check, label: "Concluído" },
    failed: { color: "bg-red-600", icon: X, label: "Falhou" },
  }

  return <ReportsDashboard />
}
