import { View, Image, Text } from '@tarojs/components'
import { useState } from 'react'
import { Philosopher } from '@/types/philosopher'
import { getPhilosopherAvatar } from '@/services/api'
import './index.scss'

interface PhilosopherCardProps {
  philosopher: Philosopher
  onClick?: (id: string) => void
}

export default function PhilosopherCard({ philosopher, onClick }: PhilosopherCardProps) {
  const [imageError, setImageError] = useState(false)
  const avatarSrc = getPhilosopherAvatar(philosopher)
  const initial = philosopher.name.charAt(0)
  const showAvatar = avatarSrc && !imageError

  const handleClick = () => {
    onClick?.(philosopher.id)
  }

  return (
    <View className='philosopher-card' onClick={handleClick}>
      <View className='philosopher-card__avatar-wrap'>
        {showAvatar ? (
          <Image
            className='philosopher-card__avatar'
            src={avatarSrc}
            mode='aspectFill'
            onError={() => setImageError(true)}
          />
        ) : (
          <View className='philosopher-card__avatar-placeholder'>
            <Text className='philosopher-card__initial'>{initial}</Text>
          </View>
        )}
      </View>
      <Text className='philosopher-card__name'>{philosopher.name}</Text>
      {philosopher.nameEn && (
        <Text className='philosopher-card__name-en'>{philosopher.nameEn}</Text>
      )}
      {philosopher.era && (
        <Text className='philosopher-card__era'>{philosopher.era}</Text>
      )}
    </View>
  )
}
