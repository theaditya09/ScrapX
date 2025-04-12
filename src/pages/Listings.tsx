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
import { DEFAULT_SCRAP_IMAGE } from "@/components/listing/ImageUploader";
import WalletConnectDialog from "@/components/wallet/WalletConnectDialog";

interface MaterialType {
  id: string;
  name: string;
  category: string;
}

interface ScrapListing {
  id: string;
  title: string;
  description: string | null;
  material_type_id: string;
  quantity: number;
  unit: string;
  listed_price: number;
  address: string | null;
  image_url: string | null;
  geolocation: any;
  status: string;
  created_at: string;
  updated_at: string;
  seller_id: string;
  material_type?: {
    id: string;
    name: string;
    category: string;
  } | null;
}

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
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  
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
    setSelectedListingId(id);
    setShowWalletDialog(true);
  };
  
  const handleWalletSuccess = async () => {
    if (!selectedListingId) return;
    
    try {
      const { error } = await supabase
        .from('scrap_listings')
        .update({ status: 'sold' })
        .eq('id', selectedListingId)
        .eq('seller_id', user?.id);
      
      if (error) throw error;
      
      // Update local state
      setListings(
        listings.map(listing => 
          listing.id === selectedListingId ? { ...listing, status: 'sold' } : listing
        )
      );
      
      toast({
        title: "Success",
        description: "Listing has been marked as sold and you've received your reward!",
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
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="shadow-md border-none overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-t-lg border-b border-emerald-100">
              <CardTitle className="text-xl text-emerald-700 flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Material Types Filter */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-emerald-800 mb-3">Material Type</h3>
                  <div className="space-y-2">
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
                          }`}>
                            {selectedMaterialTypes.includes(type.id) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <span>{type.name}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Categories Filter */}
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="font-medium text-emerald-800 mb-3">Categories</h3>
                  <div className="space-y-2">
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
                          }`}>
                            {selectedCategories.includes(category) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
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
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
              <h3 className="font-medium flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Error Loading Listings
              </h3>
              <p className="mt-1 text-sm">{error}</p>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2 text-red-700 border-red-200 hover:bg-red-50"
                onClick={fetchData}
              >
                Try Again
              </Button>
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-emerald-500" />
                <p className="mt-4 text-emerald-600">Loading listings...</p>
              </div>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-emerald-400 mb-4" />
              <h3 className="text-lg font-medium text-emerald-800">No Listings Found</h3>
              <p className="text-emerald-600/70 mt-2">
                {selectedMaterialTypes.length > 0 || selectedCategories.length > 0 
                  ? "Try changing your filter criteria" 
                  : "There are no listings available at the moment."
                }
              </p>
              {(selectedMaterialTypes.length > 0 || selectedCategories.length > 0) && (
                <Button 
                  variant="link" 
                  onClick={clearFilters}
                  className="mt-2 text-emerald-600"
                >
                  Clear Filters
                </Button>
              )}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-emerald-600 mb-2">Want to sell your scrap?</p>
                <Link to="/create-listing">
                  <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-none">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create a New Listing
                  </Button>
                </Link>
              </div>
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
                    <div className="h-48 overflow-hidden bg-gray-100 relative">
                      {listing.image_url ? (
                        <img 
                          src={listing.image_url}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error("Failed to load listing image:", listing.image_url);
                            const target = e.target as HTMLImageElement;
                            target.src = DEFAULT_SCRAP_IMAGE;
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gray-100">
                          <Package className="h-16 w-16 text-gray-300" />
                        </div>
                      )}
                      <Badge 
                        className={`absolute top-2 right-2 ${
                          listing.status === 'active' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-none' :
                          listing.status === 'sold' ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-none' : 
                          'bg-gradient-to-r from-yellow-500 to-yellow-600 border-none'
                        }`}
                      >
                        {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <CardHeader className="pb-2 pt-4">
                      <CardTitle className="text-lg line-clamp-1 text-emerald-800">{listing.title}</CardTitle>
                    </CardHeader>
                    
                    <CardContent className="pb-4 flex-1">
                      <div className="flex items-center text-emerald-600/70 text-sm mb-2">
                        <Package className="h-4 w-4 mr-2 text-emerald-500" />
                        <span>
                          {listing.material_type?.name || "Unknown Material"}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-emerald-600/70 text-sm mb-2">
                        <MapPin className="h-4 w-4 mr-2 text-emerald-500" />
                        <span className="line-clamp-1">
                          {listing.address || "Location not specified"}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-emerald-600/70 text-sm mb-2">
                        <Calendar className="h-4 w-4 mr-2 text-emerald-500" />
                        <span>
                          {new Date(listing.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="mt-3 text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        ₹{listing.listed_price}/{listing.unit}
                      </div>
                      <div className="text-sm text-emerald-600/70">
                        Quantity: {listing.quantity} {listing.unit}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-0 pb-4">
                      <div className="flex items-center gap-2 w-full">
                        <Link to={`/listings/${listing.id}`} className="flex-1">
                          <Button variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        
                        {user && listing.status === 'active' && listing.seller_id !== user.id && (
                          <Link to={`/listings/${listing.id}`} className="flex-1">
                            <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-none">
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Buy
                            </Button>
                          </Link>
                        )}
                        
                        {user && listing.seller_id === user.id && listing.status === 'active' && (
                          <Button 
                            variant="default" 
                            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-none"
                            onClick={() => handleMarkAsSold(listing.id)}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Mark Sold
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
