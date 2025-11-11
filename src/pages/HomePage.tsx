"use client"

import { useEffect, useState } from "react"
import { FileText, Zap, Clock } from "lucide-react"
import Card from "@/components/Card"
import { useReportsStore } from "@/stores/reportsStore"
import { useTurmasStore } from "@/stores/turmasStore"

export default function HomePage() {
  const { reports, fetchReports } = useReportsStore()
  const { turmas, fetchTurmas } = useTurmasStore()
  const [stats, setStats] = useState({
    total: 0,
    processing: 0,
    completed: 0,
  })

  useEffect(() => {
    fetchReports()
    fetchTurmas()
  }, [])

  useEffect(() => {
    if (reports.length > 0) {
      const processing = reports.filter((r) => r.status === "processing").length
      const completed = reports.filter((r) => r.status === "completed").length

      setStats({
        total: reports.length,
        processing,
        completed,
      })
    }
  }, [reports])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          Sistema de Geração de Relatórios
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          Gerenciamento de relatórios 
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total de Relatórios</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
            </div>
            <FileText className="w-10 h-10 text-blue-400 opacity-70" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Em Processamento</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.processing}</p>
            </div>
            <Zap className="w-10 h-10 text-yellow-400 opacity-70" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Concluídos</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.completed}</p>
            </div>
            <Clock className="w-10 h-10 text-green-400 opacity-70" />
          </div>
        </Card>
      </div>

      <Card className="border-blue-500/30 bg-blue-500/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Bem-vindo à Reports API</h2>
            <p className="text-slate-300 mt-2">
              Sistema de geração de relatórios Acesse a aba de Relatórios para começar a
              criar novos documentos para suas turmas.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-bold text-white mb-4">Turmas Disponíveis</h3>
          {turmas.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {turmas.map((turma) => (
                <div key={turma.id} className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                  <p className="font-medium text-white">{turma.nome}</p>
                  {turma.descricao && <p className="text-sm text-slate-400 mt-1">{turma.descricao}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-4">Nenhuma turma disponível</p>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-white mb-4">Recursos</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-slate-300">Geração de relatórios em PDF</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-slate-300">Exportação em Excel</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-slate-300"></span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-slate-300"></span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-slate-300"></span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
