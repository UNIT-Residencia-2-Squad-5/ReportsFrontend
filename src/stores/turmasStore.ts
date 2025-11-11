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
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get<ListTurmasResponse>("/turmas", {
        params: { page, pageSize },
      })
      const turmasData = response.data.data || response.data
      console.log("[v0] Turmas Store - Response structure:", response.data)
      console.log("[v0] Turmas Store - Turmas data:", turmasData)
      set({ turmas: Array.isArray(turmasData) ? turmasData : [], loading: false })
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || error.response?.data?.error || error.message || "Erro ao carregar turmas"
      console.error("[v0] Turmas Store Error:", errorMsg)
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
