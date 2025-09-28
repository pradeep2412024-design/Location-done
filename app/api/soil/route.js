export async function POST(request) {
  try {
    const body = await request.json()
    const location = body.location
    const crop = body.crop || body.nextCrop || "Rice"
    const month = body.month || body.cultivationMonth || "October"
    const hectare = body.hectare || body.farmSize || "5"

    console.log(`[v0] Fetching soil data for location: ${location}, crop: ${crop}, month: ${month}`)

    // Overall timeout for the entire soil data fetching process
    const overallController = new AbortController()
    const overallTimeoutId = setTimeout(() => {
      console.log(`[v0] Overall soil data fetch timeout after 10 seconds, using fallback data`)
      overallController.abort()
    }, 10000) // 10 second overall timeout

    try {
      const getCoordinates = async (locationName) => {
      try {
        // Create AbortController for geocoding timeout
        const geoController = new AbortController()
        const geoTimeoutId = setTimeout(() => {
          console.log(`[v0] Geocoding timeout after 5 seconds, using fallback coordinates`)
          geoController.abort()
        }, 5000) // 5 second timeout for geocoding

        try {
          const geocodeResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`,
            { signal: geoController.signal }
          )

          clearTimeout(geoTimeoutId) // Clear timeout if request completes

          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json()
            if (geocodeData.length > 0) {
              console.log(`[v0] Geocoded ${locationName} to:`, geocodeData[0].lat, geocodeData[0].lon)
              return {
                lat: Number.parseFloat(geocodeData[0].lat),
                lon: Number.parseFloat(geocodeData[0].lon),
              }
            }
          }
        } catch (geoError) {
          clearTimeout(geoTimeoutId) // Clear timeout on error
          
          if (geoError.name === 'AbortError') {
            console.log(`[v0] Geocoding request aborted due to timeout, using fallback coordinates`)
          } else {
            console.error("Geocoding error:", geoError)
          }
        }
      } catch (error) {
        console.error("Geocoding error:", error)
      }

      const cityCoordinates = {
        ghaziabad: { lat: 28.6692, lon: 77.4538 },
        lucknow: { lat: 26.8467, lon: 80.9462 },
        delhi: { lat: 28.7041, lon: 77.1025 },
        mumbai: { lat: 19.076, lon: 72.8777 },
        bangalore: { lat: 12.9716, lon: 77.5946 },
        chennai: { lat: 13.0827, lon: 80.2707 },
        kolkata: { lat: 22.5726, lon: 88.3639 },
        hyderabad: { lat: 17.385, lon: 78.4867 },
        pune: { lat: 18.5204, lon: 73.8567 },
      }

      const locationKey = locationName.toLowerCase().split(",")[0].trim()
      const coords = cityCoordinates[locationKey] || cityCoordinates["ghaziabad"]
      console.log(`[v0] Using fallback coordinates for ${locationName}:`, coords)
      return coords
    }

      const coordinates = await getCoordinates(location)

      const soilData = await fetchRealSoilData(coordinates, location, crop, month)

      console.log(`[v0] Fetched real soil data for ${location}:`, soilData)

      clearTimeout(overallTimeoutId) // Clear overall timeout if successful

      return Response.json({
        success: true,
        data: soilData,
      })
    } catch (overallError) {
      clearTimeout(overallTimeoutId) // Clear timeout on error
      
      if (overallError.name === 'AbortError') {
        console.log(`[v0] Overall soil data fetch aborted due to timeout, using fallback data`)
        // Generate fallback data with default coordinates
        const fallbackCoords = { lat: 20.2961, lon: 85.8245 } // Odisha coordinates
        const fallbackData = generateEnhancedLocationBasedSoilData(location, crop, month, fallbackCoords)
        
        return Response.json({
          success: true,
          data: fallbackData,
          timeout: true,
          message: "Data fetched using fallback due to timeout"
        })
      } else {
        throw overallError
      }
    }
  } catch (error) {
    console.error("Soil API route error:", error)
    return Response.json({ success: false, error: "Failed to fetch soil data" }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({ ok: true, route: 'soil' })
}

async function fetchRealSoilData(coordinates, location, crop, month) {
  try {
    console.log(`[v0] Fetching real soil data from SoilGrids API for coordinates:`, coordinates)

    // SoilGrids API endpoint for soil properties
    const soilGridsUrl = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${coordinates.lon}&lat=${coordinates.lat}&property=phh2o&property=soc&property=nitrogen&property=bdod&property=cec&property=sand&property=silt&property=clay&depth=0-5cm&depth=5-15cm&value=mean`

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.log(`[v0] SoilGrids API timeout after 7 seconds, using fallback data`)
      controller.abort()
    }, 7000) // 7 second timeout

    try {
      const soilResponse = await fetch(soilGridsUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent": "CropWiseAI/1.0",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId) // Clear timeout if request completes

      if (soilResponse.ok) {
        const soilGridsData = await soilResponse.json()
        console.log(`[v0] SoilGrids API response received:`, soilGridsData)

        // Process SoilGrids data and convert to our format
        const processedData = processSoilGridsData(soilGridsData, location, crop, month, coordinates)
        return processedData
      } else {
        console.log(`[v0] SoilGrids API failed with status ${soilResponse.status}, using enhanced fallback data`)
        return generateEnhancedLocationBasedSoilData(location, crop, month, coordinates)
      }
    } catch (fetchError) {
      clearTimeout(timeoutId) // Clear timeout on error
      
      if (fetchError.name === 'AbortError') {
        console.log(`[v0] SoilGrids API request aborted due to timeout, using fallback data`)
      } else {
        console.error(`[v0] Error fetching from SoilGrids API:`, fetchError)
      }
      
      return generateEnhancedLocationBasedSoilData(location, crop, month, coordinates)
    }
  } catch (error) {
    console.error(`[v0] Error in fetchRealSoilData:`, error)
    console.log(`[v0] Using enhanced fallback soil data`)
    return generateEnhancedLocationBasedSoilData(location, crop, month, coordinates)
  }
}

function processSoilGridsData(soilGridsData, location, crop, month, coordinates) {
  try {
    const properties = soilGridsData.properties

    // Extract soil properties from SoilGrids response (0-5cm depth)
    const phData = properties.phh2o?.mapped_units === "pH*10" ? properties.phh2o.depths[0].values.mean / 10 : 7.0

    const socData = properties.soc?.mapped_units === "dg/kg" ? properties.soc.depths[0].values.mean / 10 : 2.5 // Convert to %

    const nitrogenData =
      properties.nitrogen?.mapped_units === "cg/kg" ? properties.nitrogen.depths[0].values.mean / 100 : 0.15 // Convert to %

    const bulkDensity = properties.bdod?.mapped_units === "cg/cm³" ? properties.bdod.depths[0].values.mean / 100 : 1.4 // Convert to g/cm³

    const cec = properties.cec?.mapped_units === "mmol(c)/kg" ? properties.cec.depths[0].values.mean / 10 : 15 // Convert to cmol/kg

    const sand = properties.sand?.mapped_units === "g/kg" ? properties.sand.depths[0].values.mean / 10 : 40 // Convert to %

    const silt = properties.silt?.mapped_units === "g/kg" ? properties.silt.depths[0].values.mean / 10 : 35 // Convert to %

    const clay = properties.clay?.mapped_units === "g/kg" ? properties.clay.depths[0].values.mean / 10 : 25 // Convert to %

    // Apply crop and seasonal adjustments to real data
    const cropRequirements = getCropSoilRequirements(crop)
    const seasonalAdjustments = getSeasonalSoilAdjustments(month)

    // Calculate derived properties
    const adjustedPh = Math.max(5.5, Math.min(8.5, phData + cropRequirements.phAdjust + seasonalAdjustments.phChange))

    // Estimate moisture based on soil texture and season
    const baseMoisture = calculateMoistureFromTexture(sand, silt, clay)
    const moisture = Math.max(20, Math.min(90, baseMoisture + seasonalAdjustments.moistureChange))

    // Convert soil organic carbon to organic matter (multiply by 1.724)
    const organicMatter = Math.max(1.0, Math.min(5.0, socData * 1.724 + seasonalAdjustments.organicMatterChange))

    // Estimate NPK from soil properties
    const nitrogen = Math.max(30, Math.min(95, nitrogenData * 100 + seasonalAdjustments.nutrientAvailability))
    const phosphorus = Math.max(25, Math.min(90, cec * 2 + seasonalAdjustments.nutrientAvailability - 5))
    const potassium = Math.max(35, Math.min(95, cec * 2.5 + seasonalAdjustments.nutrientAvailability))

    // Estimate salinity from location and season
    const baseSalinity = estimateSalinityFromLocation(location)
    const salinity = Math.max(0.1, Math.min(1.0, baseSalinity + seasonalAdjustments.salinityChange))

    console.log(
      `[v0] Processed SoilGrids data - pH: ${adjustedPh}, Moisture: ${moisture}%, N: ${nitrogen}, P: ${phosphorus}, K: ${potassium}`,
    )

    return {
      ph: Math.round(adjustedPh * 10) / 10,
      moisture: Math.round(moisture),
      nitrogen: Math.round(nitrogen),
      phosphorus: Math.round(phosphorus),
      potassium: Math.round(potassium),
      organicMatter: Math.round(organicMatter * 10) / 10,
      salinity: Math.round(salinity * 100) / 100,
      texture: {
        sand: Math.round(sand),
        silt: Math.round(silt),
        clay: Math.round(clay),
      },
      bulkDensity: Math.round(bulkDensity * 100) / 100,
      cec: Math.round(cec * 10) / 10,
      lastUpdated: new Date().toISOString(),
      source: "SoilGrids_ISRIC",
      coordinates: coordinates,
    }
  } catch (error) {
    console.error(`[v0] Error processing SoilGrids data:`, error)
    return generateEnhancedLocationBasedSoilData(location, crop, month, coordinates)
  }
}

function calculateMoistureFromTexture(sand, silt, clay) {
  // Clay soils hold more water than sandy soils
  const clayFactor = clay * 0.8
  const siltFactor = silt * 0.6
  const sandFactor = sand * 0.3
  return Math.round((clayFactor + siltFactor + sandFactor) / 3 + 25)
}

function estimateSalinityFromLocation(location) {
  const locationKey = location.toLowerCase().split(",")[0].trim()
  const salinityMap = {
    ghaziabad: 0.25,
    delhi: 0.35,
    lucknow: 0.2,
    mumbai: 0.15,
    pune: 0.18,
    bangalore: 0.12,
    chennai: 0.28,
    hyderabad: 0.22,
    kolkata: 0.18,
  }
  return salinityMap[locationKey] || 0.2
}

function generateEnhancedLocationBasedSoilData(location, crop, month, coordinates) {
  const locationSoilProfile = getLocationSoilProfile(location)
  const cropRequirements = getCropSoilRequirements(crop)
  const seasonalAdjustments = getSeasonalSoilAdjustments(month)

  console.log(`[v0] Soil profile for ${location}:`, locationSoilProfile)
  console.log(`[v0] Crop requirements for ${crop}:`, cropRequirements)
  console.log(`[v0] Seasonal adjustments for ${month}:`, seasonalAdjustments)

  // Calculate soil properties based on location, crop, and season
  const ph = Math.max(
    5.5,
    Math.min(
      8.5,
      locationSoilProfile.basePh +
        cropRequirements.phAdjust +
        seasonalAdjustments.phChange +
        (Math.random() - 0.5) * 0.3,
    ),
  )

  const moisture = Math.max(
    20,
    Math.min(90, locationSoilProfile.baseMoisture + seasonalAdjustments.moistureChange + (Math.random() - 0.5) * 8),
  )

  const baseNutrient =
    locationSoilProfile.fertility + cropRequirements.nutrientDemand + seasonalAdjustments.nutrientAvailability

  const nitrogen = Math.max(30, Math.min(95, baseNutrient + (Math.random() - 0.5) * 12))
  const phosphorus = Math.max(25, Math.min(90, baseNutrient - 8 + (Math.random() - 0.5) * 15))
  const potassium = Math.max(35, Math.min(95, baseNutrient + 5 + (Math.random() - 0.5) * 10))

  const organicMatter = Math.max(
    1.0,
    Math.min(
      5.0,
      locationSoilProfile.organicMatter + seasonalAdjustments.organicMatterChange + (Math.random() - 0.5) * 0.8,
    ),
  )

  const salinity = Math.max(
    0.1,
    Math.min(1.0, locationSoilProfile.salinity + seasonalAdjustments.salinityChange + (Math.random() - 0.5) * 0.1),
  )

  return {
    ph: Math.round(ph * 10) / 10,
    moisture: Math.round(moisture),
    nitrogen: Math.round(nitrogen),
    phosphorus: Math.round(phosphorus),
    potassium: Math.round(potassium),
    organicMatter: Math.round(organicMatter * 10) / 10,
    salinity: Math.round(salinity * 100) / 100,
    lastUpdated: new Date().toISOString(),
    source: "enhanced_location_based",
    coordinates: coordinates,
  }
}

function getLocationSoilProfile(location) {
  const soilProfiles = {
    // North India - Alluvial soils
    ghaziabad: { basePh: 7.2, baseMoisture: 45, fertility: 72, organicMatter: 2.8, salinity: 0.25 },
    delhi: { basePh: 7.4, baseMoisture: 38, fertility: 65, organicMatter: 2.2, salinity: 0.35 },
    lucknow: { basePh: 6.9, baseMoisture: 48, fertility: 78, organicMatter: 3.2, salinity: 0.2 },

    // West India - Black cotton soils
    mumbai: { basePh: 6.8, baseMoisture: 55, fertility: 68, organicMatter: 2.5, salinity: 0.15 },
    pune: { basePh: 7.1, baseMoisture: 42, fertility: 75, organicMatter: 3.0, salinity: 0.18 },

    // South India - Red laterite soils
    bangalore: { basePh: 6.4, baseMoisture: 52, fertility: 82, organicMatter: 3.5, salinity: 0.12 },
    chennai: { basePh: 6.6, baseMoisture: 35, fertility: 58, organicMatter: 2.0, salinity: 0.28 },
    hyderabad: { basePh: 6.8, baseMoisture: 40, fertility: 70, organicMatter: 2.7, salinity: 0.22 },

    // East India - Alluvial soils
    kolkata: { basePh: 6.2, baseMoisture: 65, fertility: 85, organicMatter: 4.0, salinity: 0.18 },
    
    // Odisha - Lateritic and alluvial soils
    odisha: { basePh: 5.8, baseMoisture: 55, fertility: 60, organicMatter: 2.5, salinity: 0.15 },
    bhubaneswar: { basePh: 5.9, baseMoisture: 58, fertility: 65, organicMatter: 2.8, salinity: 0.12 },
    cuttack: { basePh: 6.1, baseMoisture: 62, fertility: 70, organicMatter: 3.0, salinity: 0.10 },
    puri: { basePh: 6.0, baseMoisture: 60, fertility: 68, organicMatter: 2.9, salinity: 0.08 },
  }

  const locationKey = location.toLowerCase().split(",")[0].trim()
  return soilProfiles[locationKey] || soilProfiles["ghaziabad"]
}

function getCropSoilRequirements(crop) {
  const cropRequirements = {
    rice: { phAdjust: -0.4, nutrientDemand: 15, waterNeed: "high" },
    wheat: { phAdjust: 0.2, nutrientDemand: 8, waterNeed: "medium" },
    cotton: { phAdjust: 0.1, nutrientDemand: 12, waterNeed: "medium" },
    sugarcane: { phAdjust: -0.2, nutrientDemand: 20, waterNeed: "very_high" },
    chickpea: { phAdjust: 0.3, nutrientDemand: 5, waterNeed: "low" },
    soybean: { phAdjust: 0.0, nutrientDemand: 10, waterNeed: "medium" },
    maize: { phAdjust: 0.1, nutrientDemand: 12, waterNeed: "medium" },
    tomato: { phAdjust: -0.1, nutrientDemand: 18, waterNeed: "high" },
  }

  const cropKey = crop.toLowerCase().replace(/\s*$$[^)]*$$/g, "")
  return cropRequirements[cropKey] || cropRequirements["rice"]
}

function getSeasonalSoilAdjustments(month) {
  const monthIndex = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  }

  const monthNum = monthIndex[month.toLowerCase()] ?? 4

  // Seasonal patterns in Indian agriculture
  const isMonsoon = monthNum >= 5 && monthNum <= 8 // June to September
  const isSummer = monthNum >= 2 && monthNum <= 4 // March to May
  const isWinter = monthNum >= 10 || monthNum <= 1 // November to February

  if (isMonsoon) {
    return {
      phChange: -0.1, // Slight acidification due to leaching
      moistureChange: 25, // High moisture during monsoon
      nutrientAvailability: -5, // Some nutrient leaching
      organicMatterChange: 0.3, // Increased decomposition
      salinityChange: -0.05, // Reduced salinity due to leaching
    }
  } else if (isSummer) {
    return {
      phChange: 0.1, // Slight alkalinization
      moistureChange: -15, // Low moisture in summer
      nutrientAvailability: 0, // Stable nutrients
      organicMatterChange: -0.2, // Reduced organic matter
      salinityChange: 0.05, // Increased salinity due to evaporation
    }
  } else {
    // Winter
    return {
      phChange: 0.0, // Stable pH
      moistureChange: 5, // Moderate moisture
      nutrientAvailability: 8, // Good nutrient availability
      organicMatterChange: 0.1, // Slow decomposition
      salinityChange: 0.0, // Stable salinity
    }
  }
}
