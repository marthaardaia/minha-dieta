import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ChefHat, CalendarClock, AlertCircle, Heart } from 'lucide-react'
import { GenerateButton } from '@/components/GenerateButton'
import { saveFavoriteRecipe } from '@/app/actions'

export const dynamic = 'force-dynamic'

export default async function CardapioPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const latestMenu = await prisma.weeklyMenu.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    include: { meals: true }
  })

  return (
    <div className="space-y-6">
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
        <ChefHat className="mx-auto h-12 w-12 text-emerald-600 mb-3" />
        <h2 className="text-2xl font-bold text-gray-800">Batch Cooking Semanal</h2>
        <p className="text-gray-500 mt-2 text-sm">
          A Inteligência Artificial vai olhar para a sua despensa e criar instruções passo a passo para você cozinhar de uma vez as marmitas da semana, respeitando as regras da sua nutri!
        </p>
        
        <div className="mt-6">
          <GenerateButton />
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded-md">
          <AlertCircle size={14} />
          <span>Lembre-se de configurar a GEMINI_API_KEY no arquivo .env</span>
        </div>
      </div>

      {latestMenu && (
        <div className="space-y-8">
          
          {latestMenu.meals.filter(m => m.dayOfWeek === -1).map(meal => (
            <div key={meal.id} className="bg-emerald-50 p-5 rounded-lg shadow-sm border border-emerald-200">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-emerald-800 flex items-center gap-2">
                  <ChefHat /> {meal.mealType}
                </h3>
              </div>
              <div className="prose prose-sm max-w-none text-emerald-900 whitespace-pre-wrap font-sans mb-4">
                {meal.recipeText}
              </div>
            </div>
          ))}

          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarClock className="text-emerald-600" />
            Cardápio Variado da Semana
          </h3>
          
          {[0, 1, 2, 3, 4, 5, 6].map(day => {
            const dayMeals = latestMenu.meals.filter(m => m.dayOfWeek === day)
            if (dayMeals.length === 0) return null
            
            const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
            
            return (
              <div key={day} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <h4 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">{dayNames[day]}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {dayMeals.map(meal => (
                    <div key={meal.id} className="bg-gray-50 p-3 rounded border border-gray-100 relative group">
                      <strong className="text-emerald-700 block mb-1 text-sm">{meal.mealType}</strong>
                      <span className="text-gray-600 text-sm block mb-8">{meal.recipeText}</span>
                      
                      <form action={async () => {
                        'use server'
                        const name = `${dayNames[day]} - ${meal.mealType}`
                        await saveFavoriteRecipe(name, meal.mealType, meal.recipeText)
                      }} className="absolute bottom-2 right-2">
                        <button title="Salvar Favorito" className="text-gray-400 hover:text-red-500 transition">
                          <Heart size={18} />
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
