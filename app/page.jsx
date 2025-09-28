"use client"

import { useState, useEffect, useRef } from "react"
import { useLocationAutocomplete } from "@/hooks/useLocationAutocomplete"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, TrendingUp, Users, Target, Navigation, ChevronDown, Sprout, Menu } from "lucide-react"
import { useI18n } from "@/i18n"
import LanguageSwitch from "@/components/LanguageSwitch"
import AgriculturalBackground from "@/components/AgriculturalBackground"

export default function HomePage() {
  const router = useRouter()
  const { t } = useI18n()
  const translateCrop = (name) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
    const key = `crops.${slug}`
    const translated = t(key)
    return translated === key ? name : translated
  }
  const [formData, setFormData] = useState({
    name: "",
    location: "Odisha",
    farmSize: "",
    previousCrop: "",
    nextCrop: "",
    cultivationMonth: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [showPreviousCropDropdown, setShowPreviousCropDropdown] = useState(false)
  const [showNextCropDropdown, setShowNextCropDropdown] = useState(false)
  const prevDropdownRef = useRef(null)
  const nextDropdownRef = useRef(null)
  const locationInputRef = useRef(null)
  const locationSuggestionsRef = useRef(null)
  const loc = useLocationAutocomplete("")

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showPreviousCropDropdown && prevDropdownRef.current && !prevDropdownRef.current.contains(e.target)) {
        setShowPreviousCropDropdown(false)
      }
      if (showNextCropDropdown && nextDropdownRef.current && !nextDropdownRef.current.contains(e.target)) {
        setShowNextCropDropdown(false)
      }
      if (loc.open) {
        const insideSuggestions = locationSuggestionsRef.current && locationSuggestionsRef.current.contains(e.target)
        const insideInput = locationInputRef.current && locationInputRef.current.contains(e.target)
        if (!insideSuggestions && !insideInput) {
          loc.setOpen(false)
        }
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [showPreviousCropDropdown, showNextCropDropdown, loc.open])

  const odishaPriority = [
    "Rice",
    "Maize",
    "Ragi",
    "Black Gram",
    "Green Gram",
    "Horse Gram",
    "Bengal Gram",
    "Pigeon Pea",
    "Lentil",
    "Pea",
    "Groundnut",
    "Mustard",
    "Sesame",
    "Sunflower",
    "Niger",
    "Castor",
    "Vegetables",
    "Cotton",
    "Mesta",
    "Sweet Potato",
  ]

  const cropCategories = {
    "Odisha Priority": odishaPriority,
    "Cereals & Grains": [
      "Rice",
      "Wheat",
      "Maize (Corn)",
      "Barley",
      "Jowar (Sorghum)",
      "Bajra (Pearl Millet)",
      "Ragi (Finger Millet)",
    ],
    Pulses: ["Lentil", "Gram", "Arhar/Tur", "Moong", "Urad", "Chickpea", "Black Gram"],
    "Cash Crops": ["Sugarcane", "Cotton", "Jute", "Tobacco"],
    Oilseeds: ["Groundnut (Peanut)", "Soybean", "Sunflower", "Mustard", "Safflower", "Sesame"],
    "Plantation Crops": ["Tea", "Coffee", "Rubber", "Coconut", "Arecanut", "Cocoa"],
    Fruits: [
      "Mango",
      "Banana",
      "Apple",
      "Orange",
      "Grapes",
      "Pineapple",
      "Guava",
      "Papaya",
      "Pomegranate",
      "Litchi",
      "Watermelon",
      "Muskmelon",
    ],
    Vegetables: [
      "Potato",
      "Tomato",
      "Onion",
      "Brinjal (Eggplant)",
      "Cauliflower",
      "Cabbage",
      "Carrot",
      "Radish",
      "Spinach",
      "Okra (Ladyfinger)",
      "Peas",
    ],
    "Spices & Herbs": [
      "Turmeric",
      "Ginger",
      "Garlic",
      "Chilli",
      "Black Pepper",
      "Cardamom",
      "Coriander",
      "Cumin",
      "Fennel",
      "Fenugreek",
    ],
    "Medicinal Plants": [
      "Aloe Vera",
      "Tulsi (Holy Basil)",
      "Ashwagandha",
      "Lemongrass",
      "Mint",
      "Sarpagandha",
      "Isabgol",
      "Kalmegh",
    ],
  }

  const allCrops = Object.values(cropCategories).flat()
  const prioritizedAllCrops = Array.from(new Set([...odishaPriority, ...allCrops]))

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCropSelect = (crop, field) => {
    handleInputChange(field, crop)
    // Close only after state set, and prevent outside-click handler from firing first
    requestAnimationFrame(() => {
      if (field === "previousCrop") {
        setShowPreviousCropDropdown(false)
      } else if (field === "nextCrop") {
        setShowNextCropDropdown(false)
      }
    })
  }

  const getCurrentLocation = () => {
    setIsGettingLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          try {
            const response = await fetch("/api/geocode", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ latitude, longitude }),
            })

            if (response.ok) {
              const data = await response.json()
              if (data.success) {
                handleInputChange("location", data.location)
              } else {
                throw new Error(data.error || "Geocoding failed")
              }
            } else {
              throw new Error("Geocoding service unavailable")
            }
          } catch (error) {
            console.error("Reverse geocoding error:", error)
            const fallbackLocation = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`
            handleInputChange("location", fallbackLocation)
            alert("Unable to get location name. Using coordinates instead. You can edit this manually.")
          }
          setIsGettingLocation(false)
        },
        (error) => {
          console.error("Geolocation error:", error)
          let errorMessage = "Unable to get location. Please enter manually."
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied. Please enter your location manually."
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable. Please enter manually."
              break
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please enter manually."
              break
          }
          alert(errorMessage)
          setIsGettingLocation(false)
        },
        {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 300000,
        },
      )
    } else {
      alert("Geolocation is not supported by this browser.")
      setIsGettingLocation(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Create AbortController for timeout (declare outside try block)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.log("Crop analysis fetch timeout after 12 seconds")
      controller.abort()
    }, 12000) // 12 second timeout

    try {
      const response = await fetch("/api/crop-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: formData.location,
          crop: formData.nextCrop,
          month: formData.cultivationMonth,
          hectare: formData.farmSize,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId) // Clear timeout if request completes

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Enhanced farm data received:", data)
        localStorage.setItem("farmData", JSON.stringify(data))
        router.push("/dashboard")
      } else {
        throw new Error("Failed to get crop analysis")
      }
    } catch (error) {
      clearTimeout(timeoutId) // Clear timeout on error
      
      if (error.name === 'AbortError') {
        console.log("Crop analysis fetch aborted due to timeout")
        alert("Request timed out. Please try again or check your internet connection.")
      } else {
        console.error("Error submitting form:", error)
        alert("Failed to get analysis. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AgriculturalBackground>
      <header className="agricultural-header -mx-2 sm:-mx-4 lg:-mx-6">
        <div className="w-full px-2 sm:px-4 lg:px-6 py-4">
          {/* Use 3-column grid to truly center brand and push actions to right */}
          <div className="grid grid-cols-3 items-center">
            {/* Left column (empty spacer) */}
            <div></div>

            {/* Center column: Logo + Brand centered */}
            <div className="flex items-center justify-center space-x-3">
              <div className="w-10 h-10 green-gradient rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Sprout className="w-6 h-6 text-white relative z-10" />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-bold text-green-800">{t("app.name")}</h1>
                <p className="text-xs text-green-600">{t("app.tagline")}</p>
              </div>
            </div>

            {/* Right column: Language + Auth actions aligned to far right */}
            <div className="flex items-center justify-end space-x-3">
              <div className="hidden sm:block">
                <LanguageSwitch />
              </div>
              <div className="hidden sm:flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="green-gradient hover:opacity-90 text-white shadow-lg">
                    Sign Up
                  </Button>
                </Link>
              </div>
              {/* Mobile: hamburger menu */}
              <div className="sm:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Toggle menu"
                  onClick={() => setMobileNavOpen((v) => !v)}
                  className="text-green-700 hover:text-green-800"
                >
                  <Menu className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>
          {/* Mobile menu panel */}
          {mobileNavOpen && (
            <div className="sm:hidden mt-3 border-t border-green-200 pt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LanguageSwitch />
              </div>
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="green-gradient hover:opacity-90 text-white shadow-lg">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl enhanced-heading mb-6" style={{ color: "#ffffff" }}>{t("home.hero.title")}</h2>
          <p className="text-lg enhanced-text max-w-4xl mx-auto mb-12" style={{ color: "#ffffff" }}>{t("home.hero.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
          <Card className="farmer-card">
            <CardContent className="p-6 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-800 mb-1">15%</div>
              <div className="text-sm text-green-700">{t("home.stats.yield_increase")}</div>
            </CardContent>
          </Card>

          <Card className="farmer-card">
            <CardContent className="p-6 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-800 mb-1">50K+</div>
              <div className="text-sm text-green-700">{t("home.stats.farmers_helped")}</div>
            </CardContent>
          </Card>

          <Card className="farmer-card">
            <CardContent className="p-6 text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-800 mb-1">95%</div>
              <div className="text-sm text-green-700">{t("home.stats.prediction_accuracy")}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-3xl mx-auto farmer-card shadow-lg leaf-pattern">
          <CardContent className="p-10">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-green-800 mb-3">{t("home.form.title")}</h3>
              <p className="text-green-700 text-lg">{t("home.form.subtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-green-700 mb-2">{t("home.form.name_label")}</label>
                <Input
                  placeholder={t("home.form.name_placeholder")}
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="enhanced-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-2">{t("home.form.location_label")}</label>
                <div className="relative" ref={prevDropdownRef}>
                  <Input
                    ref={locationInputRef}
                    placeholder={t("home.form.location_placeholder")}
                    value={formData.location}
                    onChange={(e) => { handleInputChange("location", e.target.value); loc.setQuery(e.target.value) }}
                    required
                    className="enhanced-input pr-12"
                    autoComplete="off"
                  />
                  {loc.open && loc.suggestions.length > 0 && (
                    <div ref={locationSuggestionsRef} className="absolute left-0 right-0 mt-1 bg-white border border-green-300 rounded-md shadow-lg max-h-60 overflow-y-auto z-20">
                      {loc.suggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { handleInputChange("location", s.displayName); loc.setOpen(false) }}
                          className="w-full text-left px-3 py-2 text-sm text-green-700 hover:bg-green-50"
                        >
                          {s.displayName}
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-green-600 hover:text-green-700 disabled:opacity-50 cursor-pointer"
                  >
                    <Navigation className={`w-4 h-4 ${isGettingLocation ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <p className="text-xs text-green-600 mt-1">{t("home.form.location_help")}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-2">{t("home.form.size_label")}</label>
                <Input
                  placeholder={t("home.form.size_placeholder")}
                  value={formData.farmSize}
                  onChange={(e) => handleInputChange("farmSize", e.target.value)}
                  required
                  className="enhanced-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-2">{t("home.form.prev_crop_label")}</label>
                <div className="relative" ref={nextDropdownRef}>
                  <Input
                    placeholder={t("home.form.prev_crop_placeholder")}
                    value={formData.previousCrop}
                    onChange={(e) => handleInputChange("previousCrop", e.target.value)}
                    className="enhanced-input pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPreviousCropDropdown(!showPreviousCropDropdown)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded cursor-pointer"
                  >
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${showPreviousCropDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showPreviousCropDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-green-300 rounded-md shadow-lg max-h-60 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                      {Object.entries(cropCategories).map(([category, crops]) => (
                        <div key={category}>
                          <div className="px-3 py-2 text-sm font-semibold text-green-700 bg-green-50 border-b border-green-200">
                            {t(`crop_categories.${category.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`) || category}
                          </div>
                          {crops.map((crop) => (
                            <button
                              key={crop}
                              type="button"
                              onClick={() => handleCropSelect(crop, "previousCrop")}
                              className="w-full text-left px-3 py-2 text-sm text-green-700 hover:bg-green-50 hover:text-green-800 cursor-pointer"
                            >
                              {translateCrop(crop)}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-2">{t("home.form.next_crop_label")}</label>
                <div className="relative">
                  <Input
                    placeholder={t("home.form.next_crop_placeholder")}
                    value={formData.nextCrop}
                    onChange={(e) => handleInputChange("nextCrop", e.target.value)}
                    required
                    className="enhanced-input pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNextCropDropdown(!showNextCropDropdown)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded cursor-pointer"
                  >
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${showNextCropDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showNextCropDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-green-300 rounded-md shadow-lg max-h-60 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                      {Object.entries(cropCategories).map(([category, crops]) => (
                        <div key={category}>
                          <div className="px-3 py-2 text-sm font-semibold text-green-700 bg-green-50 border-b border-green-200">
                            {t(`crop_categories.${category.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`) || category}
                          </div>
                          {crops.map((crop) => (
                            <button
                              key={crop}
                              type="button"
                              onClick={() => handleCropSelect(crop, "nextCrop")}
                              className="w-full text-left px-3 py-2 text-sm text-green-700 hover:bg-green-50 hover:text-green-800 cursor-pointer"
                            >
                              {translateCrop(crop)}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-700 mb-2">{t("home.form.month_label")}</label>
                <div className="relative">
                  <select
                    className="enhanced-select w-full"
                    value={formData.cultivationMonth}
                    onChange={(e) => handleInputChange("cultivationMonth", e.target.value)}
                    required
                  >
                  <option value="" disabled>{t("home.form.month_placeholder")}</option>
                  <option value="january">{t("months.january")}</option>
                  <option value="february">{t("months.february")}</option>
                  <option value="march">{t("months.march")}</option>
                  <option value="april">{t("months.april")}</option>
                  <option value="may">{t("months.may")}</option>
                  <option value="june">{t("months.june")}</option>
                  <option value="july">{t("months.july")}</option>
                  <option value="august">{t("months.august")}</option>
                  <option value="september">{t("months.september")}</option>
                  <option value="october">{t("months.october")}</option>
                  <option value="november">{t("months.november")}</option>
                  <option value="december">{t("months.december")}</option>
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full enhanced-button py-3 text-lg cursor-pointer"
                disabled={
                  isLoading ||
                  !formData.location ||
                  !formData.nextCrop ||
                  !formData.cultivationMonth ||
                  !formData.farmSize
                }
              >
                {isLoading ? t("home.form.processing") : t("home.form.submit")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold enhanced-heading mb-8 text-white" style={{ color: "#ffffff" }}>{t("home.benefits.title")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold mb-2 text-white">{t("home.benefits.yield.title")}</h4>
              <p className="text-white">{t("home.benefits.yield.desc")}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sprout className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold mb-2 text-white">{t("home.benefits.recommendations.title")}</h4>
              <p className="text-white">{t("home.benefits.recommendations.desc")}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold mb-2 text-white">{t("home.benefits.weather.title")}</h4>
              <p className="text-white">{t("home.benefits.weather.desc")}</p>
            </div>
          </div>
        </div>
      </section>
    </AgriculturalBackground>
  )
}
