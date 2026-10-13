"use client"

import { useEffect, useRef } from "react"

let openDialogs = 0
let previousOverflow = ""

/** Keyboard and focus behavior shared by dialogs, including nested dialogs. */
export function useModalAccessibility(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!isOpen) return
    const dialog = dialogRef.current
    if (!dialog) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (openDialogs++ === 0) {
      previousOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
    }
    const isTopDialog = () => {
      const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]'))
        .filter((element) => element.getClientRects().length > 0)
      return dialogs.at(-1) === dialog
    }
    const focusableElements = () => Array.from(dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter((element) => element.getClientRects().length > 0 && !element.closest('[inert], [aria-hidden="true"]'))
    const focusFirst = () => (focusableElements()[0] || dialog).focus({ preventScroll: true })
    const frame = requestAnimationFrame(focusFirst)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTopDialog()) return
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        closeRef.current()
      } else if (event.key === "Tab") {
        const elements = focusableElements()
        const first = elements[0]
        const last = elements.at(-1)
        if (!first || !last) {
          event.preventDefault()
          dialog.focus()
        } else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    const handleFocus = (event: FocusEvent) => {
      if (isTopDialog() && event.target instanceof Node && !dialog.contains(event.target)) focusFirst()
    }
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("focusin", handleFocus)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("focusin", handleFocus)
      if (--openDialogs === 0) document.body.style.overflow = previousOverflow
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [isOpen])
  return dialogRef
}
