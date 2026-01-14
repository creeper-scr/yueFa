import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  const setToken = (newToken) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  const setUser = (userData) => {
    user.value = userData
  }

  const login = async (phone, code) => {
    const res = await authApi.login(phone, code)
    if (res.code === 0) {
      setToken(res.data.token)
      setUser(res.data.user)
    }
    return res
  }

  const logout = () => {
    setToken('')
    setUser(null)
  }

  const fetchUserInfo = async () => {
    if (!token.value) return
    try {
      const res = await authApi.getMe()
      if (res.code === 0) {
        setUser(res.data)
      }
    } catch (error) {
      logout()
    }
  }

  return {
    user,
    token,
    isLoggedIn,
    login,
    logout,
    setUser,
    fetchUserInfo
  }
})
