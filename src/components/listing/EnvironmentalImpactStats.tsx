import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "@/lib/database.types";
import { Trees, Wind, Award, Leaf } from "lucide-react";

// Define ScrapListing type directly to avoid import errors
interface MaterialType {
  id: string;
  name: string;
  category: string;
  description?: string | null;
}

type ScrapListing = Database["public"]["Tables"]["scrap_listings"]["Row"] & {
  material_type?: MaterialType | null;
};

interface EnvironmentalImpactStatsProps {
  listings: ScrapListing[];
}

// Environmental impact constants
const PAPER_TO_TREES_RATIO = 0.017; // ~17 reams (8500 sheets) of paper = 1 tree
const TREE_OXYGEN_PER_YEAR = 117; // kg of oxygen per year per tree
const KG_TO_MG_PER_LITER = 1000000; // conversion factor
const DAYS_IN_YEAR = 365;

const EnvironmentalImpactStats = ({ listings }: EnvironmentalImpactStatsProps) => {
  // Filter sold items and extract paper materials
  const soldListings = listings.filter(listing => listing.status === 'sold');
  
  const calculatePaperWeight = (listing: ScrapListing): number => {
    if (!listing.quantity || !listing.unit) return 0;
    
    // Extract paper materials from description or material type
    const hasPaper = listing.description?.toLowerCase().includes('paper') ||
                    listing.material_type?.category?.toLowerCase().includes('paper');
    
    if (!hasPaper) return 0;

    // Convert all quantities to kilograms for consistency
    let weightInKg = listing.quantity;
    if (listing.unit.toLowerCase() === 'grams') {
      weightInKg = listing.quantity / 1000;
    }
    
    // If mixed materials, estimate paper portion
    if (listing.description?.toLowerCase().includes('mixed')) {
      const materials = listing.description.toLowerCase().match(/with\s+([^.]+)/i);
      if (materials) {
        const totalMaterials = materials[1].split(',').length;
        const paperMaterials = materials[1].split(',').filter(m => m.toLowerCase().includes('paper')).length;
        return (weightInKg * paperMaterials) / totalMaterials;
      }
    }
    
    return weightInKg;
  };

  // Calculate total paper weight and environmental impact
  const totalPaperWeight = soldListings.reduce((sum, listing) => sum + calculatePaperWeight(listing), 0);
  const treesSaved = totalPaperWeight * PAPER_TO_TREES_RATIO;
  const oxygenGeneratedPerYear = treesSaved * TREE_OXYGEN_PER_YEAR;
  const oxygenPerYearInMgPerLiter = oxygenGeneratedPerYear * KG_TO_MG_PER_LITER;

  // Calculate cumulative contribution based on days since each listing was sold
  const cumulativeOxygenGenerated = soldListings.reduce((sum, listing) => {
    const paperWeight = calculatePaperWeight(listing);
    const trees = paperWeight * PAPER_TO_TREES_RATIO;
    const oxygenPerDay = (trees * TREE_OXYGEN_PER_YEAR) / DAYS_IN_YEAR;
    
    // Calculate days since sold, with a minimum of 1 day to ensure we count the contribution
    const daysSinceSold = Math.max(1, Math.floor(
      (new Date().getTime() - new Date(listing.updated_at || listing.created_at).getTime()) / (1000 * 60 * 60 * 24)
    ));
    
    // Calculate oxygen generated for this listing
    const oxygenFromListing = oxygenPerDay * daysSinceSold;
    console.log(`Listing contribution:`, {
      paperWeight,
      trees,
      oxygenPerDay,
      daysSinceSold,
      oxygenFromListing
    });
    
    return sum + oxygenFromListing;
  }, 0);

  // Convert to mg/L with proper scaling
  const cumulativeOxygenInMgPerLiter = cumulativeOxygenGenerated * KG_TO_MG_PER_LITER;

  console.log(`Environmental Impact Stats:`, {
    totalPaperWeight,
    treesSaved,
    oxygenGeneratedPerYear,
    cumulativeOxygenGenerated,
    cumulativeOxygenInMgPerLiter
  });

  if (soldListings.length === 0) {
    return null;
  }

  return (
    <Card className="w-full bg-gradient-to-br from-emerald-50 to-teal-50">
      <CardHeader>
        <CardTitle className="text-emerald-800">Environmental Impact</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-full">
                <Trees className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Trees Saved</div>
                <div className="text-2xl font-bold text-emerald-600">
                  {treesSaved.toFixed(2)}
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Based on recycled paper weight: {totalPaperWeight.toFixed(2)} kg
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-full">
                <Wind className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Yearly Oxygen Generation</div>
                <div className="text-2xl font-bold text-emerald-600">
                  {oxygenPerYearInMgPerLiter.toFixed(2)} mg/L
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Potential oxygen generation per year from saved trees
            </div>
          </div>
        </div>

        <div className="mt-4 bg-white p-4 rounded-lg shadow-sm border border-emerald-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-100 rounded-full">
              <Award className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Your Contribution So Far</div>
              <div className="text-2xl font-bold text-emerald-600">
                {cumulativeOxygenInMgPerLiter.toFixed(2)} mg/L
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Total oxygen generated since you started recycling
          </div>
        </div>

        <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Leaf className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div className="text-sm text-emerald-800">
              <strong>Impact Breakdown:</strong>
              <ul className="mt-2 space-y-2 text-emerald-700">
                <li>• Your recycled paper ({totalPaperWeight.toFixed(2)} kg) has saved {treesSaved.toFixed(2)} trees</li>
                <li>• These trees can generate {oxygenGeneratedPerYear.toFixed(2)} kg of oxygen per year</li>
                <li>• Since you started recycling, you've helped generate {cumulativeOxygenGenerated.toFixed(2)} kg of oxygen</li>
                <li>• Each tree contributes approximately {TREE_OXYGEN_PER_YEAR} kg of oxygen annually</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnvironmentalImpactStats;