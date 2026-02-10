import { NextRequest, NextResponse } from 'next/server'

// In-memory storage (replace with database in production)
let templates: any[] = []

export async function GET() {
  return NextResponse.json(templates)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, subject, html } = body

    const templateId = id || Date.now().toString()
    const template = {
      id: templateId,
      name,
      subject,
      html,
      createdAt: new Date().toISOString(),
    }

    templates = templates.filter(t => t.id !== templateId)
    templates.push(template)

    return NextResponse.json(template)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save template' },
      { status: 500 }
    )
  }
}
