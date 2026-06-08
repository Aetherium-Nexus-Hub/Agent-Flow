import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GitBranch, 
  Github, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Terminal, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  Clock, 
  Server,
  Network
} from "lucide-react";

export const ResonanceScan = () => {
  const [repo, setRepo] = useState("Aetherium-Nexus-Hub/Agent-Flow");
  const [branch, setBranch] = useState("main");
  const [status, setStatus] = useState<"idle" | "connecting" | "syncing" | "scanning" | "success" | "error">("idle");
  const [response, setResponse] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const executeScan = async () => {
    if (!repo || !branch) {
      setErrorMsg("Repository and Branch paths are required.");
      return;
    }

    setResponse(null);
    setErrorMsg(null);
    setLogs([]);
    
    // Step-by-step connection simulation & real execution
    setStatus("connecting");
    addLog(`Establishing connection to Aetherium Nexus...`);
    
    await new Promise(r => setTimeout(r, 800));
    setStatus("syncing");
    addLog(`Syncing with GitHub repository: ${repo} [${branch}]`);

    await new Promise(r => setTimeout(r, 1000));
    setStatus("scanning");
    addLog(`Initializing Resonance Scan node on GitHub source...`);
    addLog(`POSTing payload to: https://aetheriumnexus.store/api/source/v0.1/resonance.scan`);

    try {
      const res = await fetch("/api/resonance/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repo, branch }),
      });

      const result = await res.json();
      addLog(`Resonance scan response received. HTTP Code: ${res.status}`);

      if (!res.ok) {
        throw new Error(
          result.data?.rawText?.trim() 
            ? `Server error: ${result.data.rawText}` 
            : `Endpoint returned HTTP ${res.status} error`
        );
      }

      setResponse(result);
      setStatus("success");
      addLog(`Scan completed successfully! Alignment matrices generated.`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Network connection to Aetherium Nexus timed out.");
      setStatus("error");
      addLog(`Scan failed: ${err.message || "Unknown Error"}`);
    }
  };

  return (
    <Card className="mt-8 border-2 border-indigo-100 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white pb-6">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center gap-2 font-semibold tracking-tight">
              <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
              Aetherium Nexus Scanner
            </CardTitle>
            <CardDescription className="text-slate-300 mt-1">
              Synchronize source code repositories and trigger automated dimensional resonance evaluations.
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className="border-indigo-500/50 text-indigo-300 bg-indigo-950/40 text-xs px-2.5 py-1 tracking-wide font-mono uppercase"
          >
            v0.1 Resonance
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5 text-zinc-500" />
              GitHub Repository
            </label>
            <Input 
              placeholder="e.g. owner/repo" 
              value={repo} 
              onChange={(e) => setRepo(e.target.value)}
              disabled={status !== "idle" && status !== "success" && status !== "error"}
              className="font-mono text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-zinc-500" />
              Branch / Ref
            </label>
            <Input 
              placeholder="e.g. main" 
              value={branch} 
              onChange={(e) => setBranch(e.target.value)}
              disabled={status !== "idle" && status !== "success" && status !== "error"}
              className="font-mono text-sm"
            />
          </div>
        </div>

        {/* Start / Action Controls */}
        <div className="flex gap-3 justify-end items-center">
          {status !== "idle" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatus("idle");
                setResponse(null);
                setErrorMsg(null);
                setLogs([]);
              }}
              className="text-xs"
              disabled={status === "connecting" || status === "syncing" || status === "scanning"}
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Reset Scanner
            </Button>
          )}
          <Button 
            onClick={executeScan} 
            disabled={status === "connecting" || status === "syncing" || status === "scanning"}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow font-semibold transition-all px-6"
          >
            {status === "connecting" || status === "syncing" || status === "scanning" ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Updating {status}...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Sync & Run Scan
              </>
            )}
          </Button>
        </div>

        {/* Active Stage Indicator */}
        {status !== "idle" && (
          <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Scan Pulse Status</span>
              <Badge 
                className={`text-[10px] font-mono font-bold uppercase ${
                  status === "success" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                  status === "error" ? "bg-rose-100 text-rose-800 border-rose-200" :
                  "bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse"
                }`}
              >
                {status}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {/* Stepper Visual indicators */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    status === "connecting" ? "bg-indigo-600 text-white animate-pulse" :
                    ["syncing", "scanning", "success", "error"].includes(status) ? "bg-indigo-100 text-indigo-700 border border-indigo-300" : "bg-zinc-200 text-zinc-500"
                  }`}>
                    1
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1">Connect</span>
                </div>
                <div className="h-[2px] bg-zinc-200 flex-1 -mt-4"></div>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    status === "syncing" ? "bg-indigo-600 text-white animate-pulse" :
                    ["scanning", "success", "error"].includes(status) ? "bg-indigo-100 text-indigo-700 border border-indigo-300" : "bg-zinc-200 text-zinc-500"
                  }`}>
                    2
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1">Sync</span>
                </div>
                <div className="h-[2px] bg-zinc-200 flex-1 -mt-4"></div>
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    status === "scanning" ? "bg-indigo-600 text-white animate-pulse" :
                    ["success", "error"].includes(status) ? "bg-indigo-100 text-indigo-700 border border-indigo-300" : "bg-zinc-200 text-zinc-500"
                  }`}>
                    3
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1">Scan</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Real-time Operation Logs */}
        {logs.length > 0 && (
          <div className="rounded-lg bg-zinc-950 text-zinc-50 p-4 border border-zinc-800 font-mono text-xs overflow-hidden leading-relaxed">
            <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5" /> Core Terminal Logs
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 scrollbar-thin">
              {logs.map((log, index) => (
                <div key={index} className={log.includes("failed") || log.includes("Scan failed") ? "text-rose-400" : log.includes("completed") ? "text-emerald-400" : "text-zinc-300"}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scan Outcome Section */}
        {status === "success" && response && (
          <div className="p-5 border-2 border-emerald-100 bg-emerald-50/20 rounded-xl space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-emerald-900 text-sm">Resonance Scan Synced</h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  The hub has registered alignment variables from the GitHub scan sequence successfully.
                </p>
              </div>
            </div>

            <div className="bg-zinc-900 text-zinc-100 p-4 rounded-lg overflow-x-auto text-[11px] font-mono leading-relaxed max-h-60 shadow-inner">
              <div className="text-[10px] text-emerald-400 font-bold mb-1.5 uppercase tracking-wider border-b border-zinc-800 pb-1">
                ALIGNMENT PAYLOAD DETECTED
              </div>
              <pre>{JSON.stringify(response, null, 2)}</pre>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="p-5 border-2 border-rose-100 bg-rose-50/30 rounded-xl space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-rose-950 text-sm">Resonance Scan Interrupted</h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  The system reached the proxy node, but the external source connection or API endpoint reported an error.
                </p>
              </div>
            </div>

            <div className="p-4 bg-zinc-900 text-zinc-300 rounded-lg text-xs leading-relaxed font-mono">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1 border-b border-zinc-800 pb-1">
                Error Details
              </div>
              <p className="text-rose-400 font-semibold mb-2">{errorMsg}</p>
              <div className="space-y-1 text-[10px] text-zinc-500">
                <p>💡 <strong>Troubleshooting suggestions:</strong></p>
                <p>1. Ensure your Aetherium nexus key or API node is fully operational.</p>
                <p>2. Verify if Github repository <code className="bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded text-[10px]">{repo}</code> is public or has correct permissions.</p>
                <p>3. Wait a minute and try clicking the "Sync & Run Scan" button again.</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="bg-zinc-50 border-t border-zinc-100 py-3 px-6 flex justify-between items-center text-[10px] text-zinc-400 font-medium">
        <span className="flex items-center gap-1">
          <Server className="w-3 h-3 text-zinc-400" /> API Endpoint: resonance.scan/v0.1
        </span>
        <span className="flex items-center gap-1">
          <Network className="w-3" /> Secure Bridge Online
        </span>
      </CardFooter>
    </Card>
  );
};
