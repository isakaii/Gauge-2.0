// utils/mixrankDebug.ts

/**
 * Utilities for testing and debugging Mixrank API integration
 */

import fs from 'fs';
import path from 'path';

/**
 * Logs a Mixrank API response to a file for later analysis
 * 
 * @param operation - Name of the operation being performed
 * @param response - The API response to log
 * @param params - The parameters that were used for the request
 */
export function logMixrankResponse(operation: string, response: any, params?: any): void {
  // Only run in development or test environments
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    return;
  }
  
  try {
    // Create directory if it doesn't exist
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Create a timestamp for the filename
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const logFilename = `mixrank-${operation}-${timestamp}.json`;
    const logPath = path.join(logDir, logFilename);
    
    // Create log content
    const logContent = JSON.stringify({
      timestamp: new Date().toISOString(),
      operation,
      params,
      response
    }, null, 2);
    
    // Write to file
    fs.writeFileSync(logPath, logContent);
    console.log(`[DEBUG] Logged Mixrank ${operation} response to ${logPath}`);
  } catch (error) {
    console.error(`Error logging Mixrank response:`, error);
  }
}

/**
 * Analyzes Mixrank data to extract meaningful information for debugging
 * 
 * @param data - The data to analyze
 * @returns Analysis of the data
 */
export function analyzeMixrankData(data: any): Record<string, any> {
  if (!data) return { valid: false, message: 'No data provided' };
  
  try {
    const analysis: Record<string, any> = {
      valid: true,
      dataType: typeof data,
    };
    
    if (typeof data === 'object') {
      if (Array.isArray(data)) {
        analysis.type = 'array';
        analysis.length = data.length;
        analysis.sampleItems = data.slice(0, 3);
      } else {
        analysis.type = 'object';
        analysis.keys = Object.keys(data);
        analysis.hasResults = 'results' in data;
        
        if (analysis.hasResults && Array.isArray(data.results)) {
          analysis.resultsCount = data.results.length;
        }
      }
    }
    
    return analysis;
  } catch (error) {
    return { 
      valid: false, 
      message: 'Error analyzing data',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Validates profile data from Mixrank API
 * 
 * @param profile - The profile data to validate
 * @returns Validation result
 */
export function validateProfileData(profile: any): Record<string, any> {
  if (!profile) return { valid: false, message: 'No profile data provided' };
  
  try {
    const validation: Record<string, any> = {
      valid: true,
      issues: [],
    };
    
    // Check for essential fields
    if (!profile.linkedin) {
      validation.issues.push('Missing LinkedIn data');
    } else {
      // Check LinkedIn sub-fields
      if (!profile.linkedin.name) validation.issues.push('Missing LinkedIn name');
      if (!profile.linkedin.url) validation.issues.push('Missing LinkedIn URL');
      
      // Check positions
      if (!profile.linkedin.positions) {
        validation.issues.push('Missing LinkedIn positions');
      } else if (!Array.isArray(profile.linkedin.positions)) {
        validation.issues.push('LinkedIn positions is not an array');
      } else {
        validation.positionsCount = profile.linkedin.positions.length;
        
        // Check if any positions have is_current=true
        const currentPositions = profile.linkedin.positions.filter(
          (pos: any) => pos && pos.is_current === true
        );
        validation.hasCurrentPosition = currentPositions.length > 0;
        
        // Check start date availability for years calculation
        const positionsWithStartDate = profile.linkedin.positions.filter(
          (pos: any) => pos && pos.start_date_year && typeof pos.start_date_year === 'number'
        );
        validation.positionsWithStartDate = positionsWithStartDate.length;
      }
      
      // Check education
      if (!profile.linkedin.education) {
        validation.issues.push('Missing LinkedIn education');
      } else if (!Array.isArray(profile.linkedin.education)) {
        validation.issues.push('LinkedIn education is not an array');
      } else {
        validation.educationCount = profile.linkedin.education.length;
        
        // Check school name availability
        const educationsWithSchool = profile.linkedin.education.filter(
          (edu: any) => edu && edu.school_name
        );
        validation.educationsWithSchool = educationsWithSchool.length;
      }
      
      // Check location
      if (!profile.linkedin.location) {
        validation.issues.push('Missing LinkedIn location');
      } else {
        validation.hasLocationText = Boolean(profile.linkedin.location.text);
      }
    }
    
    validation.valid = validation.issues.length === 0;
    return validation;
  } catch (error) {
    return { 
      valid: false, 
      message: 'Error validating profile data',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * A test function that can be run to verify the API connections
 * 
 * @param apiKey - The Mixrank API key
 * @param companyName - The company to search for
 * @returns Test results
 */
export async function testMixrankApiConnection(apiKey: string, companyName: string): Promise<Record<string, any>> {
  const MIXRANK_API_URL = "https://api.mixrank.com";
  
  try {
    const result: Record<string, any> = {
      success: true,
      steps: []
    };
    
    // Step 1: Test feature ID endpoint
    const featureUrl = `${MIXRANK_API_URL}/v2/json/${apiKey}/segment-features/persons?type=company&search=${encodeURIComponent(companyName)}`;
    const featureResponse = await fetch(featureUrl);
    
    if (!featureResponse.ok) {
      return {
        success: false,
        error: `Feature endpoint failed with status ${featureResponse.status}`,
        response: await featureResponse.text()
      };
    }
    
    const featureData = await featureResponse.json();
    result.steps.push({
      name: 'Get Feature IDs',
      success: true,
      status: featureResponse.status,
      analysis: analyzeMixrankData(featureData)
    });
    
    // Check for valid feature data
    if (!featureData.results || !Array.isArray(featureData.results) || featureData.results.length === 0) {
      return {
        success: false,
        error: 'No feature IDs found for company',
        data: featureData
      };
    }
    
    // Get the present employees feature
    const feature = featureData.results.find((result: any) => result.mod === 'present');
    if (!feature) {
      return {
        success: false,
        error: 'No present employees feature found',
        data: featureData.results
      };
    }
    
    // Step 2: Test person IDs endpoint with the feature ID
    const personUrl = `${MIXRANK_API_URL}/v2/json/${apiKey}/person/segment-preview?query=${feature.id}&limit=2`;
    const personResponse = await fetch(personUrl);
    
    if (!personResponse.ok) {
      return {
        success: false,
        error: `Person endpoint failed with status ${personResponse.status}`,
        response: await personResponse.text()
      };
    }
    
    const personData = await personResponse.json();
    result.steps.push({
      name: 'Get Person IDs',
      success: true,
      status: personResponse.status,
      analysis: analyzeMixrankData(personData)
    });
    
    // Check for valid person data
    if (!personData.results || !Array.isArray(personData.results) || personData.results.length === 0) {
      return {
        success: false,
        error: 'No person IDs found',
        data: personData
      };
    }
    
    // Step 3: Test profile endpoint with one person ID
    const personId = personData.results[0];
    const profileUrl = `${MIXRANK_API_URL}/v2/json/${apiKey}/person/${personId}`;
    const profileResponse = await fetch(profileUrl);
    
    if (!profileResponse.ok) {
      return {
        success: false,
        error: `Profile endpoint failed with status ${profileResponse.status}`,
        response: await profileResponse.text()
      };
    }
    
    const profileData = await profileResponse.json();
    result.steps.push({
      name: 'Get Profile',
      success: true,
      status: profileResponse.status,
      analysis: analyzeMixrankData(profileData),
      validation: validateProfileData(profileData)
    });
    
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}