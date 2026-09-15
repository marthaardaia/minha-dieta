'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function addIngredient(formData: FormData) {
  const name = formData.get('name') as string
  const category = formData.get('category') as string

  if (!name || !category) return

  await prisma.ingredient.create({
    data: { name, category, isAvailable: true },
  })
  revalidatePath('/despensa')
}

export async function toggleIngredient(id: number, isAvailable: boolean) {
  await prisma.ingredient.update({ where: { id }, data: { isAvailable } })
  revalidatePath('/despensa')
}

export async function deleteIngredient(id: number) {
  await prisma.ingredient.delete({ where: { id } })
  revalidatePath('/despensa')
}

export async function markWater(date: string, timeSlot: string, consumed: boolean, justification?: string) {
  await prisma.waterLog.upsert({
    where: { date_timeSlot: { date, timeSlot } },
    update: { consumed, justification },
    create: { date, timeSlot, consumed, justification },
  })
  revalidatePath('/')
}

export async function markMeal(date: string, mealType: string, consumed: boolean, justification?: string) {
  await prisma.mealLog.upsert({
    where: { date_mealType: { date, mealType } },
    update: { consumed, justification },
    create: { date, mealType, consumed, justification },
  })
  revalidatePath('/')
}

export async function generateWeeklyMenu() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'COLOQUE_SUA_CHAVE_AQUI') {
    return { error: 'Chave da API do Gemini não configurada no arquivo .env' }
  }

  const ingredients = await prisma.ingredient.findMany({ where: { isAvailable: true } })
  const ingredientNames = ingredients.map(i => i.name).join(', ')

  if (ingredients.length < 3) {
    return { error: 'Adicione mais ingredientes na despensa para gerar o cardápio.' }
  }

  const prompt = `
Você é um assistente culinário especializado em dietas restritas.
A usuária não sabe cozinhar e quer um cardápio semanal VARIADO (7 dias) baseado nas diretrizes da nutricionista e no que tem na despensa.

Diretrizes da Dieta:
- Desjejum: (Variar entre as opções: 2 a 3 frutas, ou 2 pedaços de raiz/cuscuz, ou mingau, ou vitamina, ou 1 ovo cozido). Lembrete: 1 colher de sementes.
- Lanches (manhã e tarde): 1 fruta ou suco natural ou água de coco. Variar as frutas.
- Almoço: Salada crua (metade do prato), 2 colheres de arroz integral, 1 concha de feijão, 1 porção de proteína (frango, ovo, peixe). Variar a proteína e os legumes.
- Jantar: Sopa de legumes OU salada com arroz integral e ovo OU mingau de aveia OU vitamina. Variar.

Ingredientes disponíveis na despensa: ${ingredientNames}. (Se faltar algo básico para as regras, invente com o que é permitido).

Retorne EXATAMENTE UM JSON no formato:
{
  "prep_semana": "Guia de Batch Cooking: como cozinhar o arroz, feijão, frango e legumes de uma vez para guardar na geladeira e facilitar a semana toda.",
  "dias": [
    {
      "dia": 1, // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
      "desjejum": "...",
      "lanche_manha": "...",
      "almoco": "...",
      "lanche_tarde": "...",
      "jantar": "..."
    },
    // ... repita para os 7 dias (0 a 6)
  ]
}
`

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
    
    // Adiciona o guia de prep como uma "refeição" geral
    mealsToCreate.push({
      dayOfWeek: -1,
      mealType: 'Guia de Preparo (Batch Cooking)',
      recipeText: parsed.prep_semana
    })

    // Adiciona as refeições diárias
    for (const d of parsed.dias) {
      mealsToCreate.push({ dayOfWeek: d.dia, mealType: 'Desjejum', recipeText: d.desjejum })
      mealsToCreate.push({ dayOfWeek: d.dia, mealType: 'Lanche da Manhã', recipeText: d.lanche_manha })
      mealsToCreate.push({ dayOfWeek: d.dia, mealType: 'Almoço', recipeText: d.almoco })
      mealsToCreate.push({ dayOfWeek: d.dia, mealType: 'Lanche da Tarde', recipeText: d.lanche_tarde })
      mealsToCreate.push({ dayOfWeek: d.dia, mealType: 'Jantar', recipeText: d.jantar })
    }

    const menu = await prisma.weeklyMenu.create({
      data: {
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
  const name = formData.get('name') as string
  if (!name) return
  await prisma.shoppingItem.create({ data: { name } })
  revalidatePath('/compras')
}
export async function toggleShoppingItem(id: number, isBought: boolean) {
  await prisma.shoppingItem.update({ where: { id }, data: { isBought } })
  revalidatePath('/compras')
}
export async function deleteShoppingItem(id: number) {
  await prisma.shoppingItem.delete({ where: { id } })
  revalidatePath('/compras')
}
export async function saveFavoriteRecipe(name: string, mealType: string, recipeText: string) {
  await prisma.favoriteRecipe.create({ data: { name, mealType, recipeText } })
  revalidatePath('/favoritos')
}
export async function deleteFavoriteRecipe(id: number) {
  await prisma.favoriteRecipe.delete({ where: { id } })
  revalidatePath('/favoritos')
}
export async function addWeightLog(formData: FormData) {
  const date = formData.get('date') as string
  const weight = parseFloat(formData.get('weight') as string)
  if (!date || isNaN(weight)) return
  await prisma.weightLog.upsert({
    where: { date },
    update: { weight },
    create: { date, weight },
  })
  revalidatePath('/evolucao')
}
