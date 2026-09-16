import { prisma } from '@/lib/prisma'
import { updateUserProfile } from '@/app/actions'
import { getSession } from '@/lib/auth'
import { User, Settings, Droplet, ChefHat } from 'lucide-react'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PerfilPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) redirect('/login')

  const defaultDiet = `- Desjejum: (Variar entre as opções: 2 a 3 frutas, ou 2 pedaços de raiz/cuscuz, ou mingau, ou vitamina, ou 1 ovo cozido). Lembrete: 1 colher de sementes.
- Lanches (manhã e tarde): 1 fruta ou suco natural ou água de coco. Variar as frutas.
- Almoço: Salada crua (metade do prato), 2 colheres de arroz integral, 1 concha de feijão, 1 porção de proteína (frango, ovo, peixe). Variar a proteína e os legumes.
- Jantar: Sopa de legumes OU salada com arroz integral e ovo OU mingau de aveia OU vitamina. Variar.`

  return (
    <div className="space-y-6">
      <div className="bg-emerald-600 p-6 rounded-lg shadow-sm text-white flex items-center gap-3">
        <User size={32} />
        <div>
          <h2 className="text-2xl font-bold">Meu Perfil</h2>
          <p className="text-emerald-100 text-sm">Gerencie suas configurações e dieta</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <form action={updateUserProfile} className="space-y-6">
          
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2">
              <Droplet className="text-blue-500" />
              Metas de Hidratação
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho do Copo (ml)</label>
                <input 
                  type="number" 
                  name="waterCupSize" 
                  defaultValue={user.waterCupSize || 450}
                  className="w-full border border-gray-300 p-3 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Diária (Quantidade de Copos)</label>
                <input 
                  type="number" 
                  name="waterCupsGoal" 
                  defaultValue={user.waterCupsGoal || 8}
                  className="w-full border border-gray-300 p-3 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2">
              <ChefHat className="text-emerald-600" />
              Orientações da Dieta (Para a IA)
            </h3>
            <p className="text-sm text-gray-500 mb-3">Escreva aqui as diretrizes da sua nutricionista. A Inteligência Artificial vai ler essas regras na hora de montar o seu cardápio semanal.</p>
            <textarea 
              name="dietInstructions" 
              rows={12}
              defaultValue={user.dietInstructions || defaultDiet}
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" className="bg-emerald-600 text-white px-8 py-3 rounded-md hover:bg-emerald-700 transition font-medium flex items-center gap-2">
              <Settings size={18} />
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
