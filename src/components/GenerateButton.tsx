'use client'

import { useState } from 'react'
import { generateWeeklyMenu } from '@/app/actions'

export function GenerateButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await generateWeeklyMenu()
      if (res?.error) {
        setError(res.error)
      }
    } catch (e: any) {
      setError(e.message || 'Erro desconhecido')
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md w-full max-w-lg text-sm border border-red-200 text-left">
          <strong>Erro:</strong> {error}
        </div>
      )}
      <button 
        onClick={handleGenerate} 
        disabled={loading}
        className={`px-6 py-3 rounded-md font-bold shadow-md transition w-full sm:w-auto text-white
          ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
      >
        {loading ? 'Gerando (Pode levar alguns segundos)...' : 'Gerar Novo Plano de Cozimento'}
      </button>
    </div>
  )
}
