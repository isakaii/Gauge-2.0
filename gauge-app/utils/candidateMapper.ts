// utils/candidateMapper.ts

import { CandidateData, CompanyMetrics, InvestorRound, LeadershipProfile } from "@/data/candidates";

/**
 * Maps the Mixrank API response to our application's CandidateData model
 */
export function mapMixrankResponseToCandidate(mixrankResponse: any, employmentStatus: string = "present"): CandidateData {
  const result = mixrankResponse.results[0];
  const linkedin = result.linkedin;
  
  // Defensive checking for required data
  if (!linkedin || !linkedin.positions || !Array.isArray(linkedin.positions)) {
    throw new Error("Invalid LinkedIn data: missing positions array");
  }
  
  // Find current position with defensive fallbacks
  const positions = linkedin.positions || [];
  const currentPosition = positions.find((pos: any) => pos.is_current) || positions[0] || {};
  
  // Extract education safely
  const education = linkedin.education && linkedin.education.length > 0 
    ? linkedin.education[0] 
    : null;
  
  // Calculate years of experience
  const yearsExperience = calculateYearsExperience(positions);
  
  // Generate prior experience string
  const priorExperience = generatePriorExperienceString(positions);
  
  // Create a unique ID
  const id = result.id ? result.id.toString() : Math.random().toString(36).substring(2, 9);
  
  // Make sure we have the required name field
  const name = linkedin.name && linkedin.name.full 
    ? linkedin.name.full 
    : "Unknown Name";
  
  // Map to our data model with fallbacks for all fields
  const candidate: CandidateData = {
    id,
    name,
    currentCompany: currentPosition.company_name || "Unknown Company",
    linkedinUrl: linkedin.url || `https://linkedin.com/in/unknown-${id}`,
    currentRole: currentPosition.title || "Unknown Role",
    location: linkedin.location && linkedin.location.text ? linkedin.location.text : "Unknown location",
    yearsExperience,
    school: education?.school_name || "Unknown",
    priorExperience,
    employmentStatus, // Add the employment status to the candidate data
    
    // These fields need additional data sources in a real application
    companyWhenJoined: generateCompanyMetricsWhenJoined(currentPosition),
    companyToday: generateCompanyMetricsToday(currentPosition),
    notableInvestors: generateNotableInvestors(currentPosition),
    seniorLeadership: generateSeniorLeadership(currentPosition),
  };
  
  return candidate;
}

/**
 * Helper function to calculate years of experience based on positions
 */
function calculateYearsExperience(positions: any[]): number {
  if (!positions || !Array.isArray(positions) || positions.length === 0) return 0;
  
  let earliestYear = new Date().getFullYear();
  let foundValidStartDate = false;
  
  positions.forEach(position => {
    if (position && position.start_date_year && typeof position.start_date_year === 'number' && position.start_date_year < earliestYear) {
      earliestYear = position.start_date_year;
      foundValidStartDate = true;
    }
  });
  
  // If we couldn't find any valid start dates, return a default value
  if (!foundValidStartDate) return 0;
  
  const yearsExperience = new Date().getFullYear() - earliestYear;
  
  // Sanity check to avoid negative or unreasonably large values
  if (yearsExperience < 0) return 0;
  if (yearsExperience > 50) return 50; // Cap at 50 years
  
  return yearsExperience;
}

/**
 * Helper function to generate prior experience string
 */
function generatePriorExperienceString(positions: any[]): string {
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
    console.error("Error generating prior experience string:", error);
    return "Experience information unavailable";
  }
}

/**
 * Generate company metrics when the candidate joined
 * In a real app, this would come from another data source
 */
function generateCompanyMetricsWhenJoined(position: any): CompanyMetrics {
  // This is mock data since it's not in the Mixrank API
  // In a real app, you would fetch this from another source
  return {
    size: Math.floor(Math.random() * 100) + 20,
    stage: getRandomStage(),
    funding: Math.floor(Math.random() * 30) + 5,
  };
}

/**
 * Generate current company metrics
 * In a real app, this would come from another data source
 */
function generateCompanyMetricsToday(position: any): CompanyMetrics {
  // This is mock data since it's not in the Mixrank API
  const whenJoined = generateCompanyMetricsWhenJoined(position);
  return {
    size: whenJoined.size * (Math.random() + 1),
    stage: getNextStage(whenJoined.stage),
    funding: whenJoined.funding * (Math.random() + 1),
  };
}

/**
 * Generate notable investors
 * In a real app, this would come from another data source
 */
function generateNotableInvestors(position: any): InvestorRound[] {
  // This is mock data since it's not in the Mixrank API
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

/**
 * Generate senior leadership profiles
 * In a real app, this would come from another data source
 */
function generateSeniorLeadership(position: any): LeadershipProfile[] {
  // This is mock data since it's not in the Mixrank API
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

/**
 * Helper function to get a random funding stage
 */
function getRandomStage(): string {
  const stages = ["Seed", "Series A", "Series B", "Series C", "Series D"];
  return stages[Math.floor(Math.random() * 3)]; // Bias toward earlier stages
}

/**
 * Helper function to get the next stage
 */
function getNextStage(currentStage: string): string {
  const stages = ["Seed", "Series A", "Series B", "Series C", "Series D", "Public"];
  const currentIndex = stages.indexOf(currentStage);
  
  if (currentIndex === -1 || currentIndex === stages.length - 1) {
    return currentStage;
  }
  
  // 70% chance to advance to next stage
  return Math.random() < 0.7 ? stages[currentIndex + 1] : currentStage;
}