// components/CandidateExperienceDisplay.tsx

import { Badge } from "@/components/ui/badge"

interface ExperienceDisplayProps {
  yearsExperience: number;
  experienceLevel?: string;
}

export function CandidateExperienceDisplay({ yearsExperience, experienceLevel }: ExperienceDisplayProps) {
  // Determine experience level if not provided
  const level = experienceLevel || getExperienceLevel(yearsExperience);
  
  // Choose color based on experience level
  const colorMap: Record<string, string> = {
    'Junior': 'bg-green-100 text-green-800',
    'Mid-level': 'bg-blue-100 text-blue-800',
    'Senior': 'bg-purple-100 text-purple-800',
    'Principal': 'bg-indigo-100 text-indigo-800',
    'Executive': 'bg-amber-100 text-amber-800'
  };
  
  const badgeColor = colorMap[level] || 'bg-gray-100 text-gray-800';
  
  return (
    <div className="flex flex-col items-start">
      <div className="font-medium">{yearsExperience} {yearsExperience === 1 ? 'year' : 'years'}</div>
      <Badge variant="outline" className={`mt-1 ${badgeColor}`}>
        {level}
      </Badge>
    </div>
  );
}

// Helper function to determine experience level
function getExperienceLevel(years: number): string {
  if (years < 2) return 'Junior';
  if (years < 5) return 'Mid-level';
  if (years < 10) return 'Senior';
  if (years < 15) return 'Principal';
  return 'Executive';
}