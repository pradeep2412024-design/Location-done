"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  X, 
  Minimize2,
  Maximize2,
  Sprout,
  Droplets,
  Thermometer,
  AlertTriangle,
  TrendingUp
} from "lucide-react"
import { useI18n } from "@/i18n"

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  data?: any
}

interface ChatbotProps {
  className?: string
}

export default function CropWiseChatbot({ className = "" }: ChatbotProps) {
  const { t } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Namaste! I am CropWiseAI, your intelligent farming assistant. I automatically fetch real-time data from your farm location to provide personalized advice:\n\n🌱 **Crop Recommendations** - Based on your soil and weather\n🌍 **Soil Analysis** - Real-time pH, moisture, and nutrients\n🌤️ **Weather Information** - 7-day forecasts and farming impact\n💧 **Irrigation Planning** - Smart water management\n🌿 **Fertilizer Advice** - Precision nutrient recommendations\n📈 **Yield Predictions** - AI-enhanced forecasting\n🐛 **Pest Management** - Weather-based risk assessment\n\nAsk me anything about your farming - I\'ll use live data to give you the best advice!',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [userData, setUserData] = useState({
    location: "",
    crop: "",
    month: "",
    hectare: ""
  })
  const [conversationHistory, setConversationHistory] = useState([])
  const [previousCrop, setPreviousCrop] = useState("")
  const [nextCrop, setNextCrop] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const extractUserData = (message: string) => {
    const locationMatch = message.match(/(?:location|place|area|farm|village|city|district|state)[\s:]*([^.!?]+)/i)
    const cropMatch = message.match(/(?:crop|plant|grow|cultivate)[\s:]*([^.!?]+)/i)
    const monthMatch = message.match(/(?:month|season|time|planting)[\s:]*([^.!?]+)/i)
    const hectareMatch = message.match(/(?:hectare|acre|land|area|size)[\s:]*([^.!?]+)/i)

    const newData = { ...userData }
    if (locationMatch) newData.location = locationMatch[1].trim()
    if (cropMatch) newData.crop = cropMatch[1].trim()
    if (monthMatch) newData.month = monthMatch[1].trim()
    if (hectareMatch) newData.hectare = hectareMatch[1].trim()

    setUserData(newData)
    return newData
  }

  const analyzeMessage = async (message: string) => {
    // First, try to get data from dashboard context
    try {
      const dashboardData = getDashboardData()
      if (dashboardData) {
        return await getComprehensiveAnalysis(dashboardData, message, dashboardData.locationData)
      }
    } catch (error) {
      console.error('Error getting dashboard data:', error)
    }

    // Second, try to get comprehensive data from the API without requiring user input
    try {
      const apiData = await fetchComprehensiveDataFromAPI()
      if (apiData) {
        return await getComprehensiveAnalysis(apiData, message, apiData.locationData)
      }
    } catch (error) {
      console.error('Error fetching comprehensive data:', error)
    }

    // Fallback: try to extract data from user message
    const extractedData = extractUserData(message)
    
    // Always try to get location first for better context
    let locationData = null
    if (extractedData.location) {
      try {
        locationData = await fetchLocationData(extractedData.location)
      } catch (error) {
        console.error('Error fetching location data:', error)
      }
    }
    
    // Check if we need more information
    const missingInfo = []
    if (!extractedData.location) missingInfo.push("farm location")
    if (!extractedData.crop) missingInfo.push("crop type")
    if (!extractedData.month) missingInfo.push("planting month/season")
    if (!extractedData.hectare) missingInfo.push("farm size (hectares)")

    // If we have enough data, make comprehensive API calls
    if (missingInfo.length === 0) {
      return await getComprehensiveAnalysis(extractedData, message, locationData)
    } else {
      // Even with missing data, try to provide helpful response with available data
      if (extractedData.location || locationData) {
        return await getEnhancedResponse(extractedData, message, locationData, missingInfo)
      } else {
        return generateMissingInfoResponse(missingInfo, message)
      }
    }
  }

  const fetchComprehensiveDataFromAPI = async () => {
    try {
      // Try to get data from the dashboard's existing API calls
      // This will use the same data that's already loaded in the dashboard
      const response = await fetch('/api/crop-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: "Ghaziabad, Uttar Pradesh", // Default location from dashboard
          crop: "Wheat", // Default crop from dashboard
          month: "october", // Current month
          hectare: "5" // Default farm size
        })
      })

      if (response.ok) {
        const data = await response.json()
        return {
          location: data.userInfo?.location || "Ghaziabad, Uttar Pradesh",
          crop: data.userInfo?.nextCrop || "Wheat",
          month: data.userInfo?.cultivationMonth || "october",
          hectare: data.userInfo?.farmSize || "5",
          locationData: data.locationData,
          predictions: data.predictions,
          soilData: data.soilData,
          weatherData: data.weatherData,
          marketAnalysis: data.marketAnalysis,
          recommendations: data.recommendations
        }
      }
    } catch (error) {
      console.error('Error fetching comprehensive data:', error)
    }
    return null
  }

  // Try to get data from dashboard context if available
  const getDashboardData = () => {
    try {
      // Check if we can access dashboard data from window or parent
      if (typeof window !== 'undefined') {
        // Try to get data from localStorage or sessionStorage
        const dashboardData = localStorage.getItem('dashboardData') || sessionStorage.getItem('dashboardData')
        if (dashboardData) {
          const data = JSON.parse(dashboardData)
          // Extract crop information
          if (data.userInfo) {
            setPreviousCrop(data.userInfo.previousCrop || "")
            setNextCrop(data.userInfo.nextCrop || "")
          }
          return data
        }
      }
    } catch (error) {
      console.error('Error getting dashboard data:', error)
    }
    return null
  }

  // Get crop rotation recommendations
  const getCropRotationAdvice = (previousCrop: string, nextCrop: string, soilData: any) => {
    const cropRotationData = {
      "Rice": {
        next: ["Wheat", "Mustard", "Potato", "Onion"],
        avoid: ["Rice", "Sugarcane"],
        benefits: "Rice fixes nitrogen, good for wheat rotation",
        soilImpact: "Improves soil structure, adds organic matter"
      },
      "Wheat": {
        next: ["Rice", "Maize", "Soybean", "Cotton"],
        avoid: ["Wheat", "Barley"],
        benefits: "Wheat leaves good residue, suitable for rice",
        soilImpact: "Maintains soil fertility, prevents disease buildup"
      },
      "Maize": {
        next: ["Wheat", "Mustard", "Potato", "Onion"],
        avoid: ["Maize", "Sorghum"],
        benefits: "Maize improves soil aeration, good for wheat",
        soilImpact: "Adds organic matter, improves soil structure"
      },
      "Cotton": {
        next: ["Wheat", "Mustard", "Chickpea", "Sesame"],
        avoid: ["Cotton", "Okra"],
        benefits: "Cotton rotation breaks pest cycles",
        soilImpact: "Deep roots improve soil structure"
      },
      "Sugarcane": {
        next: ["Wheat", "Mustard", "Potato", "Onion"],
        avoid: ["Sugarcane", "Rice"],
        benefits: "Sugarcane rotation prevents soil depletion",
        soilImpact: "Requires soil restoration after harvest"
      }
    }

    const prevCrop = previousCrop.toLowerCase()
    const nextCropLower = nextCrop.toLowerCase()
    
    for (const [crop, data] of Object.entries(cropRotationData)) {
      if (prevCrop.includes(crop.toLowerCase())) {
        const isGoodRotation = data.next.some(c => nextCropLower.includes(c.toLowerCase()))
        const isBadRotation = data.avoid.some(c => nextCropLower.includes(c.toLowerCase()))
        
        return {
          isGoodRotation,
          isBadRotation,
          recommendation: isGoodRotation ? "Excellent crop rotation choice!" : isBadRotation ? "Avoid this rotation - choose different crop" : "Moderate rotation choice",
          benefits: data.benefits,
          soilImpact: data.soilImpact,
          alternatives: data.next.filter(c => !nextCropLower.includes(c.toLowerCase()))
        }
      }
    }
    
    return {
      isGoodRotation: false,
      isBadRotation: false,
      recommendation: "Consider crop rotation for better soil health",
      benefits: "Crop rotation prevents soil depletion and pest buildup",
      soilImpact: "Maintains soil fertility and structure",
      alternatives: ["Wheat", "Mustard", "Chickpea", "Maize"]
    }
  }

  // Get yield increasing methods
  const getYieldIncreasingMethods = (crop: string, soilData: any, weatherData: any) => {
    const yieldMethods = {
      "Wheat": {
        soil: [
          "Apply 120-150 kg N/hectare in 3 splits",
          "Use 60-80 kg P2O5/hectare at sowing",
          "Apply 40-60 kg K2O/hectare",
          "Add 5-10 tons farmyard manure per hectare"
        ],
        irrigation: [
          "Critical irrigation at crown root initiation (21-25 DAS)",
          "Irrigate at flowering stage (60-65 DAS)",
          "Apply irrigation at grain filling stage (85-90 DAS)",
          "Use sprinkler irrigation for 20-25% water saving"
        ],
        management: [
          "Use certified seeds (40-50 kg/hectare)",
          "Optimal sowing time: 15-25 November",
          "Row spacing: 22.5 cm",
          "Apply pre-emergence herbicide",
          "Control weeds at 30-35 DAS"
        ],
        technology: [
          "Use zero-till drill for sowing",
          "Apply micro-nutrients (Zn, Mn, Fe)",
          "Use growth regulators for lodging control",
          "Implement precision farming techniques"
        ]
      },
      "Rice": {
        soil: [
          "Apply 100-120 kg N/hectare in 3 splits",
          "Use 40-60 kg P2O5/hectare",
          "Apply 40-60 kg K2O/hectare",
          "Maintain 2-3 cm standing water"
        ],
        irrigation: [
          "Continuous submergence (2-5 cm water)",
          "Alternate wetting and drying after panicle initiation",
          "Drain field 7-10 days before harvest",
          "Use SRI method for 30% water saving"
        ],
        management: [
          "Transplant 25-30 day old seedlings",
          "Spacing: 20x15 cm",
          "Apply pre-emergence herbicide",
          "Control stem borer and leaf folder"
        ],
        technology: [
          "Use drum seeder for direct seeding",
          "Apply slow-release fertilizers",
          "Use bio-fertilizers (Azospirillum)",
          "Implement SRI (System of Rice Intensification)"
        ]
      },
      "Maize": {
        soil: [
          "Apply 120-150 kg N/hectare in 3 splits",
          "Use 60-80 kg P2O5/hectare",
          "Apply 40-60 kg K2O/hectare",
          "Add 5-8 tons compost per hectare"
        ],
        irrigation: [
          "Critical irrigation at knee-high stage",
          "Irrigate at tasseling and silking",
          "Apply irrigation at grain filling",
          "Use drip irrigation for 30% water saving"
        ],
        management: [
          "Optimal spacing: 60x25 cm",
          "Thin to 1 plant per hill",
          "Apply pre-emergence herbicide",
          "Control fall armyworm and stem borer"
        ],
        technology: [
          "Use hybrid seeds",
          "Apply micro-nutrients (Zn, B)",
          "Use growth regulators",
          "Implement precision agriculture"
        ]
      }
    }

    const cropMethods = yieldMethods[crop] || yieldMethods["Wheat"]
    const soilPh = soilData?.ph || 7.0
    const soilMoisture = soilData?.moisture || 50

    let recommendations = []
    
    // Soil-based recommendations
    if (soilPh < 6.5) {
      recommendations.push("⚠️ Apply lime to increase soil pH to 6.5-7.0")
    }
    if (soilMoisture < 40) {
      recommendations.push("💧 Increase irrigation frequency - soil moisture is low")
    }
    
    return {
      crop: crop,
      soilMethods: cropMethods.soil,
      irrigationMethods: cropMethods.irrigation,
      managementMethods: cropMethods.management,
      technologyMethods: cropMethods.technology,
      specificRecommendations: recommendations
    }
  }

  // Get priority tasks and alerts
  const getPriorityTasksAndAlerts = (crop: string, soilData: any, weatherData: any, previousCrop: string) => {
    const tasks = []
    const alerts = []
    const currentDate = new Date()
    const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long' }).toLowerCase()

    // Soil-based alerts
    if (soilData) {
      if (soilData.ph < 6.0) {
        alerts.push({
          type: "urgent",
          message: "🚨 Soil pH is too low! Apply lime immediately",
          action: "Apply 2-3 tons lime per hectare"
        })
      }
      if (soilData.moisture < 30) {
        alerts.push({
          type: "urgent",
          message: "🚨 Critical soil moisture! Irrigation needed immediately",
          action: "Apply 5-7 cm irrigation water"
        })
      }
      if (soilData.nitrogen < 40) {
        alerts.push({
          type: "high",
          message: "⚠️ Low nitrogen levels detected",
          action: "Apply 50-75 kg N/hectare before sowing"
        })
      }
    }

    // Weather-based alerts
    if (weatherData && weatherData.length > 0) {
      const avgTemp = weatherData.reduce((sum: number, day: any) => sum + (day.tempValue || 0), 0) / weatherData.length
      const rainyDays = weatherData.filter((day: any) => (day.rainValue || 0) > 0).length
      
      if (avgTemp > 35) {
        alerts.push({
          type: "high",
          message: "🌡️ High temperature alert! Protect crops from heat stress",
          action: "Increase irrigation frequency and apply mulch"
        })
      }
      if (rainyDays > 4) {
        alerts.push({
          type: "medium",
          message: "🌧️ High rainfall expected - watch for waterlogging",
          action: "Ensure proper drainage and avoid field operations"
        })
      }
    }

    // Crop-specific tasks
    if (crop.toLowerCase().includes("wheat")) {
      if (currentMonth === "october" || currentMonth === "november") {
        tasks.push({
          priority: "high",
          task: "Prepare field for wheat sowing",
          deadline: "Next 2 weeks",
          action: "Plough field, apply basal fertilizers, prepare seedbed"
        })
      }
      if (currentMonth === "december" || currentMonth === "january") {
        tasks.push({
          priority: "medium",
          task: "Apply first irrigation to wheat",
          deadline: "Next 1 week",
          action: "Apply 5-7 cm irrigation at crown root initiation stage"
        })
      }
    }

    if (crop.toLowerCase().includes("rice")) {
      if (currentMonth === "may" || currentMonth === "june") {
        tasks.push({
          priority: "high",
          task: "Prepare nursery for rice",
          deadline: "Next 1 week",
          action: "Prepare seedbed, treat seeds, sow nursery"
        })
      }
    }

    // Crop rotation tasks
    if (previousCrop && previousCrop !== crop) {
      const rotationAdvice = getCropRotationAdvice(previousCrop, crop, soilData)
      if (rotationAdvice.isBadRotation) {
        alerts.push({
          type: "urgent",
          message: "🚨 Poor crop rotation choice!",
          action: `Consider: ${rotationAdvice.alternatives.join(", ")}`
        })
      }
    }

    return {
      tasks: tasks.sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }),
      alerts: alerts.sort((a, b) => {
        const alertOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
        return alertOrder[a.type] - alertOrder[b.type]
      })
    }
  }

  const fetchLocationData = async (location: string) => {
    try {
      // First try to get geocoded location data
      const geocodeResponse = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location })
      })

      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json()
        return geocodeData
      }
    } catch (error) {
      console.error('Geocoding error:', error)
    }
    return null
  }

  const getComprehensiveAnalysis = async (data: any, originalMessage: string, locationData: any = null) => {
    try {
      setIsLoading(true)
      
      // Call the crop analysis API with enhanced data
      const enhancedData = {
        ...data,
        locationData: locationData,
        timestamp: new Date().toISOString()
      }

      const response = await fetch('/api/crop-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enhancedData)
      })

      if (!response.ok) {
        throw new Error('Failed to get analysis')
      }

      const analysisData = await response.json()
      
      // Get AI-enhanced response
      const aiResponse = await getAIEnhancedResponse(originalMessage, analysisData, data)
      
      return generateComprehensiveResponse(analysisData, originalMessage, aiResponse)
    } catch (error) {
      console.error('Analysis error:', error)
      return generateFallbackResponse(data, originalMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getEnhancedResponse = async (data: any, originalMessage: string, locationData: any, missingInfo: string[]) => {
    try {
      setIsLoading(true)
      
      // Get available data for the location
      const availableData = await getAvailableDataForLocation(data.location, locationData)
      
      // Get AI response for partial data
      const aiResponse = await getAIEnhancedResponse(originalMessage, availableData, data)
      
      return generatePartialDataResponse(data, originalMessage, availableData, missingInfo, aiResponse)
    } catch (error) {
      console.error('Enhanced response error:', error)
      return generateMissingInfoResponse(missingInfo, originalMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getAvailableDataForLocation = async (location: string, locationData: any) => {
    try {
      // Get weather data for the location
      const weatherResponse = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, month: new Date().toLocaleDateString('en-US', { month: 'long' }).toLowerCase() })
      })

      let weatherData = null
      if (weatherResponse.ok) {
        const weatherResult = await weatherResponse.json()
        weatherData = weatherResult.weatherData
      }

      // Get soil data for the location
      const soilResponse = await fetch('/api/soil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          location, 
          crop: 'general', 
          month: new Date().toLocaleDateString('en-US', { month: 'long' }).toLowerCase(),
          hectare: '1'
        })
      })

      let soilData = null
      if (soilResponse.ok) {
        const soilResult = await soilResponse.json()
        soilData = soilResult.data
      }

      return {
        weatherData,
        soilData,
        locationData,
        location
      }
    } catch (error) {
      console.error('Error fetching available data:', error)
      return { location }
    }
  }

  const getAIEnhancedResponse = async (question: string, analysisData: any, userData: any) => {
    try {
      // Call the chatbot API for AI-enhanced response
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          userData: userData,
          analysisData: analysisData
        })
      })

      if (response.ok) {
        const aiData = await response.json()
        return aiData
      }
    } catch (error) {
      console.error('AI enhancement error:', error)
    }
    return null
  }

  const generateComprehensiveResponse = (data: any, originalMessage: string, aiResponse: any = null) => {
    const { predictions, recommendations, soilData, weatherData, marketAnalysis } = data
    const currentCrop = data.crop || userData.crop || "Wheat"
    
    // Get yield increasing methods
    const yieldMethods = getYieldIncreasingMethods(currentCrop, soilData, weatherData)
    
    // Get priority tasks and alerts
    const priorityData = getPriorityTasksAndAlerts(currentCrop, soilData, weatherData, previousCrop)
    
    // Get crop rotation advice
    const rotationAdvice = getCropRotationAdvice(previousCrop, currentCrop, soilData)
    
    // Use AI response if available, otherwise generate standard response
    if (aiResponse && aiResponse.response) {
      let response = `🤖 **AI-Enhanced Analysis for ${userData.location}:**\n\n`
      response += aiResponse.response
      
      // Add data badges for key metrics
      if (predictions) {
        response += `\n\n📊 **Key Metrics:**\n`
        response += `• Expected Yield: ${predictions.predictedYield} tons/hectare\n`
        response += `• Confidence: ${predictions.confidence}%\n`
        response += `• Weather Risk: ${predictions.weatherRisk}\n`
      }
      
      if (soilData) {
        response += `• Soil pH: ${soilData.ph}\n`
        response += `• Soil Moisture: ${soilData.moisture}%\n`
      }
      
      if (weatherData && weatherData.length > 0) {
        const avgTemp = weatherData.reduce((sum: number, day: any) => sum + (day.tempValue || 0), 0) / weatherData.length
        response += `• Avg Temperature: ${Math.round(avgTemp)}°C\n`
      }
      
      return {
        content: response,
        data: { ...data, aiEnhanced: true, aiResponse, yieldMethods, priorityData, rotationAdvice }
      }
    }
    
    // Fallback to standard response
    let response = `Based on real-time data from your farm in ${userData.location} for ${currentCrop} cultivation:\n\n`
    
    // Priority Alerts
    if (priorityData.alerts.length > 0) {
      response += `🚨 **PRIORITY ALERTS:**\n`
      priorityData.alerts.slice(0, 3).forEach(alert => {
        response += `• ${alert.message}\n`
        response += `  Action: ${alert.action}\n\n`
      })
    }
    
    // Priority Tasks - Use enhanced data if available
    const priorityTasksData = predictions?.priorityTasksData || predictions?.priorityTasks
    if (priorityTasksData && priorityTasksData.tasks && priorityTasksData.tasks.length > 0) {
      response += `📋 **HIGH PRIORITY TASKS (${priorityTasksData.count}):**\n`
      response += `Click to view detailed risk solutions and recommendations\n\n`
      priorityTasksData.tasks.slice(0, 3).forEach((task, index) => {
        response += `${index + 1}. **[${task.category}]** ${task.risk}\n`
        response += `   Solution: ${task.solution}\n`
        response += `   Priority: ${task.priority} | Impact: ${task.impact}\n\n`
      })
      if (priorityTasksData.tasks.length > 3) {
        response += `... and ${priorityTasksData.tasks.length - 3} more tasks\n\n`
      }
    } else if (priorityData.tasks.length > 0) {
      response += `📋 **HIGH PRIORITY TASKS:**\n`
      priorityData.tasks.slice(0, 3).forEach(task => {
        response += `• ${task.task} (${task.priority} priority)\n`
        response += `  Deadline: ${task.deadline}\n`
        response += `  Action: ${task.action}\n\n`
      })
    }
    
    // Crop rotation advice
    if (previousCrop && previousCrop !== currentCrop) {
      response += `🔄 **CROP ROTATION ANALYSIS:**\n`
      response += `• Previous Crop: ${previousCrop}\n`
      response += `• Next Crop: ${currentCrop}\n`
      response += `• Recommendation: ${rotationAdvice.recommendation}\n`
      response += `• Benefits: ${rotationAdvice.benefits}\n`
      response += `• Soil Impact: ${rotationAdvice.soilImpact}\n\n`
    }
    
    // Yield increasing methods
    response += `📈 **YIELD INCREASING METHODS FOR ${currentCrop.toUpperCase()}:**\n\n`
    
    response += `🌍 **Soil Management:**\n`
    yieldMethods.soilMethods.forEach(method => {
      response += `• ${method}\n`
    })
    response += `\n`
    
    response += `💧 **Irrigation Management:**\n`
    yieldMethods.irrigationMethods.forEach(method => {
      response += `• ${method}\n`
    })
    response += `\n`
    
    response += `🌱 **Crop Management:**\n`
    yieldMethods.managementMethods.forEach(method => {
      response += `• ${method}\n`
    })
    response += `\n`
    
    response += `🔬 **Technology & Innovation:**\n`
    yieldMethods.technologyMethods.forEach(method => {
      response += `• ${method}\n`
    })
    response += `\n`
    
    // Specific recommendations based on current conditions
    if (yieldMethods.specificRecommendations.length > 0) {
      response += `⚠️ **IMMEDIATE ACTIONS NEEDED:**\n`
      yieldMethods.specificRecommendations.forEach(rec => {
        response += `• ${rec}\n`
      })
      response += `\n`
    }
    
    // Crop recommendations
    response += `🌱 **CROP ANALYSIS:**\n`
    response += `• ${currentCrop} is suitable for your location\n`
    response += `• Expected yield: ${predictions.predictedYield} tons/hectare\n`
    response += `• Confidence level: ${predictions.confidence}%\n\n`

    // Soil analysis
    response += `🌍 **REAL-TIME SOIL ANALYSIS:**\n`
    response += `• pH Level: ${soilData.ph} (${soilData.ph < 6.5 ? 'Slightly acidic' : soilData.ph > 7.5 ? 'Slightly alkaline' : 'Optimal'})\n`
    response += `• Moisture: ${soilData.moisture}% (${soilData.moisture < 40 ? 'Low - needs irrigation' : soilData.moisture > 70 ? 'High - good for growth' : 'Moderate'})\n`
    response += `• Nutrients: N-${soilData.nitrogen}, P-${soilData.phosphorus}, K-${soilData.potassium}\n\n`

    // Weather information
    response += `🌤️ **CURRENT WEATHER CONDITIONS:**\n`
    const avgTemp = weatherData.reduce((sum: number, day: any) => sum + (day.tempValue || 0), 0) / weatherData.length
    const rainyDays = weatherData.filter((day: any) => (day.rainValue || 0) > 0).length
    response += `• Average temperature: ${Math.round(avgTemp)}°C\n`
    response += `• Rainy days this week: ${rainyDays}\n`
    response += `• Weather risk: ${predictions.weatherRisk}\n\n`

    // Market information
    response += `💰 **MARKET OUTLOOK:**\n`
    response += `• Current price: ₹${marketAnalysis.currentPrice}/quintal\n`
    response += `• Price trend: ${marketAnalysis.trend}\n`
    response += `• Expected revenue: ₹${marketAnalysis.expectedRevenue.toLocaleString()}\n\n`

    response += `Need more specific advice? Just ask me about any farming topic!`

    return {
      content: response,
      data: { ...data, yieldMethods, priorityData, rotationAdvice, priorityTasksData }
    }
  }

  const generatePartialDataResponse = (data: any, originalMessage: string, availableData: any, missingInfo: string[], aiResponse: any = null) => {
    let response = `Based on available data for ${data.location || 'your location'}:\n\n`
    
    if (aiResponse && aiResponse.response) {
      response += `🤖 **AI Analysis:**\n${aiResponse.response}\n\n`
    }
    
    if (availableData.weatherData) {
      response += `🌤️ **Current Weather:**\n`
      const avgTemp = availableData.weatherData.reduce((sum: number, day: any) => sum + (day.tempValue || 0), 0) / availableData.weatherData.length
      const rainyDays = availableData.weatherData.filter((day: any) => (day.rainValue || 0) > 0).length
      response += `• Average temperature: ${Math.round(avgTemp)}°C\n`
      response += `• Rainy days this week: ${rainyDays}\n\n`
    }
    
    if (availableData.soilData) {
      response += `🌍 **Soil Conditions:**\n`
      response += `• pH Level: ${availableData.soilData.ph}\n`
      response += `• Moisture: ${availableData.soilData.moisture}%\n`
      response += `• Nutrients: N-${availableData.soilData.nitrogen}, P-${availableData.soilData.phosphorus}, K-${availableData.soilData.potassium}\n\n`
    }
    
    response += `To get more specific recommendations, please provide:\n`
    missingInfo.forEach((info, index) => {
      response += `${index + 1}. ${info}\n`
    })
    
    return {
      content: response,
      data: { ...availableData, aiEnhanced: !!aiResponse }
    }
  }

  const generateMissingInfoResponse = (missingInfo: string[], originalMessage: string) => {
    let response = "I'm trying to fetch your farm data automatically, but I need a bit more information to provide the best advice:\n\n"
    
    missingInfo.forEach((info, index) => {
      response += `${index + 1}. ${info.charAt(0).toUpperCase() + info.slice(1)}\n`
    })
    
    response += "\nAlternatively, you can ask me general farming questions and I'll provide helpful guidance based on available data. For example:\n"
    response += "• 'What's the best time to plant wheat?'\n"
    response += "• 'How to improve soil health?'\n"
    response += "• 'What irrigation system should I use?'\n\n"
    response += "I'll do my best to help with the information available!"
    
    return { content: response }
  }

  const generateFallbackResponse = (data: any, originalMessage: string) => {
    return {
      content: `I understand you're asking about farming in ${data.location || 'your area'}. While I'm having trouble accessing detailed data right now, here are some general farming tips:\n\n• Ensure proper soil preparation before planting\n• Monitor weather conditions regularly\n• Use appropriate fertilizers based on soil test\n• Plan irrigation according to crop needs\n• Watch for pest and disease symptoms\n\nFor more specific advice, please provide your location, crop type, and planting season.`
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const messageContent = inputValue.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await analyzeMessage(messageContent)
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.content,
        timestamp: new Date(),
        data: response.data
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error processing message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `I apologize, but I'm having trouble processing your request right now. This might be due to:\n\n• Network connectivity issues\n• API service temporarily unavailable\n• Missing configuration\n\n**What I can still help you with:**\n• General farming advice and tips\n• Crop selection guidance\n• Soil management recommendations\n• Weather-based farming strategies\n\nPlease try asking a specific farming question, and I'll do my best to provide helpful guidance!`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickQuestions = [
    "Analyze my current farm conditions",
    "Give me yield increasing methods",
    "What are my priority tasks and alerts?",
    "Analyze my crop rotation strategy",
    "What's the weather impact on my crops?"
  ]

  const handleQuickQuestion = (question: string) => {
    // Send the question directly without setting input value
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    // Process the question
    analyzeMessage(question).then(response => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.content,
        timestamp: new Date(),
        data: response.data
      }
      setMessages(prev => [...prev, botMessage])
    }).catch(error => {
      console.error('Error processing quick question:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `I'm experiencing some technical difficulties, but I can still provide farming guidance!\n\n**Quick Farming Tips:**\n• Test your soil regularly for optimal crop growth\n• Plan irrigation based on weather forecasts\n• Use crop rotation to maintain soil health\n• Monitor for pests and diseases early\n• Choose crops suitable for your climate\n\nFeel free to ask me specific questions about farming practices!`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }).finally(() => {
      setIsLoading(false)
    })
  }

  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-16 w-16 shadow-lg bg-green-600 hover:bg-green-700"
        >
          <MessageCircle className="h-8 w-8" />
        </Button>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Card className={`w-96 shadow-2xl border-2 border-green-200 ${isMinimized ? 'h-16' : 'h-[600px]'} transition-all duration-300 flex flex-col`}>
        <CardHeader className="bg-green-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <CardTitle className="text-lg">CropWiseAI Assistant</CardTitle>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-green-700 h-8 w-8 p-0"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-green-700 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col flex-1 min-h-0">
            <ScrollArea className="flex-1 p-4 overflow-y-auto max-h-[400px]">
              <div className="space-y-4 pr-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 break-words ${
                        message.type === 'user'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.type === 'bot' && <Bot className="h-4 w-4 mt-1 flex-shrink-0" />}
                        {message.type === 'user' && <User className="h-4 w-4 mt-1 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="whitespace-pre-wrap text-sm break-words">{message.content}</div>
                          {message.data && (
                            <div className="mt-2 space-y-1 flex flex-wrap gap-1">
                              {message.data.aiEnhanced && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  <Bot className="h-3 w-3 mr-1" />
                                  AI Enhanced
                                </Badge>
                              )}
                              {message.data.predictions && (
                                <Badge variant="outline" className="text-xs">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Yield: {message.data.predictions.predictedYield}t/ha
                                </Badge>
                              )}
                              {message.data.soilData && (
                                <Badge variant="outline" className="text-xs">
                                  <Sprout className="h-3 w-3 mr-1" />
                                  pH: {message.data.soilData.ph}
                                </Badge>
                              )}
                              {message.data.weatherData && (
                                <Badge variant="outline" className="text-xs">
                                  <Thermometer className="h-3 w-3 mr-1" />
                                  {Math.round(message.data.weatherData.reduce((sum: number, day: any) => sum + (day.tempValue || 0), 0) / message.data.weatherData.length)}°C
                                </Badge>
                              )}
                              {message.data.priorityData && message.data.priorityData.alerts.length > 0 && (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {message.data.priorityData.alerts.length} Alerts
                                </Badge>
                              )}
                              {message.data.yieldMethods && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  Yield Methods
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3 flex items-center space-x-2">
                      <Bot className="h-4 w-4" />
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-gray-600">Analyzing your request...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {messages.length <= 2 && (
              <div className="p-4 border-t bg-white flex-shrink-0">
                <div className="text-xs text-gray-600 mb-2">Quick questions:</div>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {quickQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickQuestion(question)}
                      className="text-xs h-7 px-2 whitespace-nowrap"
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 border-t bg-white flex-shrink-0">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about crops, soil, weather..."
                  className="flex-1 min-h-[40px] max-w-full"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 min-h-[40px] px-3 flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
