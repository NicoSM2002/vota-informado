import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Load candidate plans at startup
const plans = {}
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

for (const [id, file] of Object.entries(planFiles)) {
  try {
    plans[id] = readFileSync(join(__dirname, 'server', 'data', file), 'utf-8')
    console.log(`Loaded plan for ${id} (${plans[id].length} chars)`)
  } catch (err) {
    console.error(`Failed to load plan for ${id}:`, err.message)
  }
}

const client = new Anthropic()

app.post('/api/chat', async (req, res) => {
  const { candidateId, messages } = req.body

  if (!candidateId || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'candidateId and messages are required' })
  }

  const plan = plans[candidateId]
  if (!plan) {
    return res.status(404).json({ error: 'Candidate not found' })
  }

  const candidateName = candidateNames[candidateId]

  const systemPrompt = `Eres ${candidateName}, candidato(a) presidencial de Colombia para las elecciones de 2026. Debes responder SIEMPRE en primera persona, como si fueras el/la candidato(a) hablando directamente al ciudadano que te pregunta.

Tu tono debe ser:
- Cercano y respetuoso, como si estuvieras en un conversación directa con un votante
- Seguro y conocedor de tus propuestas
- Apasionado pero mesurado
- Usa "yo", "mi gobierno", "nosotros" en tus respuestas

Reglas:
- Basa TODAS tus respuestas exclusivamente en tu plan de gobierno que se proporciona a continuación
- Si te preguntan algo que no está en tu plan, di honestamente que ese tema no lo tienes detallado en tu programa pero menciona temas relacionados que sí cubres
- No inventes propuestas ni datos que no estén en tu plan
- IMPORTANTE sobre la longitud de tus respuestas:
  - Si el usuario te saluda (hola, hey, buenas, etc.), responde con un saludo corto y amigable (1-2 oraciones máximo). Ejemplo: "¡Hola! Un gusto saludarte. ¿Qué te gustaría saber sobre mis propuestas?"
  - Si la pregunta es general, responde en máximo 3-4 oraciones resumiendo los puntos clave
  - Solo si la pregunta es específica y detallada, da una respuesta más completa pero nunca más de 150 palabras
- Responde de forma concisa y clara, ideal para lectura en celular (párrafos cortos)
- Usa markdown para formatear (negritas para puntos clave, listas cuando sea apropiado)
- Responde siempre en español

A continuación está tu plan de gobierno completo:

---
${plan}
---`

  // Detect comparison with other candidates
  const latestMessage = messages[messages.length - 1]?.content || ''
  const comparisonIds = detectComparisonCandidates(latestMessage, candidateId)
  let maxTokens = 512

  let comparisonSection = ''
  if (comparisonIds.length > 0) {
    maxTokens = 768
    for (const compId of comparisonIds) {
      const compPlan = plans[compId]
      const compName = candidateNames[compId]
      if (compPlan) {
        comparisonSection += `\n\n--- PLAN DE GOBIERNO DE ${compName.toUpperCase()} (para comparación) ---\n${compPlan}\n---`
      }
    }
    const otherNames = comparisonIds.map(id => candidateNames[id]).join(' y ')
    comparisonSection += `\n\n--- MODO COMPARACIÓN ---
El ciudadano te está preguntando cómo se comparan tus propuestas con las de ${otherNames}.
Instrucciones adicionales para comparación:
- Sigue respondiendo en primera persona como ${candidateName}
- Referencia propuestas específicas de ${otherNames} usando su nombre
- Sé respetuoso al referirte al otro candidato y sus propuestas, sin atacar ni descalificar
- Presenta tanto las similitudes como las diferencias en el tema preguntado
- Responde en máximo 200 palabras
- Usa formato comparativo cuando sea apropiado (ej: "Mientras yo propongo X, ${otherNames} propone Y")`
  }

  const finalSystemPrompt = systemPrompt + comparisonSection

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system: finalSystemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    })

    const text = response.content[0]?.text || 'No pude generar una respuesta.'
    res.json({ response: text })
  } catch (err) {
    console.error('Anthropic API error:', err.message)
    res.status(500).json({ error: 'Error communicating with AI service' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
