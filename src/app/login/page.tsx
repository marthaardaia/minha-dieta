import { loginAction } from '@/app/actions'
import { Utensils } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 border border-gray-100">
        
        <div className="flex flex-col items-center mb-8">
          <div className="bg-emerald-100 p-3 rounded-full mb-4">
            <Utensils className="text-emerald-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Meu Chef e Dieta</h1>
          <p className="text-gray-500 mt-2">Acesso VIP reservado</p>
        </div>

        <form action={loginAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
            <input 
              type="text" 
              name="username" 
              required 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Digite seu nome de usuário"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input 
              type="password" 
              name="password" 
              required 
              className="w-full border border-gray-300 p-3 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Digite sua senha"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-emerald-600 text-white font-medium py-3 rounded-md hover:bg-emerald-700 transition"
          >
            Entrar
          </button>
        </form>

      </div>
    </div>
  )
}
