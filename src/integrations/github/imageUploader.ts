import { toast } from "@/components/ui/use-toast";

/**
 * Uploads an image to GitHub repository and returns the public URL
 * This function uses GitHub API to upload the image to the specified repository
 * 
 * @param file - The file object to upload
 * @returns Promise with the URL of the uploaded image
 */
export const uploadImageToGitHub = async (file: File): Promise<string> => {
  try {
    // Get environment variables for GitHub integration
    const token = import.meta.env.VITE_GITHUB_TOKEN;
    const username = import.meta.env.VITE_GITHUB_USERNAME;
    const repo = import.meta.env.VITE_GITHUB_REPO;

    if (!token || !username || !repo) {
      console.error("Missing GitHub environment variables");
      throw new Error("GitHub configuration is incomplete. Check your environment variables.");
    }

    // Generate a unique filename with timestamp
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}_${randomString}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Path in the repository where images will be stored
    const path = `images/${fileName}`;
    
    // Convert the file to base64
    const reader = new FileReader();
    const base64Content = await new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        // Extract base64 content (remove the data:image/xxx;base64, part)
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    
    // GitHub API request to create a file
    const response = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Upload image: ${fileName}`,
        content: base64Content,
        branch: 'main', // or your default branch name
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("GitHub API error:", errorData);
      throw new Error(`Failed to upload to GitHub: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Use jsDelivr CDN URL for better CORS support
    // Format: https://cdn.jsdelivr.net/gh/username/repo@branch/path
    const jsdelivrUrl = `https://cdn.jsdelivr.net/gh/${username}/${repo}@main/${path}`;
    
    console.log("Image uploaded to GitHub successfully:", jsdelivrUrl);
    return jsdelivrUrl;
    
  } catch (error) {
    console.error("Error uploading image to GitHub:", error);
    toast({
      title: "Upload Error",
      description: error.message || "Failed to upload image to GitHub",
      variant: "destructive",
    });
    throw error;
  }
}; 