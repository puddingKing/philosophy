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
