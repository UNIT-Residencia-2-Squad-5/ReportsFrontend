"use client"

import type React from "react"
import { useState } from "react"
import { ReportCard } from "@/components/ReportCard"
import { useReports } from "@/hooks/useReports"
import type { ReportRequest } from "@/types/reports"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Plus } from "lucide-react"


export const Dashboard = () => {
  const [reports, setReports] = useState<string[]>([])
  const [formData, setFormData] = useState<ReportRequest>({
    turmaId: "",
    tipo: "csv",
  })

  const { createReport, loading, error } = useReports()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.turmaId.trim()) {
      alert("Por favor, informe o ID da turma")
      return
    }

    try {
      const { id } = await createReport(formData)
      setReports((prev) => [id, ...prev])
      setFormData({ turmaId: "", tipo: "csv" })
    } catch (error) {
      console.error("Erro ao criar relatório:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <FileText className="w-8 h-8" />
            Dashboard - Relatórios
          </h1>
          <p className="text-muted-foreground">Sistema de geração assíncrona de relatórios educacionais</p>
        </div>

        {/* Formulário para criar novo relatório */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Gerar Novo Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="turmaId">ID da Turma</Label>
                  <Input
                    id="turmaId"
                    type="text"
                    value={formData.turmaId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, turmaId: e.target.value }))}
                    placeholder="Ex: turma-42"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo do Relatório</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: "csv" | "pdf" | "xlsx") => setFormData((prev) => ({ ...prev, tipo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full md:w-auto">
                {loading ? "Criando..." : "Gerar Relatório"}
              </Button>
            </form>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Lista de relatórios */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Relatórios</CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum relatório encontrado. Crie seu primeiro relatório acima!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {reports.map((reportId) => (
                  <ReportCard key={reportId} reportId={reportId} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
