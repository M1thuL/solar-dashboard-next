// pages/index.js
import Head from "next/head";
import Header from "../components/Header";
import TimeSeriesChart from "../components/TimeSeriesChart";
import DailyEnergyChart from "../components/DailyEnergyChart";
import ForecastPanel from "../components/ForecastPanel";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function Home() {
  // fetch the latest and historical rows
  const { data: latestData } = useSWR("/api/latest", fetcher, { refreshInterval: 2000 });
  const { data: historyData } = useSWR("/api/history?limit=2000", fetcher, { refreshInterval: 60000 });

  const latest = latestData?.latest || null;
  const rows = (historyData?.data || []).map((r) => ({
    ...r,
    timestamp: r.timestamp || r.time || r.datetime,
    voltage: r.voltage,
    current: r.current,
    power: r.power,
    light_raw: r.light_raw || r.lightRaw || r.light,
  }));
  // ensure sorted ascending by timestamp
  rows.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // yesterday subset for forecast
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yStr = yesterdayDate.toISOString().slice(0, 10);
  const yesterdayRows = rows.filter((r) => r.timestamp && r.timestamp.startsWith(yStr));

  return (
    <>
      <Head>
        <title>Solar Dashboard</title>
      </Head>

      <Header />

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="col-span-2">
            <TimeSeriesChart rows={rows.slice(-200)} />
          </div>

          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-xs text-slate-500">Live sample</div>
              {latest ? (
                <div className="mt-2">
                  <div className="text-sm">Time: {new Date(latest.timestamp).toLocaleString()}</div>
                  <div className="text-lg font-medium">Power: {Number(latest.power || 0).toFixed(2)} W</div>
                  <div className="text-sm text-slate-600">Voltage: {Number(latest.voltage || 0).toFixed(2)} V</div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-slate-400">No live sample yet</div>
              )}
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-xs text-slate-500 mb-2">Data Export</div>
              <a href="/api/history?limit=10000" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded">Download JSON</a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <DailyEnergyChart rows={rows} />
          <ForecastPanel rows={yesterdayRows.length ? yesterdayRows : rows.slice(-48)} />
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-3">Recent raw samples</h3>
          <div className="text-xs text-slate-500 mb-2">Showing last 20</div>
          <div style={{ maxHeight: 220, overflow: "auto" }}>
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-500 border-b">
                <tr>
                  <th className="py-1">Time</th>
                  <th>Power (W)</th>
                  <th>Voltage (V)</th>
                  <th>Current (A)</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(-20).reverse().map((r, idx) => (
                  <tr key={idx} className="border-b last:border-b-0">
                    <td className="py-2">{new Date(r.timestamp).toLocaleString()}</td>
                    <td>{Number(r.power || 0).toFixed(2)}</td>
                    <td>{Number(r.voltage || 0).toFixed(2)}</td>
                    <td>{Number(r.current || 0).toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
