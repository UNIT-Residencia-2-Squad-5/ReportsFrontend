"use client"

import { useState, useCallback } from "react"
import { reportsService } from "../services/reports"
import type { ReportRequest, ReportStatus } from "../types/reports"

export const useReports = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createReport = useCallback(async (data: ReportRequest) => {
    setLoading(true)
    setError(null)
    try {
      const result = await reportsService.createReport(data)
      return result
    } catch (err: any) {
      setError(err.message || "Erro ao criar relatório")
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const checkStatus = useCallback(async (id: string): Promise<ReportStatus> => {
    try {
      return await reportsService.getReportStatus(id)
    } catch (err: any) {
      setError(err.message || "Erro ao verificar status")
      throw err
    }
  }, [])

  const downloadReport = useCallback(async (id: string) => {
    try {
      const { downloadUrl } = await reportsService.getDownloadUrl(id)
      window.open(downloadUrl, "_blank")
    } catch (err: any) {
      setError(err.message || "Erro ao baixar relatório")
      throw err
    }
  }, [])

  return {
    loading,
    error,
    createReport,
    checkStatus,
    downloadReport,
  }
}