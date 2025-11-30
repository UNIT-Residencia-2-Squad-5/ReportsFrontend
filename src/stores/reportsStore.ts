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

  createReport: (turmaId: string, tipoRelatorio: string, fileName?: string) => Promise<string>
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

  createReport: async (turmaId, tipoRelatorio, fileName) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.post<any>("/reports", {
        turmaId,
        tipoRelatorio,
        nomeArquivo: fileName,
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
      console.log(`[getReportStatus] Fetching status for report ${id}`)
      const response = await apiClient.get<any>(`/reports/${id}`)
      const reportData = response.data.data || response.data
      
      // Normalize status values
      if (reportData.status === 'concluido') {
        reportData.status = 'completed'
      } else if (reportData.status === 'processando') {
        reportData.status = 'processing'
      } else if (reportData.status === 'falha') {
        reportData.status = 'failed'
      }
      
      console.log(`[getReportStatus] Status for report ${id}:`, reportData.status)
      
      // Update the report in the store
      set(state => {
        const updatedReports = state.reports.map(report => 
          report.id === id ? { ...report, ...reportData } : report
        )
        return { reports: updatedReports }
      })
      
      return reportData
    } catch (error: any) {
      console.error(`[getReportStatus] Error for report ${id}:`, error)
      const errorMsg = error.response?.data?.error || error.message || "Erro ao buscar status do relatório"
      throw new Error(errorMsg)
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
    console.log('[Reports] Iniciando busca de relatórios...')
    set({ isLoading: true, error: null })
    try {
      console.log('[Reports] Fazendo requisição para /api/reports...')
      const response = await apiClient.get<any>("/reports", {
        params: { page, pageSize },
      })
      
      console.log('[Reports] Resposta recebida:', response)
      
      let reportsData: Report[] = []
      let total = 0
      
      // Verifica se a resposta tem a estrutura { success: true, data: { reports: [...] } }
      if (response.data && response.data.success === true && response.data.data) {
        const responseData = response.data.data
        
        // Verifica se os relatórios estão em responseData.reports
        if (responseData.reports && Array.isArray(responseData.reports)) {
          // Mapeia os dados para o formato esperado pelo frontend
          reportsData = responseData.reports.map((report: any) => {
            // Normaliza os status
            let status = report.status
            if (status === 'concluido') status = 'completed'
            else if (status === 'processando') status = 'processing'
            else if (status === 'falha') status = 'failed'
            
            return {
              id: report.id?.toString?.() || String(report.id),
              turma_id: report.turma_id,
              tipo_relatorio: report.tipo_relatorio,
              status: status,
              created_at: report.created_at || new Date().toISOString(),
              updated_at: report.updated_at || report.created_at || new Date().toISOString(),
              nome_arquivo: report.nome_arquivo || report.nomeArquivo || `relatorio_${report.id}.${report.tipo_relatorio === 'excel' ? 'xlsx' : 'pdf'}`,
              turma_nome: report.turma_nome || report.turmaNome || report.turma?.nome,
              file_key: report.file_key || report.fileKey,
            } as Report
          })
          total = responseData.total || reportsData.length
          console.log('[Reports] Relatórios processados:', reportsData)
        }
      }
      
      set({
        reports: reportsData,
        total,
        page,
        pageSize,
        isLoading: false,
      })
      
      console.log('[Reports] Estado atualizado com sucesso')
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
