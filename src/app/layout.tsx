import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { Home, ShoppingBasket, CalendarDays, ShoppingCart, Heart, LineChart } from 'lucide-react'
import { NotificationManager } from '@/components/NotificationManager'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Meu Chef e Dieta',
  description: 'Sistema para acompanhar dieta e gerar receitas em lote.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen flex flex-col`}>
        <NotificationManager />
        <header className="bg-emerald-600 text-white p-4 shadow-md sticky top-0 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold"><Link href="/">Meu Chef e Dieta</Link></h1>
            
            <nav className="hidden md:flex gap-4 lg:gap-6 flex-wrap">
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
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-4xl mx-auto w-full p-4 mb-16">
          {children}
        </main>

        <nav className="bg-white border-t border-gray-200 fixed bottom-0 w-full z-50 md:sticky md:bottom-auto md:w-auto md:hidden shadow-lg">
          <div className="flex justify-around items-center p-3">
            <Link href="/" className="flex flex-col items-center text-gray-600 hover:text-emerald-600">
              <Home size={24} />
              <span className="text-xs mt-1">Hoje</span>
            </Link>
            <Link href="/despensa" className="flex flex-col items-center text-gray-600 hover:text-emerald-600">
              <ShoppingBasket size={24} />
              <span className="text-xs mt-1">Despensa</span>
            </Link>
            <Link href="/cardapio" className="flex flex-col items-center text-gray-600 hover:text-emerald-600">
              <CalendarDays size={24} />
              <span className="text-xs mt-1">Cardápio</span>
            </Link>
          </div>
        </nav>
      </body>
    </html>
  )
}
