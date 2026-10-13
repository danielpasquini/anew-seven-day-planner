"use client"

import { CreateWeekModal } from "@/components/week-modal"

/** Compatibility for callers being migrated to direct week creation. */
export function CreateGuideModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return <CreateWeekModal isOpen={isOpen} onClose={onClose} />
}
