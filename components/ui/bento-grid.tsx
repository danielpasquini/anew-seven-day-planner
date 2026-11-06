import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

export function BentoGrid({ children, className, ...props }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[20rem] grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  className?: string
  background?: React.ReactNode
  Icon?: React.ComponentType<{ className?: string }>
  description: string
  href?: string
  cta?: string
}

export function BentoCard({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  ...props
}: BentoCardProps) {
  return (
    <div
      key={name}
      className={cn(
        "group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 pointer-events-none opacity-40 transition-opacity duration-300 group-hover:opacity-70">
        {background}
      </div>

      <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1.5 transition-all duration-300">
        {Icon && (
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
            <Icon className="size-5" />
          </div>
        )}
        <h3 className="font-serif text-lg font-medium tracking-tight text-foreground">
          {name}
        </h3>
        <p className="max-w-lg text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {cta && href && (
        <div className="pointer-events-auto z-10 mt-4 flex items-center">
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline group-hover:translate-x-0.5 transition-transform"
          >
            {cta}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* Subtle bottom gradient glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
    </div>
  )
}
