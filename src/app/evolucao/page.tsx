import { prisma } from '@/lib/prisma'
import { addWeightLog } from '@/app/actions'
import { format } from 'date-fns'
import { LineChart, Plus, History } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EvolucaoPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const userId = session.userId

  const weightLogs = await prisma.weightLog.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  })
  
  const mealLogs = await prisma.mealLog.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  })

  const allMenus = await prisma.weeklyMenu.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { meals: true }
  })

  const getPlannedMeal = (logDateStr: string, mealType: string) => {
    const logDate = new Date(logDateStr + 'T12:00:00Z')
    const endOfDay = new Date(logDateStr + 'T23:59:59Z')
    const activeMenu = allMenus.find(m => m.createdAt <= endOfDay) || allMenus[allMenus.length - 1]
    if (!activeMenu) return null

    const dayOfWeek = logDate.getDay()
    const planned = activeMenu.meals.find(m => {
      if (m.dayOfWeek !== dayOfWeek) return false;
      const mType = m.mealType.toLowerCase().replace(' da ', ' ');
      const lType = mealType.toLowerCase().replace(' da ', ' ');
      return lType.includes(mType) || mType.includes(lType);
    })
    return planned?.recipeText
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const formatDateStr = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

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
                  <span className="block text-xs text-gray-500">{formatDateStr(log.date)}</span>
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
          <div className="space-y-4">
            {Object.entries(
              mealLogs.reduce((acc, log) => {
                const date = new Date(log.date + 'T12:00:00Z')
                const monthYear = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                if (!acc[monthYear]) acc[monthYear] = {}
                if (!acc[monthYear][log.date]) acc[monthYear][log.date] = []
                acc[monthYear][log.date].push(log)
                return acc
              }, {} as Record<string, Record<string, typeof mealLogs>>)
            ).map(([monthYear, days], mIndex) => (
              <details key={monthYear} className="border border-gray-200 rounded-lg overflow-hidden group" open={mIndex === 0}>
                <summary className="p-4 font-bold text-emerald-800 cursor-pointer bg-emerald-50 hover:bg-emerald-100 transition capitalize list-none flex justify-between items-center">
                  <span>{monthYear}</span>
                  <span className="text-emerald-600 text-xs bg-emerald-200 px-2 py-1 rounded-full">{Object.values(days).flat().length} registros</span>
                </summary>
                
                <div className="p-4 space-y-4 bg-white">
                  {Object.entries(days).map(([dateStr, logs], dIndex) => (
                    <details key={dateStr} className="border border-gray-100 rounded-md overflow-hidden" open={mIndex === 0 && dIndex === 0}>
                      <summary className="p-3 font-semibold text-gray-700 cursor-pointer bg-gray-50 hover:bg-gray-100 transition list-none flex justify-between items-center">
                        <span>{formatDateStr(dateStr)}</span>
                        <span className="text-gray-500 text-xs">{logs.length} refeições</span>
                      </summary>
                      
                      <div className="p-3 space-y-3 bg-white">
                        {logs.map(log => {
                          const plannedRecipe = getPlannedMeal(log.date, log.mealType)
                          
                          return (
                            <div key={log.id} className={`p-4 rounded-md border flex flex-col gap-3 ${log.consumed ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <strong className="text-gray-800">{log.mealType}</strong>
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
                              
                              {plannedRecipe && (
                                <div className="bg-white/60 p-3 rounded border border-gray-200/50 text-sm text-gray-700">
                                  <span className="font-semibold text-gray-500 text-xs uppercase tracking-wider block mb-1">Cardápio Planejado:</span>
                                  {plannedRecipe}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </details>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
