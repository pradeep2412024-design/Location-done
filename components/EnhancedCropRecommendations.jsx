import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Sprout, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Filter,
  ChevronDown,
  ChevronUp,
  Star,
  BarChart3,
  Target
} from 'lucide-react'

const EnhancedCropRecommendations = ({ 
  location, 
  month, 
  soilData, 
  weatherData, 
  previousCrop,
  t 
}) => {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)
  const [sortBy, setSortBy] = useState('score') // score, yield, profitability, price

  const cropCategories = {
    "Cereals & Grains": ["Rice", "Wheat", "Maize", "Barley", "Jowar", "Bajra", "Ragi", "Corn"],
    "Pulses": ["Lentil", "Gram", "Arhar", "Tur", "Moong", "Urad", "Chickpea", "Black Gram", "Green Gram"],
    "Cash Crops": ["Sugarcane", "Cotton", "Jute", "Tobacco", "Tea", "Coffee"],
    "Oilseeds": ["Groundnut", "Peanut", "Soybean", "Sunflower", "Mustard", "Safflower", "Sesame"],
    "Plantation Crops": ["Tea", "Coffee", "Rubber", "Coconut", "Arecanut", "Cocoa"],
    "Fruits": ["Mango", "Banana", "Apple", "Orange", "Grapes", "Pineapple", "Guava", "Papaya", "Pomegranate"],
    "Vegetables": ["Potato", "Tomato", "Onion", "Brinjal", "Eggplant", "Cauliflower", "Cabbage", "Carrot", "Radish"],
    "Spices & Herbs": ["Turmeric", "Ginger", "Garlic", "Chilli", "Black Pepper", "Cardamom", "Coriander", "Cumin"],
    "Medicinal Plants": ["Aloe Vera", "Tulsi", "Holy Basil", "Ashwagandha", "Lemongrass", "Mint"]
  }

  useEffect(() => {
    if (location && month) {
      fetchRecommendations()
    }
  }, [location, month, selectedCategory])

  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/crop-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location,
          month,
          soilData,
          weatherData,
          category: selectedCategory || undefined,
          previousCrop
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations || [])
      } else {
        console.error('Failed to fetch recommendations')
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const sortRecommendations = (recs) => {
    return [...recs].sort((a, b) => {
      switch (sortBy) {
        case 'yield':
          return parseFloat(b.yield) - parseFloat(a.yield)
        case 'profitability':
          return parseFloat(b.profitability) - parseFloat(a.profitability)
        case 'price':
          return parseFloat(b.price.replace(/[₹,]/g, '')) - parseFloat(a.price.replace(/[₹,]/g, ''))
        case 'score':
        default:
          return b.score - a.score
      }
    })
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getDemandColor = (demand) => {
    switch (demand?.toLowerCase()) {
      case 'high': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getTrendIcon = (trend) => {
    switch (trend?.toLowerCase()) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'decreasing': return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
      default: return <BarChart3 className="w-4 h-4 text-gray-600" />
    }
  }

  const sortedRecommendations = sortRecommendations(recommendations)

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Sprout className="w-6 h-6 mr-2 text-green-600" />
            {t('dashboard.enhanced_recommendations.title')}
          </h2>
          <p className="text-gray-600 mt-1">
            {t('dashboard.enhanced_recommendations.subtitle')}
          </p>
          {location && location.toLowerCase().includes('odisha') && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Odisha's historical yields are lower due to traditional farming practices, 
                but with modern techniques and proper management, significant improvements are possible. 
                The improvement potential shown reflects achievable gains with better practices.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Category Filter */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowCategoryFilter(!showCategoryFilter)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {selectedCategory || t('dashboard.enhanced_recommendations.all_categories')}
              {showCategoryFilter ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>

            {showCategoryFilter && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                <div className="p-2">
                  <button
                    onClick={() => {
                      setSelectedCategory('')
                      setShowCategoryFilter(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                  >
                    {t('dashboard.enhanced_recommendations.all_categories')}
                  </button>
                  {Object.entries(cropCategories).map(([category, crops]) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category)
                        setShowCategoryFilter(false)
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="score">{t('dashboard.enhanced_recommendations.sort_by_score')}</option>
            <option value="yield">{t('dashboard.enhanced_recommendations.sort_by_yield')}</option>
            <option value="profitability">{t('dashboard.enhanced_recommendations.sort_by_profitability')}</option>
            <option value="price">{t('dashboard.enhanced_recommendations.sort_by_price')}</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2 text-gray-600">{t('dashboard.enhanced_recommendations.loading')}</span>
        </div>
      )}

      {/* Recommendations Grid */}
      {!loading && sortedRecommendations.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedRecommendations.map((crop, index) => (
            <Card key={index} className="bg-gradient-to-br from-white to-green-50 border-green-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{crop.name}</h3>
                      {index < 3 && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getScoreColor(crop.score)}>
                        {crop.match} {t('dashboard.enhanced_recommendations.match')}
                      </Badge>
                      <Badge className={getDemandColor(crop.marketDemand)}>
                        {crop.marketDemand} {t('dashboard.enhanced_recommendations.demand')}
                      </Badge>
                      {crop.trend && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getTrendIcon(crop.trend)}
                          {crop.trend}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{crop.score}%</div>
                    <div className="text-sm text-gray-600">{t('dashboard.enhanced_recommendations.overall_score')}</div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">{t('dashboard.enhanced_recommendations.expected_yield')}</span>
                    </div>
                    <div className="text-lg font-bold text-blue-600">{crop.yield}</div>
                    {crop.baseYield && crop.baseYield !== crop.yield && (
                      <div className="text-xs text-gray-500">Base: {crop.baseYield}</div>
                    )}
                    {crop.improvementPotential && crop.improvementPotential !== '0%' && (
                      <div className="text-xs text-green-600 font-medium">Improvement: {crop.improvementPotential}</div>
                    )}
                  </div>

                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">{t('dashboard.enhanced_recommendations.market_price')}</span>
                    </div>
                    <div className="text-lg font-bold text-green-600">{crop.price}</div>
                    <div className="text-xs text-gray-500">{crop.profitability} {t('dashboard.enhanced_recommendations.profitability')}</div>
                  </div>
                </div>

                {/* Duration and Location Factors */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{crop.duration}</span>
                  </div>
                  {crop.districtFactor > 1.0 && (
                    <div className="flex items-center gap-1 text-green-600">
                      <MapPin className="w-4 h-4" />
                      <span>+{Math.round((crop.districtFactor - 1) * 100)}% {t('dashboard.enhanced_recommendations.location_advantage')}</span>
                    </div>
                  )}
                </div>

                {/* Reasons */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Sprout className="w-4 h-4 mr-2 text-green-600" />
                    {t('dashboard.enhanced_recommendations.why_recommended')}
                  </h4>
                  <div className="space-y-1">
                    {crop.reasons.slice(0, 4).map((reason, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">{reason}</span>
                      </div>
                    ))}
                    {crop.reasons.length > 4 && (
                      <div className="text-xs text-gray-500 mt-1">
                        +{crop.reasons.length - 4} {t('dashboard.enhanced_recommendations.more_reasons')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Data Source */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{t('dashboard.enhanced_recommendations.data_source')}: {crop.dataSource === 'odisha_database' ? 'Odisha Database' : 'Multi-State Database'}</span>
                    {crop.variability && (
                      <span>{t('dashboard.enhanced_recommendations.variability')}: {Math.round(crop.variability * 100)}%</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && sortedRecommendations.length === 0 && (
        <div className="text-center py-12">
          <Sprout className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('dashboard.enhanced_recommendations.no_results')}
          </h3>
          <p className="text-gray-600">
            {selectedCategory 
              ? t('dashboard.enhanced_recommendations.no_results_category', { category: selectedCategory })
              : t('dashboard.enhanced_recommendations.no_results_general')
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default EnhancedCropRecommendations
