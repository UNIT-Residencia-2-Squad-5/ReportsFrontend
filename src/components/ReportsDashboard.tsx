"use client"

import { useState, useEffect } from "react"
import { X, Download, Search, Filter } from "lucide-react"
import { useReportsStore } from "@/stores/reportsStore"
import { useTurmasStore } from "@/stores/turmasStore"
import type { Report } from "@/types"

type ReportStatus = "pending" | "processing" | "completed" | "failed"
type ReportType = "pdf" | "excel" | "workload_excel" | "workload_pdf"

interface Toast {
  id: number
  message: string
  type: "success" | "error"
}

const inferFileExtension = (type?: string) =>
  type && (type.includes("excel") || type === "xlsx") ? "xlsx" : "pdf"

const buildSuggestedFileName = (
  turmaName: string | undefined,
  turmaId: string,
  tipoRelatorio: string,
) => {
  const sanitizedTurma = turmaName?.toLowerCase().replace(/\s+/g, "_")
  const base = sanitizedTurma ? `relatorio_${sanitizedTurma}` : `relatorio_turma_${turmaId}`
  return `${base}.${inferFileExtension(tipoRelatorio)}`
}

const ensureReportMetadata = (report: Report): Report => {
  const extension = inferFileExtension(report.tipo_relatorio)
  return {
    ...report,
    nome_arquivo: report.nome_arquivo || `relatorio_${report.id.slice(0, 8)}.${extension}`,
    created_at: report.created_at || new Date().toISOString(),
    updated_at: report.updated_at || report.created_at || new Date().toISOString(),
  }
}

const INITIAL_FORM_STATE = {
  turmaId: "",
  tipoRelatorio: "pdf" as string,
  fileName: "",
}

const createInitialFormState = () => ({ ...INITIAL_FORM_STATE })

// Utility Functions
const formatDate = (isoString: string) => {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

const getReportTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    pdf: "PDF",
    excel: "Excel (.xlsx)",
    xlsx: "Excel (.xlsx)",
    workload_excel: "Excel (Workload)",
    workload_pdf: "PDF (Workload)",
  }
  return labels[type] || type.toUpperCase()
}

const getStatusBadgeClass = (status: string) => {
  // Normalize status for class assignment
  const normalizedStatus = 
    status === 'concluido' ? 'completed' :
    status === 'processando' ? 'processing' :
    status === 'falha' ? 'failed' :
    status === 'pendente' ? 'pending' : status

  const classes: Record<string, string> = {
    processing: "badge-processing",
    completed: "badge-completed",
    failed: "badge-failed",
    pending: "badge-pending",
  }
  return classes[normalizedStatus] || "badge-pending"
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    processing: "Processando",
    processando: "Processando",
    completed: "Concluído",
    concluido: "Concluído",
    failed: "Falha",
    falha: "Falha",
    pending: "Pendente",
    pendente: "Pendente"
  }
  return labels[status] || status
}

// Main Component
export default function ReportsDashboard() {
  const { reports, isLoading, fetchReports, createReport, getDownloadUrl } = useReportsStore()
  const { turmas, fetchTurmas } = useTurmasStore()
  const [showNewReportModal, setShowNewReportModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("all")
  const [toasts, setToasts] = useState<Toast[]>([])

  // Form state
  const [formData, setFormData] = useState(createInitialFormState)

  // Load initial data
  useEffect(() => {
    fetchReports()
    fetchTurmas()
  }, [])

  // Atualiza automaticamente os relatórios em processamento
  useEffect(() => {
    const checkAndUpdateReports = async () => {
      try {
        const currentReports = useReportsStore.getState().reports
        const hasProcessingOrPending = currentReports.some(
          (r) => r.status === "processing" || r.status === "pending" || !r.status,
        )

        if (hasProcessingOrPending) {
          console.log("[ReportsRefresh] Refreshing reports list...")
          await fetchReports(1, 100)
        }
      } catch (error) {
        console.error("[ReportsRefresh] Error refreshing reports:", error)
      }
    }

    const intervalId = setInterval(checkAndUpdateReports, 10000)
    checkAndUpdateReports()

    return () => {
      console.log("[ReportsRefresh] Cleaning up reports refresh interval")
      clearInterval(intervalId)
    }
  }, [fetchReports])

  useEffect(() => {
    if (!selectedReport) return

    const needsMetadataUpdate =
      !selectedReport.nome_arquivo || !selectedReport.created_at || !selectedReport.updated_at
    const reportWithMetadata = needsMetadataUpdate
      ? ensureReportMetadata(selectedReport)
      : selectedReport

    if (needsMetadataUpdate) {
      setSelectedReport(reportWithMetadata)
    }

    if (reportWithMetadata.status === "completed" || reportWithMetadata.status === "failed") return

    console.log(`[StatusPolling] Starting status polling for report ${reportWithMetadata.id}`)
    const interval = setInterval(async () => {
      try {
        console.log(`[StatusPolling] Checking status for report ${reportWithMetadata.id}`)
        const updated = await useReportsStore.getState().getReportStatus(reportWithMetadata.id)
        const safeReport = ensureReportMetadata(updated)
        console.log(`[StatusPolling] Updated status for report ${reportWithMetadata.id}:`, safeReport.status)
        setSelectedReport(safeReport)

        if (safeReport.status === "completed" || safeReport.status === "failed") {
          console.log(`[StatusPolling] Status changed to ${safeReport.status}, refreshing reports list`)
          await fetchReports()
        }
      } catch (error) {
        console.error(`[StatusPolling] Error updating status for report ${reportWithMetadata.id}:`, error)
      }
    }, 5000)

    return () => {
      console.log(`[StatusPolling] Stopping status polling for report ${reportWithMetadata.id}`)
      clearInterval(interval)
    }
  }, [selectedReport?.id, selectedReport?.status, fetchReports])

  useEffect(() => {
    if (!formData.turmaId || !formData.tipoRelatorio) return

    setFormData((prev) => {
      if (!prev.fileName) {
        const turma = turmas.find((t) => t.id === formData.turmaId)
        return {
          ...prev,
          fileName: buildSuggestedFileName(turma?.nome, formData.turmaId, formData.tipoRelatorio),
        }
      }
      return prev
    })
  }, [formData.turmaId, formData.tipoRelatorio, turmas])

  const createNewReport = async () => {
    if (!formData.turmaId || !formData.tipoRelatorio) {
      addToast("Preencha todos os campos obrigatórios", "error")
      return
    }

    try {
      const reportId = await createReport(formData.turmaId, formData.tipoRelatorio, formData.fileName || undefined)
      addToast("Relatório criado, processando em segundo plano", "success")
      setShowNewReportModal(false)
      setFormData(createInitialFormState())
      await fetchReports()
    } catch (error) {
      addToast(String(error) || "Falha ao gerar relatório", "error")
    }
  }

  const handleDownload = async (reportId: string) => {
    try {
      console.log('Iniciando download do relatório:', reportId);
      
      // Get the current report
      const report = reports.find(r => r.id === reportId);
      if (!report) {
        throw new Error('Relatório não encontrado');
      }
      
      // If report is not ready, show message and return
      if (report.status !== 'completed') {
        addToast('O relatório ainda não está pronto para download', 'error');
        return;
      }
      
      // Get the download URL
      const downloadUrl = await getDownloadUrl(reportId);
      
      if (!downloadUrl) {
        throw new Error('URL de download não disponível');
      }
      
      // Open the download URL in a new tab
      window.open(downloadUrl, '_blank');
      
    } catch (error) {
      console.error('Erro ao processar download:', error);
      addToast('Ocorreu um erro ao processar o download', 'error');
    }
  }

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev: Toast[]) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev: Toast[]) => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const filteredReports = (reports || []).filter((report: Report) => {
    const search = searchTerm.toLowerCase();
    const reportType = getReportTypeLabel(report.tipo_relatorio).toLowerCase();
    const fileName = report.nome_arquivo?.toLowerCase() || '';

    const matchesSearch = !search || 
      fileName.includes(search) ||
      reportType.includes(search);
      
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;

    return matchesSearch && matchesStatus;
  })

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#000E33",
        color: "#fff",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: "32px 24px",
      }}
    >
      <style>{`
        .card-glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 24px;
          margin-bottom: 24px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: transparent;
          color: #fff;
          border: 2px solid rgba(255, 255, 255, 0.3);
          padding: 10px 22px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          border-color: rgba(255, 255, 255, 0.6);
          background: rgba(255, 255, 255, 0.05);
        }

        .badge-processing {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          display: inline-block;
        }

        .badge-completed {
          background: rgba(34, 197, 94, 0.2);
          color: #4ade80;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          display: inline-block;
        }

        .badge-failed {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          display: inline-block;
        }

        .badge-pending {
          background: rgba(156, 163, 175, 0.2);
          color: #d1d5db;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          display: inline-block;
        }

        .input-field {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px 16px;
          color: #fff;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .input-field:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 24px;
          overflow-y: auto;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: rgba(0, 14, 51, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 32px;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          z-index: 1001;
          transform: translateZ(0);
          -webkit-backface-visibility: hidden;
          -webkit-transform: translateZ(0);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 2000;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .toast {
          padding: 16px 20px;
          border-radius: 8px;
          backdrop-filter: blur(10px);
          font-weight: 500;
          animation: slideIn 0.3s ease;
          min-width: 300px;
        }

        .toast-success {
          background: rgba(34, 197, 94, 0.9);
          color: white;
        }

        .toast-error {
          background: rgba(239, 68, 68, 0.9);
          color: white;
        }

        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          text-align: left;
          padding: 16px;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.7);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        td {
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        tr:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .icon-button {
          background: transparent;
          border: none;
          color: #60a5fa;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .icon-button:hover {
          background: rgba(96, 165, 250, 0.1);
        }

        .icon-button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23fff' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 16px center;
          padding-right: 40px;
        }

        select,
        select option {
          background-color: #0a1a44;
          color: #fff;
        }

        select option {
          padding: 12px 16px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 12px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          animation: progress 2s ease-in-out infinite;
        }

        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            marginBottom: "32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: "700", margin: "0 0 8px 0" }}>Meus Relatórios</h1>
            <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: 0 }}>Gerencie e baixe seus relatórios</p>
          </div>
          <button className="btn-primary" onClick={() => setShowNewReportModal(true)}>
            + Novo Relatório
          </button>
        </div>

        {/* Search and Filters */}
        <div className="card-glass" style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ flex: "1", minWidth: "250px", position: "relative" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255, 255, 255, 0.4)",
              }}
            />
            <input
              type="text"
              placeholder="Buscar por turma ou tipo..."
              className="input-field"
              style={{ paddingLeft: "48px" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ minWidth: "200px", position: "relative" }}>
            <Filter
              size={18}
              style={{
                position: "absolute",
                left: "16px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255, 255, 255, 0.4)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <select
              className="input-field"
              style={{ paddingLeft: "48px" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="processing">Processando</option>
              <option value="completed">Concluído</option>
              <option value="failed">Falhou</option>
            </select>
          </div>
        </div>

        {/* Reports List */}
        <section className="card-glass">
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "48px", color: "rgba(255, 255, 255, 0.5)" }}>
              Carregando relatórios...
            </div>
          ) : filteredReports.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px", color: "rgba(255, 255, 255, 0.5)" }}>
              Nenhum relatório encontrado
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Nome do Relatório</th>
                    <th>Data de Solicitação</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <div style={{ fontWeight: "600" }}>
                          {report.nome_arquivo || `Relatório ${report.id.slice(0, 8)}`}
                        </div>
                        <div style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.5)", marginTop: "4px" }}>
                          {getReportTypeLabel(report.tipo_relatorio)}
                        </div>
                      </td>
                      <td style={{ color: "rgba(255, 255, 255, 0.7)" }}>{formatDate(report.created_at)}</td>
                      <td>
                        <span className={getStatusBadgeClass(report.status)}>{getStatusLabel(report.status)}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            className="icon-button"
                            onClick={() => setSelectedReport(report)}
                            title="Ver Detalhes"
                          >
                            Ver Detalhes
                          </button>
                          <button
                            className="icon-button"
                            onClick={async (e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              try {
                                console.log(`[Download] Attempting to download report ${report.id}`)
                                
                                // Tenta obter o status mais recente
                                let reportToDownload = report
                                try {
                                  console.log(`[Download] Fetching latest status for report ${report.id}`)
                                  const updated = await useReportsStore.getState().getReportStatus(report.id)
                                  reportToDownload = updated
                                  console.log(`[Download] Latest status for report ${report.id}:`, updated.status)
                                } catch (error) {
                                  console.warn(`[Download] Could not update status for report ${report.id}:`, error)
                                  // Continua com os dados existentes se não conseguir atualizar o status
                                }

                                if (reportToDownload.status === 'completed') {
                                  console.log(`[Download] Report ${report.id} is ready, starting download`)
                                  await handleDownload(report.id)
                                } else {
                                  const statusMessage = reportToDownload.status 
                                    ? `O relatório ainda não está pronto para download (Status: ${reportToDownload.status})`
                                    : 'O status do relatório não está disponível'
                                  console.log(`[Download] ${statusMessage}`)
                                  addToast(statusMessage, 'error')
                                }
                              } catch (error) {
                                console.error(`[Download] Error downloading report ${report.id}:`, error)
                                addToast('Erro ao tentar baixar o relatório. Por favor, tente novamente.', 'error')
                              }
                            }}
                            disabled={!report.status}
                            title={
                              !report.status ? 'Aguardando processamento...' :
                              report.status === 'completed' ? 'Baixar' :
                              report.status === 'processing' ? 'Processando...' :
                              report.status === 'pending' ? 'Aguardando processamento...' :
                              report.status === 'failed' ? 'Falha ao gerar' :
                              'Aguardando processamento...'
                            }
                            style={{
                              opacity: report.status === 'completed' ? 1 : 0.6,
                              cursor: report.status === 'completed' ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '8px',
                              borderRadius: '4px',
                              background: 'transparent',
                              border: 'none',
                              color: report.status === 'failed' ? '#ef4444' : 'inherit',
                              transition: 'opacity 0.2s ease'
                            }}
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* New Report Modal */}
        {showNewReportModal && (
          <div className="modal-overlay" onClick={() => setShowNewReportModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}
              >
                <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700" }}>Novo Relatório</h2>
                <button className="icon-button" onClick={() => setShowNewReportModal(false)}>
                  <X size={24} />
                </button>
              </div>

              <form style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      marginBottom: "8px",
                      color: "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    Turma
                  </label>
                  <select
                    className="input-field"
                    value={formData.turmaId}
                    onChange={(e) => setFormData({ ...formData, turmaId: e.target.value })}
                    required
                  >
                    <option value="">Selecione uma turma...</option>
                    {turmas.map((turma) => (
                      <option key={turma.id} value={turma.id}>
                        {turma.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      marginBottom: "8px",
                      color: "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    Tipo de Relatório
                  </label>
                  <select
                    className="input-field"
                    value={formData.tipoRelatorio}
                    onChange={(e) => setFormData({ ...formData, tipoRelatorio: e.target.value })}
                  >
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel (.xlsx)</option>
                    <option value="workload_pdf">PDF (Workload)</option>
                    <option value="workload_excel">Excel (Workload)</option>
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      marginBottom: "8px",
                      color: "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    Nome do Arquivo
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.fileName}
                    onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                    placeholder="relatorio_turma.pdf"
                  />
                  <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.5)", marginTop: "6px" }}>
                    Sugestão gerada automaticamente
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                  <button type="button" className="btn-primary" onClick={createNewReport} style={{ flex: 1 }}>
                    Gerar Relatório
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowNewReportModal(false)}
                    style={{ flex: 1 }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Report Details Modal */}
        {selectedReport && (
          <div className="modal-overlay" onClick={() => setSelectedReport(null)} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '24px',
            overflow: 'auto'
          }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
              backgroundColor: 'rgba(0, 14, 51, 0.95)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              zIndex: 1001,
              transform: 'translateZ(0)',
              WebkitBackfaceVisibility: 'hidden',
              WebkitTransform: 'translateZ(0)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
            }}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}
              >
                <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700" }}>Detalhes do Relatório</h2>
                <button className="icon-button" onClick={() => setSelectedReport(null)}>
                  <X size={24} />
                </button>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
                  {selectedReport.nome_arquivo || selectedReport.turma_nome || `Relatório ${selectedReport.id.slice(0, 8)}`}
                </h3>
                <p style={{ color: "rgba(255, 255, 255, 0.6)", margin: 0 }}>
                  {selectedReport.turma_nome || getReportTypeLabel(selectedReport.tipo_relatorio)}
                </p>
              </div>

              <div className="card-glass" style={{ padding: "20px" }}>
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.5)", marginBottom: "4px" }}>Status</div>
                  <span className={getStatusBadgeClass(selectedReport.status)}>
                    {getStatusLabel(selectedReport.status)}
                  </span>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.5)", marginBottom: "4px" }}>
                    Data de Criação
                  </div>
                  <div>{formatDate(selectedReport.created_at)}</div>
                </div>

                {selectedReport.status === "completed" && (
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.5)", marginBottom: "4px" }}>
                      Data de Conclusão
                    </div>
                    <div>{formatDate(selectedReport.updated_at)}</div>
                  </div>
                )}

                {selectedReport.status === "processing" && (
                  <div>
                    <div style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.5)", marginBottom: "8px" }}>
                      Processando...
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                {selectedReport.status === "completed" && (
                  <button className="btn-primary" onClick={() => handleDownload(selectedReport.id)} style={{ flex: 1 }}>
                    <Download size={18} style={{ marginRight: "8px", verticalAlign: "middle" }} />
                    Baixar Relatório
                  </button>
                )}
                {selectedReport.status === "failed" && (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setFormData({
                        turmaId: selectedReport.turma_id,
                        tipoRelatorio: selectedReport.tipo_relatorio,
                        fileName: "",
                      })
                      setSelectedReport(null)
                      setShowNewReportModal(true)
                    }}
                    style={{ flex: 1 }}
                  >
                    Tentar Novamente
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        <div className="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              {toast.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
