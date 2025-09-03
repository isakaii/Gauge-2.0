// services/companyDataCache.ts

import { supabase } from "@/supabaseClient";
import { CompanyMetrics, InvestorRound, LeadershipProfile } from "@/data/candidates";

/**
 * Service for caching company data in Supabase
 */

interface CachedCompanyData {
  id?: number;
  company_name: string;
  data_type: 'companyWhenJoined' | 'companyToday' | 'notableInvestors' | 'seniorLeadership';
  data: any;
  candidate_id?: string;
  candidate_role?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Check if we have cached data for a company and data type
 */
export async function getCompanyCachedData(
  companyName: string, 
  dataType: 'companyWhenJoined' | 'companyToday' | 'notableInvestors' | 'seniorLeadership',
  candidateId?: string,
  candidateRole?: string
): Promise<any | null> {
  try {
    if (!supabase) {
      console.warn('Supabase client not properly initialized');
      return null;
    }

    let query = supabase
      .from('company_data_cache')
      .select('*')
      .eq('company_name', companyName)
      .eq('data_type', dataType);
    
    // For companyWhenJoined, we need to match on candidate role too if provided
    if (dataType === 'companyWhenJoined' && candidateId && candidateRole) {
      query = query
        .eq('candidate_id', candidateId)
        .eq('candidate_role', candidateRole);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(1);
    
    if (error) {
      console.error(`Error fetching cached ${dataType} for ${companyName}:`, error);
      return null;
    }
    
    if (data && data.length > 0) {
      console.log(`Found cached ${dataType} data for ${companyName}`);
      return data[0].data;
    }
    
    console.log(`No cached ${dataType} data found for ${companyName}`);
    return null;
  } catch (error) {
    console.error(`Error in getCompanyCachedData for ${companyName} (${dataType}):`, error);
    return null;
  }
}

/**
 * Store company data in the cache
 */
export async function storeCompanyData(
  companyName: string,
  dataType: 'companyWhenJoined' | 'companyToday' | 'notableInvestors' | 'seniorLeadership',
  data: any,
  candidateId?: string,
  candidateRole?: string
): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase client not properly initialized');
      return false;
    }

    const now = new Date().toISOString();

    const cacheRecord: CachedCompanyData = {
      company_name: companyName,
      data_type: dataType,
      data,
      created_at: now,
      updated_at: now
    };

    // Only include candidate info for companyWhenJoined 
    // as it's specific to when they joined
    if (dataType === 'companyWhenJoined' && candidateId && candidateRole) {
      cacheRecord.candidate_id = candidateId;
      cacheRecord.candidate_role = candidateRole;
    }

    const { error } = await supabase
      .from('company_data_cache')
      .insert([cacheRecord]);
    
    if (error) {
      // If we get a duplicate error, try to update instead
      if (error.code === '23505') { // PostgreSQL duplicate key error
        console.log(`Data already exists for ${companyName} (${dataType}), updating instead`);
        
        const { error: updateError } = await supabase
          .from('company_data_cache')
          .update({ 
            data,
            updated_at: now
          })
          .eq('company_name', companyName)
          .eq('data_type', dataType);
        
        if (updateError) {
          console.error(`Error updating ${dataType} for ${companyName}:`, updateError);
          return false;
        }
        
        return true;
      }
      
      console.error(`Error storing ${dataType} for ${companyName}:`, error);
      return false;
    }
    
    console.log(`Successfully cached ${dataType} data for ${companyName}`);
    return true;
  } catch (error) {
    console.error(`Error in storeCompanyData for ${companyName} (${dataType}):`, error);
    return false;
  }
}