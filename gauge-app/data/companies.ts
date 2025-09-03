// data/companies.ts

export interface CompanyData {
    id: string
    name: string
    description: string
    logoBackground: string
    logoChar?: string
    lastLayoff: string
    headcountChange: number
    headcountChangeCount: number
    layoffPercentage: number
    layoffCount: number
  }
  
  export const companyData: CompanyData[] = [
    {
      id: "1",
      name: "TechVision AI",
      description: "AI-powered computer vision platform for enterprise applications",
      logoBackground: "bg-purple-600",
      logoChar: "T",
      lastLayoff: "2 weeks ago",
      headcountChange: -15,
      headcountChangeCount: 120,
      layoffPercentage: 18,
      layoffCount: 85,
    },
    {
      id: "2",
      name: "CloudScale",
      description: "Enterprise cloud infrastructure and scaling solutions",
      logoBackground: "bg-blue-500",
      logoChar: "C",
      lastLayoff: "1 month ago",
      headcountChange: -22,
      headcountChangeCount: 230,
      layoffPercentage: 25,
      layoffCount: 180,
    },
    {
      id: "3",
      name: "DataSphere",
      description: "Big data analytics and visualization platform",
      logoBackground: "bg-green-600",
      logoChar: "D",
      lastLayoff: "3 weeks ago",
      headcountChange: -12,
      headcountChangeCount: 45,
      layoffPercentage: 15,
      layoffCount: 32,
    },
    {
      id: "4",
      name: "FinEdge",
      description: "Next-generation fintech solutions for banking and finance",
      logoBackground: "bg-indigo-600",
      logoChar: "F",
      lastLayoff: "2 days ago",
      headcountChange: -30,
      headcountChangeCount: 150,
      layoffPercentage: 35,
      layoffCount: 120,
    },
    {
      id: "5",
      name: "RoboLogic",
      description: "Robotics and automation solutions for manufacturing",
      logoBackground: "bg-red-500",
      logoChar: "R",
      lastLayoff: "1 week ago",
      headcountChange: -8,
      headcountChangeCount: 25,
      layoffPercentage: 10,
      layoffCount: 18,
    },
    {
      id: "6",
      name: "HealthTech Innovations",
      description: "Digital health platforms and telemedicine solutions",
      logoBackground: "bg-teal-500",
      logoChar: "H",
      lastLayoff: "5 days ago",
      headcountChange: -18,
      headcountChangeCount: 65,
      layoffPercentage: 22,
      layoffCount: 48,
    },
    {
      id: "7",
      name: "SecureNet",
      description: "Cybersecurity and network protection services",
      logoBackground: "bg-gray-700",
      logoChar: "S",
      lastLayoff: "2 weeks ago",
      headcountChange: -14,
      headcountChangeCount: 42,
      layoffPercentage: 16,
      layoffCount: 35,
    },
    {
      id: "8",
      name: "EcoSmart",
      description: "Sustainable technology solutions for green businesses",
      logoBackground: "bg-emerald-600",
      logoChar: "E",
      lastLayoff: "3 days ago",
      headcountChange: -25,
      headcountChangeCount: 75,
      layoffPercentage: 28,
      layoffCount: 62,
    },
    {
      id: "9",
      name: "MetaVerse Technologies",
      description: "Virtual reality and augmented reality platforms",
      logoBackground: "bg-violet-600",
      logoChar: "M",
      lastLayoff: "1 month ago",
      headcountChange: -35,
      headcountChangeCount: 280,
      layoffPercentage: 40,
      layoffCount: 220,
    },
    {
      id: "10",
      name: "BlockChain Innovations",
      description: "Blockchain solutions for enterprise and finance",
      logoBackground: "bg-amber-600",
      logoChar: "B",
      lastLayoff: "2 weeks ago",
      headcountChange: -20,
      headcountChangeCount: 60,
      layoffPercentage: 24,
      layoffCount: 45,
    },
  ]
  
  