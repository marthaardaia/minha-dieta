import { prisma } from '@/lib/prisma'
import { deleteFavoriteRecipe } from '@/app/actions'
import { Heart, Trash2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function FavoritosPage() {
  const favorites = await prisma.favoriteRecipe.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Heart className="text-red-500" />
          Minhas Receitas Favoritas
        </h2>
        
        {favorites.length === 0 ? (
          <p className="text-gray-500 py-4">Você ainda não salvou nenhuma receita favorita. Vá no seu Cardápio e clique no coração!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favorites.map(fav => (
              <div key={fav.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm relative group">
                <h3 className="font-bold text-emerald-800 mb-1">{fav.name}</h3>
                <span className="text-xs text-emerald-600 font-semibold bg-emerald-100 px-2 py-1 rounded inline-block mb-3">
                  {fav.mealType}
                </span>
                
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {fav.recipeText}
                </div>
                
                <form action={async () => {
                  'use server'
                  await deleteFavoriteRecipe(fav.id)
                }} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                  <button title="Remover" className="text-gray-400 hover:text-red-500">
                    <Trash2 size={18} />
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
