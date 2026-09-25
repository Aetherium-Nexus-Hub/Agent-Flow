import { MeetingAgenda } from "../types";

export async function generateAgendaFromText(text: string): Promise<MeetingAgenda> {
  const response = await fetch("/api/v1/parse-meeting", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ notes: text }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to generate agenda: No response from AI");
  }

  const data = await response.json();

  return {
    title: data.title || "Meeting Agenda",
    objective: data.objective || "",
    stakeholders: (data.stakeholders || []).map((s: any) => ({
      name: s.name,
      role: s.role,
    })),
    items: (data.timeline || []).map((t: any, idx: number) => ({
      id: `item-${idx}`,
      startTime: t.time || "09:00",
      duration: t.duration || 15,
      title: t.title || "Discussion Item",
      description: t.description || "",
      presenter: t.presenter || "Presenter",
    })),
    date: new Date().toISOString().split("T")[0],
  };
}

export async function parseFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
