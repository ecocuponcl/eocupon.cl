import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt, image } = await request.json()

    if (!prompt && !image) {
      return NextResponse.json(
        { error: "Se requiere un prompt o una imagen" },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key no configurada" },
        { status: 500 }
      )
    }

    // Use OpenRouter to generate image with Flux or similar model
    const enhancedPrompt = `Professional promotional coupon design for a business discount campaign. ${prompt}. High quality, vibrant colors, marketing material style, clean and modern design.`

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ecocupon.cl",
        "X-Title": "EcoCupon",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",
        messages: [
          {
            role: "user",
            content: image 
              ? [
                  { type: "text", text: `Based on this image, create a detailed description for a professional coupon design: ${prompt || "Create a professional promotional coupon background"}` },
                  { type: "image_url", image_url: { url: image } }
                ]
              : enhancedPrompt
          }
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("OpenRouter error:", errorData)
      return NextResponse.json(
        { error: "Error al procesar la solicitud" },
        { status: response.status }
      )
    }

    const data = await response.json()
    const description = data.choices?.[0]?.message?.content || ""

    // For now, return a generated placeholder or use the description to generate
    // In production, you would use an actual image generation API like Flux
    // For demo purposes, we'll use a placeholder image service
    
    const placeholderUrl = `https://placehold.co/800x600/22c55e/ffffff/png?text=${encodeURIComponent(prompt?.substring(0, 20) || "Cupon")}`
    
    // Alternative: Use a real image generation with OpenRouter's image models
    // This is a simplified version - in production you'd want to use actual image generation
    
    return NextResponse.json({
      imageUrl: placeholderUrl,
      description,
    })
  } catch (error) {
    console.error("Generation error:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
