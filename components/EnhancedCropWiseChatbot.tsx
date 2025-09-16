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
  TrendingUp,
  Move,
  RotateCcw,
  Settings,
  Maximize,
  Minimize
} from "lucide-react"
import { useI18n } from "@/i18n"
import { useAppContext } from "@/contexts/AppContext"
import { useDragResize } from "@/hooks/useDragResize"

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

export default function EnhancedCropWiseChatbot({ className = "" }: ChatbotProps) {
  const { t } = useI18n()
  const { userData, analysisData, getCurrentData } = useAppContext()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: `Namaste! I am CropWiseAI, your intelligent farming assistant. I have access to all your farm data and can provide personalized advice:\n\n🌱 **Crop Recommendations** - Based on your soil and weather\n🌍 **Soil Analysis** - Real-time pH, moisture, and nutrients\n🌤️ **Weather Information** - 7-day forecasts and farming impact\n💧 **Irrigation Planning** - Smart water management\n🌿 **Fertilizer Advice** - Precision nutrient recommendations\n📈 **Yield Predictions** - AI-enhanced forecasting\n🐛 **Pest Management** - Weather-based risk assessment\n\nI can see your current data:\n• Location: ${userData.location || 'Not specified'}\n• Crop: ${userData.crop || 'Not specified'}\n• Farm Size: ${userData.hectare || 'Not specified'} hectares\n\nAsk me anything about your farming - I'll use your live data to give you the best advice!`,
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Drag and resize functionality
  const {
    position,
    size,
    isDragging,
    isResizing,
    containerRef,
    handleMouseDown,
    setPosition,
    setSize,
    resetPosition,
    resetSize,
    resetAll
  } = useDragResize({
    initialSize: { width: 400, height: 600 },
    minSize: { width: 300, height: 400 },
    maxSize: { width: 1000, height: 800 }
  })

  // Keep previous position/size to restore on un-minimize / un-maximize
  const prevPositionRef = useRef(position)
  const prevSizeRef = useRef(size)

  // Update refs whenever not minimized/maximized
  useEffect(() => {
    if (!isMinimized && !isMaximized) {
      prevPositionRef.current = position
      prevSizeRef.current = size
    }
  }, [position, size, isMinimized, isMaximized])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // After mount, if no saved position, place widget bottom-right with 24px margin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (position.x === 0 && position.y === 0) {
        const margin = 24
        const defaultX = Math.max(0, window.innerWidth - size.width - margin)
        const defaultY = Math.max(0, window.innerHeight - size.height - margin)
        setPosition({ x: defaultX, y: defaultY })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update welcome message when user data changes
  useEffect(() => {
    if (userData.location || userData.crop || userData.hectare) {
      setMessages(prev => {
        const updatedMessages = [...prev]
        if (updatedMessages[0]?.type === 'bot') {
          updatedMessages[0] = {
            ...updatedMessages[0],
            content: `Namaste! I am CropWiseAI, your intelligent farming assistant. I have access to all your farm data and can provide personalized advice:\n\n🌱 **Crop Recommendations** - Based on your soil and weather\n🌍 **Soil Analysis** - Real-time pH, moisture, and nutrients\n🌤️ **Weather Information** - 7-day forecasts and farming impact\n💧 **Irrigation Planning** - Smart water management\n🌿 **Fertilizer Advice** - Precision nutrient recommendations\n📈 **Yield Predictions** - AI-enhanced forecasting\n🐛 **Pest Management** - Weather-based risk assessment\n\nI can see your current data:\n• Location: ${userData.location || 'Not specified'}\n• Crop: ${userData.crop || 'Not specified'}\n• Farm Size: ${userData.hectare || 'Not specified'} hectares\n\nAsk me anything about your farming - I'll use your live data to give you the best advice!`
          }
        }
        return updatedMessages
      })
    }
  }, [userData])

  const analyzeMessage = async (message: string) => {
    try {
      setIsLoading(true)
      
      // Get current data from context
      const currentData = getCurrentData()
      
      // Call the chatbot API with all available data
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          userData: currentData.userData,
          analysisData: currentData.analysisData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      return {
        content: data.response,
        data: {
          intent: data.intent,
          suggestions: data.suggestions || [],
          dataUsed: data.dataUsed || [],
          aiEnhanced: true
        }
      }
    } catch (error) {
      console.error('Analysis error:', error)
      return {
        content: `I'm having trouble processing your request right now. However, I can still help you with farming advice!\n\n**Current Farm Data I can see:**\n• Location: ${userData.location || 'Not specified'}\n• Crop: ${userData.crop || 'Not specified'}\n• Farm Size: ${userData.hectare || 'Not specified'} hectares\n• Month: ${userData.month || 'Not specified'}\n\n**What I can help you with:**\n• Crop recommendations and planning\n• Soil analysis and improvement\n• Weather information and farming impact\n• Irrigation and water management\n• Fertilizer and nutrient advice\n• Yield predictions and optimization\n• Pest and disease management\n\nPlease try asking a specific farming question!`,
        data: { fallback: true }
      }
    } finally {
      setIsLoading(false)
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
        content: "I apologize, but I'm having trouble processing your request right now. Please try again or rephrase your question.",
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
    "What's the weather impact on my crops?",
    "Show me soil health analysis",
    "Give me irrigation recommendations",
    "What's my market outlook?"
  ]

  const handleQuickQuestion = (question: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

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
        content: "I'm experiencing some technical difficulties, but I can still provide farming guidance!",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }).finally(() => {
      setIsLoading(false)
    })
  }

  const toggleMaximize = () => {
    if (typeof window === 'undefined') return
    const margin = 24
    if (isMaximized) {
      // Restore previous
      setSize(prevSizeRef.current)
      setPosition(prevPositionRef.current)
      setIsMaximized(false)
      return
    }
    // Save current before maximizing
    prevSizeRef.current = size
    prevPositionRef.current = position
    const ww = window.innerWidth
    const wh = window.innerHeight
    const targetWidth = Math.min(1000, ww - margin * 2)
    const targetHeight = Math.min(800, wh - margin * 2)
    const x = ww - targetWidth - margin
    const y = wh - targetHeight - margin
    setSize({ width: targetWidth, height: targetHeight })
    setPosition({ x: Math.max(0, x), y: Math.max(0, y) })
    setIsMaximized(true)
  }

  const toggleMinimize = () => {
    if (typeof window === 'undefined') return
    const margin = 24
    if (isMinimized) {
      // Restore previous
      setSize(prevSizeRef.current)
      setPosition(prevPositionRef.current)
      setIsMinimized(false)
      return
    }
    // Save current before minimizing
    prevSizeRef.current = size
    prevPositionRef.current = position
    const ww = window.innerWidth
    const wh = window.innerHeight
    const headerHeight = 64
    const width = Math.max(320, Math.min(size.width, 420))
    const x = ww - width - margin
    const y = wh - headerHeight - margin
    setSize({ width, height: headerHeight })
    setPosition({ x: Math.max(0, x), y: Math.max(0, y) })
    setIsMinimized(true)
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
    <div 
      ref={containerRef}
      className={`fixed z-50 ${className}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        transform: isDragging ? 'none' : undefined
      }}
    >
      <Card className={`w-full h-full shadow-2xl border-2 border-green-200 ${isMinimized ? 'h-16' : ''} transition-all duration-300 flex flex-col`}>
        <CardHeader 
          className="bg-green-600 text-white p-4 rounded-t-lg cursor-move select-none"
          onMouseDown={(e) => handleMouseDown(e, 'drag')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Move className="h-4 w-4" />
              <Bot className="h-5 w-5" />
              <CardTitle className="text-lg">CropWiseAI Assistant</CardTitle>
              {userData.location && (
                <Badge variant="outline" className="text-xs bg-green-500 text-white border-green-400">
                  {userData.location}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:bg-green-700 h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMaximize}
                className="text-white hover:bg-green-700 h-8 w-8 p-0"
              >
                {isMaximized ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMinimize}
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
          
          {showSettings && (
            <div className="mt-4 p-3 bg-green-700 rounded-lg">
              <div className="text-sm mb-2">Chatbot Settings:</div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetPosition}
                  className="text-xs"
                >
                  Reset Position
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetSize}
                  className="text-xs"
                >
                  Reset Size
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetAll}
                  className="text-xs"
                >
                  Reset All
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col flex-1 min-h-0 relative">
            {/* Resize handles */}
            <div className="absolute top-0 left-0 w-full h-1 cursor-ns-resize" onMouseDown={(e) => handleMouseDown(e, 'resize', 'top')} />
            <div className="absolute top-0 right-0 w-1 h-full cursor-ew-resize" onMouseDown={(e) => handleMouseDown(e, 'resize', 'right')} />
            <div className="absolute bottom-0 left-0 w-full h-1 cursor-ns-resize" onMouseDown={(e) => handleMouseDown(e, 'resize', 'bottom')} />
            <div className="absolute top-0 left-0 w-1 h-full cursor-ew-resize" onMouseDown={(e) => handleMouseDown(e, 'resize', 'left')} />
            
            <ScrollArea className="flex-1 p-4 overflow-y-auto">
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
                              {message.data.dataUsed && message.data.dataUsed.length > 0 && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  Data: {message.data.dataUsed.join(', ')}
                                </Badge>
                              )}
                              {message.data.intent && (
                                <Badge variant="outline" className="text-xs">
                                  {message.data.intent.replace('_', ' ')}
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
      {/* Corner resize handles for better UX */}
      <div className="absolute -bottom-1 -right-1 w-3 h-3 cursor-nwse-resize" onMouseDown={(e) => handleMouseDown(e as any, 'resize', 'bottom-right')} />
      <div className="absolute -bottom-1 -left-1 w-3 h-3 cursor-nesw-resize" onMouseDown={(e) => handleMouseDown(e as any, 'resize', 'bottom-left')} />
      <div className="absolute -top-1 -right-1 w-3 h-3 cursor-nesw-resize" onMouseDown={(e) => handleMouseDown(e as any, 'resize', 'top-right')} />
      <div className="absolute -top-1 -left-1 w-3 h-3 cursor-nwse-resize" onMouseDown={(e) => handleMouseDown(e as any, 'resize', 'top-left')} />
    </div>
  )
}
