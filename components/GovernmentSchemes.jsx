"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  ExternalLink, 
  Info, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Users, 
  Shield, 
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign,
  Target
} from "lucide-react"
import { useI18n } from "@/i18n"

const GovernmentSchemes = ({ crop, location, state, farmSize }) => {
  const { t } = useI18n()
  const [selectedScheme, setSelectedScheme] = useState(null)

  // Comprehensive database of government schemes
  const allSchemes = [
    // Central Government Schemes
    {
      id: "pm-kisan",
      name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
      category: "central",
      description: "Direct income support scheme providing financial assistance to farmers",
      eligibility: [
        "Landholding farmers with cultivable land",
        "Small and marginal farmers (up to 2 hectares)",
        "Must have valid land records",
        "Should not be income tax payee",
        "Should not be holding constitutional posts"
      ],
      benefits: "₹6,000 per year in three equal installments",
      applicationProcess: [
        "Visit PM-KISAN portal (pmkisan.gov.in)",
        "Register with Aadhaar number",
        "Provide bank account details",
        "Submit land records",
        "Verification by concerned authorities"
      ],
      documents: [
        "Aadhaar Card",
        "Bank Account Details",
        "Land Records (7/12 or equivalent)",
        "Mobile Number",
        "Passport Size Photo"
      ],
      officialLink: "https://pmkisan.gov.in",
      status: "active",
      cropSpecific: false,
      locationSpecific: false,
      icon: DollarSign
    },
    {
      id: "pmfby",
      name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
      category: "central",
      description: "Crop insurance scheme protecting farmers against crop loss due to natural calamities",
      eligibility: [
        "All farmers growing notified crops",
        "Farmers with landholding up to 2 hectares",
        "Must be growing crops in notified areas",
        "Premium rates: 2% for Kharif, 1.5% for Rabi, 5% for commercial crops"
      ],
      benefits: "Comprehensive coverage against yield loss, prevented sowing, post-harvest losses",
      applicationProcess: [
        "Contact nearest Common Service Centre (CSC)",
        "Visit bank branch or insurance company",
        "Fill application form with crop details",
        "Pay premium amount",
        "Receive insurance certificate"
      ],
      documents: [
        "Land Records",
        "Bank Account Details",
        "Aadhaar Card",
        "Crop Details",
        "Premium Payment Receipt"
      ],
      officialLink: "https://pmfby.gov.in",
      status: "active",
      cropSpecific: true,
      locationSpecific: true,
      icon: Shield
    },
    {
      id: "soil-health-card",
      name: "Soil Health Card Scheme",
      category: "central",
      description: "Free soil testing and nutrient recommendations for farmers",
      eligibility: [
        "All farmers with cultivable land",
        "No income or landholding restrictions",
        "Available for all crops",
        "Priority for small and marginal farmers"
      ],
      benefits: "Free soil testing, nutrient recommendations, fertilizer advice",
      applicationProcess: [
        "Visit nearest Krishi Vigyan Kendra (KVK)",
        "Contact Agriculture Department office",
        "Submit application with land details",
        "Soil sample collection",
        "Receive soil health card with recommendations"
      ],
      documents: [
        "Land Records",
        "Aadhaar Card",
        "Mobile Number",
        "Address Proof"
      ],
      officialLink: "https://soilhealth.dac.gov.in",
      status: "active",
      cropSpecific: false,
      locationSpecific: false,
      icon: FileText
    },
    {
      id: "nfsm-pulses",
      name: "National Food Security Mission - Pulses",
      category: "central",
      description: "Support for pulse cultivation and productivity enhancement",
      eligibility: [
        "Farmers growing pulse crops",
        "Landholding up to 2 hectares",
        "Must be in notified districts",
        "Priority for small and marginal farmers"
      ],
      benefits: "₹15,000 per hectare subsidy for seeds, fertilizers, and inputs",
      applicationProcess: [
        "Contact Agriculture Department",
        "Submit application with crop details",
        "Verification of land and crop",
        "Approval and subsidy disbursement"
      ],
      documents: [
        "Land Records",
        "Crop Details",
        "Bank Account Details",
        "Aadhaar Card"
      ],
      officialLink: "https://nfsm.gov.in",
      status: "active",
      cropSpecific: true,
      locationSpecific: true,
      icon: Target
    },
    {
      id: "pm-kusum",
      name: "Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan (PM-KUSUM)",
      category: "central",
      description: "Solar power scheme for farmers to reduce irrigation costs",
      eligibility: [
        "Farmers with agricultural land",
        "Must have irrigation pump",
        "Land should be suitable for solar installation",
        "Must have valid electricity connection"
      ],
      benefits: "90% subsidy for solar pump installation, additional income from surplus power",
      applicationProcess: [
        "Visit PM-KUSUM portal",
        "Register with land and pump details",
        "Submit application",
        "Technical feasibility check",
        "Installation and commissioning"
      ],
      documents: [
        "Land Records",
        "Electricity Bill",
        "Pump Details",
        "Bank Account Details",
        "Aadhaar Card"
      ],
      officialLink: "https://pmkusum.mnre.gov.in",
      status: "active",
      cropSpecific: false,
      locationSpecific: true,
      icon: TrendingUp
    },
    {
      id: "msp",
      name: "Minimum Support Price (MSP)",
      category: "central",
      description: "Assured minimum price for agricultural commodities",
      eligibility: [
        "All farmers growing notified crops",
        "Must meet quality standards",
        "Should be sold through designated channels",
        "Available for 23 crops"
      ],
      benefits: "Assured minimum price, protection against price fluctuations",
      applicationProcess: [
        "Harvest crops meeting quality standards",
        "Visit nearest procurement center",
        "Submit crop samples for testing",
        "Receive MSP payment"
      ],
      documents: [
        "Land Records",
        "Crop Details",
        "Bank Account Details",
        "Quality Certificate"
      ],
      officialLink: "https://agricoop.gov.in",
      status: "active",
      cropSpecific: true,
      locationSpecific: true,
      icon: DollarSign
    }
  ]

  // State-specific schemes
  const stateSchemes = {
    "maharashtra": [
      {
        id: "jalyukt-shivar",
        name: "Jalyukt Shivar Abhiyan",
        category: "state",
        description: "Water conservation and drought mitigation program",
        eligibility: [
          "Farmers in drought-prone areas",
          "Must have agricultural land",
          "Priority for small and marginal farmers",
          "Should participate in water conservation activities"
        ],
        benefits: "₹50,000 for water conservation structures, drought mitigation support",
        applicationProcess: [
          "Contact Gram Panchayat",
          "Submit application with land details",
          "Technical survey and approval",
          "Implementation of water conservation measures"
        ],
        documents: [
          "Land Records",
          "Aadhaar Card",
          "Bank Account Details",
          "Water Conservation Plan"
        ],
        officialLink: "https://jalyuktshivar.maharashtra.gov.in",
        status: "active",
        cropSpecific: false,
        locationSpecific: true,
        icon: MapPin
      }
    ],
    "punjab": [
      {
        id: "punjab-crop-insurance",
        name: "Punjab Crop Insurance Scheme",
        category: "state",
        description: "Additional crop insurance coverage for Punjab farmers",
        eligibility: [
          "Punjab farmers growing notified crops",
          "Must be enrolled in PMFBY",
          "Additional premium subsidy from state government"
        ],
        benefits: "Additional 25% premium subsidy, enhanced coverage",
        applicationProcess: [
          "Enroll in PMFBY first",
          "Apply for additional state coverage",
          "Pay reduced premium",
          "Receive enhanced insurance certificate"
        ],
        documents: [
          "PMFBY Certificate",
          "Land Records",
          "Bank Account Details",
          "Aadhaar Card"
        ],
        officialLink: "https://punjab.gov.in",
        status: "active",
        cropSpecific: true,
        locationSpecific: true,
        icon: Shield
      }
    ],
    "odisha": [
      {
        id: "odisha-kalia",
        name: "Krushak Assistance for Livelihood and Income Augmentation (KALIA)",
        category: "state",
        description: "Comprehensive support scheme for Odisha farmers",
        eligibility: [
          "All farmers in Odisha",
          "Small and marginal farmers priority",
          "Landless agricultural laborers",
          "Must be resident of Odisha"
        ],
        benefits: "₹10,000 per year for 5 years, additional support for landless laborers",
        applicationProcess: [
          "Visit KALIA portal",
          "Register with Aadhaar and bank details",
          "Submit application",
          "Verification and approval",
          "Direct benefit transfer"
        ],
        documents: [
          "Aadhaar Card",
          "Bank Account Details",
          "Land Records",
          "Residence Proof"
        ],
        officialLink: "https://kalia.odisha.gov.in",
        status: "active",
        cropSpecific: false,
        locationSpecific: true,
        icon: Users
      }
    ],
    "karnataka": [
      {
        id: "karnataka-krishi",
        name: "Karnataka Krishi Bhagya",
        category: "state",
        description: "Comprehensive agricultural development scheme",
        eligibility: [
          "Karnataka farmers",
          "Must have agricultural land",
          "Priority for small and marginal farmers",
          "Should participate in agricultural activities"
        ],
        benefits: "Subsidy for seeds, fertilizers, irrigation, and mechanization",
        applicationProcess: [
          "Contact Agriculture Department",
          "Submit application with land details",
          "Verification and approval",
          "Subsidy disbursement"
        ],
        documents: [
          "Land Records",
          "Bank Account Details",
          "Aadhaar Card",
          "Crop Details"
        ],
        officialLink: "https://raitamitra.karnataka.gov.in",
        status: "active",
        cropSpecific: true,
        locationSpecific: true,
        icon: Target
      }
    ]
  }

  // Filter schemes based on crop and location
  const getFilteredSchemes = () => {
    let filteredSchemes = [...allSchemes]
    
    // Add state-specific schemes
    if (state && stateSchemes[state.toLowerCase()]) {
      filteredSchemes = [...filteredSchemes, ...stateSchemes[state.toLowerCase()]]
    }
    
    // Filter crop-specific schemes
    if (crop) {
      const cropLower = crop.toLowerCase()
      filteredSchemes = filteredSchemes.filter(scheme => {
        if (!scheme.cropSpecific) return true
        
        // Check if scheme applies to current crop
        if (scheme.id === "pmfby") return true // PMFBY covers all crops
        if (scheme.id === "nfsm-pulses") {
          return cropLower.includes("chickpea") || cropLower.includes("gram") || 
                 cropLower.includes("pulse") || cropLower.includes("dal")
        }
        if (scheme.id === "msp") return true // MSP covers multiple crops
        
        return true
      })
    }
    
    return filteredSchemes
  }

  const filteredSchemes = getFilteredSchemes()

  const getStatusColor = (status) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800"
      case "upcoming": return "bg-blue-100 text-blue-800"
      case "closed": return "bg-gray-100 text-gray-800"
      default: return "bg-yellow-100 text-yellow-800"
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case "central": return "bg-blue-50 border-blue-200"
      case "state": return "bg-green-50 border-green-200"
      default: return "bg-gray-50 border-gray-200"
    }
  }

  const SchemeDetailModal = ({ scheme }) => {
    if (!scheme) return null

    const IconComponent = scheme.icon

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex-1 min-w-0">
            <Info className="h-4 w-4 mr-1" />
            <span className="truncate">Details</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <IconComponent className="h-6 w-6 text-blue-600" />
              {scheme.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{scheme.description}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Benefits</h4>
                  <p className="text-green-700 font-medium">{scheme.benefits}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Status</h4>
                  <Badge className={getStatusColor(scheme.status)}>
                    {scheme.status.charAt(0).toUpperCase() + scheme.status.slice(1)}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Category</h4>
                  <Badge variant="outline">
                    {scheme.category.charAt(0).toUpperCase() + scheme.category.slice(1)} Government
                  </Badge>
                </div>
              </div>
            </div>

            {/* Eligibility Criteria */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Eligibility Criteria
              </h4>
              <ul className="space-y-2">
                {scheme.eligibility.map((criteria, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{criteria}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Application Process */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Application Process
              </h4>
              <ol className="space-y-2">
                {scheme.applicationProcess.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Required Documents */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Required Documents
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {scheme.documents.map((doc, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <span className="text-gray-700">{doc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button 
                onClick={() => window.open(scheme.officialLink, '_blank')}
                className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Apply Online
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.print()}
                className="flex-1 sm:flex-none"
              >
                Print Information
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Government Schemes & Support</h2>
        <Badge variant="outline" className="text-xs">
          Location & Crop Specific
        </Badge>
      </div>
      
      <Tabs defaultValue="recommended" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="central">Central Schemes</TabsTrigger>
          <TabsTrigger value="state">State Schemes</TabsTrigger>
        </TabsList>

        {/* Recommended Schemes */}
        <TabsContent value="recommended" className="space-y-4">
          <div className="space-y-3">
            {filteredSchemes.slice(0, 6).map((scheme, index) => (
              <div key={scheme.id} className={`p-3 rounded-lg border ${getCategoryColor(scheme.category)} overflow-hidden`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <scheme.icon className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{scheme.name}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{scheme.description}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(scheme.status)}>
                    {scheme.status.charAt(0).toUpperCase() + scheme.status.slice(1)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1 text-xs sm:text-sm">Benefits</h5>
                    <p className="text-xs sm:text-sm text-green-700 line-clamp-2">{scheme.benefits}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1 text-xs sm:text-sm">Eligibility</h5>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{scheme.eligibility[0]}</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <SchemeDetailModal scheme={scheme} />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(scheme.officialLink, '_blank')}
                      className="flex-1 min-w-0"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      <span className="truncate">Apply</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Central Schemes */}
        <TabsContent value="central" className="space-y-4">
          <div className="space-y-3">
            {allSchemes.map((scheme, index) => (
              <div key={scheme.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <scheme.icon className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{scheme.name}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{scheme.description}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(scheme.status)}>
                    {scheme.status.charAt(0).toUpperCase() + scheme.status.slice(1)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1 text-xs sm:text-sm">Benefits</h5>
                    <p className="text-xs sm:text-sm text-green-700 line-clamp-2">{scheme.benefits}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1 text-xs sm:text-sm">Eligibility</h5>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{scheme.eligibility[0]}</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <SchemeDetailModal scheme={scheme} />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(scheme.officialLink, '_blank')}
                      className="flex-1 min-w-0"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      <span className="truncate">Apply</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* State Schemes */}
        <TabsContent value="state" className="space-y-4">
          <div className="space-y-3">
            {state && stateSchemes[state.toLowerCase()] ? (
              stateSchemes[state.toLowerCase()].map((scheme, index) => (
                <div key={scheme.id} className="p-3 bg-green-50 border border-green-200 rounded-lg overflow-hidden">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <scheme.icon className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{scheme.name}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{scheme.description}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(scheme.status)}>
                      {scheme.status.charAt(0).toUpperCase() + scheme.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1 text-xs sm:text-sm">Benefits</h5>
                      <p className="text-xs sm:text-sm text-green-700 line-clamp-2">{scheme.benefits}</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1 text-xs sm:text-sm">Eligibility</h5>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{scheme.eligibility[0]}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <SchemeDetailModal scheme={scheme} />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(scheme.officialLink, '_blank')}
                        className="flex-1 min-w-0"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        <span className="truncate">Apply</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No state-specific schemes available for {state}</p>
                <p className="text-sm">Check back later for updates</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default GovernmentSchemes
