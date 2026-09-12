// BroFocus - Focus Hours Area Chart
import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';

interface FocusChartProps {
  data: any[];
  title?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 px-3 py-2.5 rounded-xl border border-violet-500/30 text-xs shadow-xl backdrop-blur-md">
        <p className="font-semibold text-slate-100 mb-1">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex items-center gap-2 mt-0.5">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-slate-400">{entry.name}:</span>
            <span className="font-bold text-slate-100">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const FocusChart: React.FC<FocusChartProps> = ({ data, title }) => {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 backdrop-blur-md">
      {title && <h3 className="text-sm font-bold text-slate-200">{title}</h3>}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b4dff" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b4dff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="tasksGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="focus_hours"
              name="Focus Hours"
              stroke="#8b4dff"
              strokeWidth={2}
              fill="url(#focusGradient)"
            />
            <Area
              type="monotone"
              dataKey="tasks_completed"
              name="Tasks Completed"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#tasksGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FocusChart;
