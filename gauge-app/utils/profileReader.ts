import { promises as fs } from 'fs';
import path from 'path';
import { CandidateData, CompanyMetrics, InvestorRound, LeadershipProfile } from '@/data/candidates';

interface SearchFilters {
  companyName?: string;
  yearsExperience?: number;
  location?: string;
  school?: string;
  role?: string;
}

/**
 * Searches the JSONL profiles file for candidates matching the specified filters
 * Returns up to the specified limit of candidates
 */
export async function searchProfilesFile(
  filePath: string,
  filters: SearchFilters,
  limit: number = 5
): Promise<CandidateData[]> {
  try {
    // Check if file exists
    const fullPath = path.join(process.cwd(), filePath);
    await fs.access(fullPath);
    
    // Read the file content
    const content = await fs.readFile(fullPath, 'utf8');
    const lines = content.split('\n');
    
    const results: CandidateData[] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const profile = JSON.parse(line);
        const candidate = mapProfileToCandidate(profile);
        
        if (matchesFilters(candidate, filters)) {
          results.push(candidate);
          
          // Stop once we have enough results
          if (results.length >= limit) {
            break;
          }
        }
      } catch (error) {
        console.error('Error processing profile:', error);
        // Continue to next line
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error reading profiles file:', error);
    return [];
  }
}

/**
 * Maps a profile from the JSONL file to our CandidateData format
 */
function mapProfileToCandidate(profile: any): CandidateData {
  // Extract current position info
  const positions = profile.experience || [];
  let currentPosition = positions.find((pos: any) => pos.is_current) || positions[0] || {};
  
  // Extract name
  const name = profile.name || "Unknown Name";
  
  // Extract company
  const currentCompany = currentPosition.company_name || "Unknown Company";
  
  // Extract role
  const currentRole = currentPosition.title || "Unknown Role";
  
  // Extract location
  const location = profile.locality || "Unknown Location";
  
  // Calculate years of experience
  const yearsExperience = calculateYearsExperience(positions);
  
  // Get school
  const education = profile.education && profile.education.length > 0 ? profile.education[0] : null;
  const school = education?.school?.name || "Unknown";
  
  // Generate prior experience
  const priorExperience = generatePriorExperienceString(positions);
  
  // Generate an ID
  const id = profile.person_id?.toString() || 
             profile.profile_id?.toString() || 
             Math.random().toString(36).substring(2, 9);
  
  // Create the candidate object
  return {
    id,
    name,
    currentCompany,
    linkedinUrl: profile.url || "",
    currentRole,
    location,
    yearsExperience,
    school,
    priorExperience,
    companyWhenJoined: generateCompanyMetrics(),
    companyToday: generateCompanyMetricsToday(),
    notableInvestors: generateNotableInvestors(),
    seniorLeadership: generateSeniorLeadership(),
    email: profile.person_emails?.[0] || null,
    employmentStatus: "present" // Default since we don't know for JSONL profiles
  };
}

/**
 * Checks if a candidate matches all specified filters
 */
function matchesFilters(candidate: CandidateData, filters: SearchFilters): boolean {
  // Company name filter (case-insensitive partial match)
  if (filters.companyName && !candidate.currentCompany.toLowerCase().includes(filters.companyName.toLowerCase())) {
    return false;
  }
  
  // Years of experience filter (allow some flexibility)
  if (filters.yearsExperience !== undefined && candidate.yearsExperience < (filters.yearsExperience - 1)) {
    return false;
  }
  
  // Location filter (case-insensitive partial match)
  if (filters.location && !candidate.location.toLowerCase().includes(filters.location.toLowerCase())) {
    return false;
  }
  
  // School filter (case-insensitive partial match)
  if (filters.school && !candidate.school.toLowerCase().includes(filters.school.toLowerCase())) {
    return false;
  }
  
  // Role filter (case-insensitive partial match)
  if (filters.role && !candidate.currentRole.toLowerCase().includes(filters.role.toLowerCase())) {
    return false;
  }
  
  // All filters passed
  return true;
}

/**
 * Calculates years of experience based on position history
 */
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

/**
 * Generates a string describing prior experience
 */
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

/**
 * Generates mock company metrics (when joined)
 */
function generateCompanyMetrics(): CompanyMetrics {
  return {
    size: Math.floor(Math.random() * 100) + 20,
    stage: getRandomStage(),
    funding: Math.floor(Math.random() * 30) + 5,
  };
}

/**
 * Generates mock company metrics (today)
 */
function generateCompanyMetricsToday(): CompanyMetrics {
  const whenJoined = generateCompanyMetrics();
  return {
    size: Math.floor(whenJoined.size * (Math.random() + 1)),
    stage: getNextStage(whenJoined.stage),
    funding: Math.floor(whenJoined.funding * (Math.random() + 1)),
  };
}

/**
 * Gets a random funding stage
 */
function getRandomStage(): string {
  const stages = ["Seed", "Series A", "Series B", "Series C", "Series D"];
  return stages[Math.floor(Math.random() * 3)]; // Bias toward earlier stages
}

/**
 * Gets the next funding stage
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

/**
 * Generates mock notable investors
 */
function generateNotableInvestors(): InvestorRound[] {
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
 * Generates mock senior leadership profiles
 */
function generateSeniorLeadership(): LeadershipProfile[] {
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