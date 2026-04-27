export interface VINData {
  make: string;
  model: string;
  year: number;
}

export async function decodeVIN(vin: string): Promise<VINData | null> {
  const cleanVIN = vin.trim().toUpperCase();
  if (cleanVIN.length !== 17) return null;

  try {
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${cleanVIN}?format=json`);
    const data = await response.json();
    
    if (data.Results && data.Results[0]) {
      const result = data.Results[0];
      return {
        make: result.Make || '',
        model: result.Model || '',
        year: parseInt(result.ModelYear) || new Date().getFullYear(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error decoding VIN:", error);
    return null;
  }
}
