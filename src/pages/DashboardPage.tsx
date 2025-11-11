"use client"

import { useEffect } from "react"
import Layout from "@/components/Layout"
import { useAuthStore } from "@/stores/authStore"
import { useUsersStore } from "@/stores/usersStore"
import { BarChart3, Users, FileText } from "lucide-react"
import Card from "@/components/Card"

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { users, fetchUsers } = useUsersStore()

  useEffect(() => {
    fetchUsers(1, 5)
  }, [])

  const stats = [
    { label: "Total de Usuários", value: users.length, icon: Users },
    { label: "Relatórios", value: "0", icon: FileText },
    { label: "Processados", value: "0", icon: BarChart3 },
  ]

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Bem-vindo, {user?.name}!</h1>
          <p className="text-gray-400 mt-2">Aqui está um resumo do seu sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <Icon size={32} className="text-blue-500 opacity-50" />
                </div>
              </Card>
            )
          })}
        </div>

        <Card>
          <h2 className="text-xl font-bold mb-4">Últimos Usuários</h2>
          <div className="space-y-3">
            {users.slice(0, 5).map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-sm text-gray-400">{u.email}</p>
                </div>
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Ativo</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
