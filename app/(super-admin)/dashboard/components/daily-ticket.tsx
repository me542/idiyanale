'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DailyData {
  date: string;
  serviceRequest: number;
  changedRequest: number;
  incidentReport: number;
}

const DailyTicket = () => {
  const data: DailyData[] = [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Daily Ticket</h3>
        <select className="text-xs px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-600">
          <option>7 days</option>
          <option>30 days</option>
        </select>
      </div>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <p className="text-gray-400 text-center">
            No daily ticket data available
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="serviceRequest"
              stroke="#10b981"
              name="Service Request"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="changedRequest"
              stroke="#3b82f6"
              name="Changed Request"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="incidentReport"
              stroke="#ef4444"
              name="Incident Report"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default DailyTicket;
