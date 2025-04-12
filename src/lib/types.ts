import { Database } from "./database.types";

export interface MaterialType {
  id: string;
  name: string;
  category: string;
  description: string | null;
}

export type ScrapListing = Database["public"]["Tables"]["scrap_listings"]["Row"] & {
  material_type?: MaterialType | null;
};