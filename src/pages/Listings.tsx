import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Filter, PlusCircle, MapPin, X, Package, Calendar, Eye, ShoppingCart, RefreshCw, Edit, Check, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RecyclabilityStats from "@/components/listing/RecyclabilityStats";
import ListingRecyclabilityBreakdown from "@/components/listing/ListingRecyclabilityBreakdown";
import EnvironmentalImpactStats from "@/components/listing/EnvironmentalImpactStats";
import WalletConnectDialog from "@/components/wallet/WalletConnectDialog";
import { Database } from "@/lib/database.types";

// Define types directly in this file to avoid import errors
interface MaterialType {
  id: string;
  name: string;
  category: string;
  description?: string | null;
}

type ScrapListing = Database["public"]["Tables"]["scrap_listings"]["Row"] & {
  material_type?: MaterialType | null;
};

const Listings = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<ScrapListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<ScrapListing[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching all available listings...");
      console.log("Current user:", user?.id);
      
      // Fetch material types for filters
      const { data: typeData, error: typeError } = await supabase
        .from('material_types')
        .select('*')
        .order('name');
        
      if (typeError) {
        console.error("Error fetching material types:", typeError);
        throw typeError;
      }
        
      console.log(`Fetched ${typeData?.length || 0} material types`);
      setMaterialTypes(typeData || []);
        
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set((typeData || []).map(type => type.category))
      ).filter(Boolean) as string[];
        
      setCategories(uniqueCategories);
        
      // Fetch ALL listings with material types included
      const { data, error } = await supabase
        .from('scrap_listings')
        .select(`
          *,
          material_type:material_type_id (
            id, name, category
          )
        `)
        // Temporarily remove status filter to check if that's the issue
        // .eq('status', 'active')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching listings:", error);
        throw error;
      }
        
      console.log(`Fetched ${data?.length || 0} listings:`, data);
        
      if (!data || data.length === 0) {
        // Log the result of a simple query to check if there are any listings at all
        console.log("No listings found, checking all listings");
        const { data: checkData, error: checkError } = await supabase
          .from('scrap_listings')
          .select('id, status, title, created_at')
          .limit(10);
          
        console.log("Raw listing check results:", checkData, checkError);
        
        if (checkData && checkData.length > 0) {
          console.log("Found listings but they may not be active, showing all listings instead");
          // If we found listings but they're not active, use them anyway
          const { data: allData, error: allError } = await supabase
            .from('scrap_listings')
            .select(`
              *,
              material_type:material_type_id (
                id, name, category
              )
            `)
            .order('created_at', { ascending: false });
            
          if (!allError && allData) {
            console.log(`Using all ${allData.length} listings regardless of status`);
            setListings(allData);
            setFilteredListings(allData);
            return;
          }
        }
      }
        
      setListings(data || []);
      setFilteredListings(data || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      setError(error.message || "Failed to load listings");
      toast({
        title: "Error",
        description: "Failed to load listings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  // Apply filters when selectedFilters change
  useEffect(() => {
    let filtered = [...listings];
    
    // Filter by material type if any selected
    if (selectedMaterialTypes.length > 0) {
      filtered = filtered.filter(listing => 
        selectedMaterialTypes.includes(listing.material_type_id)
      );
    }
    
    // Filter by category if any selected
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(listing => 
        listing.material_type && 
        selectedCategories.includes(listing.material_type.category)
      );
    }
    
    console.log(`Applied filters: ${filtered.length} listings remaining`);
    setFilteredListings(filtered);
  }, [selectedMaterialTypes, selectedCategories, listings]);
  
  const toggleMaterialType = (typeId: string) => {
    setSelectedMaterialTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId) 
        : [...prev, typeId]
    );
  };
  
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(cat => cat !== category) 
        : [...prev, category]
    );
  };
  
  const clearFilters = () => {
    setSelectedMaterialTypes([]);
    setSelectedCategories([]);
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };
  
  // Handle marking a listing as sold
  const handleMarkAsSold = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scrap_listings')
        .update({ status: 'sold' })
        .eq('id', id)
        .eq('seller_id', user?.id);
      
      if (error) throw error;
      
      // Update local state
      setListings(
        listings.map(listing => 
          listing.id === id ? { ...listing, status: 'sold' } : listing
        )
      );
      
      toast({
        title: "Success",
        description: "Listing has been marked as sold",
      });
    } catch (error) {
      console.error("Error marking listing as sold:", error);
      toast({
        title: "Error",
        description: "Failed to update the listing status",
        variant: "destructive",
      });
    }
  };
  
  const handleWalletSuccess = () => {
    // Handle wallet connection success
    console.log("Wallet connection successful");
    fetchData();
  };
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <motion.div 
        className="flex justify-between items-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-emerald-600" />
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-emerald-700">Scrap Listings</h1>
            <p className="text-emerald-600/70 mt-2 text-lg">
              Browse available recyclable materials
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={fetchData} 
            disabled={loading}
            className="flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Link to="/create-listing">
            <Button 
              variant="default" 
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-none"
            >
              <PlusCircle className="h-4 w-4" />
              Create Listing
            </Button>
          </Link>
        </div>
      </motion.div>
      
      {/* Add stats components below navbar */}
      {!loading && listings.length > 0 && (
        <div className="space-y-6 mb-8">
          <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
            <RecyclabilityStats listings={listings} />
          </div>
          
          <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
            <EnvironmentalImpactStats listings={listings} />
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="shadow-md border-none overflow-hidden mb-6">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg border-b border-emerald-100">
              <CardTitle className="text-xl text-emerald-700 flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {/* Material Types Filter */}
                <div>
                  <h3 className="font-medium text-emerald-800 mb-3">Material Type</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {materialTypes.map(type => (
                      <div key={type.id} className="flex items-center">
                        <button
                          onClick={() => toggleMaterialType(type.id)}
                          className={`flex items-center w-full p-2 rounded-md text-sm transition-colors ${
                            selectedMaterialTypes.includes(type.id) 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-sm mr-2 flex-shrink-0 ${
                            selectedMaterialTypes.includes(type.id) 
                              ? 'bg-emerald-500' 
                              : 'border border-gray-400'
                          }`} />
                          <span>{type.name}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Categories Filter */}
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="font-medium text-emerald-800 mb-3">Categories</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {categories.map(category => (
                      <div key={category} className="flex items-center">
                        <button
                          onClick={() => toggleCategory(category)}
                          className={`flex items-center w-full p-2 rounded-md text-sm transition-colors ${
                            selectedCategories.includes(category) 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-sm mr-2 flex-shrink-0 ${
                            selectedCategories.includes(category) 
                              ? 'bg-emerald-500' 
                              : 'border border-gray-400'
                          }`} />
                          <span>{category}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Clear Filters Button */}
                {(selectedMaterialTypes.length > 0 || selectedCategories.length > 0) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearFilters}
                      className="w-full justify-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    >
                      <X className="h-3 w-3" />
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
              <span className="ml-3 text-gray-500">Loading listings...</span>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-20">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Listings Found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                {selectedMaterialTypes.length > 0 || selectedCategories.length > 0
                  ? "No listings match your current filters. Try adjusting your filter criteria."
                  : "There are no listings available at the moment. Check back later or create your own listing."
                }
              </p>
              <Button asChild>
                <Link to="/create-listing">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Listing
                </Link>
              </Button>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredListings.map((listing) => (
                <motion.div key={listing.id} variants={itemVariants}>
                  <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow border-none shadow-md">
                    <div className="relative h-48 bg-gray-100">
                      {listing.image_url ? (
                        <img 
                          src={listing.image_url}
                          alt={listing.title} 
                          className="h-48 w-full object-cover rounded-t-md"
                          onError={(e) => {
                            console.error("Failed to load listing image:", listing.image_url);
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/400x300/e2e8f0/1e293b?text=Image+Load+Error";
                          }}
                        />
                      ) : (
                        <div className="h-48 w-full flex flex-col items-center justify-center bg-gray-100">
                          <Package className="h-16 w-16 text-gray-300" />
                          <p className="text-gray-400 mt-2">No image</p>
                        </div>
                      )}
                      
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                        <div className="flex justify-between items-center">
                          <Badge className="bg-teal-500 hover:bg-teal-600">
                            {listing.material_type?.name || "Unknown"}
                          </Badge>
                          <Badge variant="outline" className="bg-white">
                            {listing.material_type?.category || "Uncategorized"}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="absolute top-3 right-3">
                        <Badge className="text-lg font-semibold px-3 py-1 bg-white text-teal-700 border border-teal-200 shadow-sm">
                          ₹{listing.listed_price}/{listing.unit}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-2">
                      <CardTitle className="line-clamp-1 text-lg">{listing.title}</CardTitle>
                    </CardHeader>
                    
                    <CardContent className="pb-4 flex-1">
                      <p className="text-gray-500 text-sm line-clamp-2 min-h-[40px]">
                        {listing.description || "No description provided."}
                      </p>
                      <div className="mt-4 flex items-center gap-4">
                        <div>
                          <span className="text-lg font-bold text-teal-600">₹{listing.listed_price}</span>
                          <span className="text-gray-500 text-xs ml-1">per {listing.unit}</span>
                        </div>
                        <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200">
                          {listing.quantity} {listing.unit}
                        </Badge>
                      </div>
                      
                      <div className="mt-4">
                        <ListingRecyclabilityBreakdown listing={listing} />
                      </div>

                      <div className="flex mt-3 text-sm text-gray-500">
                        <div className="flex items-center mr-4">
                          <Package className="h-4 w-4 mr-1" />
                          <span>{listing.quantity} {listing.unit}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-0 pb-4">
                      <div className="w-full grid grid-cols-2 gap-2">
                        <Button variant="outline" asChild>
                          <Link to={`/pickup/${listing.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </Button>
                        
                        {user && listing.seller_id === user.id ? (
                          // Show edit and mark as sold buttons for user's own listings
                          listing.status === 'active' ? (
                            <Button 
                              onClick={() => handleMarkAsSold(listing.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Mark as Sold
                            </Button>
                          ) : (
                            <Button asChild variant="secondary">
                              <Link to={`/edit-listing/${listing.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Listing
                              </Link>
                            </Button>
                          )
                        ) : (
                          // Show buy button for listings that aren't user's own
                          <Button asChild>
                            <Link to={`/pickup/${listing.id}`}>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Buy
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Wallet Connect Dialog */}
      <WalletConnectDialog 
        open={showWalletDialog} 
        onOpenChange={setShowWalletDialog}
        onSuccess={handleWalletSuccess}
      />
    </div>
  );
};

export default Listings;