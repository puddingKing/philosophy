import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import PhilosopherCard from '@/components/PhilosopherCard'
import { fetchPhilosophers } from '@/services/api'
import type { Philosopher } from '@/types/philosopher'
import './index.scss'

export default function Index() {
  const [philosophers, setPhilosophers] = useState<Philosopher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchPhilosophers()
      setPhilosophers(data)
    } catch (err) {
      setError('加载失败，请确认 API 服务已启动')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useDidShow(() => {
    loadData()
  })

  const handleCardClick = (id: string) => {
    Taro.navigateTo({
      url: `/pages/philosopher/index?id=${id}`,
    })
  }

  return (
    <ScrollView className='index-page' scrollY enhanced showScrollbar={false}>
      <View className='index-page__header'>
        <Text className='index-page__title'>哲学家</Text>
        <Text className='index-page__subtitle'>探索思想的世界</Text>
      </View>

      {loading && (
        <View className='index-page__status'>
          <Text className='index-page__status-text'>加载中…</Text>
        </View>
      )}

      {!loading && error && (
        <View className='index-page__status'>
          <Text className='index-page__status-text index-page__status-text--error'>{error}</Text>
          <Text className='index-page__retry' onClick={loadData}>点击重试</Text>
        </View>
      )}

      {!loading && !error && (
        <View className='index-page__grid'>
          {philosophers.map((philosopher) => (
            <View key={philosopher.id} className='index-page__grid-item'>
              <PhilosopherCard philosopher={philosopher} onClick={handleCardClick} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}
