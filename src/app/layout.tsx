import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { Home, ShoppingBasket, CalendarDays, ShoppingCart, Heart, LineChart, LogOut, ShieldCheck } from 'lucide-react'
import { NotificationManager } from '@/components/NotificationManager'
import { getSession } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Meu Chef e Dieta',
  description: 'Sistema para acompanhar dieta e gerar receitas em lote.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen flex flex-col`}>
        <NotificationManager />
        {session && (
          <header className="bg-emerald-600 text-white p-4 shadow-md sticky top-0 z-50">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <h1 className="text-xl font-bold"><Link href="/">Meu Chef</Link></h1>
              
              <nav className="hidden md:flex gap-4 lg:gap-6 flex-wrap items-center">
                <Link href="/" className="hover:text-emerald-200 transition font-medium flex items-center gap-1">
                  <Home size={18} /> Hoje
                </Link>
                <Link href="/despensa" className="hover:text-emerald-200 transition font-medium flex items-center gap-1">
                  <ShoppingBasket size={18} /> Despensa
                </Link>
                <Link href="/cardapio" className="hover:text-emerald-200 transition font-medium flex items-center gap-1">
                  <CalendarDays size={18} /> Cardápio
                </Link>
                <Link href="/compras" className="hover:text-emerald-200 transition font-medium flex items-center gap-1">
                  <ShoppingCart size={18} /> Compras
                </Link>
                <Link href="/favoritos" className="hover:text-emerald-200 transition font-medium flex items-center gap-1">
                  <Heart size={18} /> Favoritos
                </Link>
                <Link href="/evolucao" className="hover:text-emerald-200 transition font-medium flex items-center gap-1">
                  <LineChart size={18} /> Evolução
                </Link>
                
                {session.isAdmin && (
                  <Link href="/admin" className="hover:text-emerald-200 transition font-medium flex items-center gap-1 text-emerald-100 bg-emerald-700 px-2 py-1 rounded">
                    <ShieldCheck size={18} /> Admin
                  </Link>
                )}
                <form action="/api/logout" method="POST" className="inline">
                  <button type="submit" className="hover:text-red-200 transition font-medium flex items-center gap-1 ml-2">
                    <LogOut size={18} /> Sair
                  </button>
                </form>
              </nav>
            </div>
          </header>
        )}

        <main className="flex-1 max-w-4xl mx-auto w-full p-4 mb-16">
          {children}
        </main>

        {session && (
          <nav className="bg-white border-t border-gray-200 fixed bottom-0 w-full z-50 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex overflow-x-auto hide-scrollbar items-center px-2 py-2 gap-4 snap-x">
              <Link href="/" className="flex flex-col items-center justify-center text-gray-500 hover:text-emerald-600 min-w-[64px] snap-center">
                <Home size={22} />
                <span className="text-[10px] mt-1 font-medium">Hoje</span>
              </Link>
              <Link href="/despensa" className="flex flex-col items-center justify-center text-gray-500 hover:text-emerald-600 min-w-[64px] snap-center">
                <ShoppingBasket size={22} />
                <span className="text-[10px] mt-1 font-medium">Despensa</span>
              </Link>
              <Link href="/cardapio" className="flex flex-col items-center justify-center text-gray-500 hover:text-emerald-600 min-w-[64px] snap-center">
                <CalendarDays size={22} />
                <span className="text-[10px] mt-1 font-medium">Cardápio</span>
              </Link>
              <Link href="/compras" className="flex flex-col items-center justify-center text-gray-500 hover:text-emerald-600 min-w-[64px] snap-center">
                <ShoppingCart size={22} />
                <span className="text-[10px] mt-1 font-medium">Compras</span>
              </Link>
              <Link href="/favoritos" className="flex flex-col items-center justify-center text-gray-500 hover:text-emerald-600 min-w-[64px] snap-center">
                <Heart size={22} />
                <span className="text-[10px] mt-1 font-medium">Favoritos</span>
              </Link>
              <Link href="/evolucao" className="flex flex-col items-center justify-center text-gray-500 hover:text-emerald-600 min-w-[64px] snap-center">
                <LineChart size={22} />
                <span className="text-[10px] mt-1 font-medium">Evolução</span>
              </Link>
              {session.isAdmin && (
                <Link href="/admin" className="flex flex-col items-center justify-center text-gray-500 hover:text-emerald-600 min-w-[64px] snap-center">
                  <ShieldCheck size={22} />
                  <span className="text-[10px] mt-1 font-medium">Admin</span>
                </Link>
              )}
              <form action="/api/logout" method="POST" className="flex flex-col items-center justify-center text-gray-500 hover:text-red-600 min-w-[64px] snap-center">
                <button type="submit" className="flex flex-col items-center justify-center w-full">
                  <LogOut size={22} />
                  <span className="text-[10px] mt-1 font-medium">Sair</span>
                </button>
              </form>
            </div>
          </nav>
        )}
      </body>
    </html>
  )
}
