import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  Cpu, 
  Database, 
  Play, 
  RotateCcw, 
  RefreshCw, 
  Server, 
  Sliders, 
  TrendingUp, 
  History, 
  Fingerprint, 
  Zap,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AetherCanonicalEvent, ChessMovePayload } from "../types/chess-event";

export const AetherChess = () => {
  // --- States ---
  const [boardState, setBoardState] = useState("r1bk3r/pppp1Qpp/8/2b1p3/2BnN3/8/PPPP1PPP/R1B2RK1 b - - 0 14");
  const [moveNotation, setMoveNotation] = useState("");
  const [currentMoveSequence, setCurrentMoveSequence] = useState(14);
  const [useRemoteEngine, setUseRemoteEngine] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Real-time Event Ledger
  const [events, setEvents] = useState<AetherCanonicalEvent<ChessMovePayload>[]>([]);
  // Offline Buffer for event deltas
  const [offlineBuffer, setOfflineBuffer] = useState<AetherCanonicalEvent<ChessMovePayload>[]>([]);
  
  // Console logs & Notifications
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    `[System] Neural Engine Lab [02] initialized.`,
    `[System] Current substrate: MacAir Local Core.`
  ]);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "info" | "success" | "error" } | null>(null);

  // Suggested moves for easy user interaction
  const suggestedMoves = [
    { notation: "Qxh7+", desc: "Aggressive S-Tier human tactical attack" },
    { notation: "d6", desc: "Solid positional defense" },
    { notation: "Nf5", desc: "Complex mid-game knight maneuver" },
    { notation: "IllegalMove??", desc: "Triggers verification rejection & local rollback" }
  ];

  // Helper to append log
  const addLog = (msg: string) => {
    setConsoleLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 49)]);
  };

  // Helper to generate a simulated chess board delta
  const generateNewFEN = (currentFEN: string, notation: string) => {
    // Generate some change in FEN based on move notation
    const segments = currentFEN.split(" ");
    const board = segments[0];
    const sequence = currentMoveSequence + 1;
    
    // Scramble the middle of the board slightly to show movement
    const scrambledBoard = board
      .replace("pppp", "p1p1p1")
      .replace("2BnN3", `2B1n3/${notation}`);
      
    return `${scrambledBoard} w - - 0 ${sequence}`;
  };

  // Submit Move Action (Optimistic rendering)
  const handlePlayMove = async (notationToPlay: string) => {
    const notation = (notationToPlay || moveNotation).trim();
    if (!notation) return;

    const eventId = `EVT_${Date.now()}`;
    const nextSequence = currentMoveSequence + 1;
    const newFEN = generateNewFEN(boardState, notation);

    // Create standard Canonical Event structure matching v1.1 Schema
    const pendingEvent: AetherCanonicalEvent<ChessMovePayload> = {
      eventId,
      timestamp: new Date().toISOString(),
      sourceNode: offlineMode ? 'OFFLINE_BUFFER_01' : 'NODE_MACAIR_01',
      eventType: 'CHESS_MOVE_SUBMITTED',
      instructionTags: [
        useRemoteEngine ? 'compute:remote:aistudio' : 'compute:local:macair',
        offlineMode ? 'telemetry:ledger:local' : 'telemetry:sync:firebase',
        'app:travguild:ranking'
      ],
      verification: {
        clientVerify: 'PENDING',
        clientHardwareSignature: '0xMACAIR_SECURE_HARDWARE_INTEGRITY_SHIELD',
      },
      payload: {
        matchId: 'MATCH_2026_06_28_ALPHA',
        moveSequence: nextSequence,
        notation: notation,
        playerType: 'human',
        playerIdentifier: 'ObservX',
        boardStateSnapshotDelta: newFEN
      }
    };

    addLog(`Ingesting move '${notation}' locally. Generating verification request...`);
    
    // 1. Optimistic UI Update
    setEvents(prev => [pendingEvent, ...prev]);
    setBoardState(newFEN);
    setCurrentMoveSequence(nextSequence);
    setMoveNotation("");

    // 2. Offline Mode Handling
    if (offlineMode) {
      setOfflineBuffer(prev => [...prev, pendingEvent]);
      addLog(`Offline Substrate active. Event ${eventId} buffered in local ledger.`);
      setStatusMessage({
        text: `Move '${notation}' registered and stored in offline ledger buffer.`,
        type: "info"
      });
      return;
    }

    // 3. Online Server-Side Attestation Handshake
    setIsVerifying(true);
    try {
      addLog(`POSTing pending event ${eventId} to server-side Attestation Route...`);
      const response = await fetch("/api/v1/aether/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ event: pendingEvent })
      });

      if (!response.ok) {
        throw new Error(`HTTP verification failed with status ${response.status}`);
      }

      const data = await response.json();
      const verifiedEvent: AetherCanonicalEvent<ChessMovePayload> = data.verifiedEvent;

      // Handle response based on JIT event validation
      if (verifiedEvent.verification.clientVerify === 'YES') {
        addLog(`Server-side attestation SUCCESS: Signature appended cleanly.`);
        setStatusMessage({
          text: `Move '${notation}' validated & hardened to live Firebase ledger!`,
          type: "success"
        });

        // Update local ledger event with hardened YES state
        setEvents(prev => prev.map(ev => ev.eventId === eventId ? verifiedEvent : ev));
      } else {
        // Verification 'NO' -> Rejection and Localized Rollback Protocol!
        addLog(`Server-side attestation REJECTED: '${notation}' is illegal!`);
        setStatusMessage({
          text: `Verification Rejected: ${verifiedEvent.verification.errorReason || 'Illegal move detected.'}`,
          type: "error"
        });

        // Trigger rollback with delay to let the user see the rejection animation
        setTimeout(() => {
          triggerRollback(eventId, verifiedEvent.verification.errorReason);
        }, 1000);
      }
    } catch (err: any) {
      addLog(`Network pipeline error: ${err.message || err}`);
      setStatusMessage({
        text: `Error contacting serverless bridge. Transitioning event to PENDING cache.`,
        type: "error"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Localized Rollback Protocol
  const triggerRollback = (failedEventId: string, errorReason?: string) => {
    addLog(`[Rollback] Triggering Localized Rollback Protocol for event: ${failedEventId}`);
    
    // Find the state prior to this invalid event
    // Since events are in reverse chronological order, we can filter out the rejected event
    setEvents(prev => {
      const filtered = prev.filter(ev => ev.eventId !== failedEventId);
      
      // Compute the last known valid event
      const lastValidEvent = filtered.find(ev => ev.verification.clientVerify === 'YES');
      if (lastValidEvent) {
        setBoardState(lastValidEvent.payload.boardStateSnapshotDelta);
        setCurrentMoveSequence(lastValidEvent.payload.moveSequence);
        addLog(`[Rollback] Reverted board layout projection to verified event ${lastValidEvent.eventId} (Sequence ${lastValidEvent.payload.moveSequence})`);
      } else {
        // Revert to initial
        setBoardState("r1bk3r/pppp1Qpp/8/2b1p3/2BnN3/8/PPPP1PPP/R1B2RK1 b - - 0 14");
        setCurrentMoveSequence(14);
        addLog(`[Rollback] Reverted board layout to original baseline starting coordinates.`);
      }
      return filtered;
    });
  };

  // Reconcile/Sync Offline Buffer
  const triggerOfflineReconciliation = async () => {
    if (offlineBuffer.length === 0) return;
    
    addLog(`[Reconciliation] Transitioning online. Ingesting ${offlineBuffer.length} buffered event(s)...`);
    const bufferToProcess = [...offlineBuffer];
    setOfflineBuffer([]); // Clear buffer

    for (const bufferedEvent of bufferToProcess) {
      try {
        addLog(`Processing buffered event: ${bufferedEvent.eventId}`);
        const response = await fetch("/api/v1/aether/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: bufferedEvent })
        });

        if (response.ok) {
          const data = await response.json();
          const verifiedEvent: AetherCanonicalEvent<ChessMovePayload> = data.verifiedEvent;
          
          setEvents(prev => prev.map(ev => ev.eventId === bufferedEvent.eventId ? verifiedEvent : ev));
          if (verifiedEvent.verification.clientVerify === 'YES') {
            addLog(`Ledger synced & hardened: ${bufferedEvent.payload.notation}`);
          } else {
            addLog(`Ledger rejected buffered illegal move: ${bufferedEvent.payload.notation}`);
            triggerRollback(bufferedEvent.eventId, verifiedEvent.verification.errorReason);
          }
        }
      } catch (err: any) {
        addLog(`Reconciliation error on event ${bufferedEvent.eventId}: ${err.message}`);
        // Put back in buffer
        setOfflineBuffer(prev => [...prev, bufferedEvent]);
      }
    }
    
    setStatusMessage({
      text: "Offline ledger synchronized cleanly with Remote Node.",
      type: "success"
    });
  };

  // Handle toggling of offline simulation
  useEffect(() => {
    if (!offlineMode && offlineBuffer.length > 0) {
      triggerOfflineReconciliation();
    }
  }, [offlineMode]);

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* HEADER SECTION - FULL SPAN */}
      <div className="lg:col-span-12 flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl border border-slate-800 text-white gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg animate-pulse">
              <Cpu className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">AetherChess Console v1.1</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Canonical Event Schema v1 • Sovereign Telemetry Control Lattice
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Substrate Status badges */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950/60 border border-slate-800 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${offlineMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-300">
              {offlineMode ? "Offline Substrate" : "Authoritative Node"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950/60 border border-slate-800 rounded-lg">
            <Server className="w-3 h-3 text-indigo-400" />
            <span className="text-[10px] font-mono text-slate-300">
              {useRemoteEngine ? "AI Studio Bridge" : "MacAir Substrate"}
            </span>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setOfflineMode(!offlineMode)}
            className={`text-xs h-7 border-slate-800 ${offlineMode ? 'bg-amber-950/50 hover:bg-amber-900/50 text-amber-200 border-amber-800/60' : 'bg-slate-900 hover:bg-slate-800 text-slate-300'}`}
          >
            {offlineMode ? <WifiOff className="w-3.5 h-3.5 mr-1" /> : <Wifi className="w-3.5 h-3.5 mr-1" />}
            {offlineMode ? "Re-engage Link" : "Disconnect Network"}
          </Button>
        </div>
      </div>

      {/* COLUMN 1: THE LOGIC LAYER (NEURAL ENGINE LAB [02]) */}
      <Card className="lg:col-span-4 border border-slate-200 shadow-sm flex flex-col justify-between">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Neural Engine Lab [02]
            </CardTitle>
            <Badge variant="outline" className="text-[9px] font-mono uppercase bg-indigo-50 text-indigo-700 border-indigo-200">
              Logic Layer
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Toggle client-side processing core vs. remote AI Studio verification bridge.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-4 space-y-4 flex-1">
          {/* Substrate Selector Switch */}
          <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Model Proving Ground Toggle
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => {
                  setUseRemoteEngine(false);
                  addLog("Substrate shifted to client-side Web Worker (compute:local:macair).");
                }}
                className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${!useRemoteEngine ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <Cpu className="w-3.5 h-3.5" />
                MacAir (Local)
              </button>
              <button 
                onClick={() => {
                  setUseRemoteEngine(true);
                  addLog("Substrate shifted to serverless bridge (compute:remote:aistudio).");
                }}
                className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${useRemoteEngine ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <Zap className="w-3.5 h-3.5" />
                AI Studio (Remote)
              </button>
            </div>
          </div>

          {/* Engine query simulator */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Direct Substrate Probe
            </label>
            <div className="flex gap-2">
              <Input 
                placeholder="Probe logic engine manually..."
                value={moveNotation}
                onChange={(e) => setMoveNotation(e.target.value)}
                className="text-xs h-8 font-mono"
              />
              <Button 
                onClick={() => handlePlayMove("")} 
                disabled={!moveNotation}
                className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3"
              >
                <Play className="w-3 h-3 mr-1" /> Inject
              </Button>
            </div>
          </div>

          {/* Preset Suggested moves */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide block">
              Suggested moves for Attestation Testing
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {suggestedMoves.map((m, i) => (
                <button
                  key={i}
                  onClick={() => handlePlayMove(m.notation)}
                  className={`w-full p-2 text-left rounded-lg text-xs border border-slate-100 transition-colors flex justify-between items-center ${m.notation.includes("Illegal") ? 'hover:bg-rose-50 hover:border-rose-200 bg-rose-50/20' : 'hover:bg-slate-100'}`}
                >
                  <div>
                    <span className="font-mono font-bold text-indigo-700">{m.notation}</span>
                    <p className="text-[10px] text-slate-500">{m.desc}</p>
                  </div>
                  <ChevronRightIcon className="w-3 h-3 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-slate-50 border-t border-slate-100 py-2.5 px-4 flex justify-between items-center text-[10px] text-slate-400 font-mono">
          <span>COMPUTE_POOL_ALLOC:</span>
          <span>{useRemoteEngine ? "compute:remote:aistudio" : "compute:local:macair"}</span>
        </CardFooter>
      </Card>

      {/* COLUMN 2: THE ACTIVE PLAY & VERIFICATION PORTAL (CENTER) */}
      <Card className="lg:col-span-5 border border-slate-200 shadow-sm flex flex-col justify-between">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Active Verification Board
            </CardTitle>
            <Badge variant="outline" className="text-[9px] font-mono uppercase bg-slate-100 text-slate-700 border-slate-200">
              Live play projection
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Tactile state delta observer. Submits state changes optimistically.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-4 flex-1 flex flex-col justify-center">
          {/* Active status messages banner */}
          <AnimatePresence mode="popLayout">
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                  statusMessage.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                  statusMessage.type === "error" ? "bg-rose-50 text-rose-800 border-rose-200" :
                  "bg-indigo-50 text-indigo-800 border-indigo-200"
                }`}
              >
                {statusMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> :
                 statusMessage.type === "error" ? <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" /> :
                 <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />}
                <p>{statusMessage.text}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mini Interactive Chess Board representation */}
          <div className="relative aspect-square w-full max-w-[260px] mx-auto bg-slate-900 border-4 border-slate-800 rounded-xl overflow-hidden shadow-md flex flex-col justify-between p-4">
            {/* Simulation of board coordinates */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-10 font-mono text-[9px] text-slate-300 p-2 select-none">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="border border-slate-600 flex items-center justify-center">
                  {String.fromCharCode(97 + (i % 4))}{(4 - Math.floor(i / 4))}
                </div>
              ))}
            </div>

            <div className="z-10 text-center py-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
                Aether Coordinates Delta
              </span>
              <div className="text-white font-mono text-xs font-semibold mt-1 bg-slate-950/70 p-2 rounded border border-slate-800 break-all select-all leading-normal">
                {boardState.split(" ")[0]}
              </div>
            </div>

            {/* Simulated chess pieces shifting visualization */}
            <div className="z-10 flex justify-center gap-4 py-3">
              <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-indigo-300 font-bold text-sm text-center">
                ♔ Human
                <p className="text-[9px] text-slate-400 font-normal mt-0.5 font-mono">ObservX</p>
              </div>
              <div className="p-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-300 font-bold text-sm text-center">
                ⚙ Substrate
                <p className="text-[9px] text-slate-400 font-normal mt-0.5 font-mono">
                  {useRemoteEngine ? "Gemini-2.5" : "MacAir Local"}
                </p>
              </div>
            </div>

            <div className="z-10 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-300">
              <span>Sequence: #{currentMoveSequence}</span>
              <span className={`w-2 h-2 rounded-full ${isVerifying ? 'bg-amber-500 animate-ping' : 'bg-green-500'}`}></span>
            </div>
          </div>

          {/* Disconnect buffers count indicator */}
          {offlineBuffer.length > 0 && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-800">
              <span className="flex items-center gap-1.5 font-medium">
                <WifiOff className="w-4 h-4 text-amber-600" />
                {offlineBuffer.length} Event(s) Buffered Offline
              </span>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={triggerOfflineReconciliation}
                className="h-7 text-xs bg-white text-amber-800 border-amber-300 hover:bg-amber-100"
              >
                Sync Ledger
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-slate-50 border-t border-slate-100 py-2.5 px-4 flex justify-between items-center text-[10px] text-slate-400 font-mono">
          <span>HARDWARE_SIG_HASH:</span>
          <span>0xMACAIR_SECURE_HARDWARE_INTEGRITY_SHIELD</span>
        </CardFooter>
      </Card>

      {/* COLUMN 3: THE DATA LAYER / SOVEREIGN TELEMETRY LEDGER (RIGHT) */}
      <Card className="lg:col-span-3 border border-slate-200 shadow-sm flex flex-col justify-between">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-600" />
              Sovereign Telemetry
            </CardTitle>
            <Badge variant="outline" className="text-[9px] font-mono uppercase bg-emerald-50 text-emerald-700 border-emerald-200">
              Data Layer
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Real-time event ledger tracking. Pulsating amber is PENDING, solid green is HARDENED.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 flex-1 flex flex-col justify-between gap-4 max-h-[420px] overflow-hidden">
          {/* Real-time Ledger projection */}
          <div className="space-y-2 flex-1 overflow-y-auto scrollbar-thin pr-1">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                Event Blocks Ledger
              </span>
              <History className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {events.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs italic">
                    No active events in local tracking cache. Select a suggested move or type a move above to begin.
                  </div>
                ) : (
                  events.map((ev) => {
                    const isPending = ev.verification.clientVerify === 'PENDING';
                    const isNo = ev.verification.clientVerify === 'NO';
                    
                    return (
                      <motion.div
                        key={ev.eventId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`p-2.5 rounded-lg border text-xs leading-relaxed transition-all relative overflow-hidden ${
                          isPending ? 'border-amber-200 bg-amber-50/20' :
                          isNo ? 'border-rose-200 bg-rose-50/20' :
                          'border-emerald-200 bg-emerald-50/10'
                        }`}
                      >
                        {/* Decorative dynamic status bar */}
                        <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                          isPending ? 'bg-amber-500 animate-pulse' :
                          isNo ? 'bg-rose-500' :
                          'bg-emerald-500'
                        }`}></div>

                        <div className="flex justify-between items-start pl-1.5">
                          <div>
                            <span className="font-mono font-bold text-slate-800 text-[10px] block truncate max-w-[150px]">
                              {ev.eventId}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="font-mono text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded text-[10px] font-bold">
                                {ev.payload.notation}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                Seq #{ev.payload.moveSequence}
                              </span>
                            </div>
                          </div>

                          {/* Pulsating / Hardened marker */}
                          <div className="flex items-center gap-1 text-[9px] font-mono font-bold">
                            {isPending ? (
                              <span className="text-amber-600 bg-amber-100/80 px-1.5 py-0.5 rounded animate-pulse flex items-center gap-1 uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                Pending
                              </span>
                            ) : isNo ? (
                              <span className="text-rose-600 bg-rose-100/80 px-1.5 py-0.5 rounded flex items-center gap-1 uppercase">
                                Rejected
                              </span>
                            ) : (
                              <span className="text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded flex items-center gap-1 uppercase">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Hardened
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Signature values */}
                        <div className="mt-2 text-[9px] font-mono text-slate-400 border-t border-slate-100 pt-1.5 pl-1.5">
                          <p className="truncate">HW_SIG: {ev.verification.clientHardwareSignature}</p>
                          {ev.verification.serverAttestationSignature && (
                            <p className="truncate text-emerald-600 font-semibold mt-0.5">
                              SV_ATTEST: {ev.verification.serverAttestationSignature}
                            </p>
                          )}
                          {ev.verification.errorReason && (
                            <p className="text-rose-600 font-semibold mt-0.5 whitespace-normal">
                              Err: {ev.verification.errorReason}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Internal Terminal view */}
          <div className="bg-slate-950 text-slate-100 rounded-lg p-3 font-mono text-[9px] leading-relaxed border border-slate-800">
            <span className="text-slate-400 text-[8px] font-bold uppercase tracking-wider block border-b border-slate-800 pb-1 mb-1.5">
              SYSTEM LOG BUFFER
            </span>
            <div className="h-20 overflow-y-auto space-y-1 scrollbar-thin">
              {consoleLogs.map((log, index) => (
                <div key={index} className={log.includes("revert") || log.includes("REJECTED") ? "text-rose-400" : log.includes("SUCCESS") || log.includes("hardened") ? "text-emerald-400" : "text-slate-300"}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-slate-50 border-t border-slate-100 py-2.5 px-4 flex justify-between items-center text-[10px] text-slate-400 font-mono">
          <span>LEDGER_SYNC:</span>
          <span>telemetry:sync:firebase</span>
        </CardFooter>
      </Card>

    </div>
  );
};

// Simple Chevron Icon for cleaner imports
const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);
