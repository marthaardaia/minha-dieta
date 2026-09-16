import { prisma } from '@/lib/prisma'
import { createAdminUser } from '@/app/actions'
import { getSession } from '@/lib/auth'
import { ShieldCheck, Users, UserPlus } from 'lucide-react'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getSession()
  if (!session?.isAdmin) redirect('/')

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="bg-emerald-700 p-6 rounded-lg shadow-sm text-white flex items-center gap-3">
        <ShieldCheck size={32} />
        <div>
          <h2 className="text-2xl font-bold">Painel da Administradora</h2>
          <p className="text-emerald-100 text-sm">Gerencie o acesso VIP das suas amigas</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
          <UserPlus className="text-emerald-600" />
          Adicionar Nova Amiga
        </h3>
        
        <form action={createAdminUser} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input 
              type="text" 
              name="username" 
              placeholder="Nome de usuário (sem espaços)" 
              required
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="flex-1">
            <input 
              type="text" 
              name="password" 
              placeholder="Senha de acesso" 
              required
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <button type="submit" className="w-full sm:w-auto bg-emerald-600 text-white px-6 py-3 rounded-md hover:bg-emerald-700 transition font-medium">
            Cadastrar
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Users className="text-emerald-600" />
          Usuárias Cadastradas ({users.length})
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <th className="p-3 font-semibold text-sm">ID</th>
                <th className="p-3 font-semibold text-sm">Nome de Usuário</th>
                <th className="p-3 font-semibold text-sm">Senha</th>
                <th className="p-3 font-semibold text-sm">Data de Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-sm text-gray-500">#{u.id}</td>
                  <td className="p-3 font-medium text-gray-800">
                    {u.username} {u.isAdmin && <span className="ml-2 text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">Admin</span>}
                  </td>
                  <td className="p-3 text-sm font-mono text-gray-500">{u.password}</td>
                  <td className="p-3 text-sm text-gray-500">{u.createdAt.toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
