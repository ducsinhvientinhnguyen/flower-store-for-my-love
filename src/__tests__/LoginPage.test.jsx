import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import LoginPage from '../pages/LoginPage'

// Mock react-router navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// Mock api
vi.mock('../lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}))

import { api } from '../lib/api'

// Mock authStore
vi.mock('../store/authStore', () => ({
  useAuthStore: (selector) => selector({ setAuth: vi.fn() }),
}))

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('hiển thị form đăng nhập', () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mật khẩu/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument()
  })

  it('navigate về / sau khi đăng nhập thành công', async () => {
    api.post.mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'tok', user: { id: '1', name: 'A', role: 'OWNER' } }),
    })

    renderLogin()
    await userEvent.type(screen.getByLabelText(/email/i), 'owner@test.com')
    await userEvent.type(screen.getByLabelText(/mật khẩu/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'))
  })

  it('hiển thị lỗi khi credentials sai', async () => {
    api.post.mockResolvedValue({ ok: false })

    renderLogin()
    await userEvent.type(screen.getByLabelText(/email/i), 'owner@test.com')
    await userEvent.type(screen.getByLabelText(/mật khẩu/i), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /đăng nhập/i }))

    await waitFor(() =>
      expect(screen.getByText(/email hoặc mật khẩu không đúng/i)).toBeInTheDocument()
    )
  })
})
