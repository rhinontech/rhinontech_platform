"use client"

import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

function useToast() {
  const toast = (props: ToastProps) => {
    const { title, description, variant } = props
    const message = description || title || "Notification"

    if (variant === "destructive") {
      sonnerToast.error(message, {
        description: title && description ? title : undefined,
      })
    } else {
      sonnerToast.success(message, {
        description: title && description ? title : undefined,
      })
    }
  }

  return { toast }
}

export { useToast, sonnerToast as toast }
