"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Eye, EyeOff, Phone, Mail, User } from "lucide-react"
import { useI18n } from "@/i18n"
import { useAuth } from "@/app/contexts/AuthContext"
import AgriculturalBackground from "@/components/AgriculturalBackground"

export default function LoginPage() {
  const router = useRouter()
  const { t } = useI18n()
  const { login } = useAuth()
  const [loginMethod, setLoginMethod] = useState("email")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    otp: ""
  })
  const [otpSent, setOtpSent] = useState(false)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const result = await login({
        email: formData.email,
        password: formData.password
      })
      
      if (result.success) {
        router.push("/dashboard")
      } else {
        console.error("Login failed:", result.error)
        // In a real app, you would show an error message to the user
      }
    } catch (error) {
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      if (!otpSent) {
        // Send OTP
        await new Promise(resolve => setTimeout(resolve, 1000))
        setOtpSent(true)
        console.log("OTP sent to:", formData.phone)
      } else {
        // Verify OTP and login
        const result = await login({
          phone: formData.phone,
          otp: formData.otp
        })
        
        if (result.success) {
          router.push("/dashboard")
        } else {
          console.error("Phone login failed:", result.error)
        }
      }
    } catch (error) {
      console.error("Phone login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AgriculturalBackground className="flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-green-600 hover:text-green-700 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Login Card */}
        <Card className="farmer-card shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 green-gradient logo-shine rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <User className="w-8 h-8 text-white relative z-10" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">Welcome Back</CardTitle>
            <p className="text-green-600">Sign in to your CropWise AI account</p>
          </CardHeader>

          <CardContent>
            <Tabs value={loginMethod} onValueChange={setLoginMethod} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </TabsTrigger>
              </TabsList>

              {/* Email Login */}
              <TabsContent value="email">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className="pl-10 border-green-200 focus:border-green-400 focus:ring-green-400"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-2">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className="pr-10 border-green-200 focus:border-green-400 focus:ring-green-400"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-green-300 text-green-600 focus:ring-green-500" />
                      <span className="ml-2 text-sm text-green-600">Remember me</span>
                    </label>
                    <Link href="/forgot-password" className="text-sm text-green-600 hover:text-green-700">
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full green-gradient logo-shine hover:opacity-90 text-white py-3 text-lg shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* Phone Login */}
              <TabsContent value="phone">
                <form onSubmit={handlePhoneLogin} className="space-y-4">
                  {!otpSent ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-2">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                          <Input
                            type="tel"
                            placeholder="+91 9876543210"
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            className="pl-10 border-green-200 focus:border-green-400 focus:ring-green-400"
                            required
                          />
                        </div>
                        <p className="text-xs text-green-600 mt-1">We'll send you a verification code</p>
                      </div>

                      <Button
                        type="submit"
                        className="w-full green-gradient logo-shine hover:opacity-90 text-white py-3 text-lg shadow-lg"
                        disabled={isLoading}
                      >
                        {isLoading ? "Sending OTP..." : "Send OTP"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Phone className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-sm text-green-600">
                          OTP sent to <span className="font-semibold">{formData.phone}</span>
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-2">Enter OTP</label>
                        <Input
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={formData.otp}
                          onChange={(e) => handleInputChange("otp", e.target.value)}
                          className="text-center text-lg tracking-widest border-green-200 focus:border-green-400 focus:ring-green-400"
                          maxLength="6"
                          required
                        />
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 border-green-200 text-green-600 hover:bg-green-50"
                          onClick={() => setOtpSent(false)}
                        >
                          Change Number
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 green-gradient logo-shine hover:opacity-90 text-white shadow-lg"
                          disabled={isLoading}
                        >
                          {isLoading ? "Verifying..." : "Verify OTP"}
                        </Button>
                      </div>
                    </>
                  )}
                </form>
              </TabsContent>
            </Tabs>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-green-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-green-500">New to CropWise AI?</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <Link href="/signup" className="text-green-600 hover:text-green-700 font-medium">
                Create a new account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AgriculturalBackground>
  )
}
