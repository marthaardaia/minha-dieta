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

export async function updateUserProfile(formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error('Acesso negado')
  
  const dietInstructions = formData.get('dietInstructions') as string
  const waterCupSize = parseInt(formData.get('waterCupSize') as string)
  const waterCupsGoal = parseInt(formData.get('waterCupsGoal') as string)

  await prisma.user.update({ 
    where: { id: session.userId }, 
    data: { 
      dietInstructions, 
      waterCupSize: isNaN(waterCupSize) ? undefined : waterCupSize,
      waterCupsGoal: isNaN(waterCupsGoal) ? undefined : waterCupsGoal
    } 
  })
  
  revalidatePath('/perfil')
  revalidatePath('/')
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
  const ingredient = await prisma.ingredient.findFirst({ where: { id, userId } })
  if (!ingredient) return

  await prisma.ingredient.updateMany({ where: { id, userId }, data: { isAvailable } })
  
  if (!isAvailable) {
    const existing = await prisma.shoppingItem.findFirst({
      where: { name: ingredient.name, userId, isBought: false }
    })
    
    if (!existing) {
      await prisma.shoppingItem.create({
        data: { name: ingredient.name, isBought: false, userId }
      })
    }
    revalidatePath('/compras')
  }

  revalidatePath('/despensa')
}

export async function updateIngredient(id: number, formData: FormData) {
  const userId = await getUserId()
  const name = formData.get('name') as string
  const category = formData.get('category') as string

  if (!name || !category) return

  await prisma.ingredient.updateMany({ 
    where: { id, userId }, 
    data: { name, category } 
  })
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
  revalidatePath('/evolucao')
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

  const user = await prisma.user.findUnique({ where: { id: userId } })
  const defaultDiet = `- Desjejum: (Variar entre as opções: 2 a 3 frutas, ou 2 pedaços de raiz/cuscuz, ou mingau, ou vitamina, ou 1 ovo cozido). Lembrete: 1 colher de sementes.
- Lanches (manhã e tarde): 1 fruta ou suco natural ou água de coco. Variar as frutas.
- Almoço: Salada crua (metade do prato), 2 colheres de arroz integral, 1 concha de feijão, 1 porção de proteína (frango, ovo, peixe). Variar a proteína e os legumes.
- Jantar: Sopa de legumes OU salada com arroz integral e ovo OU mingau de aveia OU vitamina. Variar.`

  const dietGuidelines = user?.dietInstructions || defaultDiet

  const ingredientList = ingredients.map(i => `- ${i.name}`).join('\n')

  // Lista de alimentos proibidos: itens marcados como "acabou" + alimentos comuns que não estão na despensa
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const availableNorm = ingredients.map(i => norm(i.name))
  const isAvailableTerm = (term: string) => {
    const t = norm(term)
    const root = t.replace(/s$/, '')
    return availableNorm.some(a => a.includes(root) || root.includes(a.replace(/s$/, '')))
  }
  const unavailable = await prisma.ingredient.findMany({ where: { isAvailable: false, userId } })
  const commonFoods = ['banana', 'morango', 'peixe', 'tilápia', 'sardinha', 'atum', 'salmão', 'castanha', 'castanha-do-pará', 'castanha de caju', 'nozes', 'amêndoa', 'amendoim', 'chia', 'linhaça', 'gergelim', 'semente de abóbora', 'mamão', 'maçã', 'melancia', 'melão', 'manga', 'pêra', 'abacate', 'abacaxi', 'laranja', 'uva', 'kiwi', 'goiaba', 'macaxeira', 'mandioca', 'batata doce', 'batata-doce', 'cará', 'inhame', 'cuscuz', 'aveia', 'iogurte', 'leite', 'queijo', 'frango', 'carne', 'ovo', 'arroz', 'feijão', 'lentilha', 'grão-de-bico', 'tomate', 'alface', 'cenoura', 'beterraba', 'pepino', 'brócolis', 'couve', 'repolho', 'abobrinha', 'abóbora', 'chuchu', 'espinafre', 'rúcula', 'pimentão', 'quiabo', 'vagem', 'berinjela', 'água de coco', 'tapioca', 'pão', 'granola', 'mel']
  const forbidden = Array.from(new Set([
    ...unavailable.map(i => i.name),
    ...commonFoods,
  ])).filter(f => !isAvailableTerm(f))

  const findViolations = (obj: any): string[] => {
    const all = norm(JSON.stringify(obj.dias || []))
    return forbidden.filter(f => {
      const t = norm(f).replace(/s$/, '')
      return new RegExp(`\\b${t.replace(/[-\s]/g, '[-\\s]')}(s|es)?\\b`).test(all)
    })
  }

  const prompt = `Você é uma nutricionista e assistente culinária. A usuária NÃO sabe cozinhar, quer EMAGRECER e precisa de um cardápio semanal VARIADO (7 dias, domingo a sábado).

=== DIRETRIZES DA NUTRICIONISTA (seguir a estrutura e as porções) ===
${dietGuidelines}

=== DESPENSA (ÚNICOS alimentos permitidos) ===
${ingredientList}

REGRAS OBRIGATÓRIAS:
1. Use SOMENTE os alimentos da lista DESPENSA acima. Qualquer alimento que não esteja na lista é PROIBIDO, mesmo que a diretriz o cite (ex.: se a diretriz pede castanha, semente, uma fruta, proteína ou legume que não está na lista, NÃO use; substitua por outro item da despensa do mesmo grupo, ou omita).
2. Exceções permitidas fora da lista: apenas água, sal, temperos secos básicos, alho, cebola, limão e azeite em pequena quantidade.
3. Siga a estrutura de cada refeição da diretriz (ex.: almoço = salada + arroz + feijão + proteína) usando os itens da despensa que se encaixam em cada grupo.
4. Informe as quantidades em medidas caseiras (colheres, conchas, unidades, gramas).
5. Para CADA refeição, informe a estimativa de calorias em um campo numérico separado (kcal_desjejum, kcal_lanche_manha, kcal_almoco, kcal_lanche_tarde, kcal_jantar). NÃO escreva as calorias dentro do texto da refeição.
6. Meta de emagrecimento: o total diário deve ficar em até 1500 kcal (ideal entre 1400 e 1500). Ajuste as porções para atingir essa meta, respeitando a estrutura da nutricionista.
7. Antes de responder, confira cada refeição: se algum alimento não está na despensa, troque-o.

=== ALIMENTOS PROIBIDOS (a usuária NÃO tem, NUNCA cite) ===
${forbidden.join(', ')}

Retorne APENAS um JSON válido (sem comentários) no formato:
{
  "prep_semana": "Guia de Batch Cooking...",
  "dias": [
    {
      "dia": 0,
      "desjejum": "...",
      "kcal_desjejum": 350,
      "lanche_manha": "...",
      "kcal_lanche_manha": 100,
      "almoco": "...",
      "kcal_almoco": 500,
      "lanche_tarde": "...",
      "kcal_lanche_tarde": 100,
      "jantar": "...",
      "kcal_jantar": 400
    }
  ]
}
Onde "dia": 0 = Domingo, 1 = Segunda, ..., 6 = Sábado. Gere os 7 dias.`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const candidateModels = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"]
    
    const callModel = async (p: string) => {
      let lastError: any = null
      for (const modelName of candidateModels) {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
        })
        let attempts = 0
        while (attempts < 3) {
          try {
            const result = await model.generateContent(p)
            return result.response.text()
          } catch (e: any) {
            lastError = e
            attempts++
            const msg = String(e?.message || '')
            if (msg.includes('503') || msg.includes('429')) {
              await new Promise(resolve => setTimeout(resolve, 1500))
              continue
            }
            break // try next candidate model if 404 or other non-retryable error
          }
        }
      }
      throw lastError || new Error("Falha ao comunicar com os modelos do Gemini.")
    }

    const parseJson = (text: string) => {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("A IA não retornou um formato JSON válido.")
      return JSON.parse(jsonMatch[0])
    }

    let parsed = parseJson(await callModel(prompt))
    let violations = findViolations(parsed)
    let fixRounds = 0
    while (violations.length > 0 && fixRounds < 3) {
      fixRounds++
      const fixPrompt = `${prompt}

Você gerou o cardápio abaixo, mas ele contém alimentos que a usuária NÃO TEM: ${violations.join(', ')}.
Reescreva o cardápio inteiro removendo TODOS esses alimentos e substituindo-os APENAS por itens da DESPENSA. Recalcule as calorias.

Cardápio anterior:
${JSON.stringify(parsed)}`
      parsed = parseJson(await callModel(fixPrompt))
      violations = findViolations(parsed)
    }
    if (violations.length > 0) {
      throw new Error(`a IA insistiu em usar itens fora da despensa (${violations.join(', ')}). Tente gerar novamente.`)
    }

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
      const dayIndex = d.dia === 7 ? 0 : d.dia;
      const k = (n: any) => (Number(n) > 0 ? Math.round(Number(n)) : 0)
      const withK = (txt: string, n: any) => (k(n) ? `${txt}\n\n🔥 ≈ ${k(n)} kcal` : txt)
      const total = k(d.kcal_desjejum) + k(d.kcal_lanche_manha) + k(d.kcal_almoco) + k(d.kcal_lanche_tarde) + k(d.kcal_jantar)
      mealsToCreate.push({ dayOfWeek: dayIndex, mealType: 'Desjejum', recipeText: withK(d.desjejum, d.kcal_desjejum) })
      mealsToCreate.push({ dayOfWeek: dayIndex, mealType: 'Lanche da Manhã', recipeText: withK(d.lanche_manha, d.kcal_lanche_manha) })
      mealsToCreate.push({ dayOfWeek: dayIndex, mealType: 'Almoço', recipeText: withK(d.almoco, d.kcal_almoco) })
      mealsToCreate.push({ dayOfWeek: dayIndex, mealType: 'Lanche da Tarde', recipeText: withK(d.lanche_tarde, d.kcal_lanche_tarde) })
      const totalText = total ? `\n\n📊 Total do dia: ≈ ${total} kcal (meta: 1500 kcal)` : ''
      mealsToCreate.push({ dayOfWeek: dayIndex, mealType: 'Jantar', recipeText: `${withK(d.jantar, d.kcal_jantar)}${totalText}` })
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
  const item = await prisma.shoppingItem.findFirst({ where: { id, userId } })
  if (!item) return

  await prisma.shoppingItem.updateMany({ where: { id, userId }, data: { isBought } })
  
  if (isBought) {
    const existing = await prisma.ingredient.findFirst({ 
      where: { name: item.name, userId } 
    })
    
    if (existing) {
       if (!existing.isAvailable) {
         await prisma.ingredient.update({ where: { id: existing.id }, data: { isAvailable: true } })
       }
    } else {
       await prisma.ingredient.create({
         data: { name: item.name, category: 'Outro', isAvailable: true, userId }
       })
    }
    revalidatePath('/despensa')
  }

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
