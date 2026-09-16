import { prisma } from '@/lib/prisma'
import { addIngredient, toggleIngredient, deleteIngredient } from '@/app/actions'
import { Trash2, Check, X, Plus } from 'lucide-react'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DespensaPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const ingredients = await prisma.ingredient.findMany({
    where: { userId: session.userId },
    orderBy: { name: 'asc' }
  })

  const categories = [
    'Fruta', 'Vegetal', 'Proteína', 'Carboidrato', 'Grão/Semente', 'Laticínio', 'Outro'
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4 text-emerald-700">Adicionar Ingrediente</h2>
        <form action={addIngredient} className="flex gap-2 flex-col sm:flex-row">
          <input 
            type="text" 
            name="name" 
            placeholder="Nome do alimento (ex: Banana)" 
            className="border p-2 rounded-md flex-1 text-gray-800"
            required
          />
          <select name="category" className="border p-2 rounded-md text-gray-800" required>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" className="bg-emerald-600 text-white p-2 rounded-md flex items-center justify-center gap-2 hover:bg-emerald-700 transition">
            <Plus size={20} />
            <span className="sm:hidden">Adicionar</span>
          </button>
        </form>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4 text-emerald-700">Meus Ingredientes</h2>
        {ingredients.length === 0 ? (
          <p className="text-gray-500">Sua despensa está vazia. Adicione os alimentos que você comprou para a dieta!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ingredients.map(ing => (
              <div key={ing.id} className={`flex items-center justify-between p-3 rounded-lg border ${ing.isAvailable ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                <div className="flex flex-col">
                  <span className={`font-medium ${ing.isAvailable ? 'text-emerald-900' : 'text-gray-500 line-through'}`}>{ing.name}</span>
                  <span className="text-xs text-gray-500">{ing.category}</span>
                </div>
                <div className="flex gap-2">
                  <form action={async () => {
                    'use server'
                    await toggleIngredient(ing.id, !ing.isAvailable)
                  }}>
                    <button className={`p-2 rounded-full ${ing.isAvailable ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}>
                      {ing.isAvailable ? <X size={16} /> : <Check size={16} />}
                    </button>
                  </form>
                  <form action={async () => {
                    'use server'
                    await deleteIngredient(ing.id)
                  }}>
                    <button className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-red-500 hover:text-white transition">
                      <Trash2 size={16} />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
