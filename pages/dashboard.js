// pages/dashboard.js
import { getSession, useSession, signOut } from 'next-auth/react';
import { useEffect, useState, useMemo } from 'react';
import TimeSeriesChart from '../components/TimeSeriesChart';
import MiniCharts from '../components/MiniCharts';
import KpiCard from '../components/KpiCard';
import fs from 'fs';
import path from 'path';

// Helper function to aggregate rows by minute
function aggregateByMinute(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  
  const minuteMap = {};
  rows.forEach(r => {
    try {
      const ts = new Date(r.timestamp);
      if (Number.isNaN(ts.getTime())) return;
      
      // Round down to nearest minute
      const minute = new Date(ts.getFullYear(), ts.getMonth(), ts.getDate(), ts.getHours(), ts.getMinutes(), 0, 0);
      const key = minute.toISOString();
      
      if (!minuteMap[key]) {
        minuteMap[key] = {
          timestamp: minute.toISOString(),
          voltages: [],
          currents: [],
          powers: [],
          lights: [],
        };
      }
      
      minuteMap[key].voltages.push(Number(r.voltage) || 0);
      minuteMap[key].currents.push(Number(r.current) || 0);
      minuteMap[key].powers.push(Number(r.power) || 0);
      minuteMap[key].lights.push(Number(r.light_raw) || 0);
    } catch (e) {
      // ignore
    }
  });
  
  // Convert to array and calculate stats
  const result = Object.values(minuteMap).map(m => ({
    timestamp: m.timestamp,
    voltage_min: Math.min(...m.voltages),
    voltage_max: Math.max(...m.voltages),
    voltage_avg: (m.voltages.reduce((a, b) => a + b, 0) / m.voltages.length).toFixed(2),
    current_min: Math.min(...m.currents),
    current_max: Math.max(...m.currents),
    current_avg: (m.currents.reduce((a, b) => a + b, 0) / m.currents.length).toFixed(2),
    power_min: Math.min(...m.powers),
    power_max: Math.max(...m.powers),
    power_avg: (m.powers.reduce((a, b) => a + b, 0) / m.powers.length).toFixed(2),
    light_avg: (m.lights.reduce((a, b) => a + b, 0) / m.lights.length).toFixed(0),
  }));
  
  return result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

export default function Dashboard({ initialLatest = null }) {
  const { data: session } = useSession();
  const [latest, setLatest] = useState(initialLatest);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);
  
  // Compute minute-aggregated data
  const minuteData = useMemo(() => aggregateByMinute(rows), [rows]);

  useEffect(() => {
    let mounted = true;
    async function fetchLatest() {
      try {
        const res = await fetch('/api/latest');
        const body = await res.json();
        if (!mounted) return;
        if (body.ok) setLatest(body.latest);
        else setLatest(null);
      } catch (err) {
        if (!mounted) return;
        setError(String(err));
      }
    }
    // fetch initial history for charts
    async function fetchHistory() {
      try {
        const h = await fetch('/api/history?limit=500');
        const jb = await h.json();
        if (jb.ok && Array.isArray(jb.data)) {
          setRows(jb.data);
        }
      } catch (err) {
        console.warn('history fetch err', err);
      }
    }

    fetchHistory();
    fetchLatest();
    const id = setInterval(fetchLatest, 2000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  // whenever latest updates, append to rows if newer
  useEffect(() => {
    if (!latest) return;
    try {
      const lastTs = rows.length ? new Date(rows[rows.length - 1].timestamp).getTime() : 0;
      const newTs = new Date(latest.timestamp).getTime();
      if (Number.isNaN(newTs)) return;
      if (newTs > lastTs) {
        setRows((r) => [...r.slice(-499), latest]);
      }
    } catch (e) {
      // ignore
    }
  }, [latest]);

  const handleExportCSV = async () => {
    try {
      const res = await fetch('/api/export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `telemetry_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data');
    }
  };

  const handleSendReport = async () => {
    try {
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session?.user?.email }),
      });
      const result = await res.json();
      if (result.ok) {
        alert('Report sent successfully!');
      } else {
        alert('Failed to send report: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Send report failed:', err);
      alert('Failed to send report');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Signed in as: {session?.user?.email}</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => signOut({ callbackUrl: '/login' })}>Sign out</button>
        <button onClick={handleExportCSV} style={{ backgroundColor: '#059669', color: '#fff', padding: '8px 16px', borderRadius: 4, border: 'none', cursor: 'pointer' }}>
          📥 Export to Excel (CSV)
        </button>
        <button onClick={handleSendReport} style={{ backgroundColor: '#3b82f6', color: '#fff', padding: '8px 16px', borderRadius: 4, border: 'none', cursor: 'pointer' }}>
          📧 Send Report
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>Live Device Data</h3>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {!latest && !error && <p>No data yet.</p>}
        {latest && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <KpiCard title="Voltage (V)" value={`${latest.voltage}`} />
            <KpiCard title="Current (A)" value={`${latest.current}`} />
            <KpiCard title="Power (W)" value={`${latest.power}`} />
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <TimeSeriesChart rows={rows} />
        </div>

        <div style={{ marginTop: 24 }}>
          <MiniCharts rows={rows} />
        </div>

        <div style={{ marginTop: 24 }}>
          <h3>Minute-by-Minute Analysis</h3>
          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, backgroundColor: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>Time (UTC)</th>
                  <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>Voltage (V)</th>
                  <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>Δ Voltage</th>
                  <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>Current (A)</th>
                  <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>Δ Current</th>
                  <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>Power (W)</th>
                  <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>Δ Power</th>
                  <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>Light (Raw)</th>
                </tr>
              </thead>
              <tbody>
                {minuteData.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ padding: 12, textAlign: 'center', color: '#9ca3af' }}>No minute data yet</td>
                  </tr>
                )}
                {minuteData.slice(-30).reverse().map((m, i) => {
                  const prev = i > 0 ? minuteData[minuteData.length - i - 1] : null;
                  const voltDiff = prev ? (parseFloat(m.voltage_avg) - parseFloat(prev.voltage_avg)).toFixed(2) : '-';
                  const currDiff = prev ? (parseFloat(m.current_avg) - parseFloat(prev.current_avg)).toFixed(2) : '-';
                  const powerDiff = prev ? (parseFloat(m.power_avg) - parseFloat(prev.power_avg)).toFixed(2) : '-';
                  
                  const voltColor = voltDiff > 0 ? '#10b981' : voltDiff < 0 ? '#ef4444' : '#6b7280';
                  const currColor = currDiff > 0 ? '#10b981' : currDiff < 0 ? '#ef4444' : '#6b7280';
                  const powerColor = powerDiff > 0 ? '#10b981' : powerDiff < 0 ? '#ef4444' : '#6b7280';
                  
                  return (
                    <tr key={m.timestamp} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: i % 2 === 0 ? '#f9fafb' : '#fff' }}>
                      <td style={{ padding: 8 }}>{new Date(m.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                      <td style={{ padding: 8 }}>{m.voltage_avg} (min: {m.voltage_min.toFixed(2)}, max: {m.voltage_max.toFixed(2)})</td>
                      <td style={{ padding: 8, color: voltColor, fontWeight: 600 }}>{voltDiff}</td>
                      <td style={{ padding: 8 }}>{m.current_avg} (min: {m.current_min.toFixed(2)}, max: {m.current_max.toFixed(2)})</td>
                      <td style={{ padding: 8, color: currColor, fontWeight: 600 }}>{currDiff}</td>
                      <td style={{ padding: 8 }}>{m.power_avg} (min: {m.power_min.toFixed(2)}, max: {m.power_max.toFixed(2)})</td>
                      <td style={{ padding: 8, color: powerColor, fontWeight: 600 }}>{powerDiff}</td>
                      <td style={{ padding: 8 }}>{m.light_avg}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Redirect server-side if not signed in
export async function getServerSideProps(ctx) {
  const session = await getSession(ctx);
  if (!session) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  // attempt to read latest.json from data folder and pass as initial prop
  const LATEST_FILE = path.join(process.cwd(), 'data', 'latest.json');
  let initialLatest = null;
  try {
    if (fs.existsSync(LATEST_FILE)) {
      const raw = fs.readFileSync(LATEST_FILE, 'utf8');
      initialLatest = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Could not read latest.json:', err);
  }
  return { props: { session, initialLatest } };
}
