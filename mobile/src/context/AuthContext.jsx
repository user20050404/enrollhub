import { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem('access_token').then(token => {
      if (token) {
        api.get('/auth/me/')
          .then(res => setUser(res.data))
          .catch(() => AsyncStorage.clear())
          .finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login/', { email, password })
    await AsyncStorage.setItem('access_token',  res.data.access)
    await AsyncStorage.setItem('refresh_token', res.data.refresh)
    setUser(res.data.user)
    return res.data.user
  }

  const logout = async () => {
    try {
      const refresh = await AsyncStorage.getItem('refresh_token')
      await api.post('/auth/logout/', { refresh })
    } catch {}
    await AsyncStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)