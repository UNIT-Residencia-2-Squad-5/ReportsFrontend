import { create } from "zustand"
import type { Report, ListReportsResponse } from "@/types"
import { apiClient } from "@/lib/api"

const normalizeStatus = (status?: string): Report["status"] => {
  const normalized = status?.toLowerCase()

  if (normalized === "concluido" || normalized === "completed") {
    return "completed"
  }

  if (normalized === "falha" || normalized === "failed" || normalized === "erro" || normalized === "error") {
    return "failed"
  }

  // Covers "processando", "processing", "pendente", "pending" and undefined
  return "processing"
}

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
  pageSize: 100,

  createReport: async (turmaId, tipoRelatorio, fileName) => {
    set({ isLoading: true, error: null })
    try {
      console.log('[REPORT STORE] Enviando requisição para criar relatório:', {
        turmaId,
        tipoRelatorio,
        fileName,
        nomeArquivo: fileName // Mostrando que estamos enviando o nome do arquivo
      });
      
      const response = await apiClient.post<any>("/reports", {
        turmaId,
        tipoRelatorio,
        nomeArquivo: fileName,
      });
      
      console.log('[REPORT STORE] Resposta da API:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });
      
      const reportId = (response.data.data?.id || response.data.id)?.toString();
      console.log('[REPORT STORE] ID do relatório criado:', reportId);

      const now = new Date().toISOString()
      const inferredExtension = tipoRelatorio.includes("excel") ? "xlsx" : "pdf"
      const placeholderReport: Report = {
        id: reportId,
        turma_id: turmaId,
        tipo_relatorio: tipoRelatorio,
        status: "processing",
        created_at: now,
        updated_at: now,
        data_solicitacao: now,
        nome_arquivo: fileName || `relatorio_${reportId?.slice(0, 8) || turmaId}.${inferredExtension}`,
      }

      set((state) => {
        // Adiciona o novo relatório e remove duplicatas
        const updatedReports = [
          ...state.reports.filter((report) => report.id !== reportId),
          placeholderReport
        ].sort((a, b) => {
          // Converter para timestamp considerando o fuso horário local
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA; // Ordem decrescente (mais recente primeiro)
        });
        
        console.log('[createReport] Relatórios ordenados:', updatedReports.map(r => ({
          id: r.id,
          created_at: r.created_at,
          tipo_relatorio: r.tipo_relatorio
        })));
        
        return {
          isLoading: false,
          reports: updatedReports,
        };
      })

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
      reportData.status = normalizeStatus(reportData.status)
      
      console.log(`[getReportStatus] Status for report ${id}:`, reportData.status)
      
      // Update the report in the store and maintain sorting
      set(state => {
        const updatedReports = state.reports.map(report => 
          report.id === id ? { ...report, ...reportData } : report
        ).sort((a, b) => {
          // Converter para timestamp considerando o fuso horário local
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA; // Ordem decrescente (mais recente primeiro)
        });
        
        console.log(`[getReportStatus] Relatórios ordenados para ${id}:`, updatedReports.map(r => ({
          id: r.id,
          created_at: r.created_at,
          tipo_relatorio: r.tipo_relatorio,
          status: r.status
        })));
        
        return { reports: updatedReports };
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

  fetchReports: async (page = 1, pageSize = 100) => {
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
            const status = normalizeStatus(report.status)

            return {
              id: report.id?.toString?.() || String(report.id),
              turma_id: report.turma_id,
              tipo_relatorio: report.tipo_relatorio,
              status,
              created_at: report.created_at || report.data_solicitacao || null,
              updated_at: report.updated_at || report.created_at || report.data_solicitacao || null,
              nome_arquivo: report.nome_arquivo || report.nomeArquivo || `relatorio_${report.id}.${report.tipo_relatorio === 'excel' ? 'xlsx' : 'pdf'}`,
              turma_nome: report.turma_nome || report.turmaNome || report.turma?.nome,
              file_key: report.file_key || report.fileKey,
            } as Report
          })
          total = responseData.total || reportsData.length
          reportsData = reportsData.sort((a, b) => {
            // Converter para timestamp considerando o fuso horário local
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA; // Ordem decrescente (mais recente primeiro)
          })
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
