import { Outlet, ScrollRestoration } from 'react-router-dom'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'

export function SiteLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  )
}
