"use client"

export default function AgriculturalBackground({ children, className = "" }) {
  return (
    <div className={`min-h-screen agricultural-bg ${className}`}>
      {/* Background Image Overlay */}
      <div 
        className="fixed inset-0 w-full h-full z-0"
        style={{
          backgroundImage: "url('/agricultural-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "scroll",
          filter: "blur(3px) brightness(0.5) saturate(0.9)",
          opacity: 0.7,
          transform: "scale(1.05)"
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 px-2 sm:px-4 lg:px-6">
        {children}
      </div>
    </div>
  )
}
