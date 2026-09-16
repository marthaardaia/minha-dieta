import { prisma } from '@/lib/prisma'
import { addShoppingItem, toggleShoppingItem, deleteShoppingItem } from '@/app/actions'
import { ShoppingCart, Plus, Trash2, Check, X } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ComprasPage() {
  const items = await prisma.shoppingItem.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
          <ShoppingCart className="text-emerald-600" />
          Lista de Compras
        </h2>
        
        <form action={addShoppingItem} className="flex flex-col sm:flex-row gap-2">
          <input 
            type="text" 
            name="name" 
            placeholder="O que está faltando?" 
            className="w-full flex-1 border border-gray-300 p-3 rounded-md text-gray-800"
            required
          />
          <button type="submit" className="w-full sm:w-auto bg-emerald-600 text-white px-4 py-3 sm:py-2 rounded-md hover:bg-emerald-700 transition flex items-center justify-center">
            <Plus size={20} />
            <span className="ml-1">Adicionar</span>
          </button>
        </form>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Sua lista está vazia!</p>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className={`flex items-center justify-between p-3 rounded-md border ${item.isBought ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-emerald-50 border-emerald-200'}`}>
                <span className={`flex-1 font-medium ${item.isBought ? 'line-through text-gray-500' : 'text-emerald-900'}`}>
                  {item.name}
                </span>
                <div className="flex gap-2">
                  <form action={async () => {
                    'use server'
                    await toggleShoppingItem(item.id, !item.isBought)
                  }}>
                    <button className={`p-2 rounded-full ${item.isBought ? 'bg-gray-200 hover:bg-gray-300 text-gray-600' : 'bg-emerald-200 hover:bg-emerald-300 text-emerald-800'}`}>
                      {item.isBought ? <X size={16} /> : <Check size={16} />}
                    </button>
                  </form>
                  <form action={async () => {
                    'use server'
                    await deleteShoppingItem(item.id)
                  }}>
                    <button className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600">
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
