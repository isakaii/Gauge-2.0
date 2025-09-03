// components/AdvancedSearch.tsx

"use client"

import { useState } from "react"
import { Loader2, Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CandidateData } from "@/data/candidates"
import { ExperienceFilterBadge } from "./ExperienceFilterBadge"

interface AdvancedSearchProps {
  onCandidatesFound: (candidates: CandidateData[], filters: any) => void;
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
}

export function AdvancedSearch({ onCandidatesFound, isSearching, setIsSearching }: AdvancedSearchProps) {
  // Dialog state
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  
  // Form state
  const [companyName, setCompanyName] = useState("");
  const [yearsExperience, setYearsExperience] = useState<string>("");
  const [maxYearsExperience, setMaxYearsExperience] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [schoolFilter, setSchoolFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [employmentStatus, setEmploymentStatus] = useState("present");
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any | null>(null);

  // Reset the form
  const resetForm = () => {
    setCompanyName("");
    setYearsExperience("");
    setMaxYearsExperience("");
    setLocationFilter("");
    setSchoolFilter("");
    setRoleFilter("");
    setEmploymentStatus("present");
    setError(null);
    setSearchResults(null);
  };

  // Close the dialog and reset the form
  const handleCancel = () => {
    setShowSearchDialog(false);
    resetForm();
  };

  // Determine if the search button should be enabled
  const isSearchEnabled = () => {
    return !isSearching && companyName.trim().length > 0;
  };

  // Perform the search
  const handleSearch = async () => {
    if (!companyName.trim()) {
      setError("Company name is required");
      return;
    }

    // Validate experience range if both values are provided
    if (yearsExperience && maxYearsExperience && 
        Number(maxYearsExperience) < Number(yearsExperience)) {
      setError("Maximum years should be greater than minimum years");
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResults(null);

    try {
      const searchParams: any = {
        companyName: companyName.trim(),
        employmentStatus,
        limit: 50 // Increased search limit
      };

      // Only add filters if they have values
      if (yearsExperience) {
        searchParams.yearsExperience = parseInt(yearsExperience);
      }
      
      if (maxYearsExperience) {
        searchParams.maxYearsExperience = parseInt(maxYearsExperience);
      }
      
      if (locationFilter) {
        searchParams.location = locationFilter.trim();
      }
      
      if (schoolFilter) {
        searchParams.school = schoolFilter.trim();
      }
      
      if (roleFilter) {
        searchParams.role = roleFilter.trim();
      }

      console.log("Searching with params:", searchParams);

      // Call our enhanced Mixrank API endpoint
      const response = await fetch('/api/mixrank-candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });

      // Handle errors
      if (!response.ok) {
        let errorMessage = "Error searching candidates";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error("API error:", errorData);
          setError(errorMessage);
        } catch (e) {
          console.error("Error parsing error response:", e);
          setError(errorMessage);
        }
        setIsSearching(false);
        return;
      }

      // Process successful response
      const data = await response.json();
      console.log("Search results:", data);
      setSearchResults(data);

      // Check if we have any candidates
      if (!data.candidates || data.candidates.length === 0) {
        setError("No candidates found matching your criteria");
        setIsSearching(false);
        return;
      }

      // Successfully found candidates
      onCandidatesFound(data.candidates, {
        companyName: companyName.trim(),
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : undefined,
        maxYearsExperience: maxYearsExperience ? parseInt(maxYearsExperience) : undefined,
        location: locationFilter.trim(),
        school: schoolFilter.trim(),
        role: roleFilter.trim(),
        employmentStatus
      });

      // Close the dialog and reset
      setShowSearchDialog(false);
      resetForm();
    } catch (error) {
      console.error("Search error:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsSearching(false);
    }
  };

  // Create summary of active filters for display
  const getActiveFilters = () => {
    const filters = [];
    
    if (companyName) filters.push(`Company: ${companyName}`);
    if (roleFilter) filters.push(`Role: ${roleFilter}`);
    if (locationFilter) filters.push(`Location: ${locationFilter}`);
    
    // Handle years of experience range
    if (yearsExperience && maxYearsExperience) {
      filters.push(`Experience: ${yearsExperience}-${maxYearsExperience} years`);
    } else if (yearsExperience) {
      filters.push(`Experience: ${yearsExperience}+ years`);
    } else if (maxYearsExperience) {
      filters.push(`Experience: 0-${maxYearsExperience} years`);
    }
    
    if (schoolFilter) filters.push(`School: ${schoolFilter}`);
    
    return filters;
  };

  return (
    <>
      <Button onClick={() => setShowSearchDialog(true)}>
        <Plus className="h-4 w-4 mr-2" /> Advanced Search
      </Button>

      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Advanced Candidate Search</DialogTitle>
            <DialogDescription>
              Enter your search criteria to find matching candidates
            </DialogDescription>
            <div className="text-xs text-gray-500 mt-1">
              Search will first look in our local database of 10k profiles before calling external APIs
            </div>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="companyName" className="text-sm font-medium">
                Company Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Microsoft, Google, Amazon"
                disabled={isSearching}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="role" className="text-sm font-medium">
                Role
              </label>
              <Input
                id="role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                placeholder="e.g. Software Engineer, Product Manager"
                disabled={isSearching}
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="location" className="text-sm font-medium">
                Location
              </label>
              <Input
                id="location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="e.g. San Francisco, New York"
                disabled={isSearching}
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                Years of Experience Range
              </label>
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <label htmlFor="yearsExperience" className="text-xs text-gray-500 mb-1 block">
                    Minimum
                  </label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    placeholder="e.g. 5"
                    min="0"
                    max="50"
                    disabled={isSearching}
                  />
                </div>
                <span className="mt-5">-</span>
                <div className="flex-1">
                  <label htmlFor="maxYearsExperience" className="text-xs text-gray-500 mb-1 block">
                    Maximum
                  </label>
                  <Input
                    id="maxYearsExperience"
                    type="number"
                    value={maxYearsExperience}
                    onChange={(e) => setMaxYearsExperience(e.target.value)}
                    placeholder="e.g. 15"
                    min="0"
                    max="50"
                    disabled={isSearching}
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Set a range to find candidates with a specific experience level. Leave empty for no restriction.
              </div>
              {maxYearsExperience && yearsExperience && Number(maxYearsExperience) < Number(yearsExperience) && (
                <div className="text-xs text-red-500 mt-1">
                  Maximum years should be greater than minimum years
                </div>
              )}
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="school" className="text-sm font-medium">
                School
              </label>
              <Input
                id="school"
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                placeholder="e.g. Stanford, MIT"
                disabled={isSearching}
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="employmentStatus" className="text-sm font-medium">
                Employment Status
              </label>
              <select
                id="employmentStatus"
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value)}
                className="w-full py-2 px-3 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
                disabled={isSearching}
              >
                <option value="present">Currently working at company</option>
                <option value="past">Previously worked at company</option>
                <option value="ever">Has ever worked at company</option>
              </select>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {searchResults && (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm font-medium">Search Results</div>
              <div className="text-sm">Found {searchResults.count} candidates matching your criteria</div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isSearching}>
              Cancel
            </Button>
            <Button 
              onClick={handleSearch} 
              disabled={!isSearchEnabled() || (
                maxYearsExperience !== "" && 
                yearsExperience !== "" && 
                Number(maxYearsExperience) < Number(yearsExperience)
              )}
            >
              {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active filters display */}
      {getActiveFilters().length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          <div className="text-sm text-gray-500 flex items-center">Active filters:</div>
          <div className="flex flex-wrap gap-2">
            {companyName && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 flex items-center gap-1">
                Company: {companyName}
                <button className="ml-1 hover:bg-blue-100 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {roleFilter && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 flex items-center gap-1">
                Role: {roleFilter}
                <button className="ml-1 hover:bg-purple-100 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {locationFilter && (
              <Badge variant="outline" className="bg-green-50 text-green-700 flex items-center gap-1">
                Location: {locationFilter}
                <button className="ml-1 hover:bg-green-100 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {/* Experience filter badge */}
            {(yearsExperience || maxYearsExperience) && (
              <ExperienceFilterBadge 
                minYears={yearsExperience ? Number(yearsExperience) : undefined}
                maxYears={maxYearsExperience ? Number(maxYearsExperience) : undefined}
              />
            )}
            
            {schoolFilter && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 flex items-center gap-1">
                School: {schoolFilter}
                <button className="ml-1 hover:bg-amber-100 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
          
          <Button variant="ghost" size="sm" className="text-xs h-6">
            Clear all filters
          </Button>
        </div>
      )}
    </>
  );
}