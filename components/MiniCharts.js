import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function MiniCharts({ rows }) {
  const dayMap = {};
  rows.forEach(r => {
    const date = new Date(r.timestamp).toISOString().slice(0,10);
    dayMap[date] = (dayMap[date] || 0) + (Number(r.power) || 0);
  });

  const daily = Object.keys(dayMap).slice(-30).map(k => ({
    date: k,
    energy_kwh: +(dayMap[k] / 1000).toFixed(2)
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow p-4">
        <h5 className="font-semibold mb-2">Daily Energy (kWh)</h5>
        <div style={{ height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={daily}>
              <XAxis dataKey="date" interval={4} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="energy_kwh" fill="#0ea5a4" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <h5 className="font-semibold mb-2">Panel Temp (last)</h5>
        <div className="text-sm text-slate-600">
          {rows.length ? (Number(rows[rows.length - 1].panel_temp).toFixed(1)) : "N/A"} °C
        </div>
      </div>
    </div>
  );
}
