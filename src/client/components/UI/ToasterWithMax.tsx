'use client'

import type React from 'react'
import { useEffect } from 'react'
import toast, { Toaster, useToasterStore } from 'react-hot-toast'

function useMaxToasts(max: number) {
  const { toasts } = useToasterStore()

  useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .filter((_, i) => i >= max)
      .forEach((t) => toast.dismiss(t.id))
  }, [toasts, max])
}

export function ToasterWithMax({
  max = 3,
  ...props
}: React.ComponentProps<typeof Toaster> & {
  max?: number
}) {
  useMaxToasts(max)

  return <Toaster {...props} />
}
