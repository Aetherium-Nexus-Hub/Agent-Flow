import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, SlidersHorizontal, User, ShieldCheck, Grid, List, X, 
  CheckSquare, Square, Briefcase, Award, Sparkles, Building2, 
  Activity, CheckCircle2, AlertCircle, HelpCircle, Network, Users
} from "lucide-react";

export interface Stakeholder {
  name: string;
  role: string;
  department: string;
  influence: "High" | "Medium" | "Low";
  interest: "High" | "Medium" | "Low";
  alignment: "Champion" | "Supportive" | "Neutral" | "Skeptical" | "Blocker";
  contributions: string[];
  actionItems: string[];
}

interface StakeholderMapProps {
  stakeholders: Stakeholder[];
  completedTasks?: { [stakeholderName: string]: { [taskIndex: number]: boolean } };
  onToggleTask?: (stakeholderName: string, taskIndex: number) => void;
}

export const StakeholderMap: React.FC<StakeholderMapProps> = ({ 
  stakeholders = [], 
  completedTasks = {},
  onToggleTask
}) => {
  const [viewMode, setViewMode] = useState<"target" | "matrix" | "bento">("target");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [selectedAlignment, setSelectedAlignment] = useState<string>("all");
  const [selectedInfluence, setSelectedInfluence] = useState<string>("all");
  const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null);
  const [highlightRelations, setHighlightRelations] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Group departments dynamically
  const departments = useMemo(() => {
    const set = new Set<string>();
    stakeholders.forEach(s => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set);
  }, [stakeholders]);

  // Filters logic
  const filteredStakeholders = useMemo(() => {
    return stakeholders.filter(s => {
      const matchSearch = 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = selectedDept === "all" || s.department === selectedDept;
      const matchAlign = selectedAlignment === "all" || s.alignment === selectedAlignment;
      const matchInfluence = selectedInfluence === "all" || s.influence === selectedInfluence;
      return matchSearch && matchDept && matchAlign && matchInfluence;
    });
  }, [stakeholders, searchQuery, selectedDept, selectedAlignment, selectedInfluence]);

  // Color mapping functions
  const getDeptColor = (dept: string) => {
    const d = dept?.toLowerCase() || "";
    if (d.includes("eng") || d.includes("tech") || d.includes("dev")) {
      return { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", dot: "bg-indigo-500", label: "Engineering" };
    }
    if (d.includes("prod") || d.includes("design") || d.includes("ux")) {
      return { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", dot: "bg-purple-500", label: "Product & Design" };
    }
    if (d.includes("sale") || d.includes("mark") || d.includes("growth")) {
      return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500", label: "Growth / Sales" };
    }
    if (d.includes("exec") || d.includes("lead") || d.includes("manage") || d.includes("vp") || d.includes("ceo")) {
      return { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", dot: "bg-rose-500", label: "Executive Leadership" };
    }
    if (d.includes("fin") || d.includes("hr") || d.includes("op") || d.includes("peop")) {
      return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", label: "Ops & People" };
    }
    return { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", dot: "bg-slate-500", label: dept || "General" };
  };

  const getAlignmentProps = (alignment: Stakeholder["alignment"]) => {
    switch (alignment) {
      case "Champion":
        return { 
          badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200", 
          glowClass: "shadow-[0_0_12px_rgba(16,185,129,0.35)]",
          color: "#10b981",
          label: "Champion 🌟"
        };
      case "Supportive":
        return { 
          badgeClass: "bg-teal-50 text-teal-700 border-teal-200", 
          glowClass: "shadow-[0_0_8px_rgba(20,184,166,0.25)]",
          color: "#14b8a6",
          label: "Supportive 👍"
        };
      case "Neutral":
        return { 
          badgeClass: "bg-slate-50 text-slate-700 border-slate-200", 
          glowClass: "shadow-none",
          color: "#64748b",
          label: "Neutral 😐"
        };
      case "Skeptical":
        return { 
          badgeClass: "bg-amber-50 text-amber-700 border-amber-200", 
          glowClass: "shadow-[0_0_8px_rgba(245,158,11,0.25)]",
          color: "#f59e0b",
          label: "Skeptical 🤨"
        };
      case "Blocker":
        return { 
          badgeClass: "bg-rose-50 text-rose-700 border-rose-200", 
          glowClass: "shadow-[0_0_12px_rgba(244,63,94,0.45)]",
          color: "#f43f5e",
          label: "Blocker ⚠️"
        };
      default:
        return { 
          badgeClass: "bg-zinc-50 text-zinc-700 border-zinc-200", 
          glowClass: "shadow-none",
          color: "#71717a",
          label: "Unknown"
        };
    }
  };

  const getInfluenceBadge = (influence: Stakeholder["influence"]) => {
    switch (influence) {
      case "High": return "bg-red-50 text-red-700 border-red-200";
      case "Medium": return "bg-orange-50 text-orange-700 border-orange-200";
      case "Low": return "bg-zinc-100 text-zinc-700 border-zinc-200";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Concentric radial positions
  const polarPositions = useMemo(() => {
    const groupedByInfluence = {
      High: [] as Stakeholder[],
      Medium: [] as Stakeholder[],
      Low: [] as Stakeholder[]
    };
    
    filteredStakeholders.forEach(s => {
      groupedByInfluence[s.influence || "Medium"].push(s);
    });

    const positionsMap = new Map<string, { x: number; y: number }>();

    // Radius rings (in percentage for layout box)
    const ringRadii = {
      High: 18,   // Core circle
      Medium: 34, // Core outer
      Low: 44    // Outer limit
    };

    // Distribute angles evenly in each ring
    const keys: ("High" | "Medium" | "Low")[] = ["High", "Medium", "Low"];
    keys.forEach(key => {
      const list = groupedByInfluence[key];
      const count = list.length;
      const radius = ringRadii[key];

      list.forEach((s, idx) => {
        // Stagger/tilt initial angle slightly to look dynamic
        const startRad = key === "High" ? 0 : key === "Medium" ? Math.PI / 4 : Math.PI / 6;
        const angle = (idx / count) * 2 * Math.PI + startRad;
        
        // Translate to 0-100 coordinates with 50,50 center
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        positionsMap.set(s.name, { x, y });
      });
    });

    return positionsMap;
  }, [filteredStakeholders]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = stakeholders.length;
    if (total === 0) return { champions: 0, actionsAssigned: 0, highInfluence: 0 };
    
    const champions = stakeholders.filter(s => s.alignment === "Champion" || s.alignment === "Supportive").length;
    const actionsAssigned = stakeholders.filter(s => s.actionItems && s.actionItems.length > 0).length;
    const highInfluence = stakeholders.filter(s => s.influence === "High").length;

    return { champions, actionsAssigned, highInfluence };
  }, [stakeholders]);

  return (
    <div id="stakeholder-map-root" className="w-[102%] -mx-[1%] bg-gradient-to-b from-zinc-50 to-white border border-zinc-200/80 rounded-2xl shadow-sm overflow-hidden mt-8">
      
      {/* Visual Header */}
      <div className="p-6 border-b border-zinc-200/80 bg-white/80 backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Users className="w-5.5 h-5.5 text-indigo-600" />
            Stakeholder Alignment Map
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Dynamic, multidimensional analysis and task mapping of all meeting participants.
          </p>
        </div>

        {/* Layout Switcher Tabs */}
        <div className="flex bg-zinc-100 p-1 rounded-xl self-start md:self-center border border-zinc-200/50">
          <button
            onClick={() => setViewMode("target")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition duration-200 ${
              viewMode === "target" ? "bg-white text-indigo-600 shadow-xs border border-zinc-200/20" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Target Map
          </button>
          <button
            onClick={() => setViewMode("matrix")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition duration-200 ${
              viewMode === "matrix" ? "bg-white text-indigo-600 shadow-xs border border-zinc-200/20" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            2D Matrix
          </button>
          <button
            onClick={() => setViewMode("bento")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition duration-200 ${
              viewMode === "bento" ? "bg-white text-indigo-600 shadow-xs border border-zinc-200/20" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Bento Groups
          </button>
        </div>
      </div>

      {/* Quick Dashboard Stats */}
      <div className="grid grid-cols-3 border-b border-zinc-100 bg-zinc-50/50">
        <div className="p-4 border-r border-zinc-100 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Total Mapped</span>
          <span className="text-2xl font-bold mt-1 text-zinc-900 font-mono">{stakeholders.length}</span>
        </div>
        <div className="p-4 border-r border-zinc-100 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Buy-In Index</span>
          <span className="text-2xl font-bold mt-1 text-emerald-600 font-mono">
            {stakeholders.length > 0 ? Math.round((stats.champions / stakeholders.length) * 100) : 0}%
          </span>
        </div>
        <div className="p-4 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Task Assignment</span>
          <span className="text-2xl font-bold mt-1 text-indigo-600 font-mono">
            {stats.actionsAssigned} / {stakeholders.length}
          </span>
        </div>
      </div>

      {/* Control Filters Area */}
      <div className="p-4 bg-white/40 border-b border-zinc-100 flex flex-col md:flex-row justify-between gap-3 items-stretch md:items-center">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search participant or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-sm border border-zinc-200 rounded-xl outline-none focus:border-indigo-400 bg-white transition"
          />
        </div>

        {/* Filtering Options */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border rounded-xl transition duration-200 ${
              showFilters ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {(selectedDept !== "all" || selectedAlignment !== "all" || selectedInfluence !== "all") && (
              <span className="h-2 w-2 rounded-full bg-indigo-600 inline-block animation-pulse" />
            )}
          </button>

          {viewMode === "target" && (
            <button
              onClick={() => setHighlightRelations(!highlightRelations)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border rounded-xl transition duration-200 ${
                highlightRelations ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              {highlightRelations ? "Hide Ties" : "Show Ties"}
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="p-4 bg-zinc-50 border-b border-zinc-100 grid grid-cols-1 md:grid-cols-3 gap-3 overflow-hidden"
        >
          {/* Department Filter */}
          <div>
            <label className="text-xs font-bold text-zinc-500 block mb-1.5 uppercase">Department / Team</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full p-2 text-xs border border-zinc-200 rounded-lg bg-white outline-none"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{getDeptColor(dept).label}</option>
              ))}
            </select>
          </div>

          {/* Alignment Filter */}
          <div>
            <label className="text-xs font-bold text-zinc-500 block mb-1.5 uppercase">Alignment State</label>
            <select
              value={selectedAlignment}
              onChange={(e) => setSelectedAlignment(e.target.value)}
              className="w-full p-2 text-xs border border-zinc-200 rounded-lg bg-white outline-none"
            >
              <option value="all">All Alignments</option>
              <option value="Champion">Champion 🔥</option>
              <option value="Supportive">Supportive 👍</option>
              <option value="Neutral">Neutral 😐</option>
              <option value="Skeptical">Skeptical 🤨</option>
              <option value="Blocker">Blocker ⚠️</option>
            </select>
          </div>

          {/* Influence Filter */}
          <div>
            <label className="text-xs font-bold text-zinc-500 block mb-1.5 uppercase">Influence/Power Weight</label>
            <select
              value={selectedInfluence}
              onChange={(e) => setSelectedInfluence(e.target.value)}
              className="w-full p-2 text-xs border border-zinc-200 rounded-lg bg-white outline-none"
            >
              <option value="all">All Influence Levels</option>
              <option value="High">High Power</option>
              <option value="Medium">Medium Power</option>
              <option value="Low">Low Power</option>
            </select>
          </div>
        </motion.div>
      )}

      {/* Main Canvas + Detail Panels */}
      <div className="flex flex-col lg:flex-row h-auto lg:h-[580px] w-full relative">
        
        {/* Visual Map Arena */}
        <div className="flex-1 bg-zinc-950/2 md:bg-radial text-zinc-800 p-4 border-b lg:border-r lg:border-b-0 border-zinc-100 relative overflow-hidden flex items-center justify-center min-h-[440px] select-none">
          
          {/* Layout 1: Concentric Rings Target Map */}
          {viewMode === "target" && (
            <div className="w-full aspect-square max-w-[460px] relative rounded-full border border-zinc-200/40 bg-white/40 shadow-inner flex items-center justify-center">
              
              {/* Polar Coordinates Target BG Rings */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                {/* Core ring */}
                <circle cx="50" cy="50" r="18" fill="none" stroke="#6366f1" strokeWidth="0.4" strokeDasharray="1.5" />
                {/* Active ring */}
                <circle cx="50" cy="50" r="34" fill="none" stroke="#22c55e" strokeWidth="0.4" strokeDasharray="1 1" />
                {/* Informational ring */}
                <circle cx="50" cy="50" r="44" fill="none" stroke="#64748b" strokeWidth="0.3" />
                
                {/* Radial sectors axes */}
                <line x1="10" y1="50" x2="90" y2="50" stroke="#f1f5f9" strokeWidth="0.4" />
                <line x1="50" y1="10" x2="50" y2="90" stroke="#f1f5f9" strokeWidth="0.4" />

                {/* Relational Alignment lines representing group integration */}
                {highlightRelations && filteredStakeholders.length > 1 && (
                  <path
                    d={`M ${filteredStakeholders.map((s) => {
                      const pos = polarPositions.get(s.name) || { x: 50, y: 50 };
                      return `${pos.x} ${pos.y}`;
                    }).join(" L ")} Z`}
                    fill="url(#indigoGroupGlow)"
                    fillOpacity="0.04"
                    stroke="#818cf8"
                    strokeWidth="0.5"
                    strokeDasharray="2"
                  />
                )}
                
                <defs>
                  <radialGradient id="indigoGroupGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                  </radialGradient>
                </defs>
              </svg>

              {/* Central Target Badge */}
              <div className="absolute w-20 h-20 rounded-full bg-indigo-50/70 border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center text-center p-2 z-10 pointer-events-none shadow-xs">
                <Sparkles className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
                <span className="text-[9px] font-bold text-indigo-900 mt-0.5 tracking-tight uppercase leading-none">CORE TOPIC</span>
              </div>

              {/* Ring Labels */}
              <span className="absolute left-[36%] top-[39%] text-[9px] text-zinc-400 font-mono rotate-12 uppercase">1. Core Players</span>
              <span className="absolute left-[24%] top-[20%] text-[9px] text-zinc-400 font-mono rotate-12 uppercase">2. Key Contributors</span>
              <span className="absolute left-[8%] top-[10%] text-[9px] text-zinc-400 font-mono rotate-12 uppercase">3. Informed Audience</span>

              {/* Plotting Stakeholder Nodes */}
              {filteredStakeholders.map((s) => {
                const pos = polarPositions.get(s.name) || { x: 50, y: 50 };
                const align = getAlignmentProps(s.alignment);
                const isSelected = selectedStakeholder?.name === s.name;

                return (
                  <motion.button
                    key={s.name}
                    id={`stakeholder-node-${s.name.replace(/\s+/g, '-').toLowerCase()}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, left: `${pos.x}%`, top: `${pos.y}%` }}
                    transition={{ type: "spring", damping: 15 }}
                    style={{ x: "-50%", y: "-50%" }}
                    onClick={() => setSelectedStakeholder(s)}
                    className="absolute z-20 group outline-none"
                  >
                    {/* Node Dot / Initials Circle */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all relative ${
                      isSelected 
                        ? "bg-indigo-600 border-indigo-800 text-white ring-4 ring-indigo-100" 
                        : "bg-white border-zinc-300 text-zinc-700 hover:border-indigo-400 hover:scale-105"
                    } ${align.glowClass}`}>
                      {getInitials(s.name)}
                      
                      {/* Department colored dynamic indicator dot */}
                      <span className={`absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full border border-white ${getDeptColor(s.department).dot}`} />
                    </div>

                    {/* Popover Hover Label tooltip */}
                    <div className="absolute top-11 left-1/2 -translate-x-1/2 bg-zinc-950 text-white px-2 mt-1.5 py-1 rounded text-[10px] font-semibold tracking-wide whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition duration-150 z-30 shadow-md">
                      {s.name} ({s.role})
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Layout 2: Power vs. Interest 2D Matrix */}
          {viewMode === "matrix" && (
            <div className="w-full h-full max-w-[500px] aspect-square relative border-2 border-zinc-200 bg-white/50 rounded-xl grid grid-cols-2 grid-rows-2">
              
              {/* Axis Dividers and Arrows */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-0.5 bg-zinc-200" />
                <div className="h-full w-0.5 bg-zinc-200 absolute" />
              </div>

              {/* Axis Labels */}
              <div className="absolute -left-1 top-1/2 -rotate-90 origin-left -translate-y-1/2 text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
                INFLUENCE / POWER ➔
              </div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
                INTEREST / COMMITMENT ➔
              </div>

              {/* Quadrant Labels */}
              <div className="p-3 bg-red-50/10 border-r border-b border-zinc-100/50 flex flex-col justify-start">
                <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded-md self-start">KEY PLAYERS (Manage Closely)</span>
              </div>
              <div className="p-3 bg-indigo-50/10 border-l border-b border-zinc-100/50 flex flex-col justify-start items-end text-right">
                <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md self-end">SOCIABLE (Keep Satisfied)</span>
              </div>
              <div className="p-3 bg-amber-50/10 border-r border-t border-zinc-100/50 flex flex-col justify-end">
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md self-start">SUPPORTIVE (Keep Informed)</span>
              </div>
              <div className="p-3 bg-slate-50/10 border-l border-t border-zinc-100/50 flex flex-col justify-end items-end text-right">
                <span className="text-[10px] font-bold text-slate-800 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md self-end">OBSERVERS (Monitor Only)</span>
              </div>

              {/* Quadrant Nodes Plotting */}
              {/* To plot neatly, we assign positions in quadrants depending on Influence: High/Medium/Low, Interest: High/Medium/Low */}
              {filteredStakeholders.map((s, idx) => {
                const getMatrixCoords = (stakeholder: Stakeholder, i: number) => {
                  const hasHighPower = stakeholder.influence === "High";
                  const hasMedPower = stakeholder.influence === "Medium";
                  const hasHighInterest = stakeholder.interest === "High";
                  const hasMedInterest = stakeholder.interest === "Medium";

                  // Quadrant 1 (Top Left) - Manage Closely (High Power, High Interest)
                  // Quadrant 2 (Top Right) - Keep Satisfied (High Power, Low Interest)
                  // Quadrant 3 (Bottom Left) - Keep Informed (Low Power, High Interest)
                  // Quadrant 4 (Bottom Right) - Minimal Effort (Low Power, Low Interest)
                  let quadX = 0; // 0 to 50
                  let quadY = 0; // 0 to 50

                  // Add a little layout clustering randomness offset per node index
                  const cellOffset = (i * 9) % 20 + 15;

                  if (hasHighPower || hasMedPower) {
                    quadY = hasHighPower ? 18 : 34;
                    quadX = (hasHighInterest || hasMedInterest) ? cellOffset : cellOffset + 50;
                  } else {
                    quadY = 66 + cellOffset % 12;
                    quadX = (hasHighInterest || hasMedInterest) ? cellOffset : cellOffset + 50;
                  }

                  return { x: quadX, y: quadY };
                };

                const pos = getMatrixCoords(s, idx);
                const align = getAlignmentProps(s.alignment);
                const isSelected = selectedStakeholder?.name === s.name;

                return (
                  <motion.button
                    key={s.name}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, left: `${pos.x}%`, top: `${pos.y}%` }}
                    transition={{ type: "spring", stiffness: 100 }}
                    style={{ position: "absolute", x: "-50%", y: "-50%" }}
                    onClick={() => setSelectedStakeholder(s)}
                    className="z-20 outline-none"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all relative ${
                      isSelected 
                        ? "bg-indigo-600 border-indigo-800 text-white ring-4 ring-indigo-100 scale-110 z-30" 
                        : "bg-white border-zinc-200 hover:border-indigo-400 hover:scale-105"
                    } ${align.glowClass}`}>
                      {getInitials(s.name)}
                      <span className={`absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full border border-white ${getDeptColor(s.department).dot}`} />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Layout 3: Bento Grid Cards Grouping */}
          {viewMode === "bento" && (
            <div className="w-full h-full p-2 py-4 overflow-y-auto max-h-[500px] flex flex-col gap-4">
              {filteredStakeholders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400 py-12">
                  <User className="w-10 h-10 stroke-1 mb-2 text-zinc-300" />
                  <span className="text-xs">No stakeholders match filters</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredStakeholders.map((s) => {
                    const dept = getDeptColor(s.department);
                    const align = getAlignmentProps(s.alignment);
                    const isSelected = selectedStakeholder?.name === s.name;
                    
                    // Task counts
                    const sActions = s.actionItems || [];
                    const sCompleted = completedTasks[s.name] 
                      ? Object.values(completedTasks[s.name]).filter(v => v).length 
                      : 0;

                    return (
                      <motion.div
                        key={s.name}
                        onClick={() => setSelectedStakeholder(s)}
                        className={`p-4 border-[1.5px] rounded-xl cursor-pointer text-left transition select-none flex gap-3 ${
                          isSelected 
                            ? "bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-100" 
                            : "bg-white hover:bg-zinc-50 border-zinc-200/80 hover:border-zinc-300"
                        }`}
                      >
                        {/* Avatar initials badge */}
                        <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold text-zinc-700 bg-zinc-100 border border-zinc-200 select-none ${align.glowClass}`}>
                          {getInitials(s.name)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-zinc-900 truncate">{s.name}</h3>
                          <p className="text-xs text-zinc-500 truncate mt-0.5">{s.role}</p>
                          
                          {/* Mini Details Badges */}
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md border ${dept.bg} ${dept.border} ${dept.text}`}>
                              {dept.label}
                            </span>
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md border ${align.badgeClass}`}>
                              {align.label}
                            </span>
                          </div>

                          {/* Task progress inline tracker */}
                          {sActions.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-zinc-500 font-semibold tracking-wide uppercase">Tasks List Progress</span>
                              <span className="text-xs font-mono font-bold text-zinc-700">{sCompleted}/{sActions.length} Done</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Insights Panel */}
        <div className="w-full lg:w-[320px] bg-white flex flex-col h-[580px] border-t lg:border-t-0 border-zinc-200 overflow-y-auto">
          {selectedStakeholder ? (
            <div className="p-6 flex flex-col h-full">
              
              {/* Close Button & Header */}
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">Stakeholder Persona</span>
                <button
                  onClick={() => setSelectedStakeholder(null)}
                  className="p-1 rounded-lg hover:bg-zinc-100 transition duration-150 text-zinc-400 hover:text-zinc-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stakeholder Identity Card */}
              <div className="text-center pb-5 border-b border-zinc-100">
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-xl font-bold bg-zinc-100 border-2 border-zinc-200 shadow-xs relative ${getAlignmentProps(selectedStakeholder.alignment).glowClass}`}>
                  {getInitials(selectedStakeholder.name)}
                </div>
                <h3 className="text-base font-bold text-zinc-900 mt-3">{selectedStakeholder.name}</h3>
                <p className="text-xs text-zinc-500 mt-0.5 font-medium">{selectedStakeholder.role}</p>

                {/* Primary details tags */}
                <div className="flex flex-wrap gap-1.5 justify-center mt-3.5">
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${getDeptColor(selectedStakeholder.department).bg} ${getDeptColor(selectedStakeholder.department).border} ${getDeptColor(selectedStakeholder.department).text}`}>
                    {getDeptColor(selectedStakeholder.department).label}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${getInfluenceBadge(selectedStakeholder.influence)}`}>
                    Power: {selectedStakeholder.influence}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${getAlignmentProps(selectedStakeholder.alignment).badgeClass}`}>
                    {getAlignmentProps(selectedStakeholder.alignment).label}
                  </span>
                </div>
              </div>

              {/* Sub-panels */}
              <div className="flex-1 overflow-y-auto pt-5 space-y-5 flex flex-col">
                
                {/* Section A: Discussion Contributions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-zinc-400" />
                    Synthesized Discussion Points
                  </h4>
                  {selectedStakeholder.contributions && selectedStakeholder.contributions.length > 0 ? (
                    <ul className="space-y-2 text-xs text-zinc-600 pl-1">
                      {selectedStakeholder.contributions.map((con, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-indigo-600 select-none">•</span>
                          <span className="leading-relaxed">{con}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-zinc-400 italic">No particular talking points recorded in the transcript notes.</span>
                  )}
                </div>

                {/* Section B: Assigned To-dos Checklist */}
                <div className="space-y-3 mt-auto">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-zinc-400" />
                      Assigned To-dos
                    </h4>
                    {selectedStakeholder.actionItems && selectedStakeholder.actionItems.length > 0 && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-zinc-100 text-zinc-700 rounded-md">
                        {
                          Object.values(completedTasks[selectedStakeholder.name] || {}).filter(Boolean).length
                        } / {selectedStakeholder.actionItems.length}
                      </span>
                    )}
                  </div>
                  
                  {selectedStakeholder.actionItems && selectedStakeholder.actionItems.length > 0 ? (
                    <div className="space-y-2 flex-grow">
                      {selectedStakeholder.actionItems.map((item, idx) => {
                        const isCompleted = !!completedTasks[selectedStakeholder.name]?.[idx];
                        
                        return (
                          <div 
                            key={idx}
                            onClick={() => onToggleTask && onToggleTask(selectedStakeholder.name, idx)}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border-2 text-left cursor-pointer transition select-none ${
                              isCompleted 
                                ? "bg-emerald-50/50 border-emerald-100 text-zinc-500 line-through" 
                                : "bg-white border-zinc-100 text-zinc-700 hover:border-zinc-200"
                            }`}
                          >
                            <button className="shrink-0 mt-0.5 focus:outline-none">
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4 text-zinc-300 hover:text-zinc-400" />
                              )}
                            </button>
                            <span className="text-xs leading-tight font-medium">{item}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-zinc-50 rounded-lg text-center border border-zinc-100">
                      <span className="text-xs text-zinc-400 italic">No action items assigned to this participant.</span>
                    </div>
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-zinc-400">
              <User className="w-12 h-12 stroke-[1] mb-3 text-zinc-300 animate-pulse" />
              <h3 className="text-sm font-bold text-zinc-700">Select Stakeholder</h3>
              <p className="text-xs text-zinc-400 mt-2 max-w-[200px]">
                Click any participant node on the alignment map to view their role details, key viewpoints, and manage their assigned tasks.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
