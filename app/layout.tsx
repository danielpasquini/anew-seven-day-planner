import type { Metadata, Viewport } from 'next'
import { Geist, Lora } from 'next/font/google'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
})

export const metadata: Metadata = {
  title: 'Anew · Seven Days. Small Steps.',
  description:
    'A calm seven-day planner with small steps, ready-made weeks without AI, and weekly notes you can make your own. Your week, at your pace.',
  applicationName: 'Anew',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#e8e5d8',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${lora.variable} bg-background`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('guia-theme');
                  var p = localStorage.getItem('guia-palette');
                  var isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  if (p) {
                    document.documentElement.setAttribute('data-palette', p);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased text-foreground selection:bg-primary/20 selection:text-primary">
        {children}
      </body>
    </html>
  )
}
