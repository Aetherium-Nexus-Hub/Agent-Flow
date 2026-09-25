import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLinks } from "../hooks/useLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, LogOut, LogIn, Sparkles } from "lucide-react";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { Onboarding } from "./Onboarding";
import { MobilePreview } from "./MobilePreview";
import { BedrockTest } from "./BedrockTest";
import { ResonanceScan } from "./ResonanceScan";
import { AgendaInput } from "./AgendaInput";
import { AetherChess } from "./AetherChess";

export const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  if (user && !profile?.username) {
    return <Onboarding user={user} onComplete={() => window.location.reload()} />;
  }

  const { links, addLink, removeLink } = useLinks(user?.uid);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const handleAdd = async () => {
    if (!title || !url) return;
    await addLink(title, url);
    setTitle("");
    setUrl("");
  };

  const handleSignOut = async () => {
    await auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-base text-zinc-900 tracking-tight">AgendaFlow</span>
              <span className="text-[10px] text-zinc-400 font-mono ml-2">Console</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-600 font-medium">
                  {profile?.username ? `@${profile.username}` : user.email}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="text-xs h-8 border-zinc-200 text-zinc-700 hover:bg-zinc-100 flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">Guest Mode</span>
                <Button 
                  size="sm" 
                  onClick={() => navigate("/")}
                  className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex p-8 gap-8 max-w-6xl mx-auto">
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
          <div className="flex gap-2 mb-6">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} />
            <Button onClick={handleAdd}>Add</Button>
          </div>
          <div className="space-y-2">
            {links.map((link) => (
              <div key={link.id} className="flex justify-between items-center p-3 border rounded bg-white">
                <span>{link.title} ({link.url})</span>
                <Button variant="ghost" onClick={() => removeLink(link.id)}><Trash2 className="w-4 h-4"/></Button>
              </div>
            ))}
          </div>
          
          <AetherChess />
          
          <AgendaInput />
          <BedrockTest />
          <ResonanceScan />
        </div>
        <MobilePreview userId={user?.uid} username={profile?.username} />
      </div>
    </div>
  );
};
