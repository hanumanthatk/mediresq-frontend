import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuth } from './AuthContext'

const WSContext = createContext(null)

export function WebSocketProvider({ children }) {
  const { user }         = useAuth()
  const clientRef        = useRef(null)
  const [connected, setConnected] = useState(false)
  const subscribersRef   = useRef({})    // topic → Set<callback>

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('accessToken')

    const client = new Client({
      webSocketFactory: () => new SockJS('/api/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true)

        // User-specific notifications
        client.subscribe(`/user/queue/notifications`, (msg) => {
          notify('notification', JSON.parse(msg.body))
        })

        // Emergency updates for everyone
        client.subscribe('/topic/emergency/updates', (msg) => {
          notify('emergency', JSON.parse(msg.body))
        })

        // Hospital-specific (only if hospital user)
        if (user.role === 'HOSPITAL' && user.hospitalId) {
          client.subscribe(`/topic/hospital/${user.hospitalId}/emergency`, (msg) => {
            notify('hospital-emergency', JSON.parse(msg.body))
          })
          client.subscribe(`/topic/hospital/${user.hospitalId}/beds`, (msg) => {
            notify('beds-update', JSON.parse(msg.body))
          })
        }
      },
      onDisconnect: () => setConnected(false),
      onStompError: (frame) => console.warn('STOMP error', frame),
    })

    client.activate()
    clientRef.current = client

    return () => { client.deactivate(); setConnected(false) }
  }, [user])

  const notify = (topic, data) => {
    const subs = subscribersRef.current[topic]
    if (subs) subs.forEach((cb) => cb(data))
  }

  const subscribe = (topic, callback) => {
    if (!subscribersRef.current[topic]) subscribersRef.current[topic] = new Set()
    subscribersRef.current[topic].add(callback)
    return () => subscribersRef.current[topic]?.delete(callback)
  }

  return (
    <WSContext.Provider value={{ connected, subscribe }}>
      {children}
    </WSContext.Provider>
  )
}

export const useWebSocket = () => useContext(WSContext)
