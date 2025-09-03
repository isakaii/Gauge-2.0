// app/companies/page.tsx

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ArrowDown, ArrowUp, ChevronDown, MoreHorizontal, Search, SlidersHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown"
import { Input } from "@/components/ui/input"
import { supabase } from "@/supabaseClient"
import { Sidebar } from "@/components/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function CompanySelectionAlert({ selectedCompanies, onClose, onConfirm, isOpen }: { selectedCompanies: string[], onClose: () => void, onConfirm: () => void, isOpen: boolean }) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Companies Selected</DialogTitle>
            <DialogDescription>
              {selectedCompanies.length > 1 
                ? `You've selected ${selectedCompanies.length} companies. ` 
                : `You've selected ${selectedCompanies[0]}. `}
              Would you like to search for candidates from {selectedCompanies.length > 1 ? 'these companies' : 'this company'}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end mt-4">
            <Button variant="outline" onClick={onClose}>
              Not Now
            </Button>
            <Button onClick={onConfirm}>
              Search Candidates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

export default function CompaniesPage() {
  const router = useRouter()
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [showSelectionAlert, setShowSelectionAlert] = useState(false)
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedFilter, setSelectedFilter] = useState("General")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase.from("layoffs").select("*")

      if (error) {
        console.error("Error fetching data:", error)
      } else {
        setCompanies(data)
      }
    }

    fetchCompanies()
  }, [])

  // Function to generate logo background color based on the first letter
  const getLogoBackground = (name: string) => {
    const colors = ["bg-purple-600", "bg-blue-500", "bg-green-600", "bg-indigo-600", "bg-red-500",
      "bg-teal-500", "bg-gray-700", "bg-emerald-600", "bg-violet-600", "bg-amber-600"]
    return colors[name.charCodeAt(0) % colors.length]
  }

  // Filter companies based on search query
  const filteredCompanies = companies.filter(
    (company) =>
      company.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.location_hq.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.industry.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCompanyToggle = (companyName: string) => {
    setSelectedCompanies((prev) => {
      const newSelection = prev.includes(companyName)
        ? prev.filter((c) => c !== companyName)
        : [...prev, companyName]
      
      return newSelection
    })
  }
  
  const handleCloseAlert = () => {
    setShowSelectionAlert(false)
  }
  
  const handleConfirmSearch = () => {
    // Store selected companies in localStorage for the people page to access
    localStorage.setItem('selectedCompaniesToSearch', JSON.stringify(selectedCompanies))
    
    // Navigate to the people page
    router.push('/people')
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 h-full flex flex-col">
        <header className="border-b p-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Companies</h1>
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
            
            <Button variant="outline" onClick={() => {
              if (selectedCompanies.length > 0) {
                setShowSelectionAlert(true)
              }
            }}>Save</Button>
          </div>
        </header>

        <div className="p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={selectedFilter === "General" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setSelectedFilter("General")}
            >
              General
            </Button>
            <Button
              variant={selectedFilter === "Funding" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setSelectedFilter("Funding")}
            >
              Funding <Badge className="ml-1 bg-blue-600">3</Badge>
            </Button>
            <Button
              variant={selectedFilter === "Team" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setSelectedFilter("Team")}
            >
              Team <Badge className="ml-1 bg-blue-600">3</Badge>
            </Button>
            <Button
              variant={selectedFilter === "Sector" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setSelectedFilter("Sector")}
            >
              Sector
            </Button>
            <Button
              variant={selectedFilter === "Layoffs" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setSelectedFilter("Layoffs")}
            >
              Layoffs <Badge className="ml-1 bg-red-600">5</Badge>
            </Button>
            <Button
              variant={selectedFilter === "Custom" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setSelectedFilter("Custom")}
            >
              Custom
            </Button>
            <Button variant="outline" className="rounded-full">
              Reset
            </Button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              placeholder="Search companies..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="text-sm text-gray-500 mb-2">{filteredCompanies.length} results</div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-sm">
                <tr>
                  <th className="p-3 w-10">
                    <Checkbox />
                  </th>
                  <th className="p-3 font-medium">Company</th>
                  <th className="p-3 font-medium">Location</th>
                  <th className="p-3 font-medium">Layoff Date</th>
                  <th className="p-3 font-medium">Industry</th>
                  <th className="p-3 font-medium">Source</th>
                  <th className="p-3 font-medium">
                    <div className="flex items-center gap-1">
                      % Laid Off <ChevronDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCompanies.map((company) => (
                  <CompanyRow 
                    key={company.id} 
                    company={company} 
                    getLogoBackground={getLogoBackground}
                    onToggle={handleCompanyToggle}
                    isSelected={selectedCompanies.includes(company.company)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Add the CompanySelectionAlert component */}
        <CompanySelectionAlert 
          selectedCompanies={selectedCompanies}
          onClose={handleCloseAlert}
          onConfirm={handleConfirmSearch}
          isOpen={showSelectionAlert}
        />
      </div>
    </div>
  )
}

function CompanyRow({ 
  company, 
  getLogoBackground, 
  onToggle, 
  isSelected 
}: { 
  company: any, 
  getLogoBackground: (name: string) => string,
  onToggle: (companyName: string) => void,
  isSelected: boolean
}) {
  return (
    <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
      <td className="p-3">
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={() => onToggle(company.company)}
        />
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-sm flex items-center justify-center ${getLogoBackground(company.company)}`}>
            <span className="text-white text-xs font-bold">{company.company.charAt(0).toUpperCase()}</span>
          </div>
          <div className="font-medium">{company.company}</div>
        </div>
      </td>
      <td className="p-3 text-sm text-gray-600">{company.location_hq}</td>
      <td className="p-3 text-sm text-gray-600">{new Date(company.layoff_date).toLocaleDateString()}</td>
      <td className="p-3 text-sm">{company.industry}</td>
      <td className="p-3">
        <div className="relative">
            <span className="block truncate max-w-xs overflow-hidden whitespace-nowrap overflow-ellipsis">
            {company.source}
            </span>
        </div>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-1">
          <ArrowDown className="h-4 w-4 text-red-500" />
          <span className="text-red-500">{company.percent_laid_off}</span>
        </div>
      </td>
      <td className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View company</DropdownMenuItem>
            <DropdownMenuItem>View candidates</DropdownMenuItem>
            <DropdownMenuItem>Add to list</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}