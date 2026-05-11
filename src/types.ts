export interface Stakeholder {
  name: string;
  role: string;
  avatar?: string;
}

export interface AgendaItem {
  id: string;
  startTime: string; // HH:mm
  duration: number; // minutes
  title: string;
  description: string;
  presenter: string;
}

export interface MeetingAgenda {
  title: string;
  date?: string;
  stakeholders: Stakeholder[];
  items: AgendaItem[];
  objective: string;
}
