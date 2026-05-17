import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Loader2, Server } from "lucide-react";

export const BedrockTest = () => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async () => {
    if (!query) return;
    
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Step 2 from The Aetherium Circuit: Transmission to Serverless Bridge
      const res = await fetch("/api/v1/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch response");
      }

      setResponse(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-8 border-2 border-indigo-100 shadow-sm">
      <CardHeader className="bg-indigo-50/50 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-600" />
              The Aetherium Circuit Test
            </CardTitle>
            <CardDescription className="mt-1">
              Verify the secure <strong>Serverless Bridge</strong> from the PDF payload.
            </CardDescription>
          </div>
          <div className="px-2 py-1 text-xs font-bold uppercase tracking-wider bg-green-100 text-green-700 rounded shadow-sm flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            Bedrock Online
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex gap-2 mb-4">
          <Input 
            placeholder="Send a prompt through the secure bridge..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuery()}
            disabled={loading}
          />
          <Button onClick={handleQuery} disabled={loading || !query} className="bg-indigo-600 hover:bg-indigo-700">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bot className="w-4 h-4 mr-2" />}
            Query Forge
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded text-sm border border-red-200">
            <strong>Error:</strong> {error}
          </div>
        )}

        {response && (
          <div className="p-4 bg-gray-900 text-gray-50 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap leading-relaxed shadow-inner">
            {response}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
