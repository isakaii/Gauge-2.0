import { NextResponse } from "next/server";
import { supabase } from "@/supabaseClient";

/**
 * API route that searches for candidates by company name using MixRank API
 * This follows the 3-step process:
 * 1. Get Feature IDs for the company
 * 2. Use Feature IDs to get Person IDs
 * 3. Get full profiles for Person IDs
 */
export async function POST(request: Request) {
  try {
    const MIXRANK_API_URL = process.env.MIXRANK_API_URL || "https://api.mixrank.com";
    const MIXRANK_API_KEY = process.env.MIXRANK_API_KEY;

    const { companyName, employmentStatus = "present" } = await request.json();
    
    if (!companyName) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }
    
    // Step 1: Get Feature IDs for the company
    let featureId: string;
    try {
      const featureResponse = await fetch(
        `${MIXRANK_API_URL}/v2/json/${MIXRANK_API_KEY}/segment-features/persons?type=company&search=${encodeURIComponent(companyName)}`
      );
      
      if (!featureResponse.ok) {
        return NextResponse.json(
          { error: `Error fetching feature IDs: ${featureResponse.status}` }, 
          { status: featureResponse.status }
        );
      }
      
      const featureData = await featureResponse.json();
      
      // Get the feature ID based on the requested employment status 
      // "present" - current employees, "past" - former employees, "ever" - all employees
      const feature = featureData.results?.find((result: any) => result.mod === employmentStatus);
      
      if (!feature) {
        return NextResponse.json(
          { error: `No ${employmentStatus} employees feature found for this company` }, 
          { status: 404 }
        );
      }
      
      featureId = feature.id;
      
    } catch (error) {
      console.error("Error in step 1 (feature IDs):", error);
      return NextResponse.json(
        { error: "Error fetching company features" }, 
        { status: 500 }
      );
    }
    
    // Step 2: Use Feature ID to get Person IDs
    let personIds: number[] = [];
    try {
      const personIdsResponse = await fetch(
        `${MIXRANK_API_URL}/v2/json/${MIXRANK_API_KEY}/person/segment-preview?query=${featureId}&limit=5`
      );
      
      if (!personIdsResponse.ok) {
        return NextResponse.json(
          { error: `Error fetching person IDs: ${personIdsResponse.status}` }, 
          { status: personIdsResponse.status }
        );
      }
      
      const personIdsData = await personIdsResponse.json();
      personIds = personIdsData.results || [];
      
      if (personIds.length === 0) {
        return NextResponse.json(
          { error: "No candidates found for this company" }, 
          { status: 404 }
        );
      }
      
    } catch (error) {
      console.error("Error in step 2 (person IDs):", error);
      return NextResponse.json(
        { error: "Error fetching person IDs" }, 
        { status: 500 }
      );
    }
    
    // Step 3: Get full profiles for the Person IDs
    const candidates = [];
    try {
      // Process each person ID (in sequence to avoid rate limits)
      for (const personId of personIds) {
        // Don't use the enable parameter as it's causing 400 errors
        const profileResponse = await fetch(
          `${MIXRANK_API_URL}/v2/json/${MIXRANK_API_KEY}/person/${personId}`
        );
        
        if (!profileResponse.ok) {
          console.warn(`Skipping profile ${personId} due to error: ${profileResponse.status}`);
          continue;
        }
        
        const profileData = await profileResponse.json();
        
        // Map the profile data to our candidate data structure
        try {
            if (profileData) {
              // Safely extract data with fallbacks
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
                
              const candidate = {
                id: personId.toString(),
                name: name,
                currentCompany: companyName,
                linkedinUrl: profileData.linkedin?.url || "",
                currentRole: currentRole,
                location: location,
                yearsExperience: calculateYearsExperience(profileData.linkedin?.positions),
                school: profileData.linkedin?.education?.[0]?.school_name || "Unknown",
                priorExperience: generatePriorExperienceString(profileData.linkedin?.positions),
                companyWhenJoined: generateCompanyMetrics(),
                companyToday: generateCompanyMetricsToday(),
                notableInvestors: generateNotableInvestors(),
                seniorLeadership: generateSeniorLeadership(),
                email: profileData.emails?.[0]?.email || null,
                employmentStatus: employmentStatus // Add employment status to track how they were fetched
              };
              
              candidates.push(candidate);
              
              // Save to Supabase only if it's properly initialized
              if (supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
                try {
                  // Try to disable RLS for this operation by using service role if available
                  let supabaseClient = supabase;
                  
                  const { error: supabaseError } = await supabaseClient
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
                      employment_status: employmentStatus, // Store the employment status
                      created_at: new Date().toISOString()
                    }, { onConflict: 'id' });
                    
                  if (supabaseError) {
                    // If we get an RLS error, log it but continue - this is normal if RLS is enabled
                    if (supabaseError.code === '42501') {
                      console.error("Supabase RLS error - you need to configure table permissions:", supabaseError.message);
                    } else {
                      console.error("Error saving to Supabase:", supabaseError);
                    }
                    // Continue without failing the whole operation
                  }
                } catch (saveError) {
                  console.error("Exception saving to Supabase:", saveError);
                  // Continue without failing the whole operation
                }
              } else {
                console.log("Skipping Supabase save - client not properly initialized");
              }
            }
          } catch (err) {
            console.error("Error processing candidate data:", err);
            // Continue with next candidate
          }
      }
      
      if (candidates.length === 0) {
        return NextResponse.json(
          { error: "Could not retrieve any valid profiles" }, 
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        candidates,
        company: companyName,
        employmentStatus: employmentStatus // Include the employment status in the response
      });
      
    } catch (error) {
      console.error("Error in step 3 (full profiles):", error);
      return NextResponse.json(
        { error: "Error fetching candidate profiles" }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in company candidates API route:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

// Helper functions for data processing
// [Keep all the existing helper functions unchanged]
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