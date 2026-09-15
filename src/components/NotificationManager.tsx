'use client'

import { useEffect } from 'react'

export function NotificationManager() {
  useEffect(() => {
    // Solicita permissão para notificações
    if ('Notification' in window) {
      Notification.requestPermission()
    }

    const checkTime = () => {
      const now = new Date()
      const hour = now.getHours()
      const minute = now.getMinutes()
      
      // Apenas no minuto 0 exato
      if (minute !== 0) return

      const waterHours = [6, 9, 10, 11, 14, 15, 16, 17]
      const mealHours = [7, 12, 18]

      if (Notification.permission === 'granted') {
        if (waterHours.includes(hour)) {
          new Notification('Hora da Água! 💧', {
            body: 'Beba seus 450ml de água agora.',
          })
        }
        
        if (mealHours.includes(hour)) {
          let mealName = ''
          if (hour === 7) mealName = 'Desjejum'
          if (hour === 12) mealName = 'Almoço'
          if (hour === 18) mealName = 'Jantar'

          new Notification(`Hora do ${mealName}! 🍽️`, {
            body: 'Não esqueça o gérmen de trigo e o levedo de cerveja!',
          })
        }
      }
    }

    // Checa a cada minuto
    const interval = setInterval(checkTime, 60000)
    
    return () => clearInterval(interval)
  }, [])

  return null
}
