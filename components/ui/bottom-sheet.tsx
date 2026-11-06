"use client"

import * as React from "react"
import { Drawer } from "vaul"
import { cn } from "@/lib/utils"
import { AudioEngine } from "@/lib/audio/AudioEngine"

export type BottomSheetProps = React.ComponentProps<typeof Drawer.Root>

export function BottomSheet({
  shouldScaleBackground = false,
  snapPoints = [0.45, 0.92],
  fadeFromIndex = 0,
  onDrag,
  ...props
}: BottomSheetProps) {
  const handleDrag = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>, percentageDragged: number) => {
      AudioEngine.sfx?.playSheetDrag()
      onDrag?.(event, percentageDragged)
    },
    [onDrag]
  )

  return (
    <Drawer.Root
      shouldScaleBackground={shouldScaleBackground}
      snapPoints={snapPoints}
      fadeFromIndex={fadeFromIndex}
      onDrag={handleDrag}
      {...props}
    />
  )
}

export const BottomSheetTrigger = Drawer.Trigger
export const BottomSheetPortal = Drawer.Portal
export const BottomSheetClose = Drawer.Close

export const BottomSheetOverlay = React.forwardRef<
  React.ElementRef<typeof Drawer.Overlay>,
  React.ComponentPropsWithoutRef<typeof Drawer.Overlay>
>(({ className, ...props }, ref) => (
  <Drawer.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px] transition-opacity duration-300",
      className
    )}
    {...props}
  />
))
BottomSheetOverlay.displayName = "BottomSheetOverlay"

export const BottomSheetHandle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "mx-auto my-3 h-1.5 w-12 rounded-full bg-muted-foreground/25 active:bg-muted-foreground/40 transition-colors",
      className
    )}
    aria-hidden="true"
    {...props}
  />
))
BottomSheetHandle.displayName = "BottomSheetHandle"

export const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof Drawer.Content>,
  React.ComponentPropsWithoutRef<typeof Drawer.Content> & {
    hideHandle?: boolean
  }
>(({ className, children, hideHandle = false, ...props }, ref) => (
  <BottomSheetPortal>
    <BottomSheetOverlay />
    <Drawer.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex max-h-[96vh] flex-col rounded-t-[24px] border-t border-border bg-card p-6 shadow-2xl focus:outline-none transition-[transform,height] duration-300 ease-out",
        className
      )}
      {...props}
    >
      {!hideHandle && <BottomSheetHandle />}
      {children}
    </Drawer.Content>
  </BottomSheetPortal>
))
BottomSheetContent.displayName = "BottomSheetContent"

export const BottomSheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-2 text-center sm:text-left", className)}
    {...props}
  />
)
BottomSheetHeader.displayName = "BottomSheetHeader"

export const BottomSheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 pt-4", className)}
    {...props}
  />
)
BottomSheetFooter.displayName = "BottomSheetFooter"

export const BottomSheetTitle = React.forwardRef<
  React.ElementRef<typeof Drawer.Title>,
  React.ComponentPropsWithoutRef<typeof Drawer.Title>
>(({ className, ...props }, ref) => (
  <Drawer.Title
    ref={ref}
    className={cn("font-serif text-xl font-medium tracking-tight text-foreground", className)}
    {...props}
  />
))
BottomSheetTitle.displayName = "BottomSheetTitle"

export const BottomSheetDescription = React.forwardRef<
  React.ElementRef<typeof Drawer.Description>,
  React.ComponentPropsWithoutRef<typeof Drawer.Description>
>(({ className, ...props }, ref) => (
  <Drawer.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))
BottomSheetDescription.displayName = "BottomSheetDescription"
