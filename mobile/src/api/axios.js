import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const api = axios.create({
  baseURL: 'http://192.168.100.93:8000/api',  // ← only this line changed
})

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = await AsyncStorage.getItem('refresh_token')
        const res = await axios.post('http://192.168.100.93:8000/api/auth/token/refresh/', { refresh })  // ← and this line
        await AsyncStorage.setItem('access_token', res.data.access)
        original.headers.Authorization = `Bearer ${res.data.access}`
        return api(original)
      } catch {
        await AsyncStorage.clear()
      }
    }
    return Promise.reject(error)
  }
)

export default api