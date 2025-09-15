"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, TrendingUp, Users, Target, Navigation, ChevronDown, Sprout } from "lucide-react"
import { useI18n } from "@/i18n"
import LanguageSwitch from "@/components/LanguageSwitch"

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
    location: "",
    farmSize: "",
    previousCrop: "",
    nextCrop: "",
    cultivationMonth: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [showPreviousCropDropdown, setShowPreviousCropDropdown] = useState(false)
  const [showNextCropDropdown, setShowNextCropDropdown] = useState(false)

  const cropCategories = {
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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCropSelect = (crop, field) => {
    handleInputChange(field, crop)
    if (field === "previousCrop") {
      setShowPreviousCropDropdown(false)
    } else if (field === "nextCrop") {
      setShowNextCropDropdown(false)
    }
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
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Enhanced farm data received:", data)
        localStorage.setItem("farmData", JSON.stringify(data))
        router.push("/dashboard")
      } else {
        throw new Error("Failed to get crop analysis")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("Failed to get analysis. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header style={{ backgroundColor: "rgba(255,253,246,255)" }} className="border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{t("app.name")}</h1>
                <p className="text-xs text-gray-600">{t("app.tagline")}</p>
              </div>
            </div>
            <div className="hidden sm:block">
              <LanguageSwitch />
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{t("home.hero.title")}</h2>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto mb-12">{t("home.hero.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
          <Card className="border-0 shadow-md" style={{ backgroundColor: "rgba(255,253,246,255)" }}>
            <CardContent className="p-6 text-center">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">15%</div>
              <div className="text-sm text-gray-600">{t("home.stats.yield_increase")}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md" style={{ backgroundColor: "rgba(255,253,246,255)" }}>
            <CardContent className="p-6 text-center">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">50K+</div>
              <div className="text-sm text-gray-600">{t("home.stats.farmers_helped")}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md" style={{ backgroundColor: "rgba(255,253,246,255)" }}>
            <CardContent className="p-6 text-center">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">95%</div>
              <div className="text-sm text-gray-600">{t("home.stats.prediction_accuracy")}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-3xl mx-auto bg-orange-50 border-0 shadow-lg" style={{ backgroundColor: "#fffbed" }}>
          <CardContent className="p-10">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{t("home.form.title")}</h3>
              <p className="text-gray-600 text-lg">{t("home.form.subtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("home.form.name_label")}</label>
                <Input
                  placeholder={t("home.form.name_placeholder")}
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("home.form.location_label")}</label>
                <div className="relative">
                  <Input
                    placeholder={t("home.form.location_placeholder")}
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    required
                    className="bg-white pr-12"
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-orange-600 hover:text-orange-700 disabled:opacity-50 cursor-pointer"
                  >
                    <Navigation className={`w-4 h-4 ${isGettingLocation ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">{t("home.form.location_help")}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("home.form.size_label")}</label>
                <Input
                  placeholder={t("home.form.size_placeholder")}
                  value={formData.farmSize}
                  onChange={(e) => handleInputChange("farmSize", e.target.value)}
                  required
                  className="bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("home.form.prev_crop_label")}</label>
                <div className="relative">
                  <Input
                    placeholder={t("home.form.prev_crop_placeholder")}
                    value={formData.previousCrop}
                    onChange={(e) => handleInputChange("previousCrop", e.target.value)}
                    className="bg-white pr-8"
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
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {Object.entries(cropCategories).map(([category, crops]) => (
                        <div key={category}>
                          <div className="px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-50 border-b">
                            {t(`crop_categories.${category.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`) || category}
                          </div>
                          {crops.map((crop) => (
                            <button
                              key={crop}
                              type="button"
                              onClick={() => handleCropSelect(crop, "previousCrop")}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 cursor-pointer"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("home.form.next_crop_label")}</label>
                <div className="relative">
                  <Input
                    placeholder={t("home.form.next_crop_placeholder")}
                    value={formData.nextCrop}
                    onChange={(e) => handleInputChange("nextCrop", e.target.value)}
                    required
                    className="bg-white pr-8"
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
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {Object.entries(cropCategories).map(([category, crops]) => (
                        <div key={category}>
                          <div className="px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-50 border-b">
                            {t(`crop_categories.${category.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`) || category}
                          </div>
                          {crops.map((crop) => (
                            <button
                              key={crop}
                              type="button"
                              onClick={() => handleCropSelect(crop, "nextCrop")}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 cursor-pointer"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("home.form.month_label")}</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-no-repeat bg-right pr-10 cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: "right 0.5rem center",
                    backgroundSize: "1.5em 1.5em",
                  }}
                  value={formData.cultivationMonth}
                  onChange={(e) => handleInputChange("cultivationMonth", e.target.value)}
                  required
                >
                  <option value="" className="text-gray-500">{t("home.form.month_placeholder")}</option>
                  <option value="january" className="font-medium text-gray-800">{t("months.january")}</option>
                  <option value="february" className="font-medium text-gray-800">{t("months.february")}</option>
                  <option value="march" className="font-medium text-gray-800">{t("months.march")}</option>
                  <option value="april" className="font-medium text-gray-800">{t("months.april")}</option>
                  <option value="may" className="font-medium text-gray-800">{t("months.may")}</option>
                  <option value="june" className="font-medium text-gray-800">{t("months.june")}</option>
                  <option value="july" className="font-medium text-gray-800">{t("months.july")}</option>
                  <option value="august" className="font-medium text-gray-800">{t("months.august")}</option>
                  <option value="september" className="font-medium text-gray-800">{t("months.september")}</option>
                  <option value="october" className="font-medium text-gray-800">{t("months.october")}</option>
                  <option value="november" className="font-medium text-gray-800">{t("months.november")}</option>
                  <option value="december" className="font-medium text-gray-800">{t("months.december")}</option>
                </select>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 text-lg cursor-pointer"
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
          <h3 className="text-2xl font-bold text-gray-900 mb-8">{t("home.benefits.title")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{t("home.benefits.yield.title")}</h4>
              <p className="text-gray-600">{t("home.benefits.yield.desc")}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sprout className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{t("home.benefits.recommendations.title")}</h4>
              <p className="text-gray-600">{t("home.benefits.recommendations.desc")}</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{t("home.benefits.weather.title")}</h4>
              <p className="text-gray-600">{t("home.benefits.weather.desc")}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
