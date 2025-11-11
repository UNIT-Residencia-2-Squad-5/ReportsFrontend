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
      const reportId = response.data.data.id
      set({ isLoading: false })
      return reportId
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || "Erro ao criar relatório"
      set({ error: errorMsg, isLoading: false })
      throw errorMsg
    }
  },

  getReportStatus: async (id) => {
    try {
      const response = await apiClient.get<any>(`/reports/${id}`)
      return response.data.data
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Erro ao buscar status do relatório"
      throw errorMsg
    }
  },

  getDownloadUrl: async (id) => {
    try {
      const response = await apiClient.get<any>(`/reports/${id}/download`)
      return response.data.data.downloadUrl
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Erro ao obter link de download"
      throw errorMsg
    }
  },

  fetchReports: async (page = 1, pageSize = 20) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.get<ListReportsResponse>("/reports", {
        params: { page, pageSize },
      })
      set({
        reports: response.data.data,
        total: response.data.total,
        page: response.data.page,
        pageSize: response.data.pageSize,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Erro ao carregar relatórios",
        isLoading: false,
      })
    }
  },

  selectReport: (report) => set({ selectedReport: report }),
  clearError: () => set({ error: null }),
}))
