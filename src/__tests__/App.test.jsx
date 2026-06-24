import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('../lib/api', () => ({
  api: { get: vi.fn().mockResolvedValue({ ok: true, json: async () => [] }) },
}))

import { useAuthStore } from '../store/authStore'
import App from '../App'

function mockAuth(state) {
  useAuthStore.mockImplementation(selector => (selector ? selector(state) : state))
}

describe('App routing', () => {
  beforeEach(() => vi.clearAllMocks())

  it('"/" hiển thị landing page công khai khi chưa đăng nhập', () => {
    mockAuth({ user: null, clearAuth: vi.fn() })
    window.history.pushState({}, '', '/')

    render(<App />)

    expect(screen.getByRole('heading', { name: /hoa tươi mỗi ngày/i })).toBeInTheDocument()
  })

  it('"/app" chuyển hướng về /login khi chưa đăng nhập', () => {
    mockAuth({ user: null, clearAuth: vi.fn() })
    window.history.pushState({}, '', '/app')

    render(<App />)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })
})
