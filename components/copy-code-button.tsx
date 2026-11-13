"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

interface CopyCodeButtonProps {
  code: string
}

export function CopyCodeButton({ code }: CopyCodeButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" className="w-full gap-2" onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Código copiado
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copiar código
        </>
      )}
    </Button>
  )
}
