"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Button from "@/components/Button"
import Card from "@/components/Card"
import { useReportsStore } from "@/stores/reportsStore"
import { useTurmasStore } from "@/stores/turmasStore"
import { Download, Loader, Check, X, Clock } from "lucide-react"

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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white">Relatórios</h1>
          <p className="text-slate-400 mt-2">Geração e gerenciamento de relatórios em PDF e Excel</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant="primary" className="h-fit">
          {showForm ? "Cancelar" : "+ Novo Relatório"}
        </Button>
      </div>

      {showForm && (
        <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent">
          <h2 className="text-2xl font-bold mb-6 text-white">Gerar Novo Relatório</h2>
          {(formError || error) && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-center justify-between">
              <span>{formError || error}</span>
              <button
                onClick={() => {
                  setFormError("")
                  clearError()
                }}
                className="hover:text-red-200"
              >
                ✕
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Turma</label>
              <select
                value={formData.turmaId}
                onChange={(e) => setFormData({ ...formData, turmaId: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="">Selecione uma turma...</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Formato de Saída</label>
              <select
                value={formData.tipoRelatorio}
                onChange={(e) => setFormData({ ...formData, tipoRelatorio: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="pdf">PDF</option>
                <option value="xlsx">Excel (XLSX)</option>
              </select>
            </div>

            <div className="flex gap-3">
              <Button type="submit" variant="primary" isLoading={isLoading} className="flex-1">
                {isLoading ? "Gerando..." : "Gerar Relatório"}
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Histórico de Relatórios</h2>
        {reports.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {reports.map((report) => {
              const config = statusConfig[report.status]
              const StatusIcon = config.icon
              return (
                <Card
                  key={report.id}
                  className="flex items-center justify-between hover:bg-slate-700/70 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 ${config.color} rounded-lg flex items-center justify-center`}>
                        {report.status === "processing" ? (
                          <Loader className="w-5 h-5 text-white animate-spin" />
                        ) : (
                          <StatusIcon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-white">Relatório {report.tipo_relatorio.toUpperCase()}</p>
                        <p className="text-sm text-slate-400">ID: {report.id}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      Criado em: {new Date(report.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${config.color}`}>
                      {config.label}
                    </span>
                    {report.status === "completed" && (
                      <Button onClick={() => handleDownload(report.id)} variant="primary" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
            <p className="text-slate-400">Nenhum relatório gerado ainda</p>
            <p className="text-slate-500 text-sm mt-1">Clique em "Novo Relatório" para começar</p>
          </Card>
        )}
      </div>
    </div>
  )
}

import { FileText } from "lucide-react"
