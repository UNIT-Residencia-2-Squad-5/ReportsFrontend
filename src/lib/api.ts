import axios, { type AxiosInstance } from "axios"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api"

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error("API Error:", error.response?.data || error.message)
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
