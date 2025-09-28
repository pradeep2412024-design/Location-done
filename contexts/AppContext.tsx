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

interface PlanTask {
  id: string
  title: string
  completed: boolean
  note?: string
  dueDate?: string
  remindAt?: string
  snoozedUntil?: string
}

interface PlanItem {
  id: string
  name: string
  createdAt: string
  tasks: PlanTask[]
}

interface AppContextType {
  userData: UserData
  analysisData: AnalysisData | null
  setUserData: (data: Partial<UserData>) => void
  setAnalysisData: (data: AnalysisData | null) => void
  updateLocation: (location: string) => void
  updateCrop: (crop: string) => void
  getCurrentData: () => { userData: UserData; analysisData: AnalysisData | null }
  plans: PlanItem[]
  addPlan: (name: string) => string
  removePlan: (planId: string) => void
  addTaskToPlan: (planId: string, title: string) => string
  toggleTaskInPlan: (planId: string, taskId: string) => void
  removeTaskFromPlan: (planId: string, taskId: string) => void
  updateTaskInPlan: (planId: string, taskId: string, updates: Partial<PlanTask>) => void
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
  const [plans, setPlans] = useState<PlanItem[]>([])

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUserData = localStorage.getItem('cropwise_userData')
    const savedAnalysisData = localStorage.getItem('cropwise_analysisData')
    const savedPlans = localStorage.getItem('cropwise_plans')
    
    if (savedUserData) {
      setUserDataState(JSON.parse(savedUserData))
    }
    
    if (savedAnalysisData) {
      setAnalysisDataState(JSON.parse(savedAnalysisData))
    }

    if (savedPlans) {
      try {
        setPlans(JSON.parse(savedPlans))
      } catch {
        setPlans([])
      }
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

  useEffect(() => {
    localStorage.setItem('cropwise_plans', JSON.stringify(plans))
  }, [plans])

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

  const addPlan = (name: string) => {
    const id = 'plan-' + Date.now().toString(36)
    const newPlan: PlanItem = {
      id,
      name: name?.trim() || 'My Plan',
      createdAt: new Date().toISOString(),
      tasks: []
    }
    setPlans(prev => [newPlan, ...prev])
    return id
  }

  const removePlan = (planId: string) => {
    setPlans(prev => prev.filter(p => p.id !== planId))
  }

  const addTaskToPlan = (planId: string, title: string) => {
    const taskId = 'task-' + Date.now().toString(36)
    const task: PlanTask = { id: taskId, title: title?.trim() || 'Task', completed: false }
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, tasks: [task, ...p.tasks] } : p))
    return taskId
  }

  const toggleTaskInPlan = (planId: string, taskId: string) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p
      return {
        ...p,
        tasks: p.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
      }
    }))
  }

  const removeTaskFromPlan = (planId: string, taskId: string) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p))
  }

  const updateTaskInPlan = (planId: string, taskId: string, updates: Partial<PlanTask>) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p
      return {
        ...p,
        tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
      }
    }))
  }

  return (
    <AppContext.Provider value={{
      userData,
      analysisData,
      setUserData,
      setAnalysisData,
      updateLocation,
      updateCrop,
      getCurrentData,
      plans,
      addPlan,
      removePlan,
      addTaskToPlan,
      toggleTaskInPlan,
      removeTaskFromPlan
      ,updateTaskInPlan
    }}>
      {children}
    </AppContext.Provider>
  )
}
