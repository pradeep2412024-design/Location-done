import { useState, useRef, useCallback, useEffect } from 'react'

interface Position {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

interface UseDragResizeOptions {
  initialPosition?: Position
  initialSize?: Size
  minSize?: Size
  maxSize?: Size
  bounds?: {
    minX?: number
    maxX?: number
    minY?: number
    maxY?: number
  }
}

export const useDragResize = (options: UseDragResizeOptions = {}) => {
  const {
    initialPosition = { x: 0, y: 0 },
    initialSize = { width: 400, height: 600 },
    minSize = { width: 300, height: 400 },
    maxSize = { width: 800, height: 1000 },
    bounds = {}
  } = options

  const [position, setPosition] = useState<Position>(initialPosition)
  const [size, setSize] = useState<Size>(initialSize)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string>('')
  
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef<Position>({ x: 0, y: 0 })
  const resizeStartRef = useRef<{ position: Position; size: Size }>({ position: { x: 0, y: 0 }, size: { width: 0, height: 0 } })

  // Load saved position and size from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('chatbot_position')
    const savedSize = localStorage.getItem('chatbot_size')
    
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition))
    }
    
    if (savedSize) {
      setSize(JSON.parse(savedSize))
    }
  }, [])

  // Save position and size to localStorage
  useEffect(() => {
    localStorage.setItem('chatbot_position', JSON.stringify(position))
  }, [position])

  useEffect(() => {
    localStorage.setItem('chatbot_size', JSON.stringify(size))
  }, [size])

  const constrainPosition = useCallback((newPosition: Position) => {
    const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
    const winHeight = typeof window !== 'undefined' ? window.innerHeight : 1080
    const {
      minX = 0,
      maxX = winWidth - size.width,
      minY = 0,
      maxY = winHeight - size.height
    } = bounds
    
    return {
      x: Math.max(minX, Math.min(maxX, newPosition.x)),
      y: Math.max(minY, Math.min(maxY, newPosition.y))
    }
  }, [bounds, size])

  const constrainSize = useCallback((newSize: Size) => {
    const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
    const winHeight = typeof window !== 'undefined' ? window.innerHeight : 1080

    // Limit size by configured min/max
    let width = Math.max(minSize.width, Math.min(maxSize.width, newSize.width))
    let height = Math.max(minSize.height, Math.min(maxSize.height, newSize.height))

    // Also ensure the element does not exceed viewport given current position
    width = Math.min(width, winWidth - position.x)
    height = Math.min(height, winHeight - position.y)

    return { width, height }
  }, [minSize, maxSize, position])

  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'drag' | 'resize', direction?: string) => {
    e.preventDefault()
    
    if (type === 'drag') {
      setIsDragging(true)
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      }
    } else if (type === 'resize' && direction) {
      setIsResizing(true)
      setResizeDirection(direction)
      resizeStartRef.current = {
        position: { ...position },
        size: { ...size }
      }
    }
  }, [position, size])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      }
      setPosition(constrainPosition(newPosition))
    } else if (isResizing) {
      const currentRight = resizeStartRef.current.position.x + resizeStartRef.current.size.width
      const currentBottom = resizeStartRef.current.position.y + resizeStartRef.current.size.height
      const deltaX = e.clientX - currentRight
      const deltaY = e.clientY - currentBottom
      
      let newSize = { ...resizeStartRef.current.size }
      let newPosition = { ...resizeStartRef.current.position }

      if (resizeDirection.includes('right')) {
        newSize.width = resizeStartRef.current.size.width + deltaX
      }
      if (resizeDirection.includes('left')) {
        newSize.width = resizeStartRef.current.size.width - deltaX
        newPosition.x = resizeStartRef.current.position.x + deltaX
      }
      if (resizeDirection.includes('bottom')) {
        newSize.height = resizeStartRef.current.size.height + deltaY
      }
      if (resizeDirection.includes('top')) {
        newSize.height = resizeStartRef.current.size.height - deltaY
        newPosition.y = resizeStartRef.current.position.y + deltaY
      }

      newSize = constrainSize(newSize)
      newPosition = constrainPosition(newPosition)
      
      setSize(newSize)
      setPosition(newPosition)
    }
  }, [isDragging, isResizing, resizeDirection, constrainPosition, constrainSize])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeDirection('')
  }, [])

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  // Keep the widget within viewport on window resize
  useEffect(() => {
    const handleWindowResize = () => {
      setPosition(prev => constrainPosition(prev))
      setSize(prev => constrainSize(prev))
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleWindowResize)
      return () => window.removeEventListener('resize', handleWindowResize)
    }
  }, [constrainPosition, constrainSize])

  const resetPosition = useCallback(() => {
    setPosition(initialPosition)
  }, [initialPosition])

  const resetSize = useCallback(() => {
    setSize(initialSize)
  }, [initialSize])

  const resetAll = useCallback(() => {
    resetPosition()
    resetSize()
  }, [resetPosition, resetSize])

  return {
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
  }
}
