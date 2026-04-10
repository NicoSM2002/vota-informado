import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Supabase client (fire-and-forget logging)
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null

const planFiles = {
  abelardo: 'abelardo.md',
  claudia: 'claudia.md',
  ivan: 'ivan.md',
  paloma: 'paloma.md',
  sergio: 'sergio.md',
}

const candidateNames = {
  abelardo: 'Abelardo De la Espriella',
  claudia: 'Claudia López',
  ivan: 'Iván Cepeda',
  paloma: 'Paloma Valencia',
  sergio: 'Sergio Fajardo',
}

// Name variants for comparison detection
const nameVariants = {
  'abelardo': 'abelardo', 'espriella': 'abelardo', 'de la espriella': 'abelardo',
  'claudia': 'claudia', 'lopez': 'claudia',
  'ivan': 'ivan', 'cepeda': 'ivan',
  'paloma': 'paloma', 'valencia': 'paloma',
  'sergio': 'sergio', 'fajardo': 'sergio',
}

function normalizeText(str) {
  return str.toLowerCase()
    .replace(/[áà]/g, 'a').replace(/[éè]/g, 'e').replace(/[íì]/g, 'i')
    .replace(/[óò]/g, 'o').replace(/[úù]/g, 'u').replace(/ñ/g, 'n')
}

function detectComparisonCandidates(text, currentCandidateId) {
  const normalized = normalizeText(text)
  const found = new Set()
  // Check longer variants first to avoid partial matches
  const sortedVariants = Object.keys(nameVariants).sort((a, b) => b.length - a.length)
  for (const variant of sortedVariants) {
    const regex = new RegExp(`\\b${variant}\\b`)
    if (regex.test(normalized)) {
      const id = nameVariants[variant]
      if (id !== currentCandidateId) found.add(id)
    }
  }
  return [...found].slice(0, 2)
}

// Load plans
const plans = {}
for (const [id, file] of Object.entries(planFiles)) {
  try {
    plans[id] = readFileSync(join(process.cwd(), 'server', 'data', file), 'utf-8')
  } catch {
    // fallback for Vercel
    try {
      plans[id] = readFileSync(join('/var/task', 'server', 'data', file), 'utf-8')
    } catch {
      plans[id] = null
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { candidateId, messages } = req.body

  if (!candidateId || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'candidateId and messages are required' })
  }

  const plan = plans[candidateId]
  if (!plan) {
    return res.status(404).json({ error: 'Candidate not found' })
  }

  const candidateName = candidateNames[candidateId]

  // Detect comparison with other candidates
  const latestMessage = messages[messages.length - 1]?.content || ''
  const comparisonIds = detectComparisonCandidates(latestMessage, candidateId)
  const isComparison = comparisonIds.length > 0
  const maxTokens = isComparison ? 768 : 512

  let comparisonPlans = ''
  let comparisonInstructions = ''
  if (isComparison) {
    const otherNames = comparisonIds.map(id => candidateNames[id]).join(' y ')
    for (const compId of comparisonIds) {
      const compPlan = plans[compId]
      const compName = candidateNames[compId]
      if (compPlan) {
        comparisonPlans += `\n\n--- PLAN DE GOBIERNO DE ${compName.toUpperCase()} (para comparación) ---\n${compPlan}\n---`
      }
    }
    comparisonInstructions = `
- IMPORTANTE: El ciudadano te está pidiendo que compares tus propuestas con las de ${otherNames}. Más abajo encontrarás el plan de gobierno de ${otherNames} para que puedas hacer una comparación informada.
- Sigue respondiendo en primera persona como ${candidateName}
- Referencia propuestas específicas de ${otherNames} usando su nombre
- Sé respetuoso al referirte al otro candidato, sin atacar ni descalificar
- Presenta similitudes Y diferencias en el tema preguntado
- Usa formato comparativo (ej: "Mientras yo propongo X, ${otherNames} propone Y")
- NUNCA uses tablas markdown. Usa listas o párrafos cortos para comparar.
- Responde en máximo 200 palabras`
  }

  const dataRule = isComparison
    ? '- Basa tus respuestas en tu plan de gobierno Y en el plan del otro candidato que se proporcionan a continuación. Usa AMBOS planes para hacer comparaciones informadas y precisas.'
    : '- Basa TODAS tus respuestas exclusivamente en tu plan de gobierno que se proporciona a continuación'

  const finalSystemPrompt = `Eres ${candidateName}, candidato(a) presidencial de Colombia para las elecciones de 2026. Debes responder SIEMPRE en primera persona, como si fueras el/la candidato(a) hablando directamente al ciudadano que te pregunta.

Tu tono debe ser:
- Cercano y respetuoso, como si estuvieras en una conversación directa con un votante
- Seguro y conocedor de tus propuestas
- Apasionado pero mesurado
- Usa "yo", "mi gobierno", "nosotros" en tus respuestas

Reglas:
${dataRule}
- Si te preguntan algo que no está en tu plan, di honestamente que ese tema no lo tienes detallado en tu programa pero menciona temas relacionados que sí cubres
- No inventes propuestas ni datos que no estén en los planes proporcionados${comparisonInstructions}
- IMPORTANTE sobre la longitud de tus respuestas:
  - Si el usuario te saluda (hola, hey, buenas, etc.), responde con un saludo corto y amigable (1-2 oraciones máximo). Ejemplo: "¡Hola! Un gusto saludarte. ¿Qué te gustaría saber sobre mis propuestas?"
  - Si la pregunta es general, responde en máximo 3-4 oraciones resumiendo los puntos clave
  - Solo si la pregunta es específica y detallada, da una respuesta más completa pero nunca más de ${isComparison ? '200' : '150'} palabras
- Responde de forma concisa y clara, ideal para lectura en celular (párrafos cortos)
- Usa markdown para formatear (negritas para puntos clave, listas cuando sea apropiado)
- Responde siempre en español

A continuación está tu plan de gobierno completo:

---
${plan}
---${comparisonPlans}`

  // Fire-and-forget: log question to Supabase (does NOT slow down response)
  if (supabase) {
    supabase.from('chat_logs').insert({
      candidate_id: candidateId,
      question: latestMessage,
      is_comparison: isComparison,
      compared_with: isComparison ? comparisonIds : null,
    }).then(() => {}).catch(() => {})
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: finalSystemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })

    const text = response.content[0]?.text || 'No pude generar una respuesta.'
    res.json({ response: text })
  } catch (err) {
    console.error('Anthropic API error:', err.message)
    res.status(500).json({ error: 'Error communicating with AI service' })
  }
}
