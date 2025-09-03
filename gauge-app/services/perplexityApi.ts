// services/perplexityApi.ts

import { CompanyMetrics, InvestorRound, LeadershipProfile } from "@/data/candidates";
import { getCompanyCachedData, storeCompanyData } from "./companyDataCache";

/**
 * Service for interacting with Perplexity API through our server-side API route
 * Uses Supabase caching to avoid redundant API calls
 */

/**
 * Helper function to extract valid JSON from a text that might contain other content
 * with better fallback handling
 */
function extractJsonFromText(text: string): any {
  console.log("Raw Perplexity response:", text);
  
  // If text is empty or undefined, return a default object
  if (!text) {
    console.warn("Empty text provided to JSON extractor");
    return { error: "No response data" };
  }
  
  // Try direct parsing first
  try {
    return JSON.parse(text);
  } catch (e) {
    console.log("Direct JSON parsing failed, attempting to extract JSON from text");
  }
  
  // Try to find JSON objects or arrays in the text
  try {
    // Look for JSON object pattern - the most complete object in the text
    const objectMatches = text.match(/({[\s\S]*?})/g);
    if (objectMatches && objectMatches.length > 0) {
      // Try each potential match from longest to shortest
      const sortedMatches = objectMatches.sort((a, b) => b.length - a.length);
      
      for (const match of sortedMatches) {
        try {
          return JSON.parse(match);
        } catch (e) {
          // Try next match if this one fails
          console.log(`Failed to parse match: ${match.substring(0, 30)}...`);
        }
      }
    }
    
    // Look for JSON array pattern
    const arrayMatches = text.match(/(\[[\s\S]*?\])/g);
    if (arrayMatches && arrayMatches.length > 0) {
      // Try each potential match from longest to shortest
      const sortedMatches = arrayMatches.sort((a, b) => b.length - a.length);
      
      for (const match of sortedMatches) {
        try {
          return JSON.parse(match);
        } catch (e) {
          // Try next match if this one fails
          console.log(`Failed to parse match: ${match.substring(0, 30)}...`);
        }
      }
    }
    
    // Try to eliminate common markdown formatting
    let cleanedText = text
      .replace(/```json|```/g, '')
      .replace(/^\s*\*\*/mg, '')  // Remove markdown bold markers
      .replace(/\*\*\s*$/mg, '')
      .trim();
    
    try {
      return JSON.parse(cleanedText);
    } catch (e) {
      console.log("Cleaned text parsing failed");
    }
  } catch (e) {
    console.log("JSON extraction via regex failed:", e);
  }
  
  // Last attempt - try to extract based on specific patterns
  try {
    // Remove any common prefixes and text
    let cleanedText = text
      .replace(/^Based on .*?information[^{]*/, '')
      .replace(/^Here is [^{]*/, '')
      .replace(/^According to [^{]*/, '')
      .replace(/^The [^{]*/, '')
      .replace(/```json|```/g, '')
      .trim();
    
    // Find the first { or [ and the last } or ]
    const firstBrace = Math.min(
      cleanedText.indexOf('{') >= 0 ? cleanedText.indexOf('{') : Infinity,
      cleanedText.indexOf('[') >= 0 ? cleanedText.indexOf('[') : Infinity
    );
    
    const lastBrace = Math.max(
      cleanedText.lastIndexOf('}'),
      cleanedText.lastIndexOf(']')
    );
    
    if (firstBrace < Infinity && lastBrace >= 0) {
      const jsonCandidate = cleanedText.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(jsonCandidate);
      } catch (e) {
        console.log("JSON candidate parsing failed:", jsonCandidate.substring(0, 30) + "...");
      }
    }
    
    // Try more aggressive extraction - find any {} pair
    const braceMatches = cleanedText.match(/({[^{}]*})/g);
    if (braceMatches && braceMatches.length > 0) {
      // Try parsing each match
      for (const match of braceMatches) {
        try {
          return JSON.parse(match);
        } catch (e) {
          // Continue to next match
        }
      }
    }
  } catch (e) {
    console.log("Final JSON extraction attempt failed:", e);
  }
  
  // If all extraction attempts fail, try to extract structured data manually
  console.log("All JSON extraction attempts failed. Attempting manual data extraction.");
  
  // For leadership data, try to extract name, role and background
  if (text.includes("name") && (text.includes("role") || text.includes("title")) && text.includes("background")) {
    try {
      // Extract name-role-background patterns
      const leadershipData = [];
      const lines = text.split("\n");
      
      let currentLeader: any = {};
      
      for (const line of lines) {
        const nameMatch = line.match(/(?:name|Name):\s*(.+)/i);
        const roleMatch = line.match(/(?:role|Role|title|Title|position|Position):\s*(.+)/i);
        const backgroundMatch = line.match(/(?:background|Background|experience|Experience):\s*(.+)/i);
        
        if (nameMatch) {
          // If we found a new name and already have data, save the previous leader
          if (currentLeader.name) {
            leadershipData.push({...currentLeader});
            currentLeader = {};
          }
          currentLeader.name = nameMatch[1].trim();
        }
        
        if (roleMatch && currentLeader.name) {
          currentLeader.role = roleMatch[1].trim();
        }
        
        if (backgroundMatch && currentLeader.name) {
          currentLeader.background = backgroundMatch[1].trim();
          // We have a complete leader entry, add it
          leadershipData.push({...currentLeader});
          currentLeader = {};
        }
      }
      
      // Add the last leader if complete
      if (currentLeader.name && currentLeader.role) {
        if (!currentLeader.background) currentLeader.background = "Information unavailable";
        leadershipData.push(currentLeader);
      }
      
      if (leadershipData.length > 0) {
        console.log("Successfully extracted leadership data manually:", leadershipData);
        return leadershipData;
      }
    } catch (e) {
      console.error("Manual leadership data extraction failed:", e);
    }
  }
  
  // For company metrics, try to extract size, stage, funding
  if (text.includes("size") || text.includes("employee") || text.includes("employees")) {
    try {
      const metrics: any = {};
      
      // Extract employee count
      const sizeMatch = text.match(/(?:size|employees|employee count|headcount|staff|workforce)(?:[^0-9]*?)([0-9,]+)/i);
      if (sizeMatch) {
        metrics.size = parseInt(sizeMatch[1].replace(/,/g, ''));
      }
      
      // Extract funding stage
      const stageMatch = text.match(/(?:stage|funding stage|round)(?:[^A-Za-z]*?)(?:is|at|in)?(?:[^A-Za-z]*?)(Seed|Series [A-Z]|Public|Private|Bootstrap|Angel|Growth|Late Stage|Early Stage|IPO)/i);
      if (stageMatch) {
        metrics.stage = stageMatch[1].trim();
      }
      
      // Extract funding amount
      const fundingMatch = text.match(/(?:funding|raised|investment|capital)(?:[^0-9]*?)(?:USD|\$|US\$)?(?:[^0-9]*?)([0-9.,]+)(?:[^0-9]*?)(?:million|M|USD million|USD M)/i);
      if (fundingMatch) {
        metrics.funding = parseFloat(fundingMatch[1].replace(/,/g, ''));
      }
      
      // Only return if we have at least one valid metric
      if (metrics.size || metrics.stage || metrics.funding) {
        // Fill in missing values with defaults
        if (!metrics.size) metrics.size = 0;
        if (!metrics.stage) metrics.stage = "Unknown";
        if (!metrics.funding) metrics.funding = 0;
        
        console.log("Successfully extracted company metrics manually:", metrics);
        return metrics;
      }
    } catch (e) {
      console.error("Manual metrics extraction failed:", e);
    }
  }
  
  // For investors, try to extract rounds and investors
  if (text.includes("investor") || text.includes("round") || text.includes("funding")) {
    try {
      const rounds = [];
      const roundPatterns = [
        /Seed/i,
        /Series A/i,
        /Series B/i,
        /Series C/i,
        /Series D/i,
        /Series E/i,
        /Angel/i,
        /Pre-Seed/i
      ];
      
      for (const pattern of roundPatterns) {
        const roundMatch = text.match(new RegExp(`(${pattern.source}[^:]*?):([^\\n]+)`, 'i'));
        if (roundMatch) {
          const roundName = roundMatch[1].trim();
          const investorsText = roundMatch[2].trim();
          const investorsList = investorsText
            .split(/,|and/)
            .map(inv => inv.trim())
            .filter(inv => inv.length > 0);
          
          if (investorsList.length > 0) {
            rounds.push({
              round: roundName,
              investors: investorsList
            });
          }
        }
      }
      
      if (rounds.length > 0) {
        console.log("Successfully extracted investor rounds manually:", rounds);
        return rounds;
      }
    } catch (e) {
      console.error("Manual investor extraction failed:", e);
    }
  }
  
  // If all attempts fail, provide an appropriate fallback based on the text content
  console.warn("All extraction methods failed. Providing fallback data.");
  
  if (text.toLowerCase().includes("senior") || text.toLowerCase().includes("leadership") || 
      text.toLowerCase().includes("ceo") || text.toLowerCase().includes("cto")) {
    return [{
      name: "Information extracted from unstructured data",
      role: "Leadership position",
      background: "Details unavailable - data extraction failed"
    }];
  }
  
  if (text.toLowerCase().includes("investor") || text.toLowerCase().includes("funding")) {
    return [{
      round: "Unknown Round",
      investors: ["Information unavailable - data extraction failed"]
    }];
  }
  
  if (text.toLowerCase().includes("employee") || text.toLowerCase().includes("size") ||
      text.toLowerCase().includes("funding") || text.toLowerCase().includes("stage")) {
    return {
      size: 0,
      stage: "Information unavailable - data extraction failed",
      funding: 0
    };
  }
  
  // Final fallback - extract anything that looks like structured data
  throw new Error("Could not extract valid JSON or structured data from response: " + text.substring(0, 100) + "...");
}

/**
 * Fetch company metrics when a candidate joined
 */
export async function fetchCompanyWhenJoined(
  companyName: string, 
  candidateName: string, 
  currentRole: string, 
  linkedinUrl?: string, 
  candidateId?: string
): Promise<CompanyMetrics> {
  try {
    // First check if we already have this data cached
    if (candidateId) {
      const cachedData = await getCompanyCachedData(
        companyName, 
        'companyWhenJoined', 
        candidateId, 
        currentRole
      );
      
      if (cachedData) {
        console.log(`Using cached company metrics for ${candidateName} at ${companyName}`);
        return cachedData;
      }
    }
    
    console.log(`No cache found, fetching company metrics for ${candidateName} at ${companyName} from Perplexity`);
    
    // Construct a query that will help find historical company information
    const query = `
      Find information about the company ${companyName} from when ${candidateName} likely joined as ${currentRole}.
      ${linkedinUrl ? `The candidate's LinkedIn profile is ${linkedinUrl}.` : ''}
      I need to know:
      1. The approximate number of employees at that time
      2. The funding stage the company was in (Seed, Series A, B, C, etc.)
      3. The total funding amount in millions USD the company had raised up to that point

      Return only a JSON object with these fields:
      {
        "size": [employee count as a number],
        "stage": [funding stage as a string],
        "funding": [funding amount in millions as a number]
      }
    `;
    
    const response = await fetch('/api/perplexity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query, 
        dataType: 'companyWhenJoined' 
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching company metrics: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract and parse the JSON from the AI response
    try {
      const content = data.response.choices[0].message.content;
      console.log("CompanyWhenJoined raw response:", content);
      
      // Use our helper function to extract JSON
      const parsedData = extractJsonFromText(content);
      
      const companyMetrics = {
        size: typeof parsedData.size === 'number' ? parsedData.size : parseInt(parsedData.size) || 0,
        stage: parsedData.stage || "Unknown",
        funding: typeof parsedData.funding === 'number' ? parsedData.funding : parseInt(parsedData.funding) || 0
      };
      
      // Store in cache for future use
      if (candidateId) {
        await storeCompanyData(
          companyName, 
          'companyWhenJoined', 
          companyMetrics, 
          candidateId, 
          currentRole
        );
      }
      
      return companyMetrics;
    } catch (parseError) {
      console.error("Error parsing Perplexity response for company historical data:", parseError);
      // Fallback to default values
      return {
        size: 0,
        stage: "Unknown",
        funding: 0
      };
    }
  } catch (error) {
    console.error('Error in fetchCompanyWhenJoined:', error);
    // Return default values on error
    return {
      size: 0,
      stage: "Unknown",
      funding: 0
    };
  }
}

/**
 * Fetch current company metrics
 */
export async function fetchCompanyToday(companyName: string): Promise<CompanyMetrics> {
  try {
    // First check if we already have this data cached
    const cachedData = await getCompanyCachedData(companyName, 'companyToday');
    
    if (cachedData) {
      console.log(`Using cached current company metrics for ${companyName}`);
      return cachedData;
    }
    
    console.log(`No cache found, fetching current company metrics for ${companyName} from Perplexity`);
    
    const query = `
      Find the most recent information about ${companyName}.
      I need to know:
      1. The current approximate number of employees
      2. The current funding stage (Seed, Series A, B, C, Public, etc.)
      3. The total funding amount in millions USD raised to date

      Return only a JSON object with these fields:
      {
        "size": [current employee count as a number],
        "stage": [current funding stage as a string],
        "funding": [total funding amount in millions as a number]
      }
    `;
    
    const response = await fetch('/api/perplexity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query, 
        dataType: 'companyToday' 
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching current company metrics: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract and parse the JSON from the AI response
    try {
      const content = data.response.choices[0].message.content;
      console.log("CompanyToday raw response:", content);
      
      // Use our helper function to extract JSON
      const parsedData = extractJsonFromText(content);
      
      const companyMetrics = {
        size: typeof parsedData.size === 'number' ? parsedData.size : parseInt(parsedData.size) || 0,
        stage: parsedData.stage || "Unknown",
        funding: typeof parsedData.funding === 'number' ? parsedData.funding : parseInt(parsedData.funding) || 0
      };
      
      // Store in cache for future use
      await storeCompanyData(companyName, 'companyToday', companyMetrics);
      
      return companyMetrics;
    } catch (parseError) {
      console.error("Error parsing Perplexity response for current company data:", parseError);
      // Fallback to default values
      return {
        size: 0,
        stage: "Unknown",
        funding: 0
      };
    }
  } catch (error) {
    console.error('Error in fetchCompanyToday:', error);
    // Return default values on error
    return {
      size: 0,
      stage: "Unknown",
      funding: 0
    };
  }
}

/**
 * Fetch notable investors for a company
 */
export async function fetchNotableInvestors(companyName: string): Promise<InvestorRound[]> {
  try {
    // First check if we already have this data cached
    const cachedData = await getCompanyCachedData(companyName, 'notableInvestors');
    
    if (cachedData) {
      console.log(`Using cached notable investors for ${companyName}`);
      return cachedData;
    }
    
    console.log(`No cache found, fetching notable investors for ${companyName} from Perplexity`);
    
    const query = `
      Find information about the notable investors and funding rounds for ${companyName}.
      I need to know:
      1. The funding rounds (Seed, Series A, B, C, etc.)
      2. The investors who participated in each round

      Return only a JSON array with up to 3 of the most significant funding rounds:
      [
        {
          "round": [name of funding round],
          "investors": [array of investor names who participated]
        },
        ...
      ]
    `;
    
    const response = await fetch('/api/perplexity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query, 
        dataType: 'notableInvestors' 
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching notable investors: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract and parse the JSON from the AI response
    try {
      const content = data.response.choices[0].message.content;
      console.log("NotableInvestors raw response:", content);
      
      // Use our helper function to extract JSON
      const parsedData = extractJsonFromText(content);
      
      let investors: InvestorRound[];
      
      if (Array.isArray(parsedData)) {
        investors = parsedData.map(round => ({
          round: round.round || "Unknown Round",
          investors: Array.isArray(round.investors) ? round.investors : [round.investors || "Unknown"]
        }));
      } else {
        // If we got an object instead of an array, try to convert it
        if (parsedData && typeof parsedData === 'object') {
          // Check if it has numeric keys like {0: {...}, 1: {...}}
          const keys = Object.keys(parsedData).filter(k => !isNaN(Number(k)));
          if (keys.length > 0) {
            investors = keys.map(k => ({
              round: parsedData[k].round || "Unknown Round",
              investors: Array.isArray(parsedData[k].investors) ? 
                parsedData[k].investors : [parsedData[k].investors || "Unknown"]
            }));
          }
          // If it's a single round object
          else if (parsedData.round) {
            investors = [{
              round: parsedData.round,
              investors: Array.isArray(parsedData.investors) ? 
                parsedData.investors : [parsedData.investors || "Unknown"]
            }];
          } else {
            throw new Error("Response is not an array or convertible object");
          }
        } else {
          throw new Error("Response is not an array or convertible object");
        }
      }
      
      // Store in cache for future use
      await storeCompanyData(companyName, 'notableInvestors', investors);
      
      return investors;
    } catch (parseError) {
      console.error("Error parsing Perplexity response for investors:", parseError);
      // Fallback to default values
      return [{
        round: "Unknown",
        investors: ["Information unavailable"]
      }];
    }
  } catch (error) {
    console.error('Error in fetchNotableInvestors:', error);
    // Return default values on error
    return [{
      round: "Unknown",
      investors: ["Information unavailable"]
    }];
  }
}

/**
 * Fetch senior leadership information for a company
 */
export async function fetchSeniorLeadership(companyName: string): Promise<LeadershipProfile[]> {
  try {
    // First check if we already have this data cached
    const cachedData = await getCompanyCachedData(companyName, 'seniorLeadership');
    
    if (cachedData) {
      console.log(`Using cached senior leadership for ${companyName}`);
      return cachedData;
    }
    
    console.log(`No cache found, fetching senior leadership for ${companyName} from Perplexity`);
    
    const query = `
      Find information about the current senior leadership team at ${companyName}.
      
      Return ONLY a JSON array with the following format for up to 4 key leaders (CEO, CTO, etc.):
      [
        {
          "name": "John Doe",
          "role": "CEO & Co-founder",
          "background": "Previously VP at Google"
        },
        {
          "name": "Jane Smith",
          "role": "CTO",
          "background": "Previously Engineering Director at Meta"
        }
      ]
      
      IMPORTANT: Your entire response must be ONLY the JSON array and nothing else. No explanations, no markdown, just pure, valid JSON that can be parsed with JSON.parse().
    `;
    
    const response = await fetch('/api/perplexity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query, 
        dataType: 'seniorLeadership' 
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching leadership data: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract and parse the JSON from the AI response
    try {
      const content = data.response.choices[0].message.content;
      console.log("SeniorLeadership raw response:", content);
      
      // Use our helper function to extract JSON
      const parsedData = extractJsonFromText(content);
      
      let leadership: LeadershipProfile[];
      
      if (Array.isArray(parsedData)) {
        leadership = parsedData.map(leader => ({
          name: leader.name || "Unknown",
          role: leader.role || "Unknown position",
          background: leader.background || "Information unavailable"
        }));
      } else {
        // If we got an object instead of an array, try to convert it
        if (parsedData && typeof parsedData === 'object') {
          // Check if it has numeric keys like {0: {...}, 1: {...}}
          const keys = Object.keys(parsedData).filter(k => !isNaN(Number(k)));
          if (keys.length > 0) {
            leadership = keys.map(k => ({
              name: parsedData[k].name || "Unknown",
              role: parsedData[k].role || "Unknown position",
              background: parsedData[k].background || "Information unavailable"
            }));
          }
          // If it's a single leader object
          else if (parsedData.name) {
            leadership = [{
              name: parsedData.name,
              role: parsedData.role || "Unknown position",
              background: parsedData.background || "Information unavailable"
            }];
          } else {
            throw new Error("Response is not an array or convertible object");
          }
        } else {
          throw new Error("Response is not an array or convertible object");
        }
      }
      
      // Store in cache for future use
      await storeCompanyData(companyName, 'seniorLeadership', leadership);
      
      return leadership;
    } catch (parseError) {
      console.error("Error parsing Perplexity response for leadership:", parseError);
      // Fallback to default values
      return [{
        name: "Information unavailable",
        role: "Unknown position",
        background: "Could not retrieve leadership data"
      }];
    }
  } catch (error) {
    console.error('Error in fetchSeniorLeadership:', error);
    // Return default values on error
    return [{
      name: "Information unavailable",
      role: "Unknown position",
      background: "Could not retrieve leadership data"
    }];
  }
}