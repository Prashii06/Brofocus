// BroFocus - Task Completion Donut Chart
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface CompletionDonutProps {
  data: {
    pending: number;
    in_progress: number;
    completed: number;
  };
}

const COLORS = {
  completed: '#10b981',
  in_progress: '#8b4dff',
  pending: '#06b6d4',
};

export const CompletionDonut: React.FC<CompletionDonutProps> = ({ data }) => {
  const chartData = [
    { name: 'Completed', value: data.completed || 0, color: COLORS.completed },
    { name: 'In Progress', value: data.in_progress || 0, color: COLORS.in_progress },
    { name: 'Pending', value: data.pending || 0, color: COLORS.pending },
  ];

  const total = (data.completed || 0) + (data.in_progress || 0) + (data.pending || 0);
  const completionRate = total > 0 ? Math.round(((data.completed || 0) / total) * 100) : 0;

  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 backdrop-blur-md">
      <h3 className="text-sm font-bold text-slate-200">Task Execution Share</h3>
      <div className="h-56 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs shadow-lg">
                      <span className="font-semibold text-slate-200">{payload[0].name}: </span>
                      <span className="font-bold text-cyan-400">{payload[0].value}</span>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-100">{completionRate}%</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Completed</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-center text-xs">
        <div>
          <span className="text-[10px] text-emerald-400 block font-medium">Done</span>
          <span className="font-bold text-slate-200">{data.completed || 0}</span>
        </div>
        <div>
          <span className="text-[10px] text-violet-400 block font-medium">In Progress</span>
          <span className="font-bold text-slate-200">{data.in_progress || 0}</span>
        </div>
        <div>
          <span className="text-[10px] text-cyan-400 block font-medium">Pending</span>
          <span className="font-bold text-slate-200">{data.pending || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default CompletionDonut;
