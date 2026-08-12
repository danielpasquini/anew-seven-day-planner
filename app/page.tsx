import { StoreProvider } from "@/lib/store"
import { GuideApp } from "@/components/guide-app"

export default function Page() {
  return (
    <StoreProvider>
      <GuideApp />
    </StoreProvider>
  )
}
