import { Upload, FileText, Loader2, X } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { parseFileText } from "../services/geminiService";

interface FileSidebarProps {
  onProcess: (text: string) => void;
  isProcessing: boolean;
}

export function FileSidebar({ onProcess, isProcessing }: FileSidebarProps) {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFile(null);
    const input = document.getElementById('file-upload') as HTMLInputElement;
    if (input) input.value = '';
  };

  const handleProcess = async () => {
    if (!file) return;
    try {
      const text = await parseFileText(file);
      onProcess(text);
    } catch (error) {
      console.error(error);
      alert("Failed to read file. Please try a different one.");
    }
  };

  return (
    <aside className="w-72 border-r border-zinc-200 bg-white h-screen flex flex-col p-6 overflow-hidden">
      <div className="mb-8 p-1">
        <h2 className="text-lg font-semibold tracking-tight">AgendaAI</h2>
        <p className="text-xs text-zinc-500 mt-1">Turn documents into structure</p>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        <div className="space-y-4">
          <label 
            htmlFor="file-upload" 
            className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-zinc-200 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-all cursor-pointer text-center p-6"
          >
            <div className="flex flex-col items-center justify-center">
              <Upload className="w-8 h-8 text-zinc-400 mb-2" />
              <p className="text-xs font-medium text-zinc-600">Drop your PDF or Docx</p>
              <p className="text-[10px] text-zinc-400 mt-1 italic">Up to 50MB</p>
            </div>
            <input 
              id="file-upload" 
              type="file" 
              className="hidden" 
              accept=".txt,.doc,.docx,.pdf"
              onChange={handleFileChange}
            />
          </label>

          {file && (
            <Card className="p-3 flex items-center justify-between border-zinc-200 bg-zinc-50 shadow-none">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="w-4 h-4 text-zinc-600 shrink-0" />
                <span className="text-xs font-medium truncate">{file.name}</span>
              </div>
              <button 
                onClick={clearFile}
                className="p-1 hover:bg-zinc-200 rounded-full text-zinc-400 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Card>
          )}

          <Button 
            className="w-full bg-zinc-950 text-white hover:bg-zinc-800 transition-colors" 
            disabled={!file || isProcessing}
            onClick={handleProcess}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Generate Agenda"
            )}
          </Button>
        </div>

        <div className="flex-1 overflow-hidden">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 px-2">Recent Uploads</p>
          <ScrollArea className="h-full px-1">
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-md bg-zinc-100 border border-zinc-200 opacity-60">
                <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center text-red-600 text-[10px] font-bold">PDF</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">Example_Brief.pdf</p>
                  <p className="text-[10px] text-zinc-400 italic">Pre-processed</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg mt-auto">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">System ready</span>
        </div>
        <div className="text-[10px] text-zinc-400 font-medium">Powered by AgendaFlow AI</div>
      </div>
    </aside>
  );
}
