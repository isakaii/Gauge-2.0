// app/api/candidates/route.ts

import { NextResponse } from "next/server";

/**
 * API route that fetches candidate data from Mixrank
 * This keeps our API key secure by handling requests server-side
 */
export async function POST(request: Request) {
  try {
    const MIXRANK_API_URL = process.env.MIXRANK_API_URL;
    const MIXRANK_API_KEY = process.env.MIXRANK_API_KEY;

    const { linkedInUrl } = await request.json();
    
    if (!linkedInUrl) {
      return NextResponse.json({ error: "LinkedIn URL is required" }, { status: 400 });
    }
    
    const encodedUrl = encodeURIComponent(linkedInUrl);
    const apiUrl = `${MIXRANK_API_URL}/v2/json/${MIXRANK_API_KEY}/person/match?social_url=${encodedUrl}`;
    
    try {
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        return NextResponse.json(
          { error: `Error fetching data: ${response.status}` }, 
          { status: response.status }
        );
      }
      
      const data = await response.json();
      
      // Check if we got a valid response with results
      if (!data || !data.results || data.results.length === 0) {
        return NextResponse.json(
          { error: "No profile data found for this LinkedIn URL" }, 
          { status: 404 }
        );
      }
      
      // Verify the result has the expected structure
      const result = data.results[0];
      if (!result.linkedin || !result.linkedin.positions) {
        return NextResponse.json(
          { error: "Profile data is incomplete or in an unexpected format" }, 
          { status: 500 }
        );
      }
      
      return NextResponse.json(data);
    } catch (fetchError) {
      console.error("Error fetching from Mixrank:", fetchError);
      return NextResponse.json(
        { error: "Network error while communicating with Mixrank API" }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in candidate API route:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}