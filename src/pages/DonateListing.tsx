import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Heart, Package, Upload as UploadIcon, Gift, Building, Pencil, FileText, Hash } from "lucide-react";
import { motion } from "framer-motion";
import { uploadImageToGitHub } from '@/integrations/github/imageUploader';
import { Badge } from "@/components/ui/badge";

// Pre-defined donation categories
const DONATION_CATEGORIES = [
  { id: "books", name: "Books & Educational Materials", icon: <FileText className="h-4 w-4" /> },
  { id: "clothes", name: "Clothes & Textiles", icon: <Package className="h-4 w-4" /> },
  { id: "electronics", name: "Electronics & Appliances", icon: <Package className="h-4 w-4" /> },
  { id: "furniture", name: "Furniture", icon: <Package className="h-4 w-4" /> },
  { id: "toys", name: "Toys & Games", icon: <Gift className="h-4 w-4" /> },
  { id: "kitchenware", name: "Kitchenware", icon: <Package className="h-4 w-4" /> },
  { id: "other", name: "Other Items", icon: <Package className="h-4 w-4" /> }
];

// Hardcoded NGO information
const HARDCODED_NGOS = [
  { 
    id: "ngo1", 
    name: "Hope Foundation", 
    description: "Supporting underprivileged children with education and basic necessities",
    address: "123 Main St, Chennai, Tamil Nadu",
    color: "bg-emerald-100 text-emerald-800"
  },
  { 
    id: "ngo2", 
    name: "Green Earth Initiative", 
    description: "Environmental conservation and sustainable living",
    address: "456 Park Avenue, Chennai, Tamil Nadu",
    color: "bg-green-100 text-green-800"
  },
  { 
    id: "ngo3", 
    name: "Community Care Center", 
    description: "Providing support to local communities in need",
    address: "789 River Road, Chennai, Tamil Nadu",
    color: "bg-teal-100 text-teal-800"
  },
  { 
    id: "ngo4", 
    name: "Rising Star Foundation", 
    description: "Helping youth develop skills for a better future",
    address: "101 Tech Park, Chennai, Tamil Nadu",
    color: "bg-lime-100 text-lime-800"
  }
];

interface NGO {
  id: string;
  name: string;
  description: string;
  address: string;
  color: string;
}

const DonateListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [donationCategory, setDonationCategory] = useState(DONATION_CATEGORIES[0].id);
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [selectedNgo, setSelectedNgo] = useState(HARDCODED_NGOS[0].id);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to donate items",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
  }, [user, navigate]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setImageFile(file);
    
    // Create a preview URL for immediate display
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setImageUrl(localUrl); // Initially set this to local URL
    
    toast({
      title: "Image Selected",
      description: "Your image has been selected and will be uploaded when you submit",
    });
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    
    try {
      setUploadingImage(true);
      
      // Upload to GitHub
      const githubUrl = await uploadImageToGitHub(imageFile);
      setImageUrl(githubUrl);
      
      return githubUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Image Upload Error",
        description: "Failed to upload image, but continuing with donation listing",
        variant: "destructive",
      });
      return previewUrl; // Use the local URL as fallback
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to donate items",
        variant: "destructive",
      });
      return;
    }
    
    if (!title || !description || !donationCategory || !selectedNgo) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Upload image if available
      let finalImageUrl = imageUrl;
      if (imageFile) {
        finalImageUrl = await uploadImage() || "";
      }
      
      // Get the selected NGO
      const ngo = HARDCODED_NGOS.find(n => n.id === selectedNgo);
      
      // Create donation listing
      const { data, error } = await supabase
        .from('scrap_listings')
        .insert({
          title,
          description,
          material_type_id: donationCategory, // Using category as material type ID for simplicity
          quantity,
          unit: "item", // Fixed unit for donations
          listed_price: 0, // Donations are free
          seller_id: user.id,
          image_url: finalImageUrl || null,
          status: 'active',
          is_donation: true,
          ngo_id: selectedNgo,
          address: ngo?.address || "NGO Address"
        })
        .select();
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Your donation has been listed successfully!",
      });
      
      // Redirect to the listings page
      navigate("/my-listings");
    } catch (error) {
      console.error("Error creating donation listing:", error);
      toast({
        title: "Error",
        description: "Failed to create donation listing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCategory = () => {
    return DONATION_CATEGORIES.find(c => c.id === donationCategory) || DONATION_CATEGORIES[0];
  };

  const getSelectedNgo = () => {
    return HARDCODED_NGOS.find(n => n.id === selectedNgo) as NGO;
  };

  if (!user) {
    return null; // Already handled in useEffect
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-emerald-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Donate Items</h1>
          </div>
          <Badge variant="outline" className="px-3 py-1 text-teal-500 border-teal-200 bg-teal-50">
            Making a Difference
          </Badge>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Form Card */}
          <div className="md:col-span-2">
            <Card className="border-none shadow-md">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg border-b border-emerald-100">
                <CardTitle className="text-2xl text-emerald-700 flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Donation Details
                </CardTitle>
                <CardDescription className="text-emerald-600/70">
                  Share information about the items you'd like to donate
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-5">
                    {/* Category Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="donation-category" className="text-sm font-medium flex items-center gap-2">
                        <Package className="h-4 w-4 text-emerald-500" />
                        <span>Item Category</span>
                      </Label>
                      <Select 
                        value={donationCategory} 
                        onValueChange={setDonationCategory}
                      >
                        <SelectTrigger className="bg-white border-emerald-200 hover:border-emerald-300 focus:ring-emerald-200">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {DONATION_CATEGORIES.map(category => (
                            <SelectItem key={category.id} value={category.id} className="flex items-center gap-2">
                              <div className="flex items-center gap-2">
                                {category.icon}
                                {category.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-emerald-500/70 italic mt-1">
                        Currently donating: {getSelectedCategory().name}
                      </p>
                    </div>
                    
                    {/* Item Name */}
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                        <Pencil className="h-4 w-4 text-emerald-500" />
                        <span>Item Name</span>
                      </Label>
                      <div className="relative">
                        <input
                          id="title"
                          className="flex h-10 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-emerald-300 focus:border-emerald-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-300 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Enter a title for your donation"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-emerald-500" />
                        <span>Description</span>
                      </Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the items you're donating..."
                        className="min-h-[120px] border-emerald-200 focus:border-emerald-300 placeholder:text-emerald-300 focus-visible:ring-emerald-300"
                        required
                      />
                    </div>
                    
                    {/* Quantity */}
                    <div className="space-y-2">
                      <Label htmlFor="quantity" className="text-sm font-medium flex items-center gap-2">
                        <Hash className="h-4 w-4 text-emerald-500" />
                        <span>Quantity</span>
                      </Label>
                      <div className="relative">
                        <input
                          id="quantity"
                          className="flex h-10 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-emerald-300 focus:border-emerald-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-300 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value))}
                          required
                        />
                      </div>
                      <p className="text-xs text-emerald-500/70 italic mt-1">
                        Number of items you're donating
                      </p>
                    </div>
                    
                    {/* Image Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="image" className="text-sm font-medium flex items-center gap-2">
                        <UploadIcon className="h-4 w-4 text-emerald-500" />
                        <span>Upload Images</span>
                      </Label>
                      <div className="flex items-center gap-4">
                        <label className="flex flex-1 min-h-32 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-6 text-center hover:bg-emerald-50 transition-colors">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <UploadIcon className="h-8 w-8 text-emerald-400" />
                            <span className="text-sm font-medium text-emerald-600">
                              {uploadingImage ? "Uploading..." : "Click to upload images"}
                            </span>
                            <span className="text-xs text-emerald-500/70">
                              PNG, JPG or JPEG (max 5MB)
                            </span>
                          </div>
                          <input
                            id="image"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                            disabled={uploadingImage}
                          />
                        </label>
                        
                        {previewUrl && (
                          <div className="relative h-32 w-32 overflow-hidden rounded-md border border-emerald-200 shadow-sm">
                            <img 
                              src={previewUrl} 
                              alt="Preview" 
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-none h-12 text-base font-medium"
                    disabled={loading || uploadingImage}
                  >
                    {loading || uploadingImage ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {uploadingImage ? "Uploading Image..." : "Creating Donation..."}
                      </>
                    ) : (
                      <>
                        <Heart className="mr-2 h-5 w-5 text-white" />
                        Donate Items
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          
          {/* NGO Selection Side Panel */}
          <div className="md:col-span-1">
            <Card className="border-none shadow-md">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-lg border-b border-emerald-100">
                <CardTitle className="text-xl text-emerald-700 flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Select NGO
                </CardTitle>
                <CardDescription className="text-emerald-600/70">
                  Choose an organization to receive your donation
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <Select 
                    value={selectedNgo} 
                    onValueChange={setSelectedNgo}
                  >
                    <SelectTrigger className="bg-white border-emerald-200 hover:border-emerald-300 focus:ring-emerald-200">
                      <SelectValue placeholder="Select an NGO" />
                    </SelectTrigger>
                    <SelectContent>
                      {HARDCODED_NGOS.map(ngo => (
                        <SelectItem key={ngo.id} value={ngo.id}>
                          {ngo.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* NGO Information Display */}
                  {selectedNgo && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`mt-4 rounded-lg p-5 border ${getSelectedNgo().color.replace('text-', 'border-')}`}
                    >
                      <Badge className={`mb-3 ${getSelectedNgo().color}`}>
                        {getSelectedNgo().name}
                      </Badge>
                      
                      <p className="text-sm text-gray-700 mb-3">
                        {getSelectedNgo().description}
                      </p>
                      
                      <div className="flex items-start gap-2 text-gray-600">
                        <Building className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">
                          {getSelectedNgo().address}
                        </p>
                      </div>
                      
                      <div className="mt-5 pt-5 border-t border-gray-100">
                        <p className="text-xs text-emerald-600 italic flex items-center gap-1">
                          <Heart className="h-3 w-3 text-emerald-800" />
                          Your donations make a difference!
                        </p>
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="rounded-lg bg-emerald-50/50 p-4 mt-6 border border-emerald-100">
                    <h3 className="text-sm font-medium text-emerald-700 mb-2">Why Donate?</h3>
                    <ul className="text-xs text-emerald-700/80 space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-emerald-100 p-1 mt-0.5">
                          <Heart className="h-2 w-2 text-emerald-800" />
                        </div>
                        <span>Help communities in need</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-emerald-100 p-1 mt-0.5">
                          <Heart className="h-2 w-2 text-emerald-800" />
                        </div>
                        <span>Reduce waste and support sustainability</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-emerald-100 p-1 mt-0.5">
                          <Heart className="h-2 w-2 text-emerald-800" />
                        </div>
                        <span>Give items a second life</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DonateListing; 