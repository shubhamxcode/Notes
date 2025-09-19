export interface User {
  id: string
  email: string
  role: 'admin' | 'member'
  tenant: Tenant
}

export interface Tenant {
  id: string
  slug: string
  name: string
  subscription: 'free' | 'pro'
}

export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  user: {
    email: string
  }
}

export interface AuthResponse {
  user: User
  token: string
} 