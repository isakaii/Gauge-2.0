// app/api/advanced-candidates/route.ts

import { NextResponse } from "next/server";
import { supabase } from "@/supabaseClient";
import { CandidateData } from "@/data/candidates";

interface SearchParams {
  companyNames: string[];
  yearsExperience?: number;
  maxYearsExperience?: number;
  location?: string;
  school?: string;
  role?: string;
  employmentStatus?: string;
  limit?: number;
}

/**
 * Enhanced API route for searching candidates with advanced filters
 * - Provides detailed logging of API responses
 * - Supports more advanced filtering options
 * - Includes better error handling and debugging information
 */
export async function POST(request: Request) {
  try {
    const MIXRANK_API_URL = process.env.MIXRANK_API_URL || "https://api.mixrank.com";
    const MIXRANK_API_KEY = process.env.MIXRANK_API_KEY;
    
    if (!MIXRANK_API_KEY) {
      console.error("MIXRANK_API_KEY is not configured");
      return NextResponse.json({ error: "API configuration error" }, { status: 500 });
    }
    
    const params: SearchParams = await request.json();
    console.log("Search parameters:", JSON.stringify(params, null, 2));
    
    const { 
      companyNames,
      yearsExperience, 
      maxYearsExperience,
      location, 
      school, 
      role, 
      employmentStatus = "present",
      limit = 50
    } = params;
    
    if (!companyNames || companyNames.length === 0) {
      return NextResponse.json({ error: "At least one company name is required" }, { status: 400 });
    }
    
    // Process each company name
    const candidates: CandidateData[] = [];
    const rawProfiles: any[] = [];
    
    for (const companyName of companyNames) {
      // Step 1: Get Feature IDs for each company
      console.log(`[STEP 1] Getting feature IDs for company: ${companyName}`);
      let featureId: string;
      const featureUrl = `${MIXRANK_API_URL}/v2/json/${MIXRANK_API_KEY}/segment-features/persons?type=company&search=${encodeURIComponent(companyName)}`;
      console.log(`[DEBUG] Feature ID Request URL: ${featureUrl}`);
      
      const featureResponse = await fetch(featureUrl);
      
      if (!featureResponse.ok) {
        const errorText = await featureResponse.text();
        console.error(`[ERROR] Feature ID API error (${featureResponse.status}): ${errorText}`);
        return NextResponse.json(
          { error: `Error fetching feature IDs: ${featureResponse.status}`, details: errorText }, 
          { status: featureResponse.status }
        );
      }
      
      const featureData = await featureResponse.json();
      console.log(`[DEBUG] Feature ID Response:`, JSON.stringify(featureData, null, 2));
      
      // Get the feature ID based on the requested employment status
      const feature = featureData.results?.find((result: any) => result.mod === employmentStatus);
      
      if (!feature) {
        const availableTypes = featureData.results?.map((r: any) => r.mod).join(", ") || "none";
        console.error(`[ERROR] No ${employmentStatus} employees feature found. Available types: ${availableTypes}`);
        return NextResponse.json(
          { 
            error: `No ${employmentStatus} employees feature found for this company`, 
            details: `Available types: ${availableTypes}` 
          }, 
          { status: 404 }
        );
      }
      
      featureId = feature.id;
      console.log(`[SUCCESS] Found feature ID ${featureId} for ${employmentStatus} employees at ${companyName}`);
      
      // Step 2: Use Feature ID to get Person IDs
      console.log(`[STEP 2] Getting person IDs with feature: ${featureId}`);
      const personUrl = `${MIXRANK_API_URL}/v2/json/${MIXRANK_API_KEY}/person/segment-preview?query=${featureId}&limit=${limit}`;
      console.log(`[DEBUG] Person IDs Request URL: ${personUrl} (limit=${limit})`);
      
      const personIdsResponse = await fetch(personUrl);
      
      if (!personIdsResponse.ok) {
        const errorText = await personIdsResponse.text();
        console.error(`[ERROR] Person IDs API error (${personIdsResponse.status}): ${errorText}`);
        return NextResponse.json(
          { error: `Error fetching person IDs: ${personIdsResponse.status}`, details: errorText }, 
          { status: personIdsResponse.status }
        );
      }
      
      const personIdsData = await personIdsResponse.json();
      console.log(`[DEBUG] Person IDs Response:`, JSON.stringify(personIdsData, null, 2));
      
      const personIds = personIdsData.results || [];
      
      if (personIds.length === 0) {
        console.error(`[ERROR] No candidates found for feature ID ${featureId}`);
        return NextResponse.json(
          { error: "No candidates found for this company" }, 
          { status: 404 }
        );
      }
      
      console.log(`[SUCCESS] Found ${personIds.length} person IDs for ${companyName}`);
      
      // Step 3: Get full profiles for the Person IDs
      console.log(`[STEP 3] Getting full profiles for ${personIds.length} person IDs`);
      
      // Process each person ID (in sequence to avoid rate limits)
      for (const personId of personIds) {
        console.log(`[DEBUG] Getting profile for person ID: ${personId}`);
        const profileUrl = `${MIXRANK_API_URL}/v2/json/${MIXRANK_API_KEY}/person/${personId}`;
        console.log(`[DEBUG] Profile Request URL: ${profileUrl}`);
        
        const profileResponse = await fetch(profileUrl);
        
        if (!profileResponse.ok) {
          console.warn(`[WARNING] Skipping profile ${personId} due to error: ${profileResponse.status}`);
          console.warn(`[WARNING] Response text: ${await profileResponse.text()}`);
          continue;
        }
        
        const profileData = await profileResponse.json();
        console.log(`[DEBUG] Profile ${personId} response:`, JSON.stringify(profileData, null, 2));
        rawProfiles.push(profileData);
        
        try {
          if (profileData) {
            // Map the profile data to our candidate data structure
            const name = typeof profileData.name === 'string' 
              ? profileData.name 
              : profileData.name?.full ?? 
                profileData.linkedin?.name?.full ?? 
                `Unknown Person (${personId})`;
                
            const currentRole = profileData.linkedin?.positions?.[0]?.title ?? 
                               profileData.title ?? 
                               "Unknown Role";
                               
            const location = typeof profileData.linkedin?.location?.text === 'string'
              ? profileData.linkedin.location.text
              : "Unknown location";
              
            const schoolInfo = profileData.linkedin?.education?.[0]?.school_name || "Unknown";
            
            // Calculate years of experience
            const yearsExp = calculateYearsExperience(profileData.linkedin?.positions);
            
            // Create candidate object
            const candidate: CandidateData = {
              id: personId.toString(),
              name: name,
              currentCompany: companyName,
              linkedinUrl: profileData.linkedin?.url || "",
              currentRole: currentRole,
              location: location,
              yearsExperience: yearsExp,
              school: schoolInfo,
              priorExperience: generatePriorExperienceString(profileData.linkedin?.positions),
              companyWhenJoined: generateCompanyMetrics(),
              companyToday: generateCompanyMetricsToday(),
              notableInvestors: generateNotableInvestors(),
              seniorLeadership: generateSeniorLeadership(),
              email: profileData.emails?.[0]?.email || null,
              employmentStatus: employmentStatus
            };
            
            // Apply advanced filters - log filter results for debugging
            const matchesMinYearsExp = yearsExperience === undefined || candidate.yearsExperience >= (yearsExperience - 1);
            const matchesMaxYearsExp = maxYearsExperience === undefined || candidate.yearsExperience <= (maxYearsExperience + 1);
            const matchesLocation = !location || location.trim() === "" || 
                                   candidate.location.toLowerCase().includes(location.toLowerCase());
            const matchesSchool = !school || school.trim() === "" || 
                                 candidate.school.toLowerCase().includes(school.toLowerCase());
            const matchesRole = !role || role.trim() === "" || 
                               candidate.currentRole.toLowerCase().includes(role.toLowerCase());
            
            console.log(`[FILTER] Person ${personId} (${candidate.name}):`);
            console.log(`- Years Experience: ${candidate.yearsExperience} (Min: ${yearsExperience || 'Any'}, Max: ${maxYearsExperience || 'Any'}) - ${matchesMinYearsExp && matchesMaxYearsExp ? 'MATCH' : 'NO MATCH'}`);
            console.log(`- Location: "${candidate.location}" (Filter: "${location || 'Any'}") - ${matchesLocation ? 'MATCH' : 'NO MATCH'}`);
            console.log(`- School: "${candidate.school}" (Filter: "${school || 'Any'}") - ${matchesSchool ? 'MATCH' : 'NO MATCH'}`);
            console.log(`- Role: "${candidate.currentRole}" (Filter: "${role || 'Any'}") - ${matchesRole ? 'MATCH' : 'NO MATCH'}`);
            
            const matchesFilters = matchesMinYearsExp && matchesMaxYearsExp && matchesLocation && matchesSchool && matchesRole;
            console.log(`- Overall: ${matchesFilters ? 'MATCHES ALL FILTERS' : 'FILTERED OUT'}`);
            
            if (matchesFilters) {
              candidates.push(candidate);
              
              // Also save to Supabase for future use (non-blocking)
              saveToSupabase(candidate).catch(err => console.error("Error saving to Supabase:", err));
            }
          }
        } catch (err) {
          console.error(`[ERROR] Error processing candidate data for person ID ${personId}:`, err);
        }
      }
      
      console.log(`[SUMMARY] Found ${candidates.length} candidates matching all filters out of ${personIds.length} total profiles`);
    }
    
    return NextResponse.json({ 
      candidates,
      count: candidates.length,
      company: companyNames?.join(", "),
      employmentStatus: employmentStatus,
      // Include some debugging information in the response
      debug: {
        totalProfilesProcessed: rawProfiles.length,
        matchingCandidates: candidates.length,
        filtersSummary: {
          companyNames: companyNames,
          employmentStatus,
          yearsExperience,
          maxYearsExperience,
          location,
          school,
          role
        }
      }
    });
    
  } catch (error) {
    console.error("[ERROR] Fatal error in mixrank-candidates API route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}

// Helper function to save a candidate to Supabase
async function saveToSupabase(candidate: CandidateData): Promise<void> {
  if (!supabase) return;
  
  try {
    const { error } = await supabase
      .from('candidates')
      .upsert({
        id: candidate.id,
        name: candidate.name,
        company: candidate.currentCompany,
        role: candidate.currentRole,
        location: candidate.location,
        linkedin_url: candidate.linkedinUrl,
        years_experience: candidate.yearsExperience,
        school: candidate.school,
        prior_experience: candidate.priorExperience,
        email: candidate.email,
        employment_status: candidate.employmentStatus,
        created_at: new Date().toISOString()
      }, { onConflict: 'id' });
      
    if (error) {
      console.error("Error saving to Supabase:", error);
    }
  } catch (error) {
    console.error("Exception saving to Supabase:", error);
  }
}

// Helper function to calculate years of experience
function calculateYearsExperience(positions: any[] = []): number {
  if (!positions || !Array.isArray(positions) || positions.length === 0) return 0;
  
  let earliestYear = new Date().getFullYear();
  let foundValidStartDate = false;
  
  positions.forEach(position => {
    if (position && position.start_date_year && typeof position.start_date_year === 'number' && position.start_date_year < earliestYear) {
      earliestYear = position.start_date_year;
      foundValidStartDate = true;
    }
  });
  
  if (!foundValidStartDate) return 0;
  
  const yearsExperience = new Date().getFullYear() - earliestYear;
  
  if (yearsExperience < 0) return 0;
  if (yearsExperience > 50) return 50; // Cap at 50 years
  
  return yearsExperience;
}

// Helper function to generate prior experience string
function generatePriorExperienceString(positions: any[] = []): string {
  if (!positions || !Array.isArray(positions) || positions.length <= 1) return "No prior experience";
  
  try {
    // Skip the current position and take the next 2 or fewer
    const priorPositions = positions
      .filter(pos => pos && typeof pos === 'object' && !pos.is_current)
      .slice(0, 2);
    
    if (priorPositions.length === 0) return "No prior experience";
    
    return priorPositions
      .map(pos => {
        const title = pos.title || "Unknown role";
        const company = pos.company_name || "Unknown company";
        return `${title} at ${company}`;
      })
      .join(", ");
  } catch (error) {
    return "Experience information unavailable";
  }
}

// Below are helper functions for generating mock company data
// In a production app, these would connect to real data sources

function generateCompanyMetrics() {
  return {
    size: Math.floor(Math.random() * 100) + 20,
    stage: getRandomStage(),
    funding: Math.floor(Math.random() * 30) + 5,
  };
}

function generateCompanyMetricsToday() {
  const whenJoined = generateCompanyMetrics();
  return {
    size: Math.floor(whenJoined.size * (Math.random() + 1)),
    stage: getNextStage(whenJoined.stage),
    funding: Math.floor(whenJoined.funding * (Math.random() + 1)),
  };
}

function getRandomStage(): string {
  const stages = ["Seed", "Series A", "Series B", "Series C", "Series D"];
  return stages[Math.floor(Math.random() * 3)]; // Bias toward earlier stages
}

function getNextStage(currentStage: string): string {
  const stages = ["Seed", "Series A", "Series B", "Series C", "Series D", "Public"];
  const currentIndex = stages.indexOf(currentStage);
  
  if (currentIndex === -1 || currentIndex === stages.length - 1) {
    return currentStage;
  }
  
  // 70% chance to advance to next stage
  return Math.random() < 0.7 ? stages[currentIndex + 1] : currentStage;
}

function generateNotableInvestors() {
  const investors = [
    "Y Combinator", "Sequoia Capital", "Andreessen Horowitz", 
    "Accel", "Benchmark", "Greylock Partners", "Kleiner Perkins",
    "Tiger Global", "Lightspeed Venture", "NEA", "FirstMark Capital"
  ];
  
  const rounds = ["Seed", "Series A", "Series B", "Series C"];
  const numRounds = Math.floor(Math.random() * 3) + 1;
  
  return Array.from({ length: numRounds }, (_, i) => {
    const round = rounds[i];
    const numInvestors = Math.floor(Math.random() * 3) + 1;
    const shuffled = [...investors].sort(() => 0.5 - Math.random());
    
    return {
      round,
      investors: shuffled.slice(0, numInvestors),
    };
  });
}

function generateSeniorLeadership() {
  const roles = [
    { title: "CEO & Co-founder", background: "Previously VP at Google" },
    { title: "CTO & Co-founder", background: "Previously Tech Lead at Meta" },
    { title: "VP of Engineering", background: "Previously Engineering Director at Amazon" },
    { title: "Chief Product Officer", background: "Previously Product Lead at Apple" },
    { title: "VP of Marketing", background: "Previously Marketing Director at Salesforce" },
  ];
  
  const firstNames = ["Sarah", "Michael", "David", "Jennifer", "Robert", "Lisa", "Kevin", "Jessica"];
  const lastNames = ["Chen", "Smith", "Johnson", "Brown", "Davis", "Wilson", "Taylor", "Lee"];
  
  const numLeaders = Math.floor(Math.random() * 2) + 2;
  const shuffledRoles = [...roles].sort(() => 0.5 - Math.random());
  
  return Array.from({ length: numLeaders }, (_, i) => {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return {
      name: `${firstName} ${lastName}`,
      role: shuffledRoles[i].title,
      background: shuffledRoles[i].background,
    };
  });
}