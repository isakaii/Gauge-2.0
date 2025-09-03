// components/ExperienceFilterBadge.tsx

import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"

interface ExperienceFilterProps {
  minYears?: number;
  maxYears?: number;
}

export function ExperienceFilterBadge({ minYears, maxYears }: ExperienceFilterProps) {
  // Determine the label text based on min/max values
  let label = '';
  if (minYears && maxYears) {
    label = `${minYears}-${maxYears} years`;
  } else if (minYears) {
    label = `${minYears}+ years`;
  } else if (maxYears) {
    label = `Up to ${maxYears} years`;
  } else {
    label = 'Any experience';
  }
  
  // Determine the color based on the experience level
  let colorClass = 'bg-gray-100 text-gray-800'; // default
  
  if (minYears && maxYears) {
    // Range case
    const avgYears = (minYears + maxYears) / 2;
    if (avgYears < 3) colorClass = 'bg-green-100 text-green-800'; // Junior
    else if (avgYears < 7) colorClass = 'bg-blue-100 text-blue-800'; // Mid-level
    else if (avgYears < 12) colorClass = 'bg-purple-100 text-purple-800'; // Senior
    else colorClass = 'bg-amber-100 text-amber-800'; // Principal+
  } else if (minYears) {
    // Minimum only
    if (minYears < 3) colorClass = 'bg-green-100 text-green-800';
    else if (minYears < 6) colorClass = 'bg-blue-100 text-blue-800';
    else if (minYears < 10) colorClass = 'bg-purple-100 text-purple-800';
    else colorClass = 'bg-amber-100 text-amber-800';
  } else if (maxYears) {
    // Maximum only
    if (maxYears < 3) colorClass = 'bg-green-100 text-green-800';
    else if (maxYears < 6) colorClass = 'bg-blue-100 text-blue-800';
    else colorClass = 'bg-gray-100 text-gray-800';
  }
  
  return (
    <Badge variant="outline" className={`${colorClass} flex items-center gap-1`}>
      <AlertCircle className="h-3 w-3" />
      {label}
    </Badge>
  );
}