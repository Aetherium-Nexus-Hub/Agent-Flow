import { motion } from "motion/react";
import { Clock, User } from "lucide-react";
import { AgendaItem } from "../types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface TimelineProps {
  items: AgendaItem[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative space-y-0">
      {/* Vertical Line */}
      <div className="absolute left-[87px] top-0 bottom-0 w-[1px] bg-zinc-200" />

      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative flex items-start gap-8 pb-10 group"
        >
          {/* Time & Duration */}
          <div className="w-20 text-right shrink-0 pt-1">
            <p className="text-xs font-bold text-zinc-800">{item.startTime}</p>
            <p className="text-[10px] text-zinc-400 uppercase tracking-tighter">{item.duration} Min</p>
          </div>

          {/* Dot */}
          <div className={`mt-2.5 w-2.5 h-2.5 rounded-full z-10 shrink-0 ${index === items.length - 1 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-400'}`} 
               style={{ marginLeft: '-5.25px' }} />

          {/* Content Card */}
          <Card className={`flex-1 p-5 border-zinc-200 shadow-sm hover:shadow-md transition-all ${index === items.length - 1 ? 'bg-zinc-900 border-zinc-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className={`text-sm font-semibold tracking-tight ${index === items.length - 1 ? 'text-zinc-50' : 'text-zinc-950'}`}>
                {item.title}
              </h4>
              <Badge variant="outline" className={`text-[10px] py-0 h-5 border-zinc-200 font-medium ${index === items.length - 1 ? 'text-zinc-400 border-zinc-800' : 'text-zinc-500'}`}>
                {item.presenter}
              </Badge>
            </div>
            <p className={`text-xs leading-relaxed ${index === items.length - 1 ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {item.description}
            </p>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
