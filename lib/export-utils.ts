import { type GuideTemplate } from "@/lib/guide-data"
import { type WeekInstance, type ThemeMode, type ColorPalette } from "@/lib/store"
import { formatDateRangeLocale, getWeekDays, type Locale } from "@/lib/date-utils"
import { sectionsForWeek } from "@/lib/guide-revision"
import { BibleProvider, type BibleVersion } from "@/lib/bible/bible-provider"

export function buildWeekMarkdown(
  activeWeek: WeekInstance,
  activeGuide: GuideTemplate,
  locale: Locale,
  bibleVersion: BibleVersion
): string {
  const guideTitle = activeWeek.guideSnapshot?.title || activeGuide.title
  const rangeStr = formatDateRangeLocale(activeWeek.startDate, activeWeek.endDate, locale)
  const isEn = locale === "en-US"

  let md = `# ${guideTitle}\n`
  md += `## ${activeWeek.title} (${rangeStr})\n\n`
  md += `**${isEn ? "Status" : "Status"}:** ${activeWeek.status === "completed" ? (isEn ? "Completed" : "Concluída") : (isEn ? "In progress" : "Em andamento")}\n`
  if (activeWeek.completedAt) {
    md += `**${isEn ? "Completed on" : "Concluída em"}:** ${new Date(activeWeek.completedAt).toLocaleString(locale)}\n`
  }
  md += `**${isEn ? "Created on" : "Data de Criação"}:** ${new Date(activeWeek.createdAt).toLocaleDateString(locale)}\n`
  md += `**${isEn ? "Week Progress" : "Progresso da Semana"}:** ${activeWeek.progresso.concluidas} ${isEn ? "of" : "de"} ${activeWeek.progresso.total} ${isEn ? "tasks completed" : "tarefas concluídas"} (${activeWeek.progresso.percentual}%)\n\n`

  if (activeWeek.aiReview) {
    md += `---\n\n`
    md += `### ${isEn ? "Optional AI reflection" : "Reflexão opcional com IA"}\n\n`
    md += `**${isEn ? "Reflection" : "Reflexão"}:** ${activeWeek.aiReview.verdict}\n\n`
    md += `**${isEn ? "Summary" : "Resumo"}:** ${activeWeek.aiReview.summary}\n\n`
    md += `**${isEn ? "What worked well" : "O que funcionou bem"}:\n`
    activeWeek.aiReview.whatWorked.forEach((item) => (md += `- ${item}\n`))
    md += `\n**${isEn ? "Observed difficulties" : "Dificuldades observadas"}:\n`
    activeWeek.aiReview.difficulties.forEach((item) => (md += `- ${item}\n`))
    md += `\n**${isEn ? "Identified patterns" : "Padrões observados"}:\n`
    activeWeek.aiReview.observedPatterns.forEach((item) => (md += `- ${item}\n`))
    md += `\n**${isEn ? "Suggestions for next cycle" : "Sugestões para a próxima semana"}:\n`
    activeWeek.aiReview.nextWeekSuggestions.forEach((item) => (md += `- ${item}\n`))
    md += `\n`
  }

  md += `---\n\n`
  md += `### ${isEn ? "Weekly Activity Schedule" : "Programação Semanal de Atividades"}\n\n`
  const days = getWeekDays(activeWeek.startDate, locale)
  const activities = activeWeek.programacao?.activities || []

  days.forEach((day) => {
    md += `#### ${day.dayNumberLabel} (${day.formattedShort})\n`
    const dayActs = activities
      .filter((a) => a.dayIndex === day.dayIndex)
      .sort((a, b) => a.order - b.order || a.time.localeCompare(b.time))

    if (dayActs.length === 0) {
      md += `*${isEn ? "No activities scheduled" : "Sem atividades cadastradas"}*\n\n`
    } else {
      dayActs.forEach((act) => {
        const done = activeWeek.data.done[act.id] ? "[X]" : "[ ]"
        const extra = act.countsTowardCompletion === false ? (isEn ? " (Informational)" : " (Informativa)") : ""
        md += `- ${done} **${act.time}** — ${act.description}${extra}\n`
      })
      md += `\n`
    }
  })

  md += `---\n\n`
  md += `### ${isEn ? "Guide Records & Responses" : "Registros e Respostas do Guia"}\n\n`
  sectionsForWeek(activeWeek, activeGuide).forEach((s) => {
    md += `#### ${isEn ? "Section" : "Seção"} ${s.number}: ${s.title}\n\n`
    s.blocks.forEach((block) => {
      if (block.type === "fields" && block.fields) {
        if (block.title) md += `##### ${block.title}\n\n`
        block.fields.forEach((field) => {
          if (field.kind === "static") return
          const val = activeWeek.data.text[field.id] || (isEn ? "*Not filled*" : "*Não preenchido*")
          const label = field.label || field.id
          md += `**${label}:**\n> ${val.replace(/\n/g, "\n> ")}\n\n`
        })
      } else if (block.type === "ladder" && block.rows) {
        block.rows.forEach((row) => {
          const nota = activeWeek.data.text[`${row.id}-nota`] || "-"
          const feito = activeWeek.data.done[row.id] ? "[X]" : "[ ]"
          md += `- ${feito} **${row.label}** — ${isEn ? "Target difficulty" : "Nota prevista"}: ${nota}\n`
        })
        md += `\n`
      }
    })
  })

  if (activeGuide.theologyEnabled) {
    const notice = BibleProvider.getAttributionNotice(bibleVersion, locale)
    if (notice) {
      md += `---\n\n*${notice}*\n`
    }
  }

  return md
}

export function buildWeekExportJSON(activeWeek: WeekInstance, activeGuide: GuideTemplate): string {
  const activities = activeWeek.programacao?.activities || []
  const taskResults = activities.map((a) => ({
    id: a.id,
    dayIndex: a.dayIndex,
    time: a.time,
    description: a.description,
    countsTowardCompletion: a.countsTowardCompletion !== false,
    done: Boolean(activeWeek.data.done[a.id]),
  }))
  const exportData = {
    exportVersion: 1,
    schemaVersion: 4,
    exportedAt: new Date().toISOString(),
    guide: {
      id: activeWeek.guideId || activeGuide.id,
      title: activeWeek.guideSnapshot?.title || activeGuide.title,
      version: activeWeek.guideVersion || activeGuide.version,
    },
    metadata: {
      weekId: activeWeek.id,
      title: activeWeek.title,
      startDate: activeWeek.startDate,
      endDate: activeWeek.endDate,
      status: activeWeek.status,
      createdAt: activeWeek.createdAt,
      updatedAt: activeWeek.updatedAt,
      completedAt: activeWeek.completedAt ?? null,
    },
    schedule: activities.map((a) => ({
      id: a.id,
      dayIndex: a.dayIndex,
      time: a.time,
      description: a.description,
      order: a.order,
      countsTowardCompletion: a.countsTowardCompletion !== false,
    })),
    responses: activeWeek.data.text,
    tasks: taskResults,
    progress: activeWeek.progresso,
    completionSnapshot: activeWeek.completionSnapshot ?? null,
    aiReview: activeWeek.aiReview ?? null,
  }
  return JSON.stringify(exportData, null, 2)
}
