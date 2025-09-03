// app/api/perplexity/route.ts

import { NextResponse } from "next/server";

/**
 * API route that communicates with Perplexity API to fetch company information
 * This keeps our API key secure by handling requests server-side
 */
export async function POST(request: Request) {
  try {
    const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

    if (!PERPLEXITY_API_KEY) {
      console.error("PERPLEXITY_API_KEY is not configured");
      return NextResponse.json({ error: "API configuration error" }, { status: 500 });
    }

    const { query, dataType } = await request.json();
    
    if (!query || !dataType) {
      return NextResponse.json({ error: "Query and dataType are required" }, { status: 400 });
    }

    console.log(`[PERPLEXITY] Fetching ${dataType} data with query:`, query);
    
    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: "You are a research assistant specialized in providing accurate company information. CRITICAL INSTRUCTION: Your response MUST be PURE, VALID JSON ONLY with no explanations or comments before or after. Your entire response should be valid when passed directly to JSON.parse() without any processing. DO NOT include phrases like 'Based on' or 'Here is'. DO NOT use markdown formatting. DO NOT wrap JSON in code blocks. JSON ONLY. If you're providing an array of objects, make sure it's a proper array structure with square brackets. If you're providing a single object, make sure it has proper curly braces and quotes. Every field must use double quotes. Be as accurate as possible with the company information while strictly conforming to valid JSON syntax."
          },
          {
            role: "user",
            content: query
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ERROR] Perplexity API error (${response.status}):`, errorText);
      return NextResponse.json(
        { error: `Error querying Perplexity: ${response.status}`, details: errorText }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`[PERPLEXITY] Successfully received ${dataType} data from Perplexity`);
    
    return NextResponse.json({
      dataType,
      response: data
    });
    
  } catch (error) {
    console.error("[ERROR] Error in Perplexity API route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}