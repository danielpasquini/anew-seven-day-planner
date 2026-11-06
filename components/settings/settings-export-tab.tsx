"use client"

import { useState, useRef } from "react"
import { Database, Download, FileJson, FileText, Printer, Upload, X } from "lucide-react"
import { useStore } from "@/lib/store"
import { isValidBackup } from "@/lib/backup-validation"
import { isNativeApp } from "@/lib/platform"
import { titleCase } from "@/lib/title-case"
import { cn } from "@/lib/utils"

export function SettingsExportTab() {
  const {
    locale,
    t,
    aiError,
    exportToMarkdown,
    exportWeekJSON,
    exportToJSON,
    importFromJSON,
  } = useStore()

  const [importStatus, setImportStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<{
    raw: string
    weekCount: number
    weekTitles: string[]
    exportedAt: string | null
  } | null>(null)

  const copy = (pt: string, en: string) => locale === "en-US" ? en : pt

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
        setPendingImport({
          raw: content,
          weekCount: parsed.weeks.length,
          weekTitles: parsed.weeks.slice(0, 5).map((week) => String(week.title)),
          exportedAt: typeof parsed.exportedAt === "string" && Number.isFinite(Date.parse(parsed.exportedAt)) ? parsed.exportedAt : null,
        })
      } catch {
        setImportStatus({ type: "error", msg: copy("Arquivo corrompido ou não é um JSON válido.", "The file is corrupted or is not valid JSON.") })
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
      setImportStatus({ type: "success", msg: copy("Backup restaurado com sucesso!", "Backup restored successfully.") })
    } else {
      setImportStatus({ type: "error", msg: copy("Falha ao restaurar backup. Arquivo inválido ou corrompido.", "The backup could not be restored. The file is invalid or corrupted.") })
    }
  }

  return (
    <div className="space-y-8">
      {aiError && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-destructive">
          {aiError}
        </p>
      )}

      {/* Import Confirmation Dialog */}
      {pendingImport && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-amber-600 dark:text-amber-400 text-lg leading-none">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {copy("Confirmar restauração de backup?", "Restore this backup?")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {copy("Isso", "This will")}{" "}
                <strong>{copy("substituirá todos os dados atuais", "replace all current data")}</strong>{" "}
                {copy("pelo conteúdo do arquivo.", "with the file contents.")}
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-background/70 border border-border p-3 text-xs space-y-1">
            <p className="font-semibold text-foreground">
              {pendingImport.weekCount} {pendingImport.weekCount === 1 ? t.week.weekSingular : t.week.weekPlural}{" "}
              {copy("no arquivo:", "in this file:")}
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {pendingImport.weekTitles.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
              {pendingImport.weekCount > 5 && (
                <li className="text-muted-foreground/60">
                  {copy("...e mais", "...and")} {pendingImport.weekCount - 5}
                </li>
              )}
            </ul>
            {pendingImport.exportedAt && (
              <p className="text-muted-foreground pt-1">
                {copy("Exportado em:", "Exported on:")} {new Date(pendingImport.exportedAt).toLocaleString(locale)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmImport}
              className="flex-1 rounded-md bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 transition touch-manipulation"
            >
              {copy("Restaurar agora", "Restore backup")}
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
          {!isNativeApp() && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40">
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
            </div>
          )}

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
  )
}
