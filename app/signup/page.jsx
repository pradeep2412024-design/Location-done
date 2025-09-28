"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Eye, EyeOff, Phone, Mail, User, UserPlus, CheckCircle } from "lucide-react"
import { useI18n } from "@/i18n"
import { useAuth } from "@/app/contexts/AuthContext"
import AgriculturalBackground from "@/components/AgriculturalBackground"

export default function SignupPage() {
  const router = useRouter()
  const { t } = useI18n()
  const { signup } = useAuth()
  const [signupMethod, setSignupMethod] = useState("email")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    otp: "",
    agreeToTerms: false
  })
  const [otpSent, setOtpSent] = useState(false)
  const [step, setStep] = useState(1) // 1: Basic info, 2: Verification, 3: Complete

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleEmailSignup = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      if (step === 1) {
        // Send verification email
        await new Promise(resolve => setTimeout(resolve, 1000))
        setStep(2)
        console.log("Verification email sent to:", formData.email)
      } else if (step === 2) {
        // Verify email
        await new Promise(resolve => setTimeout(resolve, 1000))
        setStep(3)
        console.log("Email verified:", formData.otp)
      } else {
        // Complete signup
        const result = await signup(formData)
        if (result.success) {
          router.push("/dashboard")
        } else {
          console.error("Signup failed:", result.error)
        }
      }
    } catch (error) {
      console.error("Signup error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneSignup = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      if (step === 1) {
        // Send OTP
        await new Promise(resolve => setTimeout(resolve, 1000))
        setStep(2)
        setOtpSent(true)
        console.log("OTP sent to:", formData.phone)
      } else if (step === 2) {
        // Verify OTP
        await new Promise(resolve => setTimeout(resolve, 1000))
        setStep(3)
        console.log("OTP verified:", formData.otp)
      } else {
        // Complete signup
        const result = await signup(formData)
        if (result.success) {
          router.push("/dashboard")
        } else {
          console.error("Signup failed:", result.error)
        }
      }
    } catch (error) {
      console.error("Phone signup error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-2">
        {[1, 2, 3].map((stepNum) => (
          <div key={stepNum} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= stepNum 
                ? "bg-green-600 text-white" 
                : "bg-green-100 text-green-600"
            }`}>
              {step > stepNum ? <CheckCircle className="w-4 h-4" /> : stepNum}
            </div>
            {stepNum < 3 && (
              <div className={`w-8 h-0.5 ${
                step > stepNum ? "bg-green-600" : "bg-green-200"
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <AgriculturalBackground className="flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-white hover:text-green-200 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Signup Card */}
        <Card className="farmer-card shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 green-gradient rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <UserPlus className="w-8 h-8 text-white relative z-10" />
            </div>
            <CardTitle className="text-2xl font-bold enhanced-heading">Join CropWise AI</CardTitle>
            <p className="enhanced-subtitle">Create your account to get started</p>
          </CardHeader>

          <CardContent>
            {renderStepIndicator()}

            <Tabs value={signupMethod} onValueChange={setSignupMethod} className="w-full">
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

              {/* Email Signup */}
              <TabsContent value="email">
                <form onSubmit={handleEmailSignup} className="space-y-4">
                  {step === 1 && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-green-700 mb-2">First Name</label>
                          <Input
                            type="text"
                            placeholder="John"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange("firstName", e.target.value)}
                            className="border-green-200 focus:border-green-400 focus:ring-green-400"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-green-700 mb-2">Last Name</label>
                          <Input
                            type="text"
                            placeholder="Doe"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange("lastName", e.target.value)}
                            className="border-green-200 focus:border-green-400 focus:ring-green-400"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-2">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                          <Input
                            type="email"
                            placeholder="john@example.com"
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
                            placeholder="Create a strong password"
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

                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-2">Confirm Password</label>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                            className="pr-10 border-green-200 focus:border-green-400 focus:ring-green-400"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-700"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          checked={formData.agreeToTerms}
                          onChange={(e) => handleInputChange("agreeToTerms", e.target.checked)}
                          className="mt-1 rounded border-green-300 text-green-600 focus:ring-green-500"
                          required
                        />
                        <label className="ml-2 text-sm text-green-600">
                          I agree to the{" "}
                          <Link href="/terms" className="text-green-700 hover:underline">
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link href="/privacy" className="text-green-700 hover:underline">
                            Privacy Policy
                          </Link>
                        </label>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-green-800 mb-2">Verify Your Email</h3>
                      <p className="text-sm text-green-600 mb-4">
                        We've sent a verification code to <span className="font-semibold">{formData.email}</span>
                      </p>
                      <Input
                        type="text"
                        placeholder="Enter verification code"
                        value={formData.otp}
                        onChange={(e) => handleInputChange("otp", e.target.value)}
                        className="text-center text-lg tracking-widest border-green-200 focus:border-green-400 focus:ring-green-400"
                        required
                      />
                    </div>
                  )}

                  {step === 3 && (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-green-800 mb-2">Welcome to CropWise AI!</h3>
                      <p className="text-sm text-green-600">
                        Your account has been created successfully. Let's get started with your farming journey.
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full green-gradient hover:opacity-90 text-white py-3 text-lg shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : 
                     step === 1 ? "Create Account" :
                     step === 2 ? "Verify Email" : "Get Started"}
                  </Button>
                </form>
              </TabsContent>

              {/* Phone Signup */}
              <TabsContent value="phone">
                <form onSubmit={handlePhoneSignup} className="space-y-4">
                  {step === 1 && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-green-700 mb-2">First Name</label>
                          <Input
                            type="text"
                            placeholder="John"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange("firstName", e.target.value)}
                            className="border-green-200 focus:border-green-400 focus:ring-green-400"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-green-700 mb-2">Last Name</label>
                          <Input
                            type="text"
                            placeholder="Doe"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange("lastName", e.target.value)}
                            className="border-green-200 focus:border-green-400 focus:ring-green-400"
                            required
                          />
                        </div>
                      </div>

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
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-2">Password</label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
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

                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          checked={formData.agreeToTerms}
                          onChange={(e) => handleInputChange("agreeToTerms", e.target.checked)}
                          className="mt-1 rounded border-green-300 text-green-600 focus:ring-green-500"
                          required
                        />
                        <label className="ml-2 text-sm text-green-600">
                          I agree to the{" "}
                          <Link href="/terms" className="text-green-700 hover:underline">
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link href="/privacy" className="text-green-700 hover:underline">
                            Privacy Policy
                          </Link>
                        </label>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Phone className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-green-800 mb-2">Verify Your Phone</h3>
                      <p className="text-sm text-green-600 mb-4">
                        We've sent an OTP to <span className="font-semibold">{formData.phone}</span>
                      </p>
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
                  )}

                  {step === 3 && (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-green-800 mb-2">Welcome to CropWise AI!</h3>
                      <p className="text-sm text-green-600">
                        Your account has been created successfully. Let's get started with your farming journey.
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full green-gradient hover:opacity-90 text-white py-3 text-lg shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : 
                     step === 1 ? "Create Account" :
                     step === 2 ? "Verify Phone" : "Get Started"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-green-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-green-500">Already have an account?</span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                Sign in instead
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AgriculturalBackground>
  )
}
