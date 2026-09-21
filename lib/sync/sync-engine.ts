/**
 * Real-time Debounced Cloud Sync & Concurrency Engine for Guia de Retomada
 * 
 * Features:
 * 1. Debounced Cloud Writes (600ms debounce to prevent writing on every single keystroke).
 * 2. Instant Local Storage Cache (150ms debounce for offline resilience).
 * 3. Status Reporting: 'idle' | 'saving' | 'saved' | 'error' | 'offline'.
 * 4. Stale Overwrite Prevention: Concurrency conflict resolution via updatedAt timestamps and versioning.
 * 5. Deterministic Multi-Browser Sync: Predictable behavior across multiple devices/tabs.
 * 6. Content Invariant: Interface locale switches never mutate GuideTemplate contentLocale or user free text.
 * 7. Offline Queue: Automatically queues offline writes and flushes upon network reconnection.
 */

import type { GuideTemplate } from "@/lib/guide-data"
import type { WeekInstance, WeekData } from "@/lib/store"
import type { Locale } from "@/lib/date-utils"
import type { BibleVersion } from "@/lib/bible/bible-provider"

export type SyncStatus = "idle" | "saving" | "saved" | "error" | "offline"

export type SyncStatePayload = {
  schemaVersion: number
  userId?: string
  locale?: Locale
  bibleVersion?: BibleVersion
  guides: GuideTemplate[]
  activeGuideId: string
  weeks: WeekInstance[]
  activeWeekId: string | null
  settings: {
    theme: string
    palette: string
    locale: Locale
    bibleVersion: BibleVersion
  }
  updatedAt: string
}

export type SyncListener = (status: SyncStatus, error?: string | null) => void

export interface RemoteCloudProvider {
  fetchUserData(userId: string): Promise<SyncStatePayload | null>
  saveUserData(userId: string, payload: SyncStatePayload): Promise<void>
}

export class SyncEngine {
  private status: SyncStatus = "idle"
  private listeners: Set<SyncListener> = new Set()
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private localDebounceTimer: ReturnType<typeof setTimeout> | null = null
  private pendingPayload: SyncStatePayload | null = null
  private cloudProvider: RemoteCloudProvider | null = null
  private currentUserId: string | null = null
  private isOnline = true
  private lastSavedTimestamp: string = new Date().toISOString()

  constructor(cloudProvider?: RemoteCloudProvider) {
    if (cloudProvider) {
      this.cloudProvider = cloudProvider
    }

    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine
      window.addEventListener("online", () => this.handleNetworkChange(true))
      window.addEventListener("offline", () => this.handleNetworkChange(false))
    }
  }

  public setCloudProvider(provider: RemoteCloudProvider) {
    this.cloudProvider = provider
  }

  public setUserId(userId: string | null) {
    this.currentUserId = userId
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener)
    listener(this.status)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(status: SyncStatus, error?: string | null) {
    this.status = status
    this.listeners.forEach((fn) => fn(status, error))
  }

  public getStatus(): SyncStatus {
    return this.status
  }

  public getLastSavedTimestamp(): string {
    return this.lastSavedTimestamp
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online
    if (online) {
      if (this.pendingPayload) {
        this.notify("saving")
        this.flushPendingSync()
      } else {
        this.notify("idle")
      }
    } else {
      this.notify("offline")
    }
  }

  /**
   * Schedules a debounced write to local cache (150ms) and cloud store (600ms).
   * Prevents firing requests on every keystroke.
   */
  public scheduleSync(
    payload: Omit<SyncStatePayload, "updatedAt">,
    onLocalPersist?: (fullPayload: SyncStatePayload) => void
  ) {
    const fullPayload: SyncStatePayload = {
      ...payload,
      userId: this.currentUserId || undefined,
      updatedAt: new Date().toISOString(),
    }

    this.pendingPayload = fullPayload

    // 1. Fast Local Storage Write (150ms)
    if (this.localDebounceTimer) clearTimeout(this.localDebounceTimer)
    this.localDebounceTimer = setTimeout(() => {
      try {
        onLocalPersist?.(fullPayload)
      } catch (err) {
        console.warn("Local storage write warning:", err)
      }
    }, 150)

    // 2. Debounced Remote Cloud Sync (600ms)
    if (!this.isOnline) {
      this.notify("offline")
      return
    }

    this.notify("saving")

    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(() => {
      this.flushPendingSync()
    }, 600)
  }

  /**
   * Flushes the pending sync immediately to Cloud Provider.
   */
  public async flushPendingSync(): Promise<boolean> {
    if (!this.pendingPayload || !this.cloudProvider || !this.currentUserId) {
      this.notify("saved")
      return true
    }

    if (!this.isOnline) {
      this.notify("offline")
      return false
    }

    try {
      const payloadToSend = this.pendingPayload
      await this.cloudProvider.saveUserData(this.currentUserId, payloadToSend)
      this.lastSavedTimestamp = payloadToSend.updatedAt
      this.pendingPayload = null
      this.notify("saved")
      return true
    } catch (error) {
      console.error("Cloud sync error:", error)
      this.notify("error", error instanceof Error ? error.message : "Sync failure")
      return false
    }
  }

  /**
   * Reconciles remote and local states to prevent stale overwrites between two browsers (Browser A and Browser B).
   * 
   * Rules:
   * 1. If remote document has newer updatedAt timestamp than local, remote changes are adopted.
   * 2. If local document has newer updatedAt timestamp, local changes take precedence.
   * 3. WeekInstances and GuideTemplates are merged by ID with LWW (Last-Write-Wins) per entity.
   * 4. GuideTemplate contentLocale is strictly preserved from the authoring template and never mutated by UI locale.
   * 5. User free texts are never altered.
   */
  public static reconcileStates(
    local: SyncStatePayload,
    remote: SyncStatePayload
  ): SyncStatePayload {
    // 1. Merge Guides by ID with timestamp / version comparison
    const guideMap = new Map<string, GuideTemplate>()

    remote.guides.forEach((rg) => {
      guideMap.set(rg.id, rg)
    })

    local.guides.forEach((lg) => {
      const existing = guideMap.get(lg.id)
      if (!existing) {
        guideMap.set(lg.id, lg)
      } else {
        // Keep the one with higher version or preserve template-specific contentLocale
        const winningGuide = (lg.version || 1) >= (existing.version || 1) ? lg : existing
        guideMap.set(lg.id, {
          ...winningGuide,
          contentLocale: winningGuide.contentLocale || existing.contentLocale || "pt-BR",
        })
      }
    })

    // 2. Merge Weeks by ID with field-level deep merge and timestamp comparison
    const weekMap = new Map<string, WeekInstance>()

    remote.weeks.forEach((rw) => {
      weekMap.set(rw.id, rw)
    })

    local.weeks.forEach((lw) => {
      const existing = weekMap.get(lw.id)
      if (!existing) {
        weekMap.set(lw.id, lw)
      } else {
        const localTime = new Date(lw.updatedAt || lw.createdAt || 0).getTime()
        const remoteTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime()
        const base = localTime >= remoteTime ? lw : existing
        const other = localTime >= remoteTime ? existing : lw

        // Deep merge data.text (preserving answers from both devices)
        const mergedText = {
          ...(other.data?.text || {}),
          ...(base.data?.text || {}),
        }

        // Deep merge data.done
        const mergedDone = {
          ...(other.data?.done || {}),
          ...(base.data?.done || {}),
        }

        // Merge activities by ID
        const activityMap = new Map()
        ;(other.programacao?.activities || []).forEach((a) => activityMap.set(a.id, a))
        ;(base.programacao?.activities || []).forEach((a) => activityMap.set(a.id, a))
        const mergedActivities = Array.from(activityMap.values())

        // Preserve completion and AI review if present on either
        const isCompleted = base.status === "completed" || other.status === "completed"
        const completionSnapshot = base.completionSnapshot || other.completionSnapshot || null
        const aiReview = base.aiReview || other.aiReview || null
        const completedAt = base.completedAt || other.completedAt || null

        const mergedWeek: WeekInstance = {
          ...base,
          updatedAt: new Date(Math.max(localTime, remoteTime)).toISOString(),
          status: isCompleted ? "completed" : "active",
          completedAt,
          completionSnapshot,
          aiReview,
          data: {
            text: mergedText,
            done: mergedDone,
          },
          programacao: {
            dias: 7,
            activities: mergedActivities,
          },
          progresso: {
            total: mergedActivities.filter((a) => a.countsTowardCompletion !== false).length,
            concluidas: mergedActivities.filter((a) => a.countsTowardCompletion !== false && mergedDone[a.id]).length,
            percentual:
              mergedActivities.filter((a) => a.countsTowardCompletion !== false).length > 0
                ? Math.round(
                    (mergedActivities.filter((a) => a.countsTowardCompletion !== false && mergedDone[a.id]).length /
                      mergedActivities.filter((a) => a.countsTowardCompletion !== false).length) *
                      100
                  )
                : 0,
          },
        }

        weekMap.set(lw.id, mergedWeek)
      }
    })

    const mergedWeeks = Array.from(weekMap.values()).sort((a, b) =>
      a.startDate.localeCompare(b.startDate) || a.createdAt.localeCompare(b.createdAt)
    )

    const newerOverall = new Date(local.updatedAt).getTime() >= new Date(remote.updatedAt).getTime()

    return {
      schemaVersion: 4,
      userId: local.userId || remote.userId,
      guides: Array.from(guideMap.values()),
      activeGuideId: newerOverall ? local.activeGuideId : remote.activeGuideId,
      weeks: mergedWeeks,
      activeWeekId: newerOverall ? local.activeWeekId : remote.activeWeekId,
      settings: newerOverall ? local.settings : remote.settings,
      updatedAt: newerOverall ? local.updatedAt : remote.updatedAt,
    }
  }
}
