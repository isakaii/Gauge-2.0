// app/people/page.tsx

"use client"

import { useState, useEffect } from "react"
import { ArrowDown, ArrowUp, ChevronDown, ExternalLink, Loader2, Plus, Search, SlidersHorizontal, X, Copy, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { companyData } from "@/data/companies"
import { CandidateData } from "@/data/candidates"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Sidebar } from "@/components/sidebar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/supabaseClient"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CompanyDataFetcher } from "@/components/CompanyDataFetcher"

export default function PeoplePage() {
  const [selectedFilter, setSelectedFilter] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [showCompanySelector, setShowCompanySelector] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null)
  
  // State for company search and candidate loading
  const [candidates, setCandidates] = useState<CandidateData[]>([])
  const [loading, setLoading] = useState(false)
  const [showSearchCompanyDialog, setShowSearchCompanyDialog] = useState(false)
  const [companySearchInput, setCompanySearchInput] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Employment status filter (existing)
  const [employmentStatus, setEmploymentStatus] = useState("present")
  
  // Advanced filters
  const [yearsExperience, setYearsExperience] = useState<string>("")
  const [maxYearsExperience, setMaxYearsExperience] = useState<string>("")
  const [locationFilter, setLocationFilter] = useState<string>("")
  const [schoolFilter, setSchoolFilter] = useState<string>("")
  const [roleFilter, setRoleFilter] = useState<string>("")
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  // Check for companies from the companies page
  useEffect(() => {
    const checkForSelectedCompanies = () => {
      const companiesFromNavigation = localStorage.getItem('selectedCompaniesToSearch')
      
      if (companiesFromNavigation) {
        try {
          const companies = JSON.parse(companiesFromNavigation)
          
          if (Array.isArray(companies) && companies.length > 0) {
            setSelectedCompanies(companies)
            
            setCompanySearchInput(companies.join(", "))
            
            setShowSearchCompanyDialog(true)
            
            localStorage.removeItem('selectedCompaniesToSearch')
          }
        } catch (error) {
          console.error('Error parsing selected companies from localStorage:', error)
        }
      }
    }
    
    // Check for companies after a short delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      checkForSelectedCompanies()
    }, 500)
    
    return () => clearTimeout(timer)
  }, []) // Empty dependency array ensures this runs only once on component mount

  // Load existing candidates from Supabase on initial mount
  useEffect(() => {
    const fetchCandidatesFromSupabase = async () => {
      setLoading(true)
      try {
        // Check if Supabase client is properly initialized
        if (!supabase || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.warn('Supabase client not properly initialized. Using empty candidates list.')
          setLoading(false)
          return
        }

        // Check if table exists by making a minimal query
        try {
          const { data: tableCheck, error: tableCheckError } = await supabase
            .from('candidates')
            .select('id')
            .limit(1)
          
          if (tableCheckError) {
            console.warn('Candidates table may not exist:', tableCheckError.message)
            setLoading(false)
            return
          }
        } catch (tableCheckErr) {
          console.warn('Error checking table existence:', tableCheckErr)
          setLoading(false)
          return
        }

        // If we get here, the table exists, so fetch the data
        const { data, error } = await supabase
          .from('candidates')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
        
        if (error) {
          console.error('Error fetching candidates from Supabase:', error)
          // Continue with empty candidates list instead of showing error
          console.log('Continuing with empty candidates list')
        } else if (data && data.length > 0) {
          // Map Supabase data to our application's data model
          const formattedCandidates = data.map(item => ({
            id: item.id.toString(),
            name: item.name || "Unknown Name",
            currentCompany: item.company || "Unknown Company",
            linkedinUrl: item.linkedin_url || "",
            currentRole: item.role || "Unknown Role",
            location: item.location || "Unknown Location",
            yearsExperience: item.years_experience || 0,
            school: item.school || "Unknown",
            priorExperience: item.prior_experience || "No prior experience",
            // Generate mock data for these fields since they're not stored in Supabase
            companyWhenJoined: {
              size: Math.floor(Math.random() * 100) + 20,
              stage: ["Seed", "Series A", "Series B"][Math.floor(Math.random() * 3)],
              funding: Math.floor(Math.random() * 30) + 5,
            },
            companyToday: {
              size: Math.floor(Math.random() * 300) + 50,
              stage: ["Series A", "Series B", "Series C"][Math.floor(Math.random() * 3)],
              funding: Math.floor(Math.random() * 100) + 20,
            },
            notableInvestors: [
              {
                round: "Seed",
                investors: ["Y Combinator", "Andreessen Horowitz"]
              },
              {
                round: "Series A",
                investors: ["Sequoia Capital", "Accel"]
              }
            ],
            seniorLeadership: [
              {
                name: "John Smith",
                role: "CEO & Co-founder",
                background: "Previously VP at Google"
              },
              {
                name: "Jane Doe",
                role: "CTO & Co-founder",
                background: "Previously Tech Lead at Meta"
              }
            ]
          }))
          
          setCandidates(formattedCandidates)
        }
      } catch (err) {
        console.error('Error in fetchCandidatesFromSupabase:', err)
        // Continue with empty candidates list instead of showing error
        console.log('Continuing with empty candidates list due to error')
      } finally {
        setLoading(false)
      }
    }
    
    fetchCandidatesFromSupabase()
  }, [])

  // Update search function to use the advanced candidates endpoint
  const searchCandidatesByCompany = async () => {
    if (selectedCompanies.length === 0 && !yearsExperience && !maxYearsExperience && !locationFilter && !schoolFilter && !roleFilter) {
      setError("Please enter at least one search criteria");
      return;
    }
    
    // Validate experience range if both values are provided
    if (yearsExperience && maxYearsExperience && 
        Number(maxYearsExperience) < Number(yearsExperience)) {
      setError("Maximum years should be greater than minimum years");
      return;
    }
    
    setLoading(true);
    setError(null); // Clear any existing errors
    
    try {
      // Define a proper interface for our search params
      interface SearchParams {
        companyNames: string[]; // Change to an array
        employmentStatus: string;
        minCandidates: number;
        yearsExperience?: number;
        maxYearsExperience?: number;
        location?: string;
        school?: string;
        role?: string;
      }
      
      // Build search params with advanced filters
      const searchParams: SearchParams = {
        companyNames: selectedCompanies, // Pass the array of company names
        employmentStatus,
        minCandidates: 50 // Get up to 50 candidates
      };
      
      // Only add filters if they have values
      if (yearsExperience) {
        searchParams.yearsExperience = parseInt(yearsExperience);
      }
      
      if (maxYearsExperience) {
        searchParams.maxYearsExperience = parseInt(maxYearsExperience);
      }
      
      if (locationFilter) {
        searchParams.location = locationFilter;
      }
      
      if (schoolFilter) {
        searchParams.school = schoolFilter;
      }
      
      if (roleFilter) {
        searchParams.role = roleFilter;
      }
      
      // Call the advanced candidates API
      const response = await fetch('/api/advanced-candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchParams),
      });
      
      // Try to handle the response, but don't display errors to the user
      let data = { candidates: [] };
      
      try {
        if (response.ok) {
          data = await response.json();
        } else {
          // Log the error but don't show to user
          const errorText = await response.text();
          console.error("API Error:", errorText);
        }
      } catch (parseError) {
        // Log parsing errors but don't show to user
        console.error("Error parsing response:", parseError);
      }
      
      // Only show an error if no candidates were found after a successful request
      if ((!data.candidates || data.candidates.length === 0) && response.ok) {
        setError("No candidates found matching your criteria");
        setShowSearchCompanyDialog(false);
        resetSearchForm();
        setLoading(false);
        return;
      }
      
      // If we have candidates, process them
      if (data.candidates && data.candidates.length > 0) {
        // Add the new candidates to the existing list
        setCandidates(prevCandidates => {
          // Filter out duplicates by ID
          const existingIds = new Set(prevCandidates.map(c => c.id));
          const newCandidates = data.candidates.filter((c: CandidateData) => !existingIds.has(c.id));
          
          // Add unique company names to the selected companies filter if specified
          if (companySearchInput) {
            // Create a Set to deduplicate companies
            setSelectedCompanies(prev => {
              // Only add if it doesn't already exist
              if (!prev.includes(companySearchInput)) {
                return [...prev, companySearchInput];
              }
              return prev;
            });
          }
          
          // Also add any other unique companies from the results
          const companies = data.candidates
            .map((c: CandidateData) => c.currentCompany)
            .filter(Boolean);
            
          if (companies.length > 0) {
            setSelectedCompanies(prev => {
              const uniqueCompanies = [...new Set([...prev, ...companies])];
              return uniqueCompanies;
            });
          }
          
          // Update active filters display
          updateActiveFilters();
          
          return [...newCandidates, ...prevCandidates];
        });
      }
      
      // Always close the dialog on completion, regardless of result
      setShowSearchCompanyDialog(false);
      resetSearchForm();
      
    } catch (error: any) {
      // Log the error but don't show it to the user
      console.error("Error searching candidates:", error);
      // Just close the dialog instead of showing an error
      setShowSearchCompanyDialog(false);
      resetSearchForm();
    } finally {
      setLoading(false);
    }
  };

  // Helper to update active filters display
  const updateActiveFilters = () => {
    const filters = [];
    
    if (selectedCompanies.length > 0) {
      selectedCompanies.forEach(company => {
        filters.push(`Company: ${company}`);
      });
    }
    
    if (roleFilter) filters.push(`Role: ${roleFilter}`);
    if (locationFilter) filters.push(`Location: ${locationFilter}`);
    
    // Handle years of experience range
    if (yearsExperience && maxYearsExperience) {
      filters.push(`Experience: ${yearsExperience}-${maxYearsExperience} years`);
    } else if (yearsExperience) {
      filters.push(`Experience: ${yearsExperience}+ years`);
    } else if (maxYearsExperience) {
      filters.push(`Experience: Up to ${maxYearsExperience} years`);
    }
    
    if (schoolFilter) filters.push(`School: ${schoolFilter}`);
    
    setActiveFilters(filters);
  };

  // Reset search form
  const resetSearchForm = () => {
    setCompanySearchInput("");
    setRoleFilter("");
    setLocationFilter("");
    setYearsExperience("");
    setMaxYearsExperience("");
    setSchoolFilter("");
  };

  // Filter candidates based on selected companies and search query
  const filteredCandidates = candidates.filter(
    (candidate) => {
      // First ensure all necessary properties exist and are strings
      const candidateName = typeof candidate.name === 'string' ? candidate.name.toLowerCase() : '';
      const candidateCompany = typeof candidate.currentCompany === 'string' ? candidate.currentCompany.toLowerCase() : '';
      const candidateRole = typeof candidate.currentRole === 'string' ? candidate.currentRole.toLowerCase() : '';
      const candidateLocation = typeof candidate.location === 'string' ? candidate.location.toLowerCase() : '';
      
      // Make sure search query is a string
      const query = typeof searchQuery === 'string' ? searchQuery.toLowerCase() : '';
      
      // Now do the filtering
      return (selectedCompanies.length === 0 || 
              (candidate.currentCompany && selectedCompanies.includes(candidate.currentCompany))) &&
             (candidateName.includes(query) ||
              candidateCompany.includes(query) ||
              candidateRole.includes(query) ||
              candidateLocation.includes(query));
    }
  )

  const handleCompanyToggle = (companyName: string) => {
    setSelectedCompanies((prev) => {
      if (prev.includes(companyName)) {
        // Remove the company
        return prev.filter((c) => c !== companyName);
      } else {
        // Add the company, ensuring no duplicates
        return [...new Set([...prev, companyName])];
      }
    });
  }

  const handleSaveCompanies = () => {
    setShowCompanySelector(false)
  }

  const [showEmailDraftDialog, setShowEmailDraftDialog] = useState(false)
  const [candidateEmail, setCandidateEmail] = useState<string | null>(null)
  const [emailDraft, setEmailDraft] = useState<string>("")
  const [copySuccess, setCopySuccess] = useState(false)

  // Function to draft outreach email
  const draftOutreachEmail = async () => {
    if (!selectedCandidate) return;
    
    try {
      // Query Supabase for candidate's email
      const { data, error } = await supabase
        .from('candidates')
        .select('email')
        .eq('id', selectedCandidate.id)
        .single();
      
      if (error || !data || !data.email) {
        throw new Error("No email found");
      }
      
      setCandidateEmail(data.email);
      
      // Default email template with email
      setEmailDraft(`Subject: Opportunity to Connect

Hi ${selectedCandidate.name},

I came across your profile and was impressed by your experience at ${selectedCandidate.currentCompany} as a ${selectedCandidate.currentRole}.

I'd love to connect and learn more about your experience and discuss potential opportunities that might align with your background and interests.

Looking forward to hearing from you.

Best regards,
[Your Name]`);
      
    } catch (error) {
      setCandidateEmail(null);
      
      // LinkedIn message template
      setEmailDraft(`Hi ${selectedCandidate.name},

I hope this message finds you well. I came across your profile and was impressed by your experience at ${selectedCandidate.currentCompany} as a ${selectedCandidate.currentRole}.

I'd love to connect and learn more about your experience and discuss potential opportunities that might align with your background and interests.

Looking forward to hearing from you.

Best regards,
[Your Name]`);
    } finally {
      setShowEmailDraftDialog(true);
    }
  };

  // Function to handle copying to clipboard and saving to outreach table
  const handleCopyAndSave = async () => {
    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(emailDraft);
      
      // Show success animation
      setCopySuccess(true);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
      
      // Save to Supabase outreach table
      if (selectedCandidate) {
        const { error } = await supabase
          .from('outreach')
          .insert([
            { 
              candidate_id: selectedCandidate.id,
              candidate_name: selectedCandidate.name,
              status: 'outreach sent',
              outreach_date: new Date().toISOString(),
              outreach_type: candidateEmail ? 'email' : 'linkedin'
            }
          ]);
          
        if (error) {
          console.error('Error saving outreach record:', error);
        }
      }
    } catch (err) {
      console.error('Error copying to clipboard or saving record:', err);
      setCopySuccess(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">People</h1>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Search className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming Soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <SlidersHorizontal className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming Soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button variant="outline" onClick={() => setShowCompanySelector(true)}>Select Companies</Button>
            <Button variant="outline" onClick={() => setShowSearchCompanyDialog(true)}>
              <Plus className="h-4 w-4 mr-2" /> Advanced Search
            </Button>
          </div>
        </header>

        <div className="p-4 flex-1 overflow-auto">
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={selectedFilter === "All" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setSelectedFilter("All")}
            >
              All Candidates
            </Button>
            <Button
              variant={selectedFilter === "Engineering" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setSelectedFilter("Engineering")}
            >
              Engineering <Badge className="ml-1 bg-blue-600">42</Badge>
            </Button>
            <Button
              variant={selectedFilter === "Product" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setSelectedFilter("Product")}
            >
              Product <Badge className="ml-1 bg-green-600">18</Badge>
            </Button>
            <Button
              variant={selectedFilter === "Design" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setSelectedFilter("Design")}
            >
              Design <Badge className="ml-1 bg-purple-600">15</Badge>
            </Button>
            <Button
              variant={selectedFilter === "Marketing" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setSelectedFilter("Marketing")}
            >
              Marketing <Badge className="ml-1 bg-yellow-600">23</Badge>
            </Button>
            <Button variant="outline" className="rounded-full">
              Reset
            </Button>
          </div>

          {selectedCompanies.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="text-sm text-gray-500 flex items-center">Showing candidates from:</div>
              {selectedCompanies.map((company, index) => (
                <Badge key={`${company}-${index}`} variant="outline" className="flex items-center gap-1 bg-gray-100">
                  {company}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 p-0"
                    onClick={() => handleCompanyToggle(company)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedCompanies([])}>
                Clear all
              </Button>
            </div>
          )}
          
          {/* Display active search filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="text-sm text-gray-500 flex items-center">Active filters:</div>
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <Badge key={filter} variant="outline" className="bg-blue-50 text-blue-700">
                    {filter}
                  </Badge>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActiveFilters([])}>
                Clear all filters
              </Button>
            </div>
          )}

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              placeholder="Search candidates..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )} */}

          <div className="text-sm text-gray-500 mb-2">
            {loading ? "Loading candidates..." : `${filteredCandidates.length} results`}
          </div>

          {loading ? (
            <div className="border rounded-lg p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading candidate data...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a moment as we retrieve profile information.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 text-left text-sm">
                  <tr>
                    <th className="p-3 w-10">
                      <Checkbox />
                    </th>
                    <th className="p-3 font-medium">Candidate Name</th>
                    <th className="p-3 font-medium">Current Company</th>
                    <th className="p-3 font-medium">Current Role</th>
                    <th className="p-3 font-medium">Location</th>
                    <th className="p-3 font-medium">
                      <div className="flex items-center gap-1">
                        Years Experience <ChevronDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="p-3 font-medium">School</th>
                    <th className="p-3 font-medium">Prior Experience</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCandidates.length > 0 ? (
                    filteredCandidates.map((candidate) => (
                      <tr
                        key={candidate.id}
                        className={`hover:bg-gray-50 cursor-pointer ${
                          candidate.currentCompany === "Data Unavailable" ? "bg-red-50" : ""
                        }`}
                        onClick={() => setSelectedCandidate(candidate)}
                      >
                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox />
                        </td>
                        <td className="p-3">
                          <div className="font-medium">{candidate.name}</div>
                          {candidate.currentCompany === "Data Unavailable" && (
                            <div className="text-xs text-red-500">Data fetch error</div>
                          )}
                        </td>
                        <td className="p-3">{candidate.currentCompany}</td>
                        <td className="p-3">{candidate.currentRole}</td>
                        <td className="p-3">{candidate.location}</td>
                        <td className="p-3">{candidate.yearsExperience}</td>
                        <td className="p-3">{candidate.school}</td>
                        <td className="p-3 max-w-xs">
                          <div className="line-clamp-1">{candidate.priorExperience}</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-gray-500">
                        <div className="py-8">
                          <div className="mb-4">No candidates found.</div>
                          <div className="text-sm">
                            Add candidates by using the "Advanced Search" button.
                          </div>
                          {error && (
                            <div className="mt-4 p-3 bg-red-50 rounded text-sm text-red-600 max-w-md mx-auto">
                              {error}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Company Selector Dialog */}
        <Dialog open={showCompanySelector} onOpenChange={setShowCompanySelector}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select Companies</DialogTitle>
              <DialogDescription>Choose companies to filter candidates</DialogDescription>
            </DialogHeader>

            <div className="relative my-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input placeholder="Search companies..." className="pl-10" />
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto py-2">
              {companyData.map((company: { id: string; name: string; logoBackground: string; logoChar?: string }) => (
                <div key={company.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`company-${company.id}`}
                    checked={selectedCompanies.includes(company.name)}
                    onCheckedChange={() => handleCompanyToggle(company.name)}
                  />
                  <label
                    htmlFor={`company-${company.id}`}
                    className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    <div className={`w-6 h-6 rounded-sm flex items-center justify-center ${company.logoBackground}`}>
                      {company.logoChar && <span className="text-white text-xs font-bold">{company.logoChar}</span>}
                    </div>
                    {company.name}
                  </label>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowCompanySelector(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCompanies}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Advanced Search Dialog */}
        <Dialog open={showSearchCompanyDialog} onOpenChange={setShowSearchCompanyDialog}>
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
                  Company Name
                </label>
                <Input
                  id="companyName"
                  value={companySearchInput}
                  onChange={(e) => setCompanySearchInput(e.target.value)}
                  placeholder="e.g. Microsoft, Google, Amazon"
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Years of Experience
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
                      disabled={loading}
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
                      disabled={loading}
                    />
                  </div>
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
                  disabled={loading}
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
                  disabled={loading}
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
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowSearchCompanyDialog(false);
                resetSearchForm();
              }} disabled={loading}>
                Cancel
              </Button>
              <Button 
                onClick={searchCandidatesByCompany} 
                disabled={loading || 
                  (!companySearchInput.trim() && !yearsExperience && !maxYearsExperience && !locationFilter && !schoolFilter && !roleFilter.trim()) ||
                  (yearsExperience !== "" && maxYearsExperience !== "" && Number(maxYearsExperience) < Number(yearsExperience))
                }
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Search
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Candidate Detail Sheet */}
        <Sheet open={!!selectedCandidate} onOpenChange={(open) => !open && setSelectedCandidate(null)}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            {selectedCandidate && (
              <>
                {/* Add our CompanyDataFetcher component to fetch real data */}
                <CompanyDataFetcher
                  candidate={selectedCandidate}
                  onDataLoaded={(data) => {
                    // Update the selectedCandidate with real data from Perplexity
                    setSelectedCandidate(prev => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        companyWhenJoined: data.companyWhenJoined,
                        companyToday: data.companyToday,
                        notableInvestors: data.notableInvestors,
                        seniorLeadership: data.seniorLeadership
                      };
                    });
                  }}
                />

                <SheetHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <SheetTitle className="text-xl">{selectedCandidate.name}</SheetTitle>
                    <Button 
                      variant="outline"
                      onClick={draftOutreachEmail}
                      size="sm"
                      className="ml-auto"
                    >
                      Draft Outreach Email
                    </Button>
                  </div>
                  {selectedCandidate.employmentStatus && (
                    <Badge 
                      className={`mb-2 ${
                        selectedCandidate.employmentStatus === 'present' ? 'bg-green-600' : 
                        selectedCandidate.employmentStatus === 'past' ? 'bg-orange-600' : 'bg-blue-600'
                      }`}
                    >
                      {selectedCandidate.employmentStatus === 'present' ? 'Current' : 
                      selectedCandidate.employmentStatus === 'past' ? 'Former' : 'Alumni'}
                    </Badge>
                  )}
                  <SheetDescription>
                    <span className="flex items-center gap-2">
                      {selectedCandidate.currentRole} at {selectedCandidate.currentCompany}
                      {selectedCandidate.linkedinUrl && (
                        <a
                          href={selectedCandidate.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          LinkedIn <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </span>
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Location</h3>
                      <p>{selectedCandidate.location}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Years Experience</h3>
                      <p>{selectedCandidate.yearsExperience}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">School</h3>
                      <p>{selectedCandidate.school}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Prior Experience</h3>
                      <p>{selectedCandidate.priorExperience}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Company When Joined</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-500">Size</div>
                        <div className="font-medium">{selectedCandidate.companyWhenJoined.size} employees</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-500">Stage</div>
                        <div className="font-medium">{selectedCandidate.companyWhenJoined.stage}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-500">Funding</div>
                        <div className="font-medium">${selectedCandidate.companyWhenJoined.funding}M</div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Company Today</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-500">Size</div>
                        <div className="font-medium">
                          {selectedCandidate.companyToday.size} employees
                          {selectedCandidate.companyWhenJoined.size < selectedCandidate.companyToday.size ? (
                            <span className="text-green-500 ml-1">
                              <ArrowUp className="inline h-3 w-3" />
                              {Math.round(
                                ((selectedCandidate.companyToday.size - selectedCandidate.companyWhenJoined.size) /
                                  selectedCandidate.companyWhenJoined.size) *
                                  100,
                              )}
                              %
                            </span>
                          ) : selectedCandidate.companyWhenJoined.size > selectedCandidate.companyToday.size ? (
                            <span className="text-red-500 ml-1">
                              <ArrowDown className="inline h-3 w-3" />
                              {Math.round(
                                ((selectedCandidate.companyWhenJoined.size - selectedCandidate.companyToday.size) /
                                  selectedCandidate.companyWhenJoined.size) *
                                  100,
                              )}
                              %
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-500">Stage</div>
                        <div className="font-medium">{selectedCandidate.companyToday.stage}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm text-gray-500">Funding</div>
                        <div className="font-medium">
                          ${selectedCandidate.companyToday.funding}M
                          {selectedCandidate.companyWhenJoined.funding < selectedCandidate.companyToday.funding ? (
                            <span className="text-green-500 ml-1">
                              <ArrowUp className="inline h-3 w-3" />
                              {Math.round(
                                ((selectedCandidate.companyToday.funding - selectedCandidate.companyWhenJoined.funding) /
                                  selectedCandidate.companyWhenJoined.funding) *
                                  100,
                              )}
                              %
                            </span>
                          ) : selectedCandidate.companyWhenJoined.funding > selectedCandidate.companyToday.funding ? (
                            <span className="text-red-500 ml-1">
                              <ArrowDown className="inline h-3 w-3" />
                              {Math.round(
                                ((selectedCandidate.companyWhenJoined.funding - selectedCandidate.companyToday.funding) /
                                  selectedCandidate.companyWhenJoined.funding) *
                                  100,
                              )}
                              %
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Notable Investors</h3>
                    <div className="space-y-3">
                      {selectedCandidate.notableInvestors.map((round, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-md">
                          <div className="text-sm font-medium">{round.round}</div>
                          <div className="text-sm">{round.investors.join(", ")}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Senior Leadership</h3>
                    <div className="space-y-4">
                      {selectedCandidate.seniorLeadership.map((leader, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                            {leader.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <div className="font-medium">{leader.name}</div>
                            <div className="text-sm text-gray-600">{leader.role}</div>
                            <div className="text-sm text-gray-500">{leader.background}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Email Draft Dialog */}
        <Dialog open={showEmailDraftDialog} onOpenChange={setShowEmailDraftDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Email Draft</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {candidateEmail === null ? (
                <div className="text-amber-600 bg-amber-50 p-3 rounded-md">
                  No email found. We've generated an outreach message for you to use in a LinkedIn message.
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Recipient:</span> 
                  <span className="text-blue-600">{candidateEmail}</span>
                </div>
              )}
              
              <div className="border rounded-md p-4 whitespace-pre-wrap bg-gray-50">
                {emailDraft}
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowEmailDraftDialog(false)}>
                Close
              </Button>
              <Button 
                onClick={handleCopyAndSave}
                className="relative"
              >
                {copySuccess ? (
                  <>
                    <Check className="h-4 w-4 mr-2 animate-bounce" /> 
                    <span className="animate-pulse">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" /> Copy to Clipboard
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}