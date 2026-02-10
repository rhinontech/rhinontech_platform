'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Trash2, Eye } from 'lucide-react'

interface Template {
  id: string
  name: string
  subject: string
  html: string
  createdAt?: string
}

interface TemplateListProps {
  templates: Template[]
  onLoad: (template: Template) => void
  onDelete: (id: string) => void
  onDuplicate: (template: Template) => void
}

export default function TemplateList({
  templates,
  onLoad,
  onDelete,
  onDuplicate,
}: TemplateListProps) {
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">No templates yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first template to get started
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {templates.map((template) => (
        <Card key={template.id} className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold">{template.name}</h3>
              <p className="text-sm text-muted-foreground">
                Subject: {template.subject}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onLoad(template)}
              className="flex-1"
            >
              <Eye className="w-3 h-3 mr-1" />
              Open
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDuplicate(template)}
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(template.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
