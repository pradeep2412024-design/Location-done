"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface UserData {
  location: string
  crop: string
  month: string
  hectare: string
  previousCrop?: string
  nextCrop?: string
}

interface AnalysisData {
  predictions?: any
  soilData?: any
  weatherData?: any
  marketAnalysis?: any
  recommendations?: any
  locationData?: any
  userInfo?: any
}

interface AppContextType {
  userData: UserData
  analysisData: AnalysisData | null
  setUserData: (data: Partial<UserData>) => void
  setAnalysisData: (data: AnalysisData | null) => void
  updateLocation: (location: string) => void
  updateCrop: (crop: string) => void
  getCurrentData: () => { userData: UserData; analysisData: AnalysisData | null }
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

interface AppProviderProps {
  children: ReactNode
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [userData, setUserDataState] = useState<UserData>({
    location: '',
    crop: '',
    month: '',
    hectare: ''
  })
  
  const [analysisData, setAnalysisDataState] = useState<AnalysisData | null>(null)

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUserData = localStorage.getItem('cropwise_userData')
    const savedAnalysisData = localStorage.getItem('cropwise_analysisData')
    
    if (savedUserData) {
      setUserDataState(JSON.parse(savedUserData))
    }
    
    if (savedAnalysisData) {
      setAnalysisDataState(JSON.parse(savedAnalysisData))
    }
  }, [])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cropwise_userData', JSON.stringify(userData))
  }, [userData])

  useEffect(() => {
    if (analysisData) {
      localStorage.setItem('cropwise_analysisData', JSON.stringify(analysisData))
    }
  }, [analysisData])

  const setUserData = (data: Partial<UserData>) => {
    setUserDataState(prev => ({ ...prev, ...data }))
  }

  const setAnalysisData = (data: AnalysisData | null) => {
    setAnalysisDataState(data)
  }

  const updateLocation = (location: string) => {
    setUserData({ location })
  }

  const updateCrop = (crop: string) => {
    setUserData({ crop })
  }

  const getCurrentData = () => ({
    userData,
    analysisData
  })

  return (
    <AppContext.Provider value={{
      userData,
      analysisData,
      setUserData,
      setAnalysisData,
      updateLocation,
      updateCrop,
      getCurrentData
    }}>
      {children}
    </AppContext.Provider>
  )
}
