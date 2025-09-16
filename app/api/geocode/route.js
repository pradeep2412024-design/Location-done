export async function POST(request) {
  try {
    const { latitude, longitude } = await request.json()

    // Try multiple geocoding services for better reliability
    const geocodingServices = [
      {
        name: "BigDataCloud",
        url: `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
        parser: (data) =>
          `${data.city || data.locality || "Unknown City"}, ${data.principalSubdivision || data.countryName || "Unknown Region"}`,
      },
      {
        name: "OpenStreetMap",
        url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        parser: (data) => {
          const address = data.address || {}
          const city = address.city || address.town || address.village || address.county || "Unknown City"
          const region = address.state || address.country || "Unknown Region"
          return `${city}, ${region}`
        },
      },
    ]

    for (const service of geocodingServices) {
      try {
        const response = await fetch(service.url, {
          headers: {
            "User-Agent": "CropWise-AI/1.0",
          },
        })

        if (response.ok) {
          const data = await response.json()
          const locationName = service.parser(data)

          return Response.json({
            success: true,
            location: locationName,
            service: service.name,
          })
        }
      } catch (error) {
        console.log(`${service.name} geocoding failed:`, error.message)
        continue
      }
    }

    // If all services fail, return coordinates as fallback
    return Response.json({
      success: true,
      location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      service: "coordinates",
    })
  } catch (error) {
    console.error("Geocoding API error:", error)
    return Response.json(
      {
        success: false,
        error: "Failed to process geocoding request",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return Response.json({ ok: true, route: 'geocode' })
}