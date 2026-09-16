import { prisma } from '@/lib/prisma'
import { addWeightLog } from '@/app/actions'
import { format } from 'date-fns'
import { LineChart, Plus, History } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function EvolucaoPage() {
  const weightLogs = await prisma.weightLog.findMany({
    orderBy: { date: 'desc' }
  })
  
  const mealLogs = await prisma.mealLog.findMany({
    orderBy: { date: 'desc' },
    take: 30
  })

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="space-y-6">
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
          <LineChart className="text-blue-600" />
          Acompanhamento de Peso
        </h2>
        
        <form action={addWeightLog} className="flex flex-col sm:flex-row gap-2">
          <input 
            type="date" 
            name="date" 
            defaultValue={todayStr}
            className="w-full sm:w-auto border border-gray-300 p-3 rounded-md text-gray-800"
            required
          />
          <input 
            type="number" 
            step="0.1"
            name="weight" 
            placeholder="Seu peso (kg)" 
            className="w-full flex-1 border border-gray-300 p-3 rounded-md text-gray-800"
            required
          />
          <button type="submit" className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition flex items-center justify-center">
            <span>Registrar</span>
          </button>
        </form>

        {weightLogs.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-gray-700 mb-2">Histórico:</h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {weightLogs.map(log => (
                <div key={log.id} className="min-w-fit bg-blue-50 p-3 rounded-md border border-blue-100 text-center">
                  <span className="block text-xs text-gray-500">{log.date}</span>
                  <strong className="text-lg text-blue-800">{log.weight} kg</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
          <History className="text-emerald-600" />
          Diário Alimentar
        </h2>
        
        {mealLogs.length === 0 ? (
          <p className="text-gray-500">Nenhum registro ainda.</p>
        ) : (
          <div className="space-y-3">
            {mealLogs.map(log => (
              <div key={log.id} className={`p-4 rounded-md border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${log.consumed ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                <div>
                  <strong className="text-gray-800">{log.date} - {log.mealType}</strong>
                  <div className="text-sm mt-1">
                    {log.consumed ? (
                      <span className="text-emerald-600 font-semibold">Consumido ✔️</span>
                    ) : (
                      <span className="text-red-500 font-semibold">Pulou ❌</span>
                    )}
                  </div>
                </div>
                {log.justification && (
                  <div className="bg-white p-2 rounded text-sm text-gray-600 italic border border-gray-200 w-full sm:w-1/2">
                    " {log.justification} "
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
