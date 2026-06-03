import { View, Text, Image, ScrollView } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { fetchPhilosopherById, getPhilosopherAvatar } from '@/services/api'
import type { Philosopher } from '@/types/philosopher'
import './index.scss'

export default function PhilosopherDetail() {
  const router = useRouter()
  const id = router.params.id || ''
  const [philosopher, setPhilosopher] = useState<Philosopher | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setImageError(false)
    fetchPhilosopherById(id)
      .then(setPhilosopher)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <View className='philosopher-detail philosopher-detail--empty'>
        <Text className='philosopher-detail__empty-text'>加载中…</Text>
      </View>
    )
  }

  if (!philosopher) {
    return (
      <View className='philosopher-detail philosopher-detail--empty'>
        <Text className='philosopher-detail__empty-text'>未找到该哲学家</Text>
      </View>
    )
  }

  const avatarSrc = getPhilosopherAvatar(philosopher)
  const initial = philosopher.name.charAt(0)
  const showAvatar = avatarSrc && !imageError

  return (
    <ScrollView className='philosopher-detail' scrollY enhanced showScrollbar={false}>
      <View className='philosopher-detail__hero'>
        {showAvatar ? (
          <Image
            className='philosopher-detail__avatar'
            src={avatarSrc}
            mode='aspectFill'
            onError={() => setImageError(true)}
          />
        ) : (
          <View className='philosopher-detail__avatar-placeholder'>
            <Text className='philosopher-detail__initial'>{initial}</Text>
          </View>
        )}
        <Text className='philosopher-detail__name'>{philosopher.name}</Text>
        {philosopher.nameEn && (
          <Text className='philosopher-detail__name-en'>{philosopher.nameEn}</Text>
        )}
        <View className='philosopher-detail__meta'>
          {philosopher.era && (
            <Text className='philosopher-detail__tag'>{philosopher.era}</Text>
          )}
          {philosopher.school && (
            <Text className='philosopher-detail__tag'>{philosopher.school}</Text>
          )}
        </View>
      </View>

      {philosopher.summary && (
        <View className='philosopher-detail__section'>
          <Text className='philosopher-detail__section-title'>简介</Text>
          <Text className='philosopher-detail__text'>{philosopher.summary}</Text>
        </View>
      )}

      {philosopher.biography && (
        <View className='philosopher-detail__section'>
          <Text className='philosopher-detail__section-title'>生平</Text>
          <Text className='philosopher-detail__text'>{philosopher.biography}</Text>
        </View>
      )}

      {philosopher.works && philosopher.works.length > 0 && (
        <View className='philosopher-detail__section'>
          <Text className='philosopher-detail__section-title'>代表作品</Text>
          {philosopher.works.map((work) => (
            <View key={work.id} className='philosopher-detail__work-item'>
              <Text className='philosopher-detail__work-title'>{work.title}</Text>
              {work.year && (
                <Text className='philosopher-detail__work-year'>{work.year}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      <View className='philosopher-detail__footer'>
        <Text className='philosopher-detail__footer-text'>更多内容开发中…</Text>
      </View>
    </ScrollView>
  )
}
