import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const DiagnosticPage = () => {
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"untested" | "success" | "error">("untested");
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableData, setTableData] = useState<any[]>([]);
  const [queryResult, setQueryResult] = useState<any>(null);

  const testConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Testing Supabase connection...");
      
      // Simple query to test connection
      const { data, error } = await supabase.from("_tables").select("name");
      
      if (error) {
        console.error("Connection error:", error);
        setConnectionStatus("error");
        setError(error.message);
        throw error;
      }
      
      console.log("Connection successful:", data);
      setConnectionStatus("success");
      setTables(data.map((t: any) => t.name).sort());
    } catch (err: any) {
      console.error("Test connection error:", err);
      setConnectionStatus("error");
      setError(err.message || "Connection failed");
      toast({
        title: "Connection Error",
        description: err.message || "Failed to connect to Supabase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (tableName: string) => {
    if (!tableName) return;
    
    try {
      setLoading(true);
      setError(null);
      setSelectedTable(tableName);
      
      console.log(`Loading data from table: ${tableName}`);
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .limit(10);
      
      if (error) {
        console.error(`Error loading table ${tableName}:`, error);
        setError(error.message);
        throw error;
      }
      
      console.log(`Loaded ${data?.length || 0} rows from ${tableName}`);
      setTableData(data || []);
    } catch (err: any) {
      console.error("Load table error:", err);
      setError(err.message || `Failed to load data from ${tableName}`);
      toast({
        title: "Data Loading Error",
        description: err.message || `Failed to load data from ${tableName}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const executeCustomQuery = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Executing diagnostics query for scrap_listings");
      
      // Execute a custom query to check scrap_listings
      const { data, error } = await supabase
        .from("scrap_listings")
        .select("id, title, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      
      if (error) {
        console.error("Custom query error:", error);
        setError(error.message);
        throw error;
      }
      
      console.log("Custom query result:", data);
      setQueryResult(data);
    } catch (err: any) {
      console.error("Custom query error:", err);
      setError(err.message || "Custom query failed");
      toast({
        title: "Query Error",
        description: err.message || "Failed to execute custom query",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check schema definitions
  const checkSchema = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get schema for scrap_listings table
      const { data, error } = await supabase.rpc("get_schema_definition", {
        table_name: "scrap_listings"
      });
      
      if (error) {
        console.error("Schema check error:", error);
        setError(error.message);
        throw error;
      }
      
      console.log("Schema definition:", data);
      setQueryResult(data);
    } catch (err: any) {
      console.error("Schema check error:", err);
      setError(err.message || "Schema check failed");
      toast({
        title: "Schema Check Error",
        description: err.message || "Failed to check schema",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Supabase Diagnostic Tool</h1>
      
      <div className="grid gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Connection Test</h2>
          
          <div className="flex items-center gap-4 mb-4">
            <Button 
              onClick={testConnection} 
              disabled={loading}
            >
              Test Connection
            </Button>
            
            {connectionStatus === "success" && (
              <span className="text-green-500 font-medium">✓ Connected</span>
            )}
            
            {connectionStatus === "error" && (
              <span className="text-red-500 font-medium">✗ Connection Failed</span>
            )}
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded text-red-700 text-sm mb-4">
              {error}
            </div>
          )}
          
          {tables.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Available Tables</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {tables.map(table => (
                  <Button 
                    key={table} 
                    variant="outline" 
                    onClick={() => loadTableData(table)}
                    className={selectedTable === table ? "border-primary" : ""}
                  >
                    {table}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Custom Queries</h2>
            
            <div className="space-y-4">
              <Button 
                onClick={executeCustomQuery} 
                disabled={loading}
                className="w-full"
              >
                Check Scrap Listings
              </Button>
              
              <Button 
                onClick={checkSchema} 
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                Check Schema Definition
              </Button>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Query Results</h2>
            
            {queryResult && (
              <pre className="bg-gray-50 p-4 rounded border border-gray-200 overflow-auto text-xs h-64">
                {JSON.stringify(queryResult, null, 2)}
              </pre>
            )}
            
            {!queryResult && (
              <div className="text-gray-500 text-center py-10">
                Run a query to see results
              </div>
            )}
          </div>
        </div>
        
        {tableData.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">
              Table Data: {selectedTable} 
              <span className="text-sm font-normal text-gray-500 ml-2">
                (showing up to 10 records)
              </span>
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {tableData.length > 0 && 
                      Object.keys(tableData[0]).map(key => (
                        <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {key}
                        </th>
                      ))
                    }
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableData.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value: any, i) => (
                        <td key={i} className="px-6 py-4 whitespace-nowrap text-sm">
                          {typeof value === 'object' 
                            ? JSON.stringify(value) 
                            : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosticPage; 