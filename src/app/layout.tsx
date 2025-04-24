import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { MealProvider } from "@/lib/contexts/MealContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "학교 급식 웹",
  description: "우리 학교 급식 정보 웹",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <MealProvider>{children}</MealProvider>
      </body>
    </html>
  )
}
