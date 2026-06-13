import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import POSPage from './pages/POSPage'
import InventoryPage from './pages/InventoryPage'
import PreOrdersPage from './pages/PreOrdersPage'
import CustomersPage from './pages/CustomersPage'
import ReportsPage from './pages/ReportsPage'
import ExpensesPage from './pages/ExpensesPage'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient()

function GuestRoute({ children }) {
  const user = useAuthStore(s => s.user)
  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/" element={<Layout />}>
            <Route index element={<POSPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="pre-orders" element={<PreOrdersPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
