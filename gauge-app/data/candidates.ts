// data/candidates.ts

export interface CompanyMetrics {
  size: number
  stage: string
  funding: number
}

export interface InvestorRound {
  round: string
  investors: string[]
}

export interface LeadershipProfile {
  name: string
  role: string
  background: string
}

export interface CandidateData {
  id: string
  name: string
  currentCompany: string
  linkedinUrl: string
  currentRole: string
  location: string
  yearsExperience: number
  school: string
  priorExperience: string
  companyWhenJoined: CompanyMetrics
  companyToday: CompanyMetrics
  notableInvestors: InvestorRound[]
  seniorLeadership: LeadershipProfile[]
  email?: string | null
  employmentStatus?: string // Added this property to track whether candidate is present/past/ever
}

// Empty initial array - we'll load candidates from Supabase or via API
export const candidateData: CandidateData[] = [];