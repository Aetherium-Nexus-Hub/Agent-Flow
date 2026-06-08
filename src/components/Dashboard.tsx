import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLinks } from "../hooks/useLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { Onboarding } from "./Onboarding";
import { MobilePreview } from "./MobilePreview";
import { BedrockTest } from "./BedrockTest";
import { ResonanceScan } from "./ResonanceScan";

export const Dashboard = () => {
  const { user, profile } = useAuth();
  
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

  return (
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
            <div key={link.id} className="flex justify-between items-center p-3 border rounded">
              <span>{link.title} ({link.url})</span>
              <Button variant="ghost" onClick={() => removeLink(link.id)}><Trash2 className="w-4 h-4"/></Button>
            </div>
          ))}
        </div>
        <BedrockTest />
        <ResonanceScan />
      </div>
      <MobilePreview userId={user?.uid} username={profile?.username} />
    </div>
  );
};
