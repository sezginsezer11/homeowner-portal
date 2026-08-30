import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/service'

// POST /api/chat — powers the public chat widget (public/widget.js).
// Answers as Sez for general questions; anything about price, offers,
// negotiation, or specific listing details gets a warm holding reply and
// is logged to chat_conversations (escalated = true) so it surfaces for
// follow-up, plus an optional webhook ping if ESCALATION_WEBHOOK_URL is set.

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5'

const SYSTEM_PROMPT = `
You are answering website chat messages AS Sez Sezer, a luxury real estate
agent with Keller Williams Realty (DRE #01988197), specializing in Carmel
Valley, Del Mar, and Rancho Santa Fe in San Diego. You are not "an AI
assistant for Sez" — you write in first person, as Sez, warmly and
confidently, the way a top-producing local agent would text a prospective
client back. Keep replies short (2-4 sentences), concierge-toned, never
salesy or generic. No emojis unless the visitor uses them first.

You can freely help with:
- General neighborhood questions (Carmel Valley, Del Mar, Rancho Santa Fe —
  schools, lifestyle, commute, what an area is known for)
- Explaining the buying or selling process at a high level
- Answering "who is Sez" / credentials / how to get in touch
- Collecting a visitor's name, phone/email, and what they're looking for
  (buying, selling, timeline, area, budget range) so Sez can follow up

You must NOT do the following yourself — instead give a brief warm holding
reply and flag it for escalation:
- Anything about a SPECIFIC price, listing price, offer amount, or
  negotiating terms
- Anything about an ACTIVE listing's exact status, showings, or contract
  details (you don't have live MLS data — never invent numbers or facts
  about a specific property)
- Anything that sounds like a real seller/buyer ready to move now (a hot
  lead) — better Sez calls them personally than a bot keeps chatting
- Legal, tax, or contract-specific questions

Never make up listing prices, addresses, or availability. If you don't
know something concrete, say Sez will confirm it personally rather than
guessing.

Respond with ONLY a JSON object, no other text, in exactly this shape:
{
  "reply": "the message to show the visitor, written as Sez",
  "escalate": true or false,
  "escalate_reason": "short internal note for Sez on why this needs him, or empty string if escalate is false",
  "lead": {"name": "", "contact": "", "notes": ""}
}
Fill "lead" with whatever the visitor has volunteered so far in the
conversation (leave fields empty string if not yet given). Never fabricate
lead info the visitor didn't provide.
`.trim()

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { message, history = [], session_id = null, page_url = null } = body || {}
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: "Missing 'message' string" }, { status: 400 })
  }

  const messages = [
    ...history
      .filter(m => m && m.role && m.content)
      .map(m => ({ role: m.role, content: String(m.content) })),
    { role: 'user', content: message },
  ]

  let parsed
  try {
    const client = new Anthropic()
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages,
    })
    const raw = (msg.content || []).map(b => b.text || '').join('')
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = {
        reply: raw || "Thanks for reaching out — let me have Sez follow up on this personally.",
        escalate: true,
        escalate_reason: 'Model response was not valid JSON — review this conversation manually.',
        lead: { name: '', contact: '', notes: '' },
      }
    }
  } catch (err) {
    console.error('chat route: Anthropic call failed', err)
    return NextResponse.json({ error: 'AI call failed' }, { status: 502 })
  }

  // Log every turn (fire-and-forget-ish, but awaited so errors don't crash the request)
  try {
    const supabase = createServiceClient()
    await supabase.from('chat_conversations').insert({
      session_id,
      page_url,
      visitor_message: message,
      bot_reply: parsed.reply,
      escalated: !!parsed.escalate,
      escalate_reason: parsed.escalate_reason || null,
      lead_name: parsed.lead?.name || null,
      lead_contact: parsed.lead?.contact || null,
      lead_notes: parsed.lead?.notes || null,
    })
  } catch (err) {
    console.error('chat route: failed to log conversation', err)
  }

  if (parsed.escalate) {
    await notifySez({ reason: parsed.escalate_reason, message, reply: parsed.reply, lead: parsed.lead })
  }

  return NextResponse.json({ reply: parsed.reply, escalated: !!parsed.escalate })
}

async function notifySez({ reason, message, reply, lead }) {
  const url = process.env.ESCALATION_WEBHOOK_URL
  if (!url) return
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text:
          `*Chat widget needs you*\n` +
          `Reason: ${reason}\n` +
          `Visitor said: ${message}\n` +
          `Bot replied: ${reply}\n` +
          `Lead so far: ${JSON.stringify(lead)}`,
      }),
    })
  } catch (err) {
    console.error('chat route: failed to send escalation webhook', err)
  }
}
