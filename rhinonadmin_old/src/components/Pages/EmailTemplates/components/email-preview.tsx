'use client'

import { Card } from '@/components/ui/card'

interface EmailPreviewProps {
  html: string
}

export default function EmailPreview({ html }: EmailPreviewProps) {
  return (
    <div className="p-6 space-y-4">
      <Card className="p-6 bg-white text-black min-h-96">
        <div
          dangerouslySetInnerHTML={{ __html: html }}
          className="prose prose-sm max-w-none"
        />
      </Card>
      <div className="p-3 bg-muted rounded-lg">
        <p className="text-xs text-muted-foreground font-mono break-all">
          {html}
        </p>
      </div>
    </div>
  )
}
