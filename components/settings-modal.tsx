"use client"

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
  Database,
  Upload,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Sparkles,
} from "lucide-react"
import {
  useStore,
  PALETTES,
  type WeekInstance,
} from "@/lib/store"
import {
  formatDateRangeBR,
  getTodayFormatted,
  getWeekDays,
} from "@/lib/date-utils"
import { cn } from "@/lib/utils"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: "semanas" | "programacao" | "aparencia" | "exportacao"
}

export function SettingsModal({ isOpen, onClose, initialTab = "semanas" }: SettingsModalProps) {
  const {
    weeks,
    activeWeek,
    selectWeek,
    createWeek,
    deleteWeek,
    theme,
    setTheme,
    palette,
    setPalette,
    exportToMarkdown,
    exportToJSON,
    importFromJSON,
    addScheduleActivity,
    updateScheduleActivity,
    deleteScheduleActivity,
    moveScheduleActivity,
  } = useStore()

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

  if (!isOpen) return null

  // Create week handler
  const handleCreateWeek = (e: React.FormEvent) => {
    e.preventDefault()
    const autoTitle = `Semana ${weeks.length + 1}`
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

  // Import JSON handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        const ok = importFromJSON(content)
        if (ok) {
          setImportStatus({ type: "success", msg: "Backup restaurado com sucesso!" })
        } else {
          setImportStatus({ type: "error", msg: "Arquivo de backup inválido ou corrompido." })
        }
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const days = activeWeek ? getWeekDays(activeWeek.startDate) : []
  const activities = activeWeek?.programacao?.activities || []
  const dayActivities = activities
    .filter((a) => a.dayIndex === selectedDayIndex)
    .sort((a, b) => a.order - b.order || a.time.localeCompare(b.time))

  return (
    <div
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
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3 sm:px-6 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="size-5 text-primary shrink-0" aria-hidden="true" />
            <div>
              <h2 id="settings-modal-title" className="font-serif text-base sm:text-lg font-semibold text-foreground truncate">
                Configurações do Aplicativo
              </h2>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Gerencie semanas, horários, estilo e backup de forma centralizada.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition touch-manipulation min-w-[2.5rem] min-h-[2.5rem] flex items-center justify-center"
            aria-label="Fechar configurações"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Layout: Sidebar Navigation + Main Content Area */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Navigation Bar / Tabs */}
          <nav
            aria-label="Abas de configuração"
            className="flex flex-row md:flex-col shrink-0 border-b md:border-b-0 md:border-r border-border bg-muted/20 p-2 gap-1 overflow-x-auto md:w-56"
          >
            <button
              type="button"
              onClick={() => setActiveTab("semanas")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition touch-manipulation whitespace-nowrap min-h-[2.5rem]",
                activeTab === "semanas"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Calendar className="size-4 shrink-0" aria-hidden="true" />
              <span>1. Semanas</span>
              <span className="ml-auto text-[0.65rem] font-medium hidden md:inline">
                ({weeks.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("programacao")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition touch-manipulation whitespace-nowrap min-h-[2.5rem]",
                activeTab === "programacao"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Clock className="size-4 shrink-0" aria-hidden="true" />
              <span>2. Programação</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("aparencia")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition touch-manipulation whitespace-nowrap min-h-[2.5rem]",
                activeTab === "aparencia"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Palette className="size-4 shrink-0" aria-hidden="true" />
              <span>3. Aparência</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("exportacao")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition touch-manipulation whitespace-nowrap min-h-[2.5rem]",
                activeTab === "exportacao"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Download className="size-4 shrink-0" aria-hidden="true" />
              <span>4. Exportação</span>
            </button>
          </nav>

          {/* Main Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* TAB 1: SEMANAS */}
            {activeTab === "semanas" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif text-base font-semibold text-foreground">
                    Gerenciador de Semanas
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Crie novas semanas, selecione a semana ativa para acompanhamento ou exclua históricos antigos.
                  </p>
                </div>

                {/* Form: Criar Nova Semana */}
                <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                    + Criar Nova Semana
                  </h4>
                  <form onSubmit={handleCreateWeek} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-5 space-y-1">
                      <label className="text-xs font-medium text-foreground block">
                        Nome da Semana
                      </label>
                      <input
                        type="text"
                        placeholder={`Ex: Semana ${weeks.length + 1}`}
                        value={newWeekTitle}
                        onChange={(e) => setNewWeekTitle(e.target.value)}
                        /* font-size 16px to prevent iOS auto-zoom */
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-xs font-medium text-foreground block">
                        Data de Início
                      </label>
                      <input
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
                        <span>Criar Semana</span>
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
                          Confirmar exclusão da &quot;{deletingWeek.title}&quot;?
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Esta ação excluirá permanentemente os registros e respostas gravados para esta semana ({formatDateRangeBR(deletingWeek.startDate, deletingWeek.endDate)}).
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setDeletingWeek(null)}
                        className="rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition touch-manipulation"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmDeleteWeek}
                        className="rounded-md bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition shadow-xs touch-manipulation"
                      >
                        Sim, Excluir Semana
                      </button>
                    </div>
                  </div>
                )}

                {/* List of Existing Weeks */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Semanas Cadastradas ({weeks.length})
                  </h4>

                  <div className="grid grid-cols-1 gap-2.5">
                    {weeks.map((w) => {
                      const isActive = w.id === activeWeek?.id
                      const rangeStr = formatDateRangeBR(w.startDate, w.endDate)

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
                                  Semana Ativa
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Período: <span className="font-medium text-foreground">{rangeStr}</span>
                            </p>
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              <div className="w-28 sm:w-32 bg-secondary rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-primary h-full transition-all duration-300"
                                  style={{ width: `${w.progresso.percentual}%` }}
                                />
                              </div>
                              <span className="text-[0.7rem] font-medium text-muted-foreground">
                                {w.progresso.concluidas}/{w.progresso.total} tarefas ({w.progresso.percentual}%)
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
                                Ativar Esta
                              </button>
                            )}

                            {weeks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setDeletingWeek(w)}
                                className="rounded-md border border-border p-2 text-muted-foreground hover:border-destructive hover:text-destructive hover:bg-destructive/10 transition touch-manipulation min-w-[2.25rem] min-h-[2.25rem] flex items-center justify-center"
                                title="Excluir semana"
                                aria-label={`Excluir ${w.title}`}
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
                    Programação de Atividades ({activeWeek?.title ?? "Semana Selecionada"})
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Adicione, altere os horários ou remova compromissos para cada dia da semana ativa.
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
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                    + Adicionar Atividade ({days[selectedDayIndex]?.dayNumberLabel} - {days[selectedDayIndex]?.formattedShort})
                  </h4>
                  <form onSubmit={handleAddActivity} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-xs font-medium text-foreground block">Horário</label>
                      <input
                        type="text"
                        placeholder="Ex: 16:30"
                        value={newActTime}
                        onChange={(e) => setNewActTime(e.target.value)}
                        /* font-size 16px to prevent iOS auto-zoom */
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div className="sm:col-span-6 space-y-1">
                      <label className="text-xs font-medium text-foreground block">Descrição da Tarefa</label>
                      <input
                        type="text"
                        placeholder="Ex: Ativação 15 min / Saída"
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
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* List of activities for selected day */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Atividades do Dia ({dayActivities.length})
                  </h4>

                  {dayActivities.length === 0 ? (
                    <p className="p-4 text-center text-xs italic text-muted-foreground rounded-lg border border-dashed border-border">
                      Nenhuma atividade cadastrada para este dia. Adicione uma atividade acima!
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
                                  type="text"
                                  value={editActTime}
                                  onChange={(e) => setEditActTime(e.target.value)}
                                  className="sm:col-span-3 rounded-md border border-border bg-background px-2.5 py-1.5 text-base font-medium"
                                  placeholder="Horário"
                                />
                                <input
                                  type="text"
                                  value={editActDesc}
                                  onChange={(e) => setEditActDesc(e.target.value)}
                                  className="sm:col-span-7 rounded-md border border-border bg-background px-2.5 py-1.5 text-base font-medium"
                                  placeholder="Descrição"
                                />
                                <div className="sm:col-span-2 flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(act.id)}
                                    className="flex-1 rounded bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 touch-manipulation"
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingActId(null)}
                                    className="rounded border border-border p-2 text-xs text-muted-foreground hover:bg-accent touch-manipulation"
                                    aria-label="Cancelar edição"
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
                                title="Mover para cima"
                                aria-label="Mover para cima"
                              >
                                <ArrowUp className="size-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveScheduleActivity(act.id, "down")}
                                disabled={index === dayActivities.length - 1}
                                className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition touch-manipulation"
                                title="Mover para baixo"
                                aria-label="Mover para baixo"
                              >
                                <ArrowDown className="size-4" aria-hidden="true" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStartEdit(act.id, act.time, act.description)}
                                className="p-1.5 text-muted-foreground hover:text-primary transition touch-manipulation"
                                title="Editar atividade"
                                aria-label={`Editar: ${act.description}`}
                              >
                                <Edit2 className="size-4" aria-hidden="true" />
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteScheduleActivity(act.id)}
                                className="p-1.5 text-muted-foreground hover:text-destructive transition touch-manipulation"
                                title="Excluir atividade"
                                aria-label={`Excluir: ${act.description}`}
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

            {/* TAB 3: APARÊNCIA */}
            {activeTab === "aparencia" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif text-base font-semibold text-foreground">
                    Aparência e Personalização
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Escolha o modo de cor e a paleta tonal ideal para sua leitura e acompanhamento.
                  </p>
                </div>

                {/* Modo de Tema */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Modo de Exibição
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
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
                          <span className="text-xs font-semibold text-foreground">Claro</span>
                          {theme === "light" && <Check className="size-3.5 text-primary" aria-hidden="true" />}
                        </div>
                        <p className="text-[0.7rem] text-muted-foreground">Fundo papel aquecido</p>
                      </div>
                    </button>

                    <button
                      type="button"
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
                          <span className="text-xs font-semibold text-foreground">Escuro</span>
                          {theme === "dark" && <Check className="size-3.5 text-primary" aria-hidden="true" />}
                        </div>
                        <p className="text-[0.7rem] text-muted-foreground">Confortável para a noite</p>
                      </div>
                    </button>

                    <button
                      type="button"
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
                          <span className="text-xs font-semibold text-foreground">Sistema</span>
                          {theme === "system" && <Check className="size-3.5 text-primary" aria-hidden="true" />}
                        </div>
                        <p className="text-[0.7rem] text-muted-foreground">Segue o seu dispositivo</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Paleta de Cores */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Paletas de Cores Editoriais
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PALETTES.map((p) => {
                      const isSel = palette === p.id

                      return (
                        <button
                          key={p.id}
                          type="button"
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
                              {p.name}
                            </span>
                            {isSel && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[0.65rem] font-bold text-primary">
                                <Check className="size-3" aria-hidden="true" /> Ativa
                              </span>
                            )}
                          </div>

                          {/* Preview Swatches */}
                          <div className="flex items-center gap-1.5 py-1">
                            <div className="flex items-center gap-1 rounded-md border border-border/60 p-1 bg-background/50">
                              <span
                                className="size-3.5 rounded-full border border-black/10 shadow-2xs"
                                style={{ backgroundColor: p.bgHex }}
                                title="Fundo (Background)"
                              />
                              <span
                                className="size-3.5 rounded-full border border-black/10 shadow-2xs"
                                style={{ backgroundColor: p.cardHex }}
                                title="Superfície (Card)"
                              />
                              <span
                                className="size-3.5 rounded-full border border-black/10 shadow-2xs"
                                style={{ backgroundColor: p.primaryHex }}
                                title="Cor Primária"
                              />
                              <span
                                className="size-3.5 rounded-full border border-black/10 shadow-2xs"
                                style={{ backgroundColor: p.goldHex }}
                                title="Destaque / Títulos"
                              />
                            </div>
                            <span className="text-[0.65rem] text-muted-foreground font-medium">
                              {p.subtitle}
                            </span>
                          </div>

                          <p className="text-[0.7rem] text-muted-foreground leading-relaxed">
                            {p.description}
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
              <div className="space-y-6">
                <div>
                  <h3 className="font-serif text-base font-semibold text-foreground">
                    Exportação e Backup
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Guarde relatórios impressos do seu progresso, exporte arquivos em Markdown ou faça backup dos seus dados em JSON.
                  </p>
                </div>

                {importStatus && (
                  <div
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
                      aria-label="Fechar mensagem"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {/* Option 1: PDF Print */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                        <Printer className="size-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Imprimir ou Salvar em PDF
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Abre a caixa de impressão do navegador formatada sem menus nem botões, pronta para salvar em PDF.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition touch-manipulation shrink-0 min-h-[2.5rem]"
                    >
                      <Printer className="size-4" aria-hidden="true" />
                      <span>Imprimir / Salvar PDF</span>
                    </button>
                  </div>

                  {/* Option 2: Markdown Export */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                        <FileText className="size-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Exportar para Markdown (.md)
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Baixa um documento estruturado com todo o conteúdo do guia, metas e respostas preenchidas da semana ativa.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={exportToMarkdown}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary/20 transition touch-manipulation shrink-0 min-h-[2.5rem]"
                    >
                      <FileText className="size-4" aria-hidden="true" />
                      <span>Baixar Markdown (.md)</span>
                    </button>
                  </div>

                  {/* Option 3: JSON Backup Export & Import */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                        <Database className="size-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          Backup Completo de Dados (JSON)
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Baixe um arquivo de backup em JSON com todas as suas semanas e preferências, ou restaure um backup.
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
                        <span>Baixar Backup (.json)</span>
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
                        <span>Restaurar Backup</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-3 sm:px-6 shrink-0">
          <span className="text-xs text-muted-foreground truncate max-w-[60%]">
            {activeWeek ? `Semana em exibição: ${activeWeek.title}` : ""}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition touch-manipulation min-h-[2.25rem]"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  )
}
