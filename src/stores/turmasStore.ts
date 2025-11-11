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
      set({ turmas: response.data.data, loading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.error || "Erro ao carregar turmas",
        loading: false,
      })
    }
  },

  getTurmaById: (id: string) => {
    const { turmas } = get()
    return turmas.find((t) => t.id === id)
  },
}))
