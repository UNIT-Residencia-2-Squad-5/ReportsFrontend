import { create } from "zustand"
import { apiClient } from "@/lib/api"
import type { Turma, ListTurmasResponse } from "@/types"

interface TurmasStore {
  turmas: Turma[]
  loading: boolean
  error: string | null
  fetchTurmas: (page?: number, pageSize?: number) => Promise<void>
  getTurmaById: (id: string) => Turma | undefined
}

export const useTurmasStore = create<TurmasStore>((set, get) => ({
  turmas: [],
  loading: false,
  error: null,

  fetchTurmas: async (page = 1, pageSize = 50) => {
    console.log("[Turmas] Iniciando busca por turmas...")
    set({ loading: true, error: null })
    try {
      console.log("[Turmas] Fazendo requisição para /api/turmas...")
      const response = await apiClient.get<ListTurmasResponse>("/turmas", {
        params: { page, pageSize },
      })
      console.log("[Turmas] Resposta recebida:", response)
      
      // Verifica se a resposta tem a estrutura esperada
      let turmasData = response.data
      
      // Se a resposta tiver uma propriedade 'data' e ela for um array, usamos ela
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        const responseData = response.data as any
        if (Array.isArray(responseData.data?.items)) {
          turmasData = responseData.data.items
        } else if (Array.isArray(responseData.data)) {
          turmasData = responseData.data
        }
      }
      
      console.log("[Turmas] Dados processados:", turmasData)
      
      // Garante que turmasData é um array antes de definir no estado
      const turmasArray = Array.isArray(turmasData) ? turmasData : []
      console.log("[Turmas] Turmas a serem salvas:", turmasArray)
      
      set({ 
        turmas: turmasArray,
        loading: false 
      })
      
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        "Erro ao carregar turmas"
      
      console.error("[Turmas] Erro na requisição:", {
        message: errorMsg,
        error: error,
        response: error.response?.data
      })
      
      set({
        error: errorMsg,
        loading: false,
      })
    }
  },

  getTurmaById: (id: string) => {
    const { turmas } = get()
    return turmas.find((t) => t.id === id)
  },
}))
