"use client"

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("authToken")
        if (token) {
          // In a real app, you would verify the token with your backend
          const userData = JSON.parse(localStorage.getItem("userData") || "{}")
          setUser(userData)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        localStorage.removeItem("authToken")
        localStorage.removeItem("userData")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (credentials) => {
    try {
      setIsLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const userData = {
        id: Date.now(),
        email: credentials.email || credentials.phone,
        name: credentials.firstName ? `${credentials.firstName} ${credentials.lastName}` : "User",
        loginMethod: credentials.email ? "email" : "phone",
        createdAt: new Date().toISOString()
      }

      // In a real app, you would get these from your backend
      const token = "mock-jwt-token-" + Date.now()
      
      localStorage.setItem("authToken", token)
      localStorage.setItem("userData", JSON.stringify(userData))
      setUser(userData)
      
      return { success: true, user: userData }
    } catch (error) {
      console.error("Login failed:", error)
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (userData) => {
    try {
      setIsLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newUser = {
        id: Date.now(),
        email: userData.email || userData.phone,
        name: `${userData.firstName} ${userData.lastName}`,
        loginMethod: userData.email ? "email" : "phone",
        createdAt: new Date().toISOString()
      }

      // In a real app, you would get these from your backend
      const token = "mock-jwt-token-" + Date.now()
      
      localStorage.setItem("authToken", token)
      localStorage.setItem("userData", JSON.stringify(newUser))
      setUser(newUser)
      
      return { success: true, user: newUser }
    } catch (error) {
      console.error("Signup failed:", error)
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("userData")
    setUser(null)
    // Redirect to homepage after logout
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  const value = {
    user,
    isLoading,
    login,
    signup,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
