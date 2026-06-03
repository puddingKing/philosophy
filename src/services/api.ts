import Taro from '@tarojs/taro'
import type { Philosopher } from '@/types/philosopher'

/** 开发时在 project.config.json 关闭 urlCheck；真机调试请改为电脑局域网 IP */
export const API_BASE_URL = 'http://127.0.0.1:3000'

export async function fetchPhilosophers(): Promise<Philosopher[]> {
  const res = await Taro.request<Philosopher[]>({
    url: `${API_BASE_URL}/api/philosophers`,
    method: 'GET',
  })

  if (res.statusCode !== 200) {
    throw new Error(`API error: ${res.statusCode}`)
  }

  return res.data
}

export async function fetchPhilosopherById(id: string): Promise<Philosopher | null> {
  const res = await Taro.request<Philosopher>({
    url: `${API_BASE_URL}/api/philosophers/${id}`,
    method: 'GET',
  })

  if (res.statusCode === 404) return null
  if (res.statusCode !== 200) {
    throw new Error(`API error: ${res.statusCode}`)
  }

  return res.data
}

export function getPhilosopherAvatar(philosopher: Philosopher): string | undefined {
  return philosopher.avatarUrl
}
