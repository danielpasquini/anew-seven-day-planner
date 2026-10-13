"use client"

import { titleCase } from "@/lib/title-case"

import { useState, useRef, useEffect } from "react"
import {
  Calendar,
  Clock,
  Palette,
  Download,
  X,
  Plus,
  Trash2,
  Check,
  Edit2,
  Sun,
  Moon,
  Monitor,
  Printer,
  FileText,
  FileJson,
  Database,
  Upload,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
} from "lucide-react"
import {
  useStore,
  PALETTES,
  type WeekInstance,
} from "@/lib/store"
import {
  formatDateRangeLocale,
  getTodayFormatted,
  getWeekDays,
} from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { useModalAccessibility } from "@/components/modal-accessibility"
import { isValidBackup } from "@/lib/backup-validation"
import { isNativeApp } from "@/lib/platform"

const SETTINGS_TEXT: Record<string, string> = {
  "Arquivo corrompido ou não é um JSON válido.": "The file is corrupted or is not valid JSON.",
  "Backup restaurado com sucesso!": "Backup restored successfully.",
  "Falha ao restaurar backup. Arquivo inválido ou corrompido.": "The backup could not be restored. The file is invalid or corrupted.",
  "Abas de configuração": "Settings sections",
  "Semana Selecionada": "Selected week",
  "Adicione, altere os horários ou remova compromissos para cada dia da semana ativa.": "Add, adjust or remove activities for each day of your selected week.",
  "Horário": "Time",
  "Descrição da Tarefa": "Activity description",
  "Adicionar": "Add",
  "Nenhuma atividade cadastrada para este dia. Adicione uma atividade acima!": "No activities for this day yet. You can add one above or leave room for rest.",
  "Tradução clássica de referência": "Traditional Portuguese translation",
  "Linguagem contemporânea e clara": "Contemporary Portuguese translation",
  "Ativa": "Active",
  "Fundo (Background)": "Background",
  "Superfície (Card)": "Surface",
  "Cor Primária": "Primary color",
  "Destaque / Títulos": "Accent color",
  "Confirmar restauração de backup?": "Restore this backup?",
  "Isso": "This will",
  "substituirá todos os dados atuais": "replace all current data",
  "pelo conteúdo do arquivo.": "with the file contents.",
  "no arquivo:": "in this file:",
  "...e mais": "...and",
  "Exportado em:": "Exported on:",
  "Restaurar agora": "Restore backup",
  "semana": "week",
  "semanas": "weeks",
  "Rotina de atividades": "Activity routine",
  "Adicionar atividade": "Add activity",
  "Atividades deste dia": "Activities for this day",
  "Original (Pinho Sálvia)": "Sage & paper",
  "Pinho & Papel Quente": "Sage & warm paper",
  "Visual original do aplicativo. Equilíbrio, serenidade e papel aquecido.": "Soft greens and warm paper for a calm reading space.",
  "Terracota Editorial": "Terracotta",
  "Argila & Barro Quente": "Clay & warm earth",
  "Cores quentes e orgânicas com tom de barro e aterramento.": "Warm, earthy colors with a soft clay accent.",
  "Sábia Editorial": "Ocean blue",
  "Azul Marinho & Índigo": "Navy & indigo",
  "Serenidade oceânica, clareza mental e estrutura sóbria.": "Quiet blues and clean, readable surfaces.",
  "Grafite Elefante": "Graphite",
  "Carvão Monocromático": "Charcoal & neutral paper",
  "Minimalismo contemporâneo e sóbrio em escala neutra.": "A simple, neutral palette with charcoal accents.",
  "Oliva Editorial": "Olive",
  "Verde Oliva & Amêndoa": "Olive & almond",
  "Tons botânicos de oliva e terra com leiturabilidade acolhedora.": "Botanical greens and soft earth tones."
}

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: "semanas" | "programacao" | "aparencia" | "exportacao"
}

export function SettingsModal({ isOpen, onClose, initialTab = "semanas" }: SettingsModalProps) {
  const dialogRef = useModalAccessibility(isOpen, onClose)
  const {
    weeks,
    activeWeek,
    activeGuide,
    selectWeek,
    createWeek,
    deleteWeek,
    theme,
    setTheme,
    palette,
    setPalette,
    locale,
    setLocale,
    bibleVersion,
    setBibleVersion,
    t,
    exportToMarkdown,
    exportWeekJSON,
    exportToJSON,
    importFromJSON,
    addScheduleActivity,
    updateScheduleActivity,
    deleteScheduleActivity,
    moveScheduleActivity,
    storageReadOnly,
    aiError,
  } = useStore()

  const copy = (pt: string) => locale === "en-US" ? SETTINGS_TEXT[pt] || pt : pt

  const [activeTab, setActiveTab] = useState<"semanas" | "programacao" | "aparencia" | "exportacao">(initialTab)

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

  // Section 1: Semanas Form state
  const [newWeekTitle, setNewWeekTitle] = useState("")
  const [newWeekStartDate, setNewWeekStartDate] = useState(getTodayFormatted())
  const [deletingWeek, setDeletingWeek] = useState<WeekInstance | null>(null)

  // Section 2: Programação Editor state
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0)
  const [newActTime, setNewActTime] = useState("16:30")
  const [newActDesc, setNewActDesc] = useState("")
  const [editingActId, setEditingActId] = useState<string | null>(null)
  const [editActTime, setEditActTime] = useState("")
  const [editActDesc, setEditActDesc] = useState("")

  // Section 4: Import state
  const [importStatus, setImportStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Pending import confirmation
  const [pendingImport, setPendingImport] = useState<{
    raw: string
    weekCount: number
    weekTitles: string[]
    exportedAt: string | null
  } | null>(null)

  if (!isOpen) return null

  // Create week handler
  const handleCreateWeek = (e: React.FormEvent) => {
    e.preventDefault()
    const autoTitle = `${t.week.weekNumberLabel} ${weeks.length + 1}`
    createWeek(newWeekTitle.trim() || autoTitle, newWeekStartDate || getTodayFormatted())
    setNewWeekTitle("")
    setNewWeekStartDate(getTodayFormatted())
  }

  // Delete week handler
  const handleConfirmDeleteWeek = () => {
    if (deletingWeek) {
      deleteWeek(deletingWeek.id)
      setDeletingWeek(null)
    }
  }

  // Programação: Add activity handler
  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newActDesc.trim()) return
    addScheduleActivity(selectedDayIndex, newActTime.trim() || "12:00", newActDesc.trim())
    setNewActDesc("")
  }

  // Programação: Start edit handler
  const handleStartEdit = (actId: string, time: string, desc: string) => {
    setEditingActId(actId)
    setEditActTime(time)
    setEditActDesc(desc)
  }

  // Programação: Save edit handler
  const handleSaveEdit = (actId: string) => {
    if (!editActDesc.trim()) return
    updateScheduleActivity(actId, {
      time: editActTime || "12:00",
      description: editActDesc.trim(),
    })
    setEditingActId(null)
  }

  // Import JSON handler — parse and show confirmation first
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setImportStatus({ type: "error", msg: locale === "en-US" ? "The backup must be 10 MiB or smaller." : "O backup deve ter no máximo 10 MiB." })
      e.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (!content) return
      try {
        const parsed: unknown = JSON.parse(content)
        if (!isValidBackup(parsed)) {
          setImportStatus({ type: "error", msg: locale === "en-US" ? "The backup is invalid or incomplete. Your current data has not been changed." : "O backup é inválido ou incompleto. Seus dados atuais não foram alterados." })
          return
        }
        // Stage for confirmation
        setPendingImport({
          raw: content,
          weekCount: parsed.weeks.length,
          weekTitles: parsed.weeks.slice(0, 5).map((week) => String(week.title)),
          exportedAt: typeof parsed.exportedAt === "string" && Number.isFinite(Date.parse(parsed.exportedAt)) ? parsed.exportedAt : null,
        })
      } catch {
        setImportStatus({ type: "error", msg: copy("Arquivo corrompido ou não é um JSON válido.") })
      }
    }
    reader.onerror = () => setImportStatus({ type: "error", msg: locale === "en-US" ? "The file could not be read. Try another backup." : "Não foi possível ler o arquivo. Tente outro backup." })
    reader.readAsText(file)
    e.target.value = ""
  }

  const handleConfirmImport = () => {
    if (!pendingImport) return
    const ok = importFromJSON(pendingImport.raw)
    setPendingImport(null)
    if (ok) {
      setImportStatus({ type: "success", msg: copy("Backup restaurado com sucesso!") })
    } else {
      setImportStatus({ type: "error", msg: copy("Falha ao restaurar backup. Arquivo inválido ou corrompido.") })
    }
  }

  const days = activeWeek ? getWeekDays(activeWeek.startDate, locale) : []
  const activities = activeWeek?.programacao?.activities || []
  const dayActivities = activities
    .filter((a) => a.dayIndex === selectedDayIndex)
    .sort((a, b) => a.order - b.order || a.time.localeCompare(b.time))

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      {/* Container */}
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

        {/* Modal Layout: Sidebar Navigation + Main Content Area */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Navigation Bar / Tabs */}
          <nav
            aria-label={copy("Abas de configuração")}
            className="flex flex-row md:flex-col shrink-0 border-b md:border-b-0 md:border-r border-border bg-muted/20 p-2 gap-1 overflow-x-auto md:w-56"
          >
            <button
              type="button"
              aria-pressed={activeTab === "semanas"}
              onClick={() => setActiveTab("semanas")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition touch-manipulation whitespace-nowrap min-h-[2.5rem]",
                activeTab === "semanas"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Calendar className="size-4 shrink-0" aria-hidden="true" />
              <span>{t.settings.tabs.weeks}</span>
              <span className="ml-auto text-[0.65rem] font-medium hidden md:inline">
                ({weeks.length})
              </span>
            </button>

            <button
              type="button"
              aria-pressed={activeTab === "programacao"}
              onClick={() => setActiveTab("programacao")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition touch-manipulation whitespace-nowrap min-h-[2.5rem]",
                activeTab === "programacao"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Clock className="size-4 shrink-0" aria-hidden="true" />
              <span>{t.settings.tabs.schedule}</span>
            </button>

            <button
              type="button"
              aria-pressed={activeTab === "aparencia"}
              onClick={() => setActiveTab("aparencia")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition touch-manipulation whitespace-nowrap min-h-[2.5rem]",
                activeTab === "aparencia"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Palette className="size-4 shrink-0" aria-hidden="true" />
              <span>{t.settings.tabs.appearance}</span>
            </button>

            <button
              type="button"
              aria-pressed={activeTab === "exportacao"}
              onClick={() => setActiveTab("exportacao")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition touch-manipulation whitespace-nowrap min-h-[2.5rem]",
                activeTab === "exportacao"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Download className="size-4 shrink-0" aria-hidden="true" />
              <span>{t.settings.tabs.export}</span>
            </button>
          </nav>

          {/* Main Content Body */}
          <fieldset disabled={storageReadOnly && activeTab !== "exportacao"} aria-label={locale === "en-US" ? "Settings content" : "Conteúdo das configurações"} className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* TAB 1: SEMANAS */}
            {activeTab === "semanas" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif text-base font-semibold text-foreground">
                    {titleCase(t.settings.semanasTab.title)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.settings.semanasTab.desc}
                  </p>
                </div>

                {/* Form: Criar Nova Semana */}
                <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                  <h4 className="text-xs font-bold tracking-wider text-primary">
                    {titleCase(t.settings.semanasTab.newWeekBtn)}
                  </h4>
                  <form onSubmit={handleCreateWeek} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-5 space-y-1">
                      <label htmlFor="settings-newWeekTitle" className="text-xs font-medium text-foreground block">
                        {t.week.titleLabel}
                      </label>
                      <input id="settings-newWeekTitle"
                        type="text"
                        placeholder={`${locale === "en-US" ? "For example:" : "Exemplo:"} ${t.week.weekNumberLabel} ${weeks.length + 1}`}
                        maxLength={120}
                        value={newWeekTitle}
                        onChange={(e) => setNewWeekTitle(e.target.value)}
                        /* font-size 16px to prevent iOS auto-zoom */
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                      <label htmlFor="settings-newWeekStartDate" className="text-xs font-medium text-foreground block">
                        {t.week.startDateLabel}
                      </label>
                      <input id="settings-newWeekStartDate"
                        type="date"
                        value={newWeekStartDate}
                        onChange={(e) => setNewWeekStartDate(e.target.value)}
                        /* font-size 16px to prevent iOS auto-zoom */
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition touch-manipulation min-h-[2.5rem]"
                      >
                        <Plus className="size-4" aria-hidden="true" />
                        <span>{t.common.create}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Confirm Delete Dialog */}
                {deletingWeek && (
                  <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <h4 className="text-sm font-semibold text-destructive">
                          {titleCase(t.settings.semanasTab.confirmDeletePrefix)} &quot;{deletingWeek.title}&quot;?
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t.week.deleteDesc} ({formatDateRangeLocale(deletingWeek.startDate, deletingWeek.endDate, locale)}).
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setDeletingWeek(null)}
                        className="rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition touch-manipulation"
                      >
                        {t.common.cancel}
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmDeleteWeek}
                        className="rounded-md bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition shadow-xs touch-manipulation"
                      >
                        {t.week.deleteConfirm}
                      </button>
                    </div>
                  </div>
                )}

                {/* List of Existing Weeks */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold tracking-wider text-muted-foreground">
                    {titleCase(t.nav.weeks)} ({weeks.length})
                  </h4>

                  <div className="grid grid-cols-1 gap-2.5">
                    {weeks.map((w) => {
                      const isActive = w.id === activeWeek?.id
                      const rangeStr = formatDateRangeLocale(w.startDate, w.endDate, locale)

                      return (
                        <div
                          key={w.id}
                          className={cn(
                            "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 transition",
                            isActive
                              ? "border-primary bg-primary/8 shadow-xs"
                              : "border-border bg-card hover:border-primary/40"
                          )}
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-serif text-sm font-semibold text-foreground">
                                {w.title}
                              </span>
                              {isActive && (
                                <span className="rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[0.65rem] font-bold">
                                  {t.common.active}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t.common.period} <span className="font-medium text-foreground">{rangeStr}</span>
                            </p>
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              <span className="text-[0.7rem] font-medium text-muted-foreground">
                                {w.progresso.concluidas}/{w.progresso.total} {t.common.tasks}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {!isActive && (
                              <button
                                type="button"
                                onClick={() => selectWeek(w.id)}
                                className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition touch-manipulation min-h-[2.25rem]"
                              >
                                {t.common.activate}
                              </button>
                            )}

                            {weeks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setDeletingWeek(w)}
                                className="rounded-md border border-border p-2 text-muted-foreground hover:border-destructive hover:text-destructive hover:bg-destructive/10 transition touch-manipulation min-w-[2.25rem] min-h-[2.25rem] flex items-center justify-center"
                                title={t.common.delete}
                                aria-label={`${t.common.delete} ${w.title}`}
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PROGRAMAÇÃO */}
            {activeTab === "programacao" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif text-base font-semibold text-foreground">
                    {titleCase(copy("Rotina de atividades"))} ({titleCase(activeWeek?.title ?? copy("Semana Selecionada"))})
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {copy("Adicione, altere os horários ou remova compromissos para cada dia da semana ativa.")}
                  </p>
                </div>

                {/* Day selector tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-border">
                  {days.map((d) => {
                    const count = activities.filter((a) => a.dayIndex === d.dayIndex).length
                    const isSel = d.dayIndex === selectedDayIndex

                    return (
                      <button
                        key={d.dayIndex}
                        type="button"
                        aria-pressed={selectedDayIndex === d.dayIndex}
                        onClick={() => setSelectedDayIndex(d.dayIndex)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition whitespace-nowrap touch-manipulation min-h-[2.25rem]",
                          isSel
                            ? "bg-primary text-primary-foreground font-bold shadow-xs"
                            : "bg-muted/40 text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <span>{d.dayNumberLabel}</span>
                        <span className="text-[0.65rem] opacity-80">({d.formattedShort})</span>
                        <span className="rounded-full bg-background/20 px-1.5 py-0.2 text-[0.6rem]">
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Form: Add Activity for selected day */}
                <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                  <h4 className="text-xs font-bold tracking-wider text-primary">
                    {titleCase(copy("Adicionar atividade"))} ({titleCase(days[selectedDayIndex]?.dayNumberLabel)} - {titleCase(days[selectedDayIndex]?.formattedShort)})
                  </h4>
                  <form onSubmit={handleAddActivity} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-3 space-y-1">
                      <label htmlFor="settings-newActTime" className="text-xs font-medium text-foreground block">{copy("Horário")}</label>
                      <input id="settings-newActTime"
                        type="time"
                        value={newActTime}
                        onChange={(e) => setNewActTime(e.target.value)}
                        /* font-size 16px to prevent iOS auto-zoom */
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="sm:col-span-6 space-y-1">
                      <label htmlFor="settings-newActDesc" className="text-xs font-medium text-foreground block">{copy("Descrição da Tarefa")}</label>
                      <input id="settings-newActDesc"
                        type="text"
                        maxLength={1200}
                        placeholder={locale === "en-US" ? "For example: 15-minute walk" : "Exemplo: caminhada de 15 minutos"}
                        value={newActDesc}
                        onChange={(e) => setNewActDesc(e.target.value)}
                        /* font-size 16px to prevent iOS auto-zoom */
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <button
                        type="submit"
                        disabled={!newActDesc.trim()}
                        className="w-full flex items-center justify-center gap-1 rounded-md bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition touch-manipulation min-h-[2.5rem]"
                      >
                        <Plus className="size-4" aria-hidden="true" />
                        <span>{copy("Adicionar")}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* List of activities for selected day */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold tracking-wider text-muted-foreground">
                    {titleCase(copy("Atividades deste dia"))} ({dayActivities.length})
                  </h4>

                  {dayActivities.length === 0 ? (
                    <p className="p-4 text-center text-xs italic text-muted-foreground rounded-lg border border-dashed border-border">
                      {locale === "en-US" ? "No activities scheduled for this day. Add one whenever you wish." : "Nenhuma atividade cadastrada para este dia. Adicione uma quando quiser."}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {dayActivities.map((act, index) => {
                        const isEditing = editingActId === act.id

                        if (isEditing) {
                          return (
                            <div
                              key={act.id}
                              className="rounded-lg border border-primary bg-primary/5 p-3 space-y-2"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                                <input
                                  type="time"
                                  aria-label={t.schedule.timeLabel}
                                  value={editActTime}
                                  onChange={(e) => setEditActTime(e.target.value)}
                                  className="sm:col-span-3 rounded-md border border-border bg-background px-2.5 py-1.5 text-base font-medium"
                                  placeholder={t.schedule.timeLabel}
                                />
                                <input
                                  type="text"
                                  aria-label={t.schedule.descLabel}
                                  maxLength={1200}
                                  value={editActDesc}
                                  onChange={(e) => setEditActDesc(e.target.value)}
                                  className="sm:col-span-7 rounded-md border border-border bg-background px-2.5 py-1.5 text-base font-medium"
                                  placeholder={t.schedule.descLabel}
                                />
                                <div className="sm:col-span-2 flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(act.id)}
                                    className="flex-1 rounded bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 touch-manipulation"
                                  >
                                    {t.common.save}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingActId(null)}
                                    className="rounded border border-border p-2 text-xs text-muted-foreground hover:bg-accent touch-manipulation"
                                    aria-label={t.common.cancel}
                                  >
                                    <X className="size-4" aria-hidden="true" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        }

                        return (
                          <div
                            key={act.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-2.5 hover:border-primary/40 transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-xs font-mono font-bold shrink-0">
                                {act.time}
                              </span>
                              <span className="text-xs font-medium text-foreground truncate">
                                {act.description}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => moveScheduleActivity(act.id, "up")}
                                disabled={index === 0}
                                className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition touch-manipulation"
                                title={t.schedule.orderUp}
                                aria-label={t.schedule.orderUp}
                              >
                                <ArrowUp className="size-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveScheduleActivity(act.id, "down")}
                                disabled={index === dayActivities.length - 1}
                                className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition touch-manipulation"
                                title={t.schedule.orderDown}
                                aria-label={t.schedule.orderDown}
                              >
                                <ArrowDown className="size-4" aria-hidden="true" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStartEdit(act.id, act.time, act.description)}
                                className="p-1.5 text-muted-foreground hover:text-primary transition touch-manipulation"
                                title={t.settings.programacaoTab.editActivityTitle}
                                aria-label={`${t.settings.programacaoTab.editActivityTitle}: ${act.description}`}
                              >
                                <Edit2 className="size-4" aria-hidden="true" />
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteScheduleActivity(act.id)}
                                className="p-1.5 text-muted-foreground hover:text-destructive transition touch-manipulation"
                                title={t.settings.programacaoTab.deleteActivityTitle}
                                aria-label={`${t.settings.programacaoTab.deleteActivityTitle}: ${act.description}`}
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: APARÊNCIA & IDIOMA */}
            {activeTab === "aparencia" && (
              <div className="space-y-6">
                {/* Idioma da Interface */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-bold tracking-wider text-muted-foreground">
                      {titleCase(t.settings.language.label)}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.settings.language.desc}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setLocale("pt-BR")}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-3.5 transition text-left touch-manipulation",
                        locale === "pt-BR"
                          ? "border-primary bg-primary/8 shadow-xs ring-1 ring-primary/30"
                          : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base leading-none">🇧🇷</span>
                        <span className="text-xs font-semibold text-foreground">{t.settings.language.ptBR}</span>
                      </div>
                      {locale === "pt-BR" && <Check className="size-4 text-primary" aria-hidden="true" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setLocale("en-US")}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-3.5 transition text-left touch-manipulation",
                        locale === "en-US"
                          ? "border-primary bg-primary/8 shadow-xs ring-1 ring-primary/30"
                          : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base leading-none">🇺🇸</span>
                        <span className="text-xs font-semibold text-foreground">{t.settings.language.enUS}</span>
                      </div>
                      {locale === "en-US" && <Check className="size-4 text-primary" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {/* Versão Bíblica Padrão (quando teologia estiver ativada) */}
                {activeGuide.theologyEnabled && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    <div>
                      <h4 className="text-xs font-bold tracking-wider text-muted-foreground">
                        {titleCase(t.settings.bibleVersion.label)}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.settings.bibleVersion.desc}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {locale === "en-US" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setBibleVersion("KJV")}
                            className={cn(
                              "flex items-center justify-between rounded-xl border p-3.5 transition text-left touch-manipulation",
                              bibleVersion === "KJV"
                                ? "border-primary bg-primary/8 shadow-xs ring-1 ring-primary/30"
                                : "border-border bg-card hover:border-primary/40"
                            )}
                          >
                            <div>
                              <p className="text-xs font-semibold text-foreground">King James Version (KJV)</p>
                              <p className="text-[0.7rem] text-muted-foreground">Traditional English translation</p>
                            </div>
                            {bibleVersion === "KJV" && <Check className="size-4 text-primary" aria-hidden="true" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => setBibleVersion("NIV")}
                            className={cn(
                              "flex items-center justify-between rounded-xl border p-3.5 transition text-left touch-manipulation",
                              bibleVersion === "NIV"
                                ? "border-primary bg-primary/8 shadow-xs ring-1 ring-primary/30"
                                : "border-border bg-card hover:border-primary/40"
                            )}
                          >
                            <div>
                              <p className="text-xs font-semibold text-foreground">New International Version (NIV)</p>
                              <p className="text-[0.7rem] text-muted-foreground">Modern readable translation</p>
                            </div>
                            {bibleVersion === "NIV" && <Check className="size-4 text-primary" aria-hidden="true" />}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setBibleVersion("ARA")}
                            className={cn(
                              "flex items-center justify-between rounded-xl border p-3.5 transition text-left touch-manipulation",
                              bibleVersion === "ARA"
                                ? "border-primary bg-primary/8 shadow-xs ring-1 ring-primary/30"
                                : "border-border bg-card hover:border-primary/40"
                            )}
                          >
                            <div>
                              <p className="text-xs font-semibold text-foreground">Almeida Revista e Atualizada (ARA)</p>
                              <p className="text-[0.7rem] text-muted-foreground">{copy("Tradução clássica de referência")}</p>
                            </div>
                            {bibleVersion === "ARA" && <Check className="size-4 text-primary" aria-hidden="true" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => setBibleVersion("NVT")}
                            className={cn(
                              "flex items-center justify-between rounded-xl border p-3.5 transition text-left touch-manipulation",
                              bibleVersion === "NVT"
                                ? "border-primary bg-primary/8 shadow-xs ring-1 ring-primary/30"
                                : "border-border bg-card hover:border-primary/40"
                            )}
                          >
                            <div>
                              <p className="text-xs font-semibold text-foreground">Nova Versão Transformadora (NVT)</p>
                              <p className="text-[0.7rem] text-muted-foreground">{copy("Linguagem contemporânea e clara")}</p>
                            </div>
                            {bibleVersion === "NVT" && <Check className="size-4 text-primary" aria-hidden="true" />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Tema */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <h4 className="text-xs font-bold tracking-wider text-muted-foreground">
                    {titleCase(t.settings.theme.label)}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      aria-pressed={theme === "light"}
                      onClick={() => setTheme("light")}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3.5 transition text-left touch-manipulation",
                        theme === "light"
                          ? "border-primary bg-primary/8 shadow-xs"
                          : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      <Sun className="size-5 text-amber-500 shrink-0" aria-hidden="true" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground">{t.settings.theme.light}</span>
                          {theme === "light" && <Check className="size-3.5 text-primary" aria-hidden="true" />}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      aria-pressed={theme === "dark"}
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3.5 transition text-left touch-manipulation",
                        theme === "dark"
                          ? "border-primary bg-primary/8 shadow-xs"
                          : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      <Moon className="size-5 text-indigo-400 shrink-0" aria-hidden="true" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground">{t.settings.theme.dark}</span>
                          {theme === "dark" && <Check className="size-3.5 text-primary" aria-hidden="true" />}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      aria-pressed={theme === "system"}
                      onClick={() => setTheme("system")}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-3.5 transition text-left touch-manipulation",
                        theme === "system"
                          ? "border-primary bg-primary/8 shadow-xs"
                          : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      <Monitor className="size-5 text-muted-foreground shrink-0" aria-hidden="true" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground">{t.settings.theme.system}</span>
                          {theme === "system" && <Check className="size-3.5 text-primary" aria-hidden="true" />}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Paleta de Cores */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <h4 className="text-xs font-bold tracking-wider text-muted-foreground">
                    {titleCase(t.settings.palette.label)}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PALETTES.map((p) => {
                      const isSel = palette === p.id

                      return (
                        <button
                          key={p.id}
                          type="button"
                          aria-pressed={palette === p.id}
                          onClick={() => setPalette(p.id)}
                          className={cn(
                            "flex flex-col gap-2 rounded-xl border p-3.5 transition text-left touch-manipulation",
                            isSel
                              ? "border-primary bg-primary/8 shadow-xs ring-1 ring-primary/30"
                              : "border-border bg-card hover:border-primary/40"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-semibold text-foreground">
                              {copy(p.name)}
                            </span>
                            {isSel && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[0.65rem] font-bold text-primary">
                                <Check className="size-3" aria-hidden="true" /> {copy("Ativa")}
                              </span>
                            )}
                          </div>

                          {/* Preview Swatches */}
                          <div className="flex items-center gap-1.5 py-1">
                            <div className="flex items-center gap-1 rounded-md border border-border/60 p-1 bg-background/50">
                              <span
                                className="size-3.5 rounded-full border border-black/10 shadow-2xs"
                                style={{ backgroundColor: p.bgHex }}
                                title={copy("Fundo (Background)")}
                              />
                              <span
                                className="size-3.5 rounded-full border border-black/10 shadow-2xs"
                                style={{ backgroundColor: p.cardHex }}
                                title={copy("Superfície (Card)")}
                              />
                              <span
                                className="size-3.5 rounded-full border border-black/10 shadow-2xs"
                                style={{ backgroundColor: p.primaryHex }}
                                title={copy("Cor Primária")}
                              />
                              <span
                                className="size-3.5 rounded-full border border-black/10 shadow-2xs"
                                style={{ backgroundColor: p.goldHex }}
                                title={copy("Destaque / Títulos")}
                              />
                            </div>
                            <span className="text-[0.65rem] text-muted-foreground font-medium">
                              {copy(p.subtitle)}
                            </span>
                          </div>

                          <p className="text-[0.7rem] text-muted-foreground leading-relaxed">
                            {copy(p.description)}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: EXPORTAÇÃO */}
            {activeTab === "exportacao" && (
              <div className="space-y-8">

                {aiError && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive">{aiError}</p>}

                {/* Import Confirmation Dialog */}
                {pendingImport && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 dark:text-amber-400 text-lg leading-none">⚠️</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{copy("Confirmar restauração de backup?")}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {copy("Isso")} <strong>{copy("substituirá todos os dados atuais")}</strong> {copy("pelo conteúdo do arquivo.")}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-background/70 border border-border p-3 text-xs space-y-1">
                      <p className="font-semibold text-foreground">
                        {pendingImport.weekCount} {pendingImport.weekCount === 1 ? t.week.weekSingular : t.week.weekPlural} {copy("no arquivo:")}
                      </p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                        {pendingImport.weekTitles.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                        {pendingImport.weekCount > 5 && (
                          <li className="text-muted-foreground/60">{copy("...e mais")} {pendingImport.weekCount - 5}</li>
                        )}
                      </ul>
                      {pendingImport.exportedAt && (
                        <p className="text-muted-foreground pt-1">
                          {copy("Exportado em:")} {new Date(pendingImport.exportedAt).toLocaleString(locale)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmImport}
                        className="flex-1 rounded-md bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition touch-manipulation"
                      >
                        {copy("Restaurar agora")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingImport(null)}
                        className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent transition touch-manipulation"
                      >
                        {t.common.cancel}
                      </button>
                    </div>
                  </div>
                )}

                {/* Import / Export status message */}
                {importStatus && (
                  <div
                    role={importStatus.type === "error" ? "alert" : "status"}
                    className={cn(
                      "rounded-lg p-3 text-xs font-medium flex items-center justify-between border",
                      importStatus.type === "success"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-destructive/30 bg-destructive/10 text-destructive"
                    )}
                  >
                    <span>{importStatus.msg}</span>
                    <button
                      type="button"
                      onClick={() => setImportStatus(null)}
                      className="p-1 text-muted-foreground hover:text-foreground"
                      aria-label={t.common.close}
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                )}

                {/* ── SECTION A: EXPORTAR SEMANA ATUAL ── */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-serif text-base font-semibold text-foreground">{titleCase(t.settings.exportTab.currentWeekTitle)}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.settings.exportTab.currentWeekDesc}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {/* PDF / Print */}
                    {!isNativeApp() && <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                          <Printer className="size-5" aria-hidden="true" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">{titleCase(t.export.exportPdf)}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t.settings.exportTab.pdfDesc}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition touch-manipulation shrink-0 min-h-[2.5rem]"
                      >
                        <Printer className="size-4" aria-hidden="true" />
                        <span>{t.export.printPdf}</span>
                      </button>
                    </div>}

                    {/* Markdown */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                          <FileText className="size-5" aria-hidden="true" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">{titleCase(t.export.exportToMarkdown)}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t.settings.exportTab.markdownDesc}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={exportToMarkdown}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary/20 transition touch-manipulation shrink-0 min-h-[2.5rem]"
                      >
                        <FileText className="size-4" aria-hidden="true" />
                        <span>{t.export.downloadMarkdown}</span>
                      </button>
                    </div>

                    {/* Week JSON */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                          <FileJson className="size-5" aria-hidden="true" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">{titleCase(t.export.exportWeekJson)}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t.settings.exportTab.weekJsonDesc}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={exportWeekJSON}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-md border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition touch-manipulation shrink-0 min-h-[2.5rem]"
                      >
                        <FileJson className="size-4" aria-hidden="true" />
                        <span>{t.export.downloadJson}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* ── SECTION B: BACKUP COMPLETO ── */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-serif text-base font-semibold text-foreground">{titleCase(t.settings.exportTab.backupTitle)}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.settings.exportTab.backupDesc}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                        <Database className="size-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{titleCase(t.export.backupJson)}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t.settings.exportTab.backupFullDesc}
                        </p>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={exportToJSON}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition touch-manipulation min-h-[2.5rem]"
                      >
                        <Download className="size-4" aria-hidden="true" />
                        <span>{t.settings.exportTab.downloadBackup}</span>
                      </button>

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".json"
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-md border border-border bg-secondary px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary/80 transition touch-manipulation min-h-[2.5rem]"
                      >
                        <Upload className="size-4" aria-hidden="true" />
                        <span>{t.settings.exportTab.restoreBackup}</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </fieldset>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-3 sm:px-6 shrink-0">
          <span className="text-xs text-muted-foreground truncate max-w-[60%]">
            {activeWeek ? `${t.settings.activeWeekLabel} ${activeWeek.title}` : ""}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition touch-manipulation min-h-[2.25rem]"
          >
            {t.common.done}
          </button>
        </div>
      </div>
    </div>
  )
}
