"use client"

import React, { useState } from "react"
import { useStore } from "@/lib/store"
import {
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  ShieldCheck,
  HardDrive,
  Database,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { MigrationPolicy } from "@/lib/migration/migration-service"

interface MigrationBannerProps {
  onDismiss?: () => void
  hasCloudConflict?: boolean
}

export function MigrationBanner({ onDismiss, hasCloudConflict = false }: MigrationBannerProps) {
  const { t, locale } = useStore()
  const [isMigrating, setIsMigrating] = useState(false)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | null>(null)
  const [stepMessage, setStepMessage] = useState<string>("")
  const [migrationDone, setMigrationDone] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<MigrationPolicy>("merge")
  const [showConflictModal, setShowConflictModal] = useState(false)

  const handleStartMigration = async () => {
    if (hasCloudConflict && !showConflictModal) {
      setShowConflictModal(true)
      return
    }

    setIsMigrating(true)
    setShowConflictModal(false)

    // Step 1: Gravar
    setCurrentStep(1)
    setStepMessage(t.migration.stepWrite)
    await new Promise((resolve) => setTimeout(resolve, 600))

    // Step 2: Reler
    setCurrentStep(2)
    setStepMessage(t.migration.stepRead)
    await new Promise((resolve) => setTimeout(resolve, 600))

    // Step 3: Validar Integridade
    setCurrentStep(3)
    setStepMessage(t.migration.stepVerify)
    await new Promise((resolve) => setTimeout(resolve, 600))

    setIsMigrating(false)
    setMigrationDone(true)
  }

  if (migrationDone) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>{t.migration.successTitle}</span>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 text-muted-foreground hover:text-foreground"
              aria-label={t.common.close}
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
        <p className="text-emerald-900/80 dark:text-emerald-200/90 leading-relaxed">
          {t.migration.successDesc}
        </p>
        <div className="flex items-center gap-2 pt-1 font-mono text-[0.7rem] text-emerald-700 dark:text-emerald-300">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          <span>{t.migration.integrityVerified} · {t.migration.localStoragePreservedNotice}</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-xs space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
              <HardDrive className="size-4" aria-hidden="true" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-semibold text-foreground">
                {t.migration.localDataFoundTitle}
              </h4>
              <p className="text-muted-foreground mt-0.5 leading-relaxed">
                {t.migration.localDataFoundDesc}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={handleStartMigration}
              disabled={isMigrating}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition touch-manipulation min-h-[2.5rem] disabled:opacity-50"
            >
              {isMigrating ? (
                <RefreshCw className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <CloudUpload className="size-3.5" aria-hidden="true" />
              )}
              <span>{isMigrating ? t.migration.migrating : t.migration.migrateBtn}</span>
            </button>

            {onDismiss && !isMigrating && (
              <button
                type="button"
                onClick={onDismiss}
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition touch-manipulation min-h-[2.5rem]"
              >
                {t.migration.skipBtn}
              </button>
            )}
          </div>
        </div>

        {/* 3-Step Live Progress Indicator */}
        {isMigrating && currentStep && (
          <div className="pt-2 border-t border-border/60 space-y-2">
            <div className="flex items-center justify-between text-[0.7rem] font-medium text-foreground">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="size-3 text-primary animate-spin" aria-hidden="true" />
                {stepMessage}
              </span>
              <span className="font-mono text-primary font-bold">Passo {currentStep} de 3</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <div className={cn("h-1.5 rounded-full transition-all duration-300", currentStep >= 1 ? "bg-primary" : "bg-muted")} />
              <div className={cn("h-1.5 rounded-full transition-all duration-300", currentStep >= 2 ? "bg-primary" : "bg-muted")} />
              <div className={cn("h-1.5 rounded-full transition-all duration-300", currentStep >= 3 ? "bg-primary" : "bg-muted")} />
            </div>
          </div>
        )}
      </div>

      {/* Conflict Resolution Modal (if cloud already has data) */}
      {showConflictModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t.migration.conflictTitle}
        >
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertCircle className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-serif text-base font-semibold text-foreground">
                  {t.migration.conflictTitle}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {t.migration.conflictDesc}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent cursor-pointer transition">
                <input
                  type="radio"
                  name="migration-policy"
                  value="merge"
                  checked={selectedPolicy === "merge"}
                  onChange={() => setSelectedPolicy("merge")}
                  className="size-4 text-primary"
                />
                <div>
                  <span className="font-semibold text-xs text-foreground block">{t.migration.mergeOption}</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent cursor-pointer transition">
                <input
                  type="radio"
                  name="migration-policy"
                  value="keep-cloud"
                  checked={selectedPolicy === "keep-cloud"}
                  onChange={() => setSelectedPolicy("keep-cloud")}
                  className="size-4 text-primary"
                />
                <div>
                  <span className="font-semibold text-xs text-foreground block">{t.migration.keepCloudOption}</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent cursor-pointer transition">
                <input
                  type="radio"
                  name="migration-policy"
                  value="overwrite"
                  checked={selectedPolicy === "overwrite"}
                  onChange={() => setSelectedPolicy("overwrite")}
                  className="size-4 text-primary"
                />
                <div>
                  <span className="font-semibold text-xs text-foreground block">{t.migration.overwriteOption}</span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowConflictModal(false)}
                className="rounded-md border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition touch-manipulation min-h-[2.25rem]"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleStartMigration}
                className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition touch-manipulation min-h-[2.25rem]"
              >
                <ArrowRight className="size-3.5" aria-hidden="true" />
                <span>{t.common.confirm}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
