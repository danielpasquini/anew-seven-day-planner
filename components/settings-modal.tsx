"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, Download, Palette, X } from "lucide-react"
import { useStore } from "@/lib/store"
import { titleCase } from "@/lib/title-case"
import { cn } from "@/lib/utils"
import { useModalAccessibility } from "@/components/modal-accessibility"
import { SettingsWeeksTab } from "./settings/settings-weeks-tab"
import { SettingsPlanningTab } from "./settings/settings-planning-tab"
import { SettingsAppearanceTab } from "./settings/settings-appearance-tab"
import { SettingsExportTab } from "./settings/settings-export-tab"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: "semanas" | "programacao" | "aparencia" | "exportacao"
  onCreateWeek: () => void
}

export function SettingsModal({
  isOpen,
  onClose,
  initialTab = "semanas",
  onCreateWeek,
}: SettingsModalProps) {
  const dialogRef = useModalAccessibility(isOpen, onClose)
  const { activeWeek, locale, storageReadOnly, t } = useStore()
  const [activeTab, setActiveTab] = useState<"semanas" | "programacao" | "aparencia" | "exportacao">(initialTab)

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  if (!isOpen) return null

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className="relative flex flex-col w-full max-w-4xl h-full sm:h-auto sm:max-h-[90vh] bg-card text-card-foreground border-0 sm:border border-border rounded-none sm:rounded-2xl shadow-2xl overflow-hidden"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Palette className="size-4" aria-hidden="true" />
            </div>
            <h3 id="settings-modal-title" className="font-serif text-lg font-semibold text-foreground">
              {titleCase(t.settings.title)}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition touch-manipulation"
            aria-label={t.common.close}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* Tab Navigation & Content */}
        <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Sidebar Tabs */}
          <nav
            aria-label={locale === "en-US" ? "Settings sections" : "Abas de configuração"}
            className="flex sm:flex-col overflow-x-auto sm:overflow-x-visible border-b sm:border-b-0 sm:border-r border-border p-2 sm:p-3 sm:w-56 shrink-0 gap-1 bg-muted/20"
          >
            <button
              type="button"
              aria-pressed={activeTab === "semanas"}
              onClick={() => setActiveTab("semanas")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition text-left whitespace-nowrap touch-manipulation min-h-[2.5rem]",
                activeTab === "semanas"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Calendar className="size-4 shrink-0" aria-hidden="true" />
              <span>{titleCase(t.settings.tabs.weeks)}</span>
            </button>

            <button
              type="button"
              aria-pressed={activeTab === "programacao"}
              onClick={() => setActiveTab("programacao")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition text-left whitespace-nowrap touch-manipulation min-h-[2.5rem]",
                activeTab === "programacao"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Clock className="size-4 shrink-0" aria-hidden="true" />
              <span>{titleCase(t.settings.tabs.schedule)}</span>
            </button>

            <button
              type="button"
              aria-pressed={activeTab === "aparencia"}
              onClick={() => setActiveTab("aparencia")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition text-left whitespace-nowrap touch-manipulation min-h-[2.5rem]",
                activeTab === "aparencia"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Palette className="size-4 shrink-0" aria-hidden="true" />
              <span>{titleCase(t.settings.tabs.appearance)}</span>
            </button>

            <button
              type="button"
              aria-pressed={activeTab === "exportacao"}
              onClick={() => setActiveTab("exportacao")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition text-left whitespace-nowrap touch-manipulation min-h-[2.5rem]",
                activeTab === "exportacao"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Download className="size-4 shrink-0" aria-hidden="true" />
              <span>{titleCase(t.settings.tabs.export)}</span>
            </button>
          </nav>

          {/* Main Content Body */}
          <fieldset
            disabled={storageReadOnly && activeTab !== "exportacao"}
            aria-label={locale === "en-US" ? "Settings content" : "Conteúdo das configurações"}
            className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
          >
            {activeTab === "semanas" && <SettingsWeeksTab onCreateWeek={onCreateWeek} />}
            {activeTab === "programacao" && <SettingsPlanningTab />}
            {activeTab === "aparencia" && <SettingsAppearanceTab />}
            {activeTab === "exportacao" && <SettingsExportTab />}
          </fieldset>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-3 sm:px-6 shrink-0">
          <span className="text-xs text-muted-foreground">
            {activeWeek ? `${t.settings.activeWeekLabel} ${activeWeek.title}` : ""}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition touch-manipulation min-h-[2.25rem]"
          >
            {t.common.done}
          </button>
        </div>
      </div>
    </div>
  )
}
