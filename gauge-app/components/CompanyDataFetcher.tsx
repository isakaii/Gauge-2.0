// components/CompanyDataFetcher.tsx

"use client"

import { useState, useEffect } from "react";
import { CandidateData, CompanyMetrics, InvestorRound, LeadershipProfile } from "@/data/candidates";
import { fetchCompanyWhenJoined, fetchCompanyToday, fetchNotableInvestors, fetchSeniorLeadership } from "@/services/perplexityApi";
import { getCompanyCachedData } from "@/services/companyDataCache";
import { Loader2, RefreshCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface CompanyDataFetcherProps {
  candidate: CandidateData;
  onDataLoaded: (data: {
    companyWhenJoined: CompanyMetrics;
    companyToday: CompanyMetrics;
    notableInvestors: InvestorRound[];
    seniorLeadership: LeadershipProfile[];
  }) => void;
}

export function CompanyDataFetcher({ candidate, onDataLoaded }: CompanyDataFetcherProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState(false);
  const [dataSource, setDataSource] = useState<'cache' | 'api' | null>(null);

  const fetchAllCompanyData = async () => {
    setLoading(true);
    setError(null);
    setDataSource(null);
    
    try {
      console.log(`Fetching real company data for ${candidate.name} at ${candidate.currentCompany}`);
      
      // First check if we have cached data for all components
      const cachedWhenJoined = await getCompanyCachedData(
        candidate.currentCompany, 
        'companyWhenJoined', 
        candidate.id, 
        candidate.currentRole
      );
      
      const cachedToday = await getCompanyCachedData(
        candidate.currentCompany, 
        'companyToday'
      );
      
      const cachedInvestors = await getCompanyCachedData(
        candidate.currentCompany, 
        'notableInvestors'
      );
      
      const cachedLeadership = await getCompanyCachedData(
        candidate.currentCompany, 
        'seniorLeadership'
      );
      
      // If we have all data cached
      if (cachedWhenJoined && cachedToday && cachedInvestors && cachedLeadership) {
        console.log("Using cached data for all company information");
        setDataSource('cache');
        
        // Use all cached data
        onDataLoaded({
          companyWhenJoined: cachedWhenJoined,
          companyToday: cachedToday,
          notableInvestors: cachedInvestors,
          seniorLeadership: cachedLeadership
        });
        
        setDataFetched(true);
        setLoading(false);
        return;
      }
      
      // If we don't have all data cached, fetch from API
      setDataSource('api');
      
      // First attempt to fetch each data type individually with fallbacks
      let companyWhenJoined, companyToday, notableInvestors, seniorLeadership;
      let fetchErrors = [];
      
      try {
        companyWhenJoined = await fetchCompanyWhenJoined(
          candidate.currentCompany, 
          candidate.name, 
          candidate.currentRole, 
          candidate.linkedinUrl,
          candidate.id
        );
      } catch (err) {
        console.error("Error fetching company history:", err);
        fetchErrors.push("history");
        // Use fallback data
        companyWhenJoined = {
          size: 0,
          stage: "Unknown",
          funding: 0
        };
      }
      
      try {
        companyToday = await fetchCompanyToday(candidate.currentCompany);
      } catch (err) {
        console.error("Error fetching current company data:", err);
        fetchErrors.push("current");
        // Use fallback data
        companyToday = {
          size: 0,
          stage: "Unknown",
          funding: 0
        };
      }
      
      try {
        notableInvestors = await fetchNotableInvestors(candidate.currentCompany);
      } catch (err) {
        console.error("Error fetching investors:", err);
        fetchErrors.push("investors");
        // Use fallback data
        notableInvestors = [{
          round: "Unknown",
          investors: ["Information unavailable"]
        }];
      }
      
      try {
        seniorLeadership = await fetchSeniorLeadership(candidate.currentCompany);
      } catch (err) {
        console.error("Error fetching leadership:", err);
        fetchErrors.push("leadership");
        // Use fallback data
        seniorLeadership = [{
          name: "Information unavailable",
          role: "Unknown position",
          background: "Could not retrieve leadership data"
        }];
      }
      
      // Display a warning if any fetch operations failed
      if (fetchErrors.length > 0) {
        const errorTypes = fetchErrors.join(", ");
        console.warn(`Some company data could not be fetched: ${errorTypes}`);
        setError(`Some company data (${errorTypes}) couldn't be fetched completely. Using partial real data.`);
      }
      
      // Update the data even if some parts are fallbacks
      onDataLoaded({
        companyWhenJoined,
        companyToday,
        notableInvestors,
        seniorLeadership
      });
      
      setDataFetched(true);
    } catch (err) {
      console.error("Fatal error fetching company data:", err);
      setError("Failed to load real company information. Using estimated data instead.");
    } finally {
      setLoading(false);
    }
  };

  // Only auto-fetch data if we haven't fetched it before
  useEffect(() => {
    if (!dataFetched && !loading) {
      fetchAllCompanyData();
    }
  }, [candidate.id]); // Only re-run when the candidate changes

  if (loading) {
    return (
      <div className="text-center py-4 my-2 bg-gray-50 rounded-md">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-600">Fetching real company data...</p>
        <p className="text-xs text-gray-500 mt-1">This may take a moment as we search for accurate information</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="default" className="mb-4">
        <AlertDescription className="flex justify-between items-center">
          <span>{error}</span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={fetchAllCompanyData}
            disabled={loading}
            className="ml-2"
          >
            <RefreshCcw className="h-4 w-4 mr-1" /> Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (dataFetched) {
    return (
      <div className={`px-3 py-2 rounded-md text-sm mb-4 ${
        dataSource === 'cache' 
          ? 'bg-blue-50 text-blue-800' 
          : 'bg-green-50 text-green-800'
      }`}>
        <span className="font-medium">Using real company data</span>
        <span className="text-xs ml-2">
          {dataSource === 'cache' 
            ? 'Retrieved from cache' 
            : 'Powered by Perplexity'}
        </span>
      </div>
    );
  }

  return null;
}