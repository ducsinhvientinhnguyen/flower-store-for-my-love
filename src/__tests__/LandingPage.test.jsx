import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import LandingPage from '../pages/LandingPage'

vi.mock('../lib/api', () => ({
  api: { get: vi.fn() },
}))

import { api } from '../lib/api'

function renderLanding() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('LandingPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('hiển thị hero, câu chuyện thương hiệu và link đăng nhập', async () => {
    api.get.mockResolvedValue({ ok: true, json: async () => [] })

    renderLanding()

    expect(screen.getByRole('heading', { name: /hoa tươi mỗi ngày/i })).toBeInTheDocument()
    expect(screen.getByText(/từ tâm huyết đến từng cánh hoa/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /đăng nhập/i })).toHaveAttribute('href', '/login')
  })

  it('hiển thị sản phẩm nổi bật khi API trả dữ liệu', async () => {
    api.get.mockResolvedValue({
      ok: true,
      json: async () => [
        { id: '1', name: 'Bó Hồng Hỗn Hợp', category: 'Hoa hồng', basePrice: 350000, imageUrl: 'https://x/y.jpg' },
      ],
    })

    renderLanding()

    await waitFor(() => expect(screen.getByText('Bó Hồng Hỗn Hợp')).toBeInTheDocument())
  })
})
