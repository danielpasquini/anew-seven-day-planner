import type { Metadata } from "next"
import { AccountDeletionPage } from "@/components/account-deletion-page"

export const metadata: Metadata = { title: "Account deletion · Anew" }
export default function Page() { return <AccountDeletionPage /> }
