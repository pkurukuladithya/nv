import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const HistoryChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="muted-text" style={{ textAlign: "center", padding: "2rem" }}>No history data available for chart.</div>;
  }

  // Reverse data so oldest is on the left, newest on the right
  const chartData = [...data].reverse().map(d => ({
    time: new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    temperature: d.temperature,
    humidity: d.humidity,
    moisture: d.moisture,
  }));

  return (
    <div className="chart-container" style={{ width: '100%', height: 350, marginTop: '1rem' }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12, fill: '#6b7280' }} 
            tickMargin={10}
            minTickGap={30}
          />
          <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6b7280' }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#6b7280' }} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '0.25rem' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="temperature" 
            name="Temp (°C)" 
            stroke="#ef4444" 
            strokeWidth={3} 
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="humidity" 
            name="Humidity (%)" 
            stroke="#3b82f6" 
            strokeWidth={3} 
            dot={false}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="moisture" 
            name="Moisture (%)" 
            stroke="#14b8a6" 
            strokeWidth={3} 
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoryChart;
