const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://canagold-backend.onrender.com/api"

export const apiClient = {
  async request<T>(endpoint: string, options: RequestInit & { token?: string } = {}): Promise<T> {
    const { token, ...fetchOptions } = options
    const headers: Record<string, string> = {
      ...(fetchOptions.headers as Record<string, string> || {}),
    }

    // Only set Content-Type if body is not FormData
    if (!(fetchOptions.body instanceof FormData)) {
      headers["Content-Type"] = "application/json"
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      // If unauthorized and we have a token, it might be expired
      if (response.status === 401 && token) {
        console.warn("Received 401, token may be expired")
      }
      throw new Error(data.message || `API Error: ${response.status}`)
    }

    return data
  },
}
