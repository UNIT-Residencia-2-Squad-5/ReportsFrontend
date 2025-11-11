"use client"

import { Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import HomePage from "@/pages/HomePage"
import ReportsPage from "@/pages/ReportsPage"
import NotFoundPage from "@/pages/NotFoundPage"

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  )
}

export default App
