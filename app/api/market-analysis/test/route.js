import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Test the market analysis API
    const testData = {
      crop: "Rice",
      location: "Bhubaneswar, Odisha",
      state: "odisha",
      month: "6"
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/market-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: "Market analysis API test successful",
      testData,
      result: result.data ? {
        crop: result.data.crop,
        location: result.data.location,
        currentPrice: result.data.realTimeData?.currentPrice,
        trend: result.data.realTimeData?.trend,
        lastUpdated: result.data.lastUpdated,
        cached: result.cached
      } : null
    })

  } catch (error) {
    console.error("Market analysis test error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      message: "Market analysis API test failed"
    }, { status: 500 })
  }
}
