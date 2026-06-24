import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import POSPage from './pages/POSPage'
import InventoryPage from './pages/InventoryPage'
import PreOrdersPage from './pages/PreOrdersPage'
import CustomersPage from './pages/CustomersPage'
import ReportsPage from './pages/ReportsPage'
import ExpensesPage from './pages/ExpensesPage'
import PageTransition from './components/motion/PageTransition'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient()

function GuestRoute({ children }) {
  const user = useAuthStore(s => s.user)
  if (user) return <Navigate to="/app" replace />
  return children
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <PageTransition><LoginPage /></PageTransition>
            </GuestRoute>
          }
        />
        <Route path="/app" element={<Layout />}>
          <Route index element={<PageTransition><POSPage /></PageTransition>} />
          <Route path="inventory" element={<PageTransition><InventoryPage /></PageTransition>} />
          <Route path="pre-orders" element={<PageTransition><PreOrdersPage /></PageTransition>} />
          <Route path="customers" element={<PageTransition><CustomersPage /></PageTransition>} />
          <Route path="reports" element={<PageTransition><ReportsPage /></PageTransition>} />
          <Route path="expenses" element={<PageTransition><ExpensesPage /></PageTransition>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
