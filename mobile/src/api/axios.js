import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const BASE_URL = 'https://enrollhub-backend.onrender.com/api'

const api = axios.create({
  baseURL: BASE_URL,
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
        const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh })
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