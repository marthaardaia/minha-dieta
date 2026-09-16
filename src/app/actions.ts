'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { loginSession, logoutSession, getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

async function getUserId() {
  const session = await getSession()
  if (!session || !session.userId) {
    throw new Error('Não autorizado')
  }
  return session.userId
}

export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user || user.password !== password) {
    throw new Error('Credenciais inválidas')
  }

  await loginSession(user.id, user.username, user.isAdmin)
  redirect('/')
}

export async function logoutAction() {
  await logoutSession()
  redirect('/login')
}

export async function createAdminUser(formData: FormData) {
  const session = await getSession()
  if (!session || !session.isAdmin) throw new Error('Acesso negado')
  
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  
  if (!username || !password) return

  await prisma.user.create({ data: { username, password } })
  revalidatePath('/admin')
}

export async function deleteAdminUser(id: number) {
  const session = await getSession()
  if (!session || !session.isAdmin) throw new Error('Acesso negado')
  if (id === session.userId) throw new Error('Você não pode excluir a si mesma')
  
  await prisma.user.delete({ where: { id } })
  revalidatePath('/admin')
}

export async function updateAdminUserPassword(id: number, formData: FormData) {
  const session = await getSession()
  if (!session || !session.isAdmin) throw new Error('Acesso negado')
  
  const password = formData.get('password') as string
  if (!password) return

  await prisma.user.update({ where: { id }, data: { password } })
  revalidatePath('/admin')
}

export async function addIngredient(formData: FormData) {
  const userId = await getUserId()
  const name = formData.get('name') as string
  const category = formData.get('category') as string

  if (!name || !category) return

  await prisma.ingredient.create({
    data: { name, category, isAvailable: true, userId },
  })
  revalidatePath('/despensa')
}

export async function toggleIngredient(id: number, isAvailable: boolean) {
  const userId = await getUserId()
  await prisma.ingredient.updateMany({ where: { id, userId }, data: { isAvailable } })
  revalidatePath('/despensa')
}

export async function deleteIngredient(id: number) {
  const userId = await getUserId()
  await prisma.ingredient.deleteMany({ where: { id, userId } })
  revalidatePath('/despensa')
}

export async function markWater(date: string, timeSlot: string, consumed: boolean, justification?: string) {
  const userId = await getUserId()
  await prisma.waterLog.upsert({
    where: { userId_date_timeSlot: { userId, date, timeSlot } },
    update: { consumed, justification },
    create: { userId, date, timeSlot, consumed, justification },
  })
  revalidatePath('/')
}

export async function markMeal(date: string, mealType: string, consumed: boolean, justification?: string) {
  const userId = await getUserId()
  await prisma.mealLog.upsert({
    where: { userId_date_mealType: { userId, date, mealType } },
    update: { consumed, justification },
    create: { userId, date, mealType, consumed, justification },
  })
  revalidatePath('/')
}

export async function generateWeeklyMenu() {
  const userId = await getUserId()
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'COLOQUE_SUA_CHAVE_AQUI') {
    return { error: 'Chave da API do Gemini não configurada no arquivo .env' }
  }

  const ingredients = await prisma.ingredient.findMany({ where: { isAvailable: true, userId } })
  const ingredientNames = ingredients.map(i => i.name).join(', ')

  if (ingredients.length < 3) {
    return { error: 'Adicione mais ingredientes na despensa para gerar o cardápio.' }
  }

  const prompt = `Você é um assistente culinário especializado em dietas restritas.
A usuária não sabe cozinhar e quer um cardápio semanal VARIADO (7 dias) baseado nas diretrizes da nutricionista e no que tem na despensa.

Diretrizes da Dieta:
- Desjejum: (Variar entre as opções: 2 a 3 frutas, ou 2 pedaços de raiz/cuscuz, ou mingau, ou vitamina, ou 1 ovo cozido). Lembrete: 1 colher de sementes.
- Lanches (manhã e tarde): 1 fruta ou suco natural ou água de coco. Variar as frutas.
- Almoço: Salada crua (metade do prato), 2 colheres de arroz integral, 1 concha de feijão, 1 porção de proteína (frango, ovo, peixe). Variar a proteína e os legumes.
- Jantar: Sopa de legumes OU salada com arroz integral e ovo OU mingau de aveia OU vitamina. Variar.

Ingredientes disponíveis na despensa: ${ingredientNames}. (Se faltar algo básico para as regras, invente com o que é permitido).

Retorne EXATAMENTE UM JSON no formato:
{
  "prep_semana": "Guia de Batch Cooking...",
  "dias": [
    {
      "dia": 1, 
      "desjejum": "...",
      "lanche_manha": "...",
      "almoco": "...",
      "lanche_tarde": "...",
      "jantar": "..."
    }
  ]
}`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" })
    
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("A IA não retornou um formato JSON válido.")
    
    const parsed = JSON.parse(jsonMatch[0])

    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)

    const mealsToCreate = []
    
    mealsToCreate.push({
      dayOfWeek: -1,
      mealType: 'Guia de Preparo (Batch Cooking)',
      recipeText: parsed.prep_semana
    })

    for (const d of parsed.dias) {
      mealsToCreate.push({ dayOfWeek: d.dia, mealType: 'Desjejum', recipeText: d.desjejum })
      mealsToCreate.push({ dayOfWeek: d.dia, mealType: 'Lanche da Manhã', recipeText: d.lanche_manha })
      mealsToCreate.push({ dayOfWeek: d.dia, mealType: 'Almoço', recipeText: d.almoco })
      mealsToCreate.push({ dayOfWeek: d.dia, mealType: 'Lanche da Tarde', recipeText: d.lanche_tarde })
      mealsToCreate.push({ dayOfWeek: d.dia, mealType: 'Jantar', recipeText: d.jantar })
    }

    const menu = await prisma.weeklyMenu.create({
      data: {
        userId,
        startDate: today,
        endDate: nextWeek,
        meals: {
          create: mealsToCreate
        }
      }
    })

    revalidatePath('/cardapio')
    revalidatePath('/')
    return { success: true, menuId: menu.id }
  } catch (error: any) {
    console.error(error)
    return { error: 'Erro ao gerar cardápio: ' + error.message }
  }
}

export async function addShoppingItem(formData: FormData) {
  const userId = await getUserId()
  const name = formData.get('name') as string
  if (!name) return
  await prisma.shoppingItem.create({ data: { name, userId } })
  revalidatePath('/compras')
}
export async function toggleShoppingItem(id: number, isBought: boolean) {
  const userId = await getUserId()
  await prisma.shoppingItem.updateMany({ where: { id, userId }, data: { isBought } })
  revalidatePath('/compras')
}
export async function deleteShoppingItem(id: number) {
  const userId = await getUserId()
  await prisma.shoppingItem.deleteMany({ where: { id, userId } })
  revalidatePath('/compras')
}
export async function saveFavoriteRecipe(name: string, mealType: string, recipeText: string) {
  const userId = await getUserId()
  await prisma.favoriteRecipe.create({ data: { name, mealType, recipeText, userId } })
  revalidatePath('/favoritos')
}
export async function deleteFavoriteRecipe(id: number) {
  const userId = await getUserId()
  await prisma.favoriteRecipe.deleteMany({ where: { id, userId } })
  revalidatePath('/favoritos')
}
export async function addWeightLog(formData: FormData) {
  const userId = await getUserId()
  const date = formData.get('date') as string
  const weight = parseFloat(formData.get('weight') as string)
  if (!date || isNaN(weight)) return
  await prisma.weightLog.upsert({
    where: { userId_date: { userId, date } },
    update: { weight },
    create: { userId, date, weight },
  })
  revalidatePath('/evolucao')
}
