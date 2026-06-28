import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { motion } from "motion/react";
import { 
  ExternalLink, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  ChevronRight,
  User,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LinkItem {
  id: string;
  title: string;
  url: string;
  order?: number;
}

export const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [displayName, setDisplayName] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfileAndLinks = async () => {
      if (!username) {
        setProfileExists(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // 1. Query user with matching username
        const cleanUsername = username.toLowerCase().trim();
        const usersRef = collection(db, "users");
        const userQuery = query(usersRef, where("username", "==", cleanUsername));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
          setProfileExists(false);
          setLoading(false);
          return;
        }

        const userDoc = userSnapshot.docs[0];
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        setDisplayName(userData.displayName || `@${cleanUsername}`);
        setProfileExists(true);

        // 2. Fetch links owned by this userId
        const linksRef = collection(db, "links");
        const linksQuery = query(linksRef, where("owner", "==", userId));
        const linksSnapshot = await getDocs(linksQuery);

        const linksData = linksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as LinkItem[];

        // Sort by order locally
        linksData.sort((a, b) => (a.order || 0) - (b.order || 0));
        setLinks(linksData);
      } catch (error) {
        console.error("Error fetching public profile:", error);
        setProfileExists(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndLinks();
  }, [username]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 mt-3 font-medium">Retrieving Aether portfolio...</p>
      </div>
    );
  }

  if (profileExists === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-full mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Link Page Not Found</h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            The profile <span className="font-mono font-semibold text-rose-600">@{username}</span> has not been claimed yet! You can claim this link page for yourself right now.
          </p>
          <div className="mt-6 w-full flex flex-col gap-2.5">
            <Link to="/">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                Claim @{username} Now
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full text-slate-600 border-slate-200">
                Go to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get user avatar initials
  const initials = displayName
    ? displayName.replace(/[^a-zA-Z0-9 ]/g, "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-slate-50 to-indigo-50/30 flex flex-col items-center justify-between p-6">
      {/* Container card */}
      <div className="w-full max-w-md flex-1 flex flex-col items-center pt-12 pb-24">
        
        {/* User Profile Info */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg border-2 border-white ring-4 ring-indigo-50 mb-4 select-none">
            {initials || <User className="w-8 h-8" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">
            {displayName}
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1 bg-slate-100 px-2 py-0.5 rounded-full">
            portfol.io/{username}
          </p>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleShare}
            className="mt-3 text-slate-500 text-xs hover:text-indigo-600"
          >
            <Share2 className="w-3.5 h-3.5 mr-1" />
            {copied ? "Copied!" : "Share Page"}
          </Button>
        </div>

        {/* Dynamic Link Stack */}
        <div className="w-full space-y-3.5">
          {links.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-100 text-center text-slate-400 text-sm italic">
              No links saved on this portfolio profile yet.
            </div>
          ) : (
            links.map((link, index) => (
              <motion.a
                key={link.id}
                href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className="group relative block w-full bg-white hover:bg-indigo-600 text-slate-800 hover:text-white border border-slate-100 shadow-sm rounded-2xl p-4 transition-all duration-200 text-center font-semibold hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-5"></div> {/* Spacer for symmetry */}
                  <span className="text-sm select-none">{link.title}</span>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                </div>
              </motion.a>
            ))
          )}
        </div>
      </div>

      {/* Persistent Call To Action footer */}
      <footer className="w-full max-w-sm mt-auto">
        <Link to="/">
          <div className="bg-slate-900/90 hover:bg-slate-900 backdrop-blur-md text-white p-3.5 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between transition-all group">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
              <div className="text-left">
                <p className="text-xs font-bold leading-normal">Claim your link page</p>
                <p className="text-[10px] text-slate-400 leading-normal">Build your personalized modular portfolio</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </footer>
    </div>
  );
};
