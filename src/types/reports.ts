export interface ReportRequest {
  turmaId: string
  tipo: "csv" | "pdf" | "xlsx"
  parametros?: Record<string, any>
}

export interface ReportStatus {
  id: string
  status: "pendente" | "processando" | "concluido" | "falhou"
  filename?: string
  geradoEm?: string
  erro?: string
}

export interface ReportDownload {
  downloadUrl: string
  expiresIn: number
}
