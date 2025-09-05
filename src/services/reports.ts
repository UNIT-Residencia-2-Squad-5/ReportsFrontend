import api from "./api"
import type { ReportRequest, ReportStatus, ReportDownload } from "../types/reports"

export const reportsService = {
  // POST /api/reports - Criar nova solicitação
  createReport: async (data: ReportRequest): Promise<{ id: string }> => {
    const response = await api.post("/api/reports", data)
    return response.data
  },

  // GET /api/reports/:id/status - Consultar status
  getReportStatus: async (id: string): Promise<ReportStatus> => {
    const response = await api.get(`/api/reports/${id}/status`)
    return response.data
  },

  // GET /api/reports/:id/download - URL de download
  getDownloadUrl: async (id: string, ttl?: number): Promise<ReportDownload> => {
    const params = ttl ? { ttl } : {}
    const response = await api.get(`/api/reports/${id}/download`, { params })
    return response.data
  },
}
