// services/mixrankApi.ts

/**
 * Service to interact with the Mixrank API through our server-side API route
 */
export async function fetchCandidateByLinkedInUrl(linkedInUrl: string) {
    try {
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkedInUrl }),
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching candidate data:', error);
      throw error;
    }
  }
  
  export async function fetchCandidatesData(linkedInUrls: string[]) {
    try {
      const candidatePromises = linkedInUrls.map(url => fetchCandidateByLinkedInUrl(url));
      return await Promise.all(candidatePromises);
    } catch (error) {
      console.error('Error fetching multiple candidates:', error);
      throw error;
    }
  }