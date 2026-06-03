export interface Work {
  id: string
  title: string
  year?: string
  description?: string
}

export interface Philosopher {
  id: string
  name: string
  nameEn?: string
  era?: string
  school?: string
  avatarUrl?: string
  summary?: string
  biography?: string
  works?: Work[]
  createdAt?: string
  updatedAt?: string
}

export interface CreatePhilosopherInput {
  id: string
  name: string
  nameEn?: string
  era?: string
  school?: string
  summary?: string
  biography?: string
  works?: Omit<Work, 'id'>[]
}

export type UpdatePhilosopherInput = Partial<Omit<CreatePhilosopherInput, 'id'>>

export interface User {
  id: number
  username: string
}

export interface LoginInput {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}
