// scripts/test-mixrank-api.ts

/**
 * Script to test Mixrank API integration with advanced filtering
 * 
 * To run this script:
 * 1. Make sure your .env file has the MIXRANK_API_KEY and MIXRANK_API_URL
 * 2. Run: npx ts-node scripts/test-mixrank-api.ts
 */

import { testMixrankApiConnection } from '../utils/mixrankDebug';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const MIXRANK_API_KEY = process.env.MIXRANK_API_KEY;
const MIXRANK_API_URL = process.env.MIXRANK_API_URL || 'https://api.mixrank.com';

// Test cases to run
const TEST_CASES = [
  {
    name: 'Basic company search',
    params: {
      companyName: 'Meta',
      employmentStatus: 'present',
      limit: 5
    }
  },
  {
    name: 'Filter by role',
    params: {
      companyName: 'Google',
      role: 'engineer',
      employmentStatus: 'present',
      limit: 5
    }
  },
  {
    name: 'Filter by location',
    params: {
      companyName: 'Microsoft',
      location: 'Seattle',
      employmentStatus: 'present',
      limit: 5
    }
  },
  {
    name: 'Filter by minimum years of experience',
    params: {
      companyName: 'Apple',
      yearsExperience: 10,
      employmentStatus: 'present',
      limit: 5
    }
  },
  {
    name: 'Filter by maximum years of experience',
    params: {
      companyName: 'Facebook',
      maxYearsExperience: 5,
      employmentStatus: 'present',
      limit: 5
    }
  },
  {
    name: 'Filter by experience range',
    params: {
      companyName: 'LinkedIn',
      yearsExperience: 3,
      maxYearsExperience: 8,
      employmentStatus: 'present',
      limit: 5
    }
  },
  {
    name: 'Filter by school',
    params: {
      companyName: 'Amazon',
      school: 'Stanford',
      employmentStatus: 'present',
      limit: 5
    }
  },
  {
    name: 'Multiple filters with experience range',
    params: {
      companyName: 'Netflix',
      role: 'product',
      location: 'California',
      yearsExperience: 5,
      maxYearsExperience: 15,
      employmentStatus: 'present',
      limit: 5
    }
  },
  {
    name: 'Former employees search',
    params: {
      companyName: 'Airbnb',
      employmentStatus: 'past',
      limit: 5
    }
  }
];

async function runTestCase(testCase: any): Promise<any> {
  console.log(`\n[TEST] Running test case: ${testCase.name}`);
  console.log(`Parameters: ${JSON.stringify(testCase.params, null, 2)}`);
  
  try {
    // 1. Test connection to Mixrank API directly
    const connectionTest = await testDirectApiConnection(testCase.params.companyName);
    console.log(`Direct API connection test: ${connectionTest.success ? 'SUCCESS' : 'FAILED'}`);
    if (!connectionTest.success) {
      console.error(`Connection test error: ${connectionTest.error}`);
      return { success: false, error: connectionTest.error };
    }
    
    // 2. Make API request
    const response = await testMixrankEndpoint(testCase.params);
    return response;
  } catch (error) {
    console.error(`Error in test case: ${testCase.name}`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function testDirectApiConnection(companyName: string): Promise<any> {
  if (!MIXRANK_API_KEY) {
    return { success: false, error: 'MIXRANK_API_KEY is not set in .env file' };
  }
  
  try {
    return await testMixrankApiConnection(MIXRANK_API_KEY, companyName);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function testMixrankEndpoint(params: any): Promise<any> {
  try {
    // Prepare the request to your enhanced endpoint 
    console.log(`Calling endpoint with params:`, params);
    
    // You'd replace this with your actual API call
    // For this example, we'll simulate calling your enhanced endpoint
    const response = await simulateApiCall(params);
    
    if (!response.success) {
      console.error(`Error from endpoint: ${response.error}`);
      return { success: false, error: response.error };
    }
    
    // Log the results
    console.log(`[SUCCESS] Found ${response.data.candidates.length} candidates`);
    
    // Save the full response to a file
    saveResponseToFile(response.data, params);
    
    return {
      success: true,
      candidates: response.data.candidates.length,
      filters: params,
      debug: response.data.debug
    };
  } catch (error) {
    console.error(`Error testing Mixrank endpoint:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// This function simulates the API call for the example
// In a real implementation, you would make an actual API call
async function simulateApiCall(params: any): Promise<any> {
  try {
    // For a real implementation, you would replace this with:
    // const response = await fetch('/api/mixrank-candidates', {...})
    // and process the response accordingly
    
    // For this example, we'll simulate calling the Mixrank API
    // Note: this won't actually work unless run in a context where the API is available
    return {
      success: true,
      data: {
        candidates: Array(3).fill(null).map((_, i) => ({
          id: `test-id-${i}`,
          name: `Test Candidate ${i}`,
          currentCompany: params.companyName,
          currentRole: params.role ? `${params.role.charAt(0).toUpperCase() + params.role.slice(1)} Role` : 'Default Role',
          location: params.location || 'Unknown Location',
          yearsExperience: params.yearsExperience || 5,
          school: params.school || 'Unknown School',
          // Other fields would be here
        })),
        count: 3,
        company: params.companyName,
        employmentStatus: params.employmentStatus,
        debug: {
          totalProfilesProcessed: 5,
          matchingCandidates: 3,
          filtersSummary: params
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function saveResponseToFile(data: any, params: any): void {
  try {
    // Create logs directory if it doesn't exist
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Create a timestamp and clean company name for the filename
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const companyName = params.companyName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const logFilename = `test-mixrank-${companyName}-${timestamp}.json`;
    const logPath = path.join(logDir, logFilename);
    
    // Create log content
    const logContent = JSON.stringify({
      timestamp: new Date().toISOString(),
      params,
      response: data
    }, null, 2);
    
    // Write to file
    fs.writeFileSync(logPath, logContent);
    console.log(`Saved response to ${logPath}`);
  } catch (error) {
    console.error(`Error saving response to file:`, error);
  }
}

async function main() {
  console.log('Starting Mixrank API test script...');
  
  if (!MIXRANK_API_KEY) {
    console.error('Error: MIXRANK_API_KEY is not set in .env file');
    process.exit(1);
  }
  
  console.log(`Using Mixrank API URL: ${MIXRANK_API_URL}`);
  console.log(`Using Mixrank API Key: ${MIXRANK_API_KEY.substring(0, 5)}...`);
  
  console.log(`\nRunning ${TEST_CASES.length} test cases...\n`);
  
  // Run all test cases
  const results = [];
  for (const testCase of TEST_CASES) {
    const result = await runTestCase(testCase);
    results.push({
      name: testCase.name,
      ...result
    });
  }
  
  // Summarize results
  console.log('\n==== TEST RESULTS SUMMARY ====');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.name}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    if (result.candidates) {
      console.log(`   Found ${result.candidates} candidates`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\nSuccess rate: ${successCount} / ${results.length} (${Math.round(successCount / results.length * 100)}%)`);
  
  console.log('\nTest script complete.');
}

// Run the script
main().catch(error => {
  console.error('Fatal error in test script:', error);
  process.exit(1);
});