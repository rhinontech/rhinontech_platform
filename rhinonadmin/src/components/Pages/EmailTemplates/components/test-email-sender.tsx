'use client'

import { useState } from 'react'
import { Send, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TestEmailSenderProps {
  template: {
    name: string
    subject: string
    html: string
  }
}

export default function TestEmailSender({ template }: TestEmailSenderProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSendTest = async () => {
    if (!email.trim()) {
      setMessage('Please enter an email address')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          subject: template.subject,
          html: template.html,
        }),
      })

      if (!response.ok) throw new Error('Failed to send test email')

      setMessage(`Test email sent to ${email}!`)
      setEmail('')
    } catch (error) {
      setMessage('Error: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Send Test Email</p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="test@example.com"
        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
        disabled={loading}
      />
      <Button
        onClick={handleSendTest}
        disabled={loading}
        className="w-full bg-primary text-primary-foreground"
      >
        {loading ? (
          <>
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Send Test
          </>
        )}
      </Button>
      {message && (
        <p className={`text-xs ${message.includes('Error') ? 'text-destructive' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  )
}
