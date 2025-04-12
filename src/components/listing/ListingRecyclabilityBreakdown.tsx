import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Database } from "@/lib/database.types";

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

interface ListingRecyclabilityBreakdownProps {
  listing: ScrapListing;
}

const ListingRecyclabilityBreakdown = ({ listing }: ListingRecyclabilityBreakdownProps) => {
  // Function to extract materials from description
  const extractMaterials = (description: string | null): string[] => {
    if (!description) return [];
    
    // Look for materials mentioned after "with" in the description
    const materialsMatch = description.match(/with\s+([^.]+)/i);
    if (materialsMatch) {
      // Split by commas and clean up each material
      return materialsMatch[1]
        .split(',')
        .map(material => material.trim().replace(/\s+/g, ' '))
        .filter(material => material.length > 0);
    }
    return [];
  };

  // Get materials from either the description or material type
  const materials = listing.description?.toLowerCase().includes('mixed') || listing.description?.toLowerCase().includes('with')
    ? extractMaterials(listing.description)
    : [listing.material_type?.category || ''].filter(m => m.length > 0);

  // Count recyclable vs non-recyclable materials
  const totalMaterials = materials.length;
  const nonRecyclableCount = materials.filter(material => 
    material.toLowerCase().includes('plastic')
  ).length;
  const recyclableCount = totalMaterials - nonRecyclableCount;
  
  // Calculate percentages
  const recyclablePercentage = totalMaterials > 0 ? (recyclableCount / totalMaterials) * 100 : 0;
  const nonRecyclablePercentage = totalMaterials > 0 ? (nonRecyclableCount / totalMaterials) * 100 : 0;

  if (totalMaterials === 0) {
    return null;
  }

  return (
    <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">Material Composition</span>
        <span className="text-emerald-600 font-bold">{Math.round(recyclablePercentage)}% Recyclable</span>
      </div>
      
      <div className="flex gap-1 h-2">
        <div 
          className="bg-emerald-500 rounded-l transition-all duration-300"
          style={{ width: `${recyclablePercentage}%` }}
        />
        <div 
          className="bg-red-500 rounded-r transition-all duration-300"
          style={{ width: `${nonRecyclablePercentage}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="text-xs bg-emerald-50 p-2 rounded">
          <div className="font-medium text-emerald-700 mb-1">Recyclable Materials</div>
          <div className="text-emerald-600">
            {recyclableCount} of {totalMaterials} parts
          </div>
        </div>
        <div className="text-xs bg-red-50 p-2 rounded">
          <div className="font-medium text-red-700 mb-1">Non-Recyclable</div>
          <div className="text-red-600">
            {nonRecyclableCount} of {totalMaterials} parts
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-1">
        <span className="font-medium">Materials:</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {materials.map((material, index) => (
            <span 
              key={index}
              className={`${
                material.toLowerCase().includes('plastic')
                  ? 'text-red-600 bg-red-50 border-red-100' 
                  : 'text-emerald-600 bg-emerald-50 border-emerald-100'
              } px-2 py-0.5 rounded border`}
            >
              {material}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ListingRecyclabilityBreakdown;