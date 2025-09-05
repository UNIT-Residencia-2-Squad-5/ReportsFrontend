"use client"

import { useState, useEffect } from "react"
import type { ReportStatus } from "@/types/reports"
import { useReports } from "@/hooks/useReports"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface ReportCardProps {
  reportId: string
  initialStatus?: ReportStatus
}

export const ReportCard = ({ reportId, initialStatus }: ReportCardProps) => {
  const [status, setStatus] = useState<ReportStatus | null>(initialStatus || null)
  const { checkStatus, downloadReport, loading } = useReports()

  useEffect(() => {
    const pollStatus = async () => {
      if (!status || status.status === "processando" || status.status === "pendente") {
        try {
          const newStatus = await checkStatus(reportId)
          setStatus(newStatus)
        } catch (error) {
          console.error("Erro ao verificar status:", error)
        }
      }
    }

    pollStatus()

    // Poll a cada 5 segundos se ainda está processando
    const interval = setInterval(pollStatus, 5000)

    return () => clearInterval(interval)
  }, [reportId, status, checkStatus])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "concluido":
        return "default"
      case "processando":
        return "secondary"
      case "pendente":
        return "outline"
      case "falhou":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "concluido":
        return <CheckCircle className="w-4 h-4" />
      case "processando":
        return <Clock className="w-4 h-4 animate-spin" />
      case "pendente":
        return <AlertCircle className="w-4 h-4" />
      case "falhou":
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const handleDownload = async () => {
    if (status?.status === "concluido") {
      await downloadReport(reportId)
    }
  }

  if (!status) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{status.filename || `Relatório ${reportId.slice(0, 8)}`}</CardTitle>
            {status.geradoEm && (
              <p className="text-sm text-muted-foreground">
                Gerado em: {new Date(status.geradoEm).toLocaleString("pt-BR")}
              </p>
            )}
          </div>

          <Badge variant={getStatusVariant(status.status)} className="flex items-center gap-1">
            {getStatusIcon(status.status)}
            {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {status.erro && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
            Erro: {status.erro}
          </div>
        )}

        <div className="flex gap-2 items-center">
          <Button
            onClick={handleDownload}
            disabled={status.status !== "concluido" || loading}
            variant={status.status === "concluido" ? "default" : "secondary"}
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {loading ? "Baixando..." : "Download"}
          </Button>

          {(status.status === "processando" || status.status === "pendente") && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
