import { prisma } from '@/lib/prisma'
import { markMeal, markWater } from '@/app/actions'
import { Check, CheckCircle2, Coffee, Moon, Utensils, Droplet, Info } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { GenerateButton } from '@/components/GenerateButton'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const session = await getSession()
  if (!session) redirect('/login')
  const userId = session.userId

  const todayStr = new Date().toLocaleDateString('en-CA') 
  const todayDate = new Date(todayStr + 'T12:00:00Z')
  const dayOfWeek = todayDate.getDay() 

  const activeMenu = await prisma.weeklyMenu.findFirst({
    where: {
      userId,
      startDate: { lte: todayDate },
      endDate: { gte: todayDate }
    },
    include: { meals: true },
    orderBy: { createdAt: 'desc' }
  })
  
  const waterLogs = await prisma.waterLog.findMany({
    where: { userId, date: todayStr }
  })
  
  const mealLogs = await prisma.mealLog.findMany({
    where: { userId, date: todayStr }
  })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  const cupSize = user?.waterCupSize || 450
  const cupsGoal = user?.waterCupsGoal || 8

  const waterSlots = cupsGoal === 8 
    ? ['06:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']
    : Array.from({ length: cupsGoal }, (_, i) => `Copo ${i + 1}`)
  const mealSlots = [
    { type: 'Desjejum (07:00)', icon: Coffee, required: true },
    { type: 'Lanche Manhã', icon: Utensils, required: false },
    { type: 'Almoço (12:00)', icon: Utensils, required: true },
    { type: 'Lanche Tarde', icon: Utensils, required: false },
    { type: 'Jantar (18:00)', icon: Moon, required: true }
  ]

  const latestMenu = await prisma.weeklyMenu.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { meals: true }
  })
  
  const currentDayOfWeek = new Date().getDay()
  const todaysMeals = latestMenu?.meals.filter(m => m.dayOfWeek === currentDayOfWeek) || []

  return (
    <div className="space-y-6">
      
      {/* Alerta da Nutri */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Lembrete Diário:</strong> 1 colher de sopa de gérmen de trigo na comida e 1 comprimido de levedo de cerveja 30 minutos antes das refeições principais.
            </p>
          </div>
        </div>
      </div>

      {/* Checklist de Água */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600">
          <Droplet />
          Hidratação ({cupSize}ml por copo)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {waterSlots.map(slot => {
            const log = waterLogs.find(l => l.timeSlot === slot)
            const isDone = log?.consumed ?? false

            return (
              <div key={slot} className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition ${isDone ? 'bg-blue-100 border-blue-300' : 'bg-gray-50 border-gray-200'}`}>
                <span className="font-semibold text-gray-700">{slot}</span>
                <form action={async () => {
                  'use server'
                  await markWater(todayStr, slot, !isDone)
                }}>
                  <button className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${isDone ? 'bg-blue-500' : 'bg-gray-300 hover:bg-gray-400'}`}>
                    <Check size={20} />
                  </button>
                </form>
              </div>
            )
          })}
        </div>
      </div>

      {/* Checklist de Refeições */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-600">
          <Utensils />
          Refeições de Hoje
        </h2>
        <div className="space-y-4">
          {mealSlots.map(slot => {
            const log = mealLogs.find(l => l.mealType === slot.type)
            const isDone = log?.consumed ?? false
            const justification = log?.justification ?? ''
            
            // Procura no cardápio gerado algo que lembre o tipo da refeição
            const plannedMeal = todaysMeals.find(m => {
              const mType = m.mealType.toLowerCase().replace(' da ', ' ');
              const lType = slot.type.toLowerCase().replace(' da ', ' ');
              return lType.includes(mType) || mType.includes(lType);
            })

            return (
              <div key={slot.type} className={`p-4 rounded-lg border ${isDone ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-2 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <slot.icon className={isDone ? 'text-emerald-500' : 'text-gray-400'} size={20} />
                      <span className="font-semibold text-gray-800">{slot.type}</span>
                      {!slot.required && <span className="text-xs text-gray-400 font-normal">(Opcional)</span>}
                    </div>
                    {plannedMeal && (
                      <p className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-100">
                        <strong>Cardápio:</strong> {plannedMeal.recipeText}
                      </p>
                    )}
                  </div>
                  <form action={async () => {
                    'use server'
                    await markMeal(todayStr, slot.type, !isDone, justification)
                  }}>
                    <button className={`w-full md:w-auto px-4 py-2 rounded-md text-white font-medium text-sm transition ${isDone ? 'bg-emerald-500' : 'bg-gray-300 hover:bg-gray-400'}`}>
                      {isDone ? 'Feito' : 'Marcar'}
                    </button>
                  </form>
                </div>
                
                <form action={async (formData) => {
                  'use server'
                  const just = formData.get('justification') as string
                  await markMeal(todayStr, slot.type, isDone, just)
                }} className="mt-2 flex flex-col sm:flex-row gap-2">
                  <input 
                    type="text" 
                    name="justification" 
                    defaultValue={justification}
                    placeholder="Imprevisto? Justifique o atraso ou alteração..." 
                    className="w-full text-sm border border-gray-300 rounded-md p-2 bg-white"
                  />
                  <button type="submit" className="w-full sm:w-auto py-2 sm:py-0 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 rounded-md font-medium">
                    Salvar
                  </button>
                </form>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
