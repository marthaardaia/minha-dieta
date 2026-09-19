import { prisma } from '@/lib/prisma'
import { addIngredient, toggleIngredient, deleteIngredient, updateIngredient } from '@/app/actions'
import { Trash2, Check, X, Plus, Edit2 } from 'lucide-react'
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
              <div key={ing.id} className={`flex items-start justify-between p-3 rounded-lg border transition-all ${ing.isAvailable ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50 opacity-70'}`}>
                <details className="flex-1 group mr-2">
                  <summary className="flex flex-col cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium hover:underline ${ing.isAvailable ? 'text-emerald-900' : 'text-gray-500 line-through'}`}>
                        {ing.name}
                      </span>
                      <Edit2 size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                    <span className="text-xs text-gray-500">{ing.category}</span>
                  </summary>
                  <form action={async (formData) => {
                    'use server'
                    await updateIngredient(ing.id, formData)
                  }} className="mt-3 flex flex-col gap-2">
                    <input name="name" defaultValue={ing.name} className="text-sm border border-gray-300 p-1.5 rounded bg-white" required />
                    <select name="category" defaultValue={ing.category} className="text-sm border border-gray-300 p-1.5 rounded bg-white" required>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button type="submit" className="text-xs bg-emerald-600 text-white p-1.5 rounded hover:bg-emerald-700">Salvar Alterações</button>
                  </form>
                </details>
                <div className="flex gap-2 shrink-0">
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
