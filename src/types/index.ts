// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// User Types
export interface User {
  id: string
  name: string
  email: string
  created_at: string
  updated_at: string
}

export interface CreateUserRequest {
  name: string
  email: string
  password: string
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  password?: string
}

export interface ListUsersResponse {
  total: number
  page: number
  pageSize: number
  data: User[]
}

// Turma Types
export interface Turma {
  id: string
  nome: string
  descricao?: string
  created_at: string
  updated_at: string
}

// Reports Types
export interface Report {
  id: string
  turma_id: string
  tipo_relatorio: string
  status: "pending" | "processing" | "completed" | "failed"
  created_at: string
  updated_at: string
  file_key?: string
  nome_arquivo?: string
  error_message?: string
  turma_nome?: string // For dashboard display
}

export interface CreateReportRequest {
  turmaId: string
  tipoRelatorio: string
}

export interface ReportStatus {
  id: string
  status: "pending" | "processing" | "completed" | "failed"
  message?: string
}

export interface DownloadUrl {
  downloadUrl: string
}

export interface ListTurmasResponse {
  total: number
  page: number
  pageSize: number
  data: Turma[]
}

export interface ListReportsResponse {
  total: number
  page: number
  pageSize: number
  data: Report[]
}
