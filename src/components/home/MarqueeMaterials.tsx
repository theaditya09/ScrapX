import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { Marquee } from "@/components/magicui/marquee";
import { cn } from "@/lib/utils";

type MaterialType = Database['public']['Tables']['material_types']['Row'];

interface MarqueeMaterialsProps {
  materials: MaterialType[];
  loading: boolean;
}

const getCategoryImage = (category: string): string => {
  // Normalize the category name to handle case sensitivity
  const normalizedCategory = category?.trim() || '';
  
  const imageMap: { [key: string]: string } = {
    'Biological': '/features_img/biological.jpg',
    'Clothes': '/features_img/clothes.jpg',
    'Electronics': '/features_img/electric.jpg',
    'Electronic': '/features_img/electric.jpg',
    'Electronic Waste': '/features_img/electric.jpg',
    'Electric': '/features_img/electric.jpg',
    'Electrical': '/features_img/electric.jpg',
    'Electrical Waste': '/features_img/electric.jpg',
    'E-Waste': '/features_img/electric.jpg',
    'Metal': '/features_img/metal.jpg',
    'Paper': '/features_img/paper.jpg',
    'Plastic': '/features_img/plastic.jpeg',
    'Glass': '/features_img/glass.jpg'
  };

  // Try exact match first
  const selectedImage = imageMap[normalizedCategory];
  if (!selectedImage) {
    // Try case-insensitive match as fallback
    const lowerCategory = normalizedCategory.toLowerCase();
    const matchingKey = Object.keys(imageMap).find(key => key.toLowerCase() === lowerCategory);
    if (matchingKey) {
      return imageMap[matchingKey];
    }
  }

  return selectedImage || '/features_img/image.png';
};

const MaterialCard = ({
  material,
}: {
  material: MaterialType;
}) => {
  return (
    <div 
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-xl mx-3 h-64 w-56 group",
        "border border-gray-200/50 shadow-md hover:shadow-xl transition-all duration-300"
      )}
    >
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={getCategoryImage(material.category)} 
          alt={material.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/features_img/image.png";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col items-start">
        <span className="inline-block bg-emerald-600/80 text-white text-xs px-2 py-1 rounded-full mb-2">
          {material.category}
        </span>
        <h3 className="text-xl font-bold text-white drop-shadow-md mb-1">
          {material.name}
        </h3>
        <p className="text-sm text-white/80 line-clamp-2 mb-3">
          {material.description || `Recyclable ${material.name} materials`}
        </p>
      </div>
    </div>
  );
};

export function MarqueeMaterials({ materials, loading }: MarqueeMaterialsProps) {
  // Create a fallback if no materials are available
  const fallbackMaterials = [
    { id: 'paper', name: 'Paper', category: 'Paper', description: 'Newspapers, magazines, office paper' },
    { id: 'plastic', name: 'Plastic', category: 'Plastic', description: 'Bottles, containers, packaging' },
    { id: 'metal', name: 'Metal', category: 'Metal', description: 'Cans, aluminum, scrap metal' },
    { id: 'electronic', name: 'Electronics', category: 'Electronic', description: 'Old devices, cables, batteries' },
    { id: 'clothes', name: 'Textiles', category: 'Clothes', description: 'Old clothing, fabrics, linens' },
    { id: 'biological', name: 'Organic Waste', category: 'Biological', description: 'Compostable materials, food waste' },
  ];
  
  // Use materials from the database or fallback if none available
  const displayMaterials = materials?.length > 0 ? materials : fallbackMaterials;
    
  // Create two separate arrays for the two rows
  const firstRowMaterials = displayMaterials.slice(0, Math.ceil(displayMaterials.length / 2));
  const secondRowMaterials = displayMaterials.slice(Math.ceil(displayMaterials.length / 2));

  return (
    <section className="py-16 bg-gradient-to-b from-white to-teal-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-emerald-800 via-teal-600 to-teal-400 font-heading mb-4 drop-shadow-sm">
            Materials We Accept
          </h2>
          <div className="mt-6 h-2 w-40 bg-gradient-to-r from-emerald-800 via-teal-600 to-teal-400 mx-auto rounded-full opacity-80" />
          <p className="mt-8 text-xl text-emerald-800/80 max-w-3xl mx-auto leading-relaxed font-light">
            Redefining recycling with tech-powered simplicity, sustainability, and rewards.
          </p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-md"
              />
            ))}
          </div>
        ) : (
          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden mb-8">
            <div className="w-full overflow-hidden py-4">
              <Marquee pauseOnHover className="[--duration:30s] [--gap:2rem]">
                {firstRowMaterials.map((material) => (
                  <MaterialCard key={material.id} material={material} />
                ))}
              </Marquee>
            </div>
            
            <div className="w-full overflow-hidden py-4 mt-4">
              <Marquee reverse pauseOnHover className="[--duration:25s] [--gap:2rem]">
                {secondRowMaterials.map((material) => (
                  <MaterialCard key={material.id} material={material} />
                ))}
              </Marquee>
            </div>
            
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-teal-50 to-transparent z-10"></div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-teal-50 to-transparent z-10"></div>
          </div>
        )}
      </div>
    </section>
  );
}

export default MarqueeMaterials; 