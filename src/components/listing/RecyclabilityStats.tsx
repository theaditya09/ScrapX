import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface RecyclabilityStatsProps {
  listings: ScrapListing[];
}

const RecyclabilityStats = ({ listings }: RecyclabilityStatsProps) => {
  // Filter only sold items
  const soldListings = listings.filter(listing => listing.status === 'sold');
  
  // Calculate recyclability stats - everything except plastic is recyclable
  const nonRecyclableCount = soldListings.filter(listing => {
    const category = listing.material_type?.category?.toLowerCase();
    return category === 'plastic';
  }).length;

  const totalSold = soldListings.length;
  const recyclableCount = totalSold - nonRecyclableCount;
  const recyclablePercentage = totalSold > 0 ? (recyclableCount / totalSold) * 100 : 0;

  if (totalSold === 0) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recyclability Statistics</span>
          <span className="text-2xl font-bold text-emerald-600">{Math.round(recyclablePercentage)}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Recyclable Materials</span>
              <span className="text-sm text-gray-500">{recyclableCount} out of {totalSold} items</span>
            </div>
            <Progress value={recyclablePercentage} className="h-2" />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-emerald-50 rounded-lg">
              <p className="text-emerald-700 font-medium">Recyclable Items</p>
              <p className="text-emerald-600 text-lg font-bold">{recyclableCount}</p>
              <p className="text-emerald-600/70 text-xs">Metal, Paper, Cloth, etc.</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-red-700 font-medium">Non-Recyclable Items</p>
              <p className="text-red-600 text-lg font-bold">{nonRecyclableCount}</p>
              <p className="text-red-600/70 text-xs">Plastic materials</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecyclabilityStats;