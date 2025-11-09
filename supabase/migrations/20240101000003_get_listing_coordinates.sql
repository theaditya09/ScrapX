-- Create function to get a single listing with coordinates and related data
-- This function returns a JSON object with all listing details including nested objects
CREATE OR REPLACE FUNCTION public.get_listing_coordinates(listing_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Build the complete result JSON with all related data
  SELECT json_build_object(
    'id', l.id,
    'title', l.title,
    'description', l.description,
    'listed_price', l.listed_price,
    'status', l.status,
    'created_at', l.created_at::text,
    'seller_id', l.seller_id,
    'material_type_id', l.material_type_id,
    'latitude', CASE 
      WHEN l.geolocation IS NOT NULL THEN 
        ST_Y(l.geolocation::geometry)
      ELSE NULL
    END,
    'longitude', CASE 
      WHEN l.geolocation IS NOT NULL THEN 
        ST_X(l.geolocation::geometry)
      ELSE NULL
    END,
    'quantity', l.quantity,
    'unit', l.unit,
    'image_url', l.image_url,
    'address', l.address,
    'classification', l.classification,
    'confidence', l.confidence,
    'weight_estimation', l.weight_estimation,
    'material_type', CASE 
      WHEN mt.id IS NOT NULL THEN json_build_object(
        'id', mt.id,
        'name', mt.name,
        'category', mt.category,
        'description', mt.description
      )
      ELSE NULL
    END,
    'profiles', CASE 
      WHEN p.id IS NOT NULL THEN json_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'avatar_url', p.avatar_url
      )
      ELSE NULL
    END,
    'geolocation', CASE 
      WHEN l.geolocation IS NOT NULL THEN
        json_build_object(
          'type', 'Point',
          'coordinates', json_build_array(
            ST_X(l.geolocation::geometry),
            ST_Y(l.geolocation::geometry)
          )
        )
      ELSE NULL
    END,
    'is_donation', COALESCE(l.is_donation, false),
    'ngo_id', l.ngo_id,
    'ngo', CASE 
      WHEN n.id IS NOT NULL THEN json_build_object(
        'id', n.id,
        'name', n.name,
        'description', n.description
      )
      ELSE NULL
    END
  ) INTO result
  FROM scrap_listings l
  LEFT JOIN material_types mt ON l.material_type_id = mt.id
  LEFT JOIN profiles p ON l.seller_id = p.id
  LEFT JOIN ngos n ON l.ngo_id = n.id
  WHERE l.id = listing_id;
  
  RETURN result;
END;
$$;

-- Comment on function
COMMENT ON FUNCTION public.get_listing_coordinates IS 'Returns a single listing with coordinates, material type, profile, and NGO information as JSON';

