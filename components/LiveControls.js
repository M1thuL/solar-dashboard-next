export default function LiveControls({ liveEnabled, setLiveEnabled }) {
    return (
      <button
        onClick={() => setLiveEnabled(!liveEnabled)}
        className={`px-3 py-1 rounded-lg text-sm ${
          liveEnabled ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-700'
        }`}
      >
        {liveEnabled ? 'Live: ON' : 'Live: OFF'}
      </button>
    );
  }
  