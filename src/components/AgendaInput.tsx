import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Sparkles, FileText, CalendarCheck, Copy, Check, Download,
  History, Trash2, Calendar, Map, Clock, ArrowRight, User
} from "lucide-react";
import Markdown from "react-markdown";
import { useMeetings, Meeting, Stakeholder } from "../hooks/useMeetings";
import { useAuth } from "../context/AuthContext";
import { StakeholderMap } from "./StakeholderMap";
import { Timeline } from "./Timeline";

export const AgendaInput = () => {
  const { user } = useAuth();
  const { meetings, loading: meetingsLoading, addMeeting, removeMeeting, updateMeeting } = useMeetings(user?.uid);

  const [notes, setNotes] = useState("");
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [activeTab, setActiveTab] = useState<"agenda" | "map" | "timeline">("agenda");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync active meeting when lists refresh, preserving selection
  useEffect(() => {
    if (activeMeeting?.id) {
      const match = meetings.find(m => m.id === activeMeeting.id);
      if (match) {
        setActiveMeeting(match);
      }
    }
  }, [meetings, activeMeeting?.id]);

  const handleGenerate = async () => {
    if (!notes.trim()) return;

    setLoading(true);
    setError(null);
    setActiveMeeting(null);
    setCopied(false);

    try {
      // Direct call to our newly implemented server route
      const res = await fetch("/api/v1/parse-meeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate agenda and maps");
      }

      // Format parsed payload into schema
      const newMeetingData: Omit<Meeting, "owner" | "createdAt"> = {
        title: data.title || "Untitled Strategic Meeting",
        objective: data.objective || "Review collective agenda items and align stakeholders.",
        markdownAgenda: data.markdownAgenda || "",
        notes: notes,
        stakeholders: data.stakeholders || [],
        timeline: data.timeline || [],
        completedTasks: {}
      };

      // Save to Firebase list
      if (user?.uid) {
        const docId = await addMeeting(newMeetingData);
        if (docId) {
          setActiveMeeting({
            ...newMeetingData,
            id: docId,
            owner: user.uid,
            createdAt: new Date()
          });
        }
      } else {
        // Fallback for offline or local state sessions
        setActiveMeeting({
          ...newMeetingData,
          owner: "local",
          createdAt: new Date()
        });
      }

      setActiveTab("map"); // Automatically direct users to the beautiful stakeholder map view!
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong while generating the agenda and maps.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (stakeholderName: string, taskIndex: number) => {
    if (!activeMeeting) return;
    const currentCompleted = activeMeeting.completedTasks || {};
    const stakeholderTasks = currentCompleted[stakeholderName] || {};
    const updatedStakeholderTasks = {
      ...stakeholderTasks,
      [taskIndex]: !stakeholderTasks[taskIndex]
    };
    const updatedCompletedTasks = {
      ...currentCompleted,
      [stakeholderName]: updatedStakeholderTasks
    };

    // Update local state instantly for extreme responsiveness
    setActiveMeeting({
      ...activeMeeting,
      completedTasks: updatedCompletedTasks
    });

    // Save to Firestore
    if (activeMeeting.id && user?.uid) {
      try {
        await updateMeeting(activeMeeting.id, { completedTasks: updatedCompletedTasks });
      } catch (err) {
        console.error("Failed to save checked task state:", err);
      }
    }
  };

  const handleSelectMeeting = (meeting: Meeting) => {
    setActiveMeeting(meeting);
    setNotes(meeting.notes || "");
    setActiveTab("map");
  };

  const handleDeleteMeeting = async (meetingId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering selection
    if (confirm("Are you sure you want to delete this meeting?")) {
      try {
        await removeMeeting(meetingId);
        if (activeMeeting?.id === meetingId) {
          setActiveMeeting(null);
        }
      } catch (err) {
        console.error("Failed to delete meeting:", err);
      }
    }
  };

  const handleCopy = async () => {
    if (!activeMeeting?.markdownAgenda) return;
    try {
      await navigator.clipboard.writeText(activeMeeting.markdownAgenda);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleDownload = () => {
    if (!activeMeeting?.markdownAgenda) return;
    const blob = new Blob([activeMeeting.markdownAgenda], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${activeMeeting.title.toLowerCase().replace(/\s+/g, "-")}-agenda.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Convert parsed timeline format into the exact format Timeline consumes (AgendaItem)
  const convertedTimelineItems = activeMeeting?.timeline?.map((item, idx) => ({
    id: `seg-${idx}`,
    startTime: item.time || "09:00",
    duration: item.duration || 15,
    title: item.title || "Introduction",
    description: item.description || "",
    presenter: item.presenter || "Open Floor"
  })) || [];

  return (
    <div id="agenda-flow-app-container" className="space-y-8 mt-8">
      
      {/* Search/Library History Section for logged-in users */}
      {user && meetings.length > 0 && (
        <Card id="meeting-history-card" className="border border-zinc-200/50 shadow-xs">
          <CardHeader className="py-4 px-6 bg-zinc-50/50 flex flex-row items-center justify-between border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-500" />
              <CardTitle id="history-title" className="text-sm font-bold text-zinc-800">Your Meeting Library</CardTitle>
            </div>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-zinc-200 text-zinc-700 rounded">
              {meetings.length} Saved
            </span>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2.5 max-h-[160px] overflow-y-auto">
              {meetings.map((meeting) => {
                const isSelected = activeMeeting?.id === meeting.id;
                return (
                  <div
                    key={meeting.id}
                    onClick={() => handleSelectMeeting(meeting)}
                    className={`group/history flex items-center gap-2 pl-3 pr-2.5 py-1.5 border rounded-xl text-xs font-semibold cursor-pointer transition select-none ${
                      isSelected 
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700" 
                        : "bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200/80"
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 opacity-70" />
                    <span className="truncate max-w-[160px]">{meeting.title}</span>
                    <button
                      onClick={(e) => handleDeleteMeeting(meeting.id!, e)}
                      className={`p-0.5 rounded-md hover:bg-black/15 transition text-current opacity-0 group-hover/history:opacity-100`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input Form area */}
      <Card id="agenda-input-card" className="border border-zinc-200 shadow-xs overflow-hidden">
        <CardHeader className="bg-indigo-55/15 p-6 border-b border-zinc-100">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle id="agenda-card-title" className="text-lg flex items-center gap-2 text-zinc-900">
                <CalendarCheck className="w-5.5 h-5.5 text-indigo-600" />
                Synthesize Meeting Notes & Maps
              </CardTitle>
              <CardDescription className="mt-1">
                Parse messy meeting notes, chat logs, or raw transcripts to build beautiful timelines and interactive stakeholder alignment graphs.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="notes-textarea" className="text-xs font-bold text-zinc-700 flex items-center gap-1.5 uppercase tracking-wide">
              <FileText className="w-4 h-4 text-zinc-400" />
              Raw Notes / Transcripts
            </label>
            <textarea
              id="notes-textarea"
              placeholder="Paste raw transcripts, summaries, list notes, or initial ideas here. (e.g., 'Alice: Let's do marketing. Bob says Engineering is too busy'...)"
              className="w-full min-h-[180px] p-4 text-sm border border-zinc-200 rounded-xl outline-none focus:border-indigo-400 bg-white transition duration-200 resize-y"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex justify-between gap-3 items-center pt-2">
            <div className="text-xs text-zinc-400 font-mono">
              {notes.length} characters
            </div>
            <Button
              id="generate-agenda-button"
              onClick={handleGenerate}
              disabled={loading || !notes.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 px-5 py-2.5 rounded-xl border border-indigo-700 shadow-sm transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Participant Dynamics...
                </>
              ) : (
                <>
                  <Sparkles className="w-4.5 h-4.5" />
                  Synthesize & Map
                </>
              )}
            </Button>
          </div>

          {error && (
            <div id="agenda-error" className="p-4 bg-rose-50 border border-rose-200/50 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-1.5 shrink-0" />
              <div><strong>Parsing Fault:</strong> {error}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Structured Output Visualization Display Panel */}
      {activeMeeting && (
        <div id="parsed-results-section" className="space-y-6">
          
          {/* Dashboard Summary Block */}
          <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-500 font-mono">Objective Synopsis</span>
            <h1 className="text-2xl font-black text-zinc-900 mt-1">{activeMeeting.title}</h1>
            <p className="text-sm text-zinc-600 leading-relaxed mt-2.5">
              <strong>Meeting Goal:</strong> {activeMeeting.objective}
            </p>
          </div>

          {/* Interactive Core Tabs */}
          <div className="flex border-b border-zinc-200 gap-1.5">
            <button
              onClick={() => setActiveTab("agenda")}
              className={`pb-3.5 px-3 border-b-2 text-sm font-bold transition duration-200 ${
                activeTab === "agenda" 
                  ? "border-indigo-600 text-indigo-700" 
                  : "border-transparent text-zinc-500 hover:text-zinc-950"
              }`}
            >
              Written Agenda
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`pb-3.5 px-3 border-b-2 text-sm font-bold transition duration-200 flex items-center gap-1.5 ${
                activeTab === "map" 
                  ? "border-indigo-600 text-indigo-700" 
                  : "border-transparent text-zinc-500 hover:text-zinc-950"
              }`}
            >
              <Map className="w-4 h-4" />
              Stakeholder Map
              <span className="h-4 px-1.5 bg-indigo-100 text-[10px] font-bold text-indigo-800 rounded-full flex items-center justify-center font-mono">
                {activeMeeting.stakeholders?.length || 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`pb-3.5 px-3 border-b-2 text-sm font-bold transition duration-200 flex items-center gap-1.5 ${
                activeTab === "timeline" 
                  ? "border-indigo-600 text-indigo-700" 
                  : "border-transparent text-zinc-500 hover:text-zinc-950"
              }`}
            >
              <Clock className="w-4 h-4" />
              Timeline Flow
              <span className="h-4 px-1.5 bg-zinc-100 text-[10px] font-bold text-zinc-700 rounded-full flex items-center justify-center font-mono">
                {activeMeeting.timeline?.length || 0}
              </span>
            </button>
          </div>

          {/* Tab Panes */}
          <div className="pt-2">
            
            {/* TAB: Written Agenda Summary */}
            {activeTab === "agenda" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                  <span className="text-xs font-bold text-zinc-600">Generated Markdown Agenda Summary</span>
                  <div className="flex gap-2">
                    <Button
                      id="copy-agenda-button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-950 bg-white border-zinc-200 px-3 py-1.5 rounded-lg font-semibold"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Agenda
                        </>
                      )}
                    </Button>
                    <Button
                      id="download-agenda-button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-950 bg-white border-zinc-200 px-3 py-1.5 rounded-lg font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download .md
                    </Button>
                  </div>
                </div>

                <div className="p-8 bg-white border border-zinc-200 rounded-2xl shadow-inner max-h-[580px] overflow-y-auto">
                  <div className="markdown-body">
                    <Markdown
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-zinc-900 mt-6 mb-2 border-b pb-1" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-zinc-800 mt-5 mb-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-medium text-zinc-800 mt-4 mb-1" {...props} />,
                        p: ({node, ...props}) => <p className="text-zinc-600 leading-relaxed mb-3 text-sm" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 my-3 text-zinc-600 text-sm" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 space-y-1 my-3 text-zinc-600 text-sm" {...props} />,
                        li: ({node, ...props}) => <li className="text-zinc-600 mb-1 text-sm" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold text-zinc-950" {...props} />,
                        code: ({node, ...props}) => <code className="bg-zinc-100 text-zinc-800 px-1 py-0.5 rounded text-xs font-mono" {...props} />
                      }}
                    >
                      {activeMeeting.markdownAgenda}
                    </Markdown>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Stakeholder Map Component */}
            {activeTab === "map" && (
              <StakeholderMap 
                stakeholders={activeMeeting.stakeholders}
                completedTasks={activeMeeting.completedTasks || {}}
                onToggleTask={handleToggleTask}
              />
            )}

            {/* TAB: Suggested Agenda Timeline flow */}
            {activeTab === "timeline" && (
              <div className="py-4 bg-zinc-50/20 border border-zinc-200/60 rounded-2xl p-6">
                {convertedTimelineItems.length > 0 ? (
                  <Timeline items={convertedTimelineItems} />
                ) : (
                  <div className="py-12 text-center text-zinc-400">
                    <Clock className="w-10 h-10 mx-auto stroke-1" />
                    <p className="text-xs italic mt-2">No structured timeline intervals parsed.</p>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
