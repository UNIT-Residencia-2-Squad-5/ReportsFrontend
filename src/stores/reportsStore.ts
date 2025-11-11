import { create } from "zustand"
import type { Report, ListReportsResponse } from "@/types"
import { apiClient } from "@/lib/api"

interface ReportsState {
  reports: Report[]
  selectedReport: Report | null
  isLoading: boolean
  error: string | null
  total: number
  page: number
  pageSize: number

  createReport: (turmaId: string, tipoRelatorio: string) => Promise<string>
  getReportStatus: (id: string) => Promise<Report>
  getDownloadUrl: (id: string) => Promise<string>
  fetchReports: (page?: number, pageSize?: number) => Promise<void>
  selectReport: (report: Report | null) => void
  clearError: () => void
}

export const useReportsStore = create<ReportsState>((set) => ({
  reports: [],
  selectedReport: null,
  isLoading: false,
  error: null,
  total: 0,
  page: 1,
  pageSize: 20,

  createReport: async (turmaId, tipoRelatorio) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.post<any>("/reports", {
        turmaId,
        tipoRelatorio,
      })
      const reportId = response.data.data?.id || response.data.id
      set({ isLoading: false })
      console.log("[v0] Report created successfully:", reportId)
      return reportId
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Erro ao criar relatório"
      console.error("[v0] Report creation error:", errorMsg)
      set({ error: errorMsg, isLoading: false })
      throw errorMsg
    }
  },

  getReportStatus: async (id) => {
    try {
      const response = await apiClient.get<any>(`/reports/${id}`)
      const reportData = response.data.data || response.data
      console.log("[v0] Report status:", reportData.status)
      return reportData
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Erro ao buscar status do relatório"
      console.error("[v0] Status check error:", errorMsg)
      throw errorMsg
    }
  },

  getDownloadUrl: async (id) => {
    try {
      const response = await apiClient.get<any>(`/reports/${id}/download`)
      const downloadUrl = response.data.data?.downloadUrl || response.data.downloadUrl
      console.log("[v0] Download URL obtained:", downloadUrl)
      return downloadUrl
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Erro ao obter link de download"
      console.error("[v0] Download error:", errorMsg)
      throw errorMsg
    }
  },

  fetchReports: async (page = 1, pageSize = 20) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.get<ListReportsResponse>("/reports", {
        params: { page, pageSize },
      })
      const reportsData = response.data.data || response.data
      console.log("[v0] Reports Store - Response structure:", response.data)
      console.log("[v0] Reports Store - Reports data:", reportsData)
      set({
        reports: Array.isArray(reportsData) ? reportsData : [],
        total: response.data.total || 0,
        page: response.data.page || 1,
        pageSize: response.data.pageSize || 20,
        isLoading: false,
      })
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Erro ao carregar relatórios"
      console.error("[v0] Fetch reports error:", errorMsg)
      set({
        error: errorMsg,
        isLoading: false,
      })
    }
  },

  selectReport: (report) => set({ selectedReport: report }),
  clearError: () => set({ error: null }),
}))
