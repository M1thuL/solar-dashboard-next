export default function EmailPreview({ latest }) {
    if (!latest) return <div className="text-sm text-slate-500">No sample available</div>;
  
    return (
      <div className="text-sm p-3 bg-slate-50 rounded">
        <div className="text-xs text-slate-500 mb-1">Daily Email Preview</div>
        <div><b>Time:</b> {new Date(latest.timestamp).toLocaleString()}</div>
        <div><b>Power:</b> {Number(latest.power).toFixed(1)} W</div>
        <div><b>Energy Est:</b> {(latest.power/1000).toFixed(2)} kWh</div>
        <div className="text-xs text-slate-400 mt-2">This mimics the Inngest nightly email.</div>
      </div>
    );
  }
  