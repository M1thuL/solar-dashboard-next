export default function KpiCard({ title, value }) {
    return (
      <div className="bg-white rounded-2xl shadow p-4 flex flex-col">
        <div className="text-sm text-slate-500">{title}</div>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
      </div>
    );
  }
  