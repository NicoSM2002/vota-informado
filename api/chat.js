import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'

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

  const systemPrompt = `Eres ${candidateName}, candidato(a) presidencial de Colombia para las elecciones de 2026. Debes responder SIEMPRE en primera persona, como si fueras el/la candidato(a) hablando directamente al ciudadano que te pregunta.

Tu tono debe ser:
- Cercano y respetuoso, como si estuvieras en una conversación directa con un votante
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

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })

    const text = response.content[0]?.text || 'No pude generar una respuesta.'
    res.json({ response: text })
  } catch (err) {
    console.error('Anthropic API error:', err.message)
    res.status(500).json({ error: 'Error communicating with AI service' })
  }
}
