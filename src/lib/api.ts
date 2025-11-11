import axios, { type AxiosInstance } from "axios"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api"
console.log("[v0] API Base URL:", BASE_URL)

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    })

    this.client.interceptors.request.use(
      (config) => {
        console.log("[v0] API Request:", {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params,
          data: config.data,
        })
        return config
      },
      (error) => {
        console.error("[v0] Request Error:", error)
        return Promise.reject(error)
      },
    )

    this.client.interceptors.response.use(
      (response) => {
        console.log("[v0] API Response:", {
          status: response.status,
          url: response.config.url,
          data: response.data,
        })
        return response
      },
      (error) => {
        console.error("[v0] API Error:", {
          url: error.config?.url,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data || error.message,
          message: error.message,
        })
        return Promise.reject(error)
      },
    )
  }

  get<T>(url: string, config?: any) {
    return this.client.get<T>(url, config)
  }

  post<T>(url: string, data?: any, config?: any) {
    return this.client.post<T>(url, data, config)
  }

  patch<T>(url: string, data?: any, config?: any) {
    return this.client.patch<T>(url, data, config)
  }

  delete<T>(url: string, config?: any) {
    return this.client.delete<T>(url, config)
  }
}

export const apiClient = new ApiClient()