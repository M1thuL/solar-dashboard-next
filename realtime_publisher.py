# realtime_publisher.py (Windows-friendly, verbose) — looped playback
import pandas as pd
import time
import sys
import json
from pathlib import Path
from datetime import datetime

# CONFIG: filenames (placed in project root)
CSV = "sensor_data_bangalore_2023.csv"
OUT = Path("latest_row.json")

# Read CSV (expects the file you generated earlier)
try:
    df = pd.read_csv(CSV, parse_dates=["timestamp"])
except Exception as e:
    print(f"ERROR: cannot read CSV '{CSV}': {e}")
    raise SystemExit(1)

n = len(df)
start_index = int(sys.argv[1]) if len(sys.argv) > 1 else 0
speedup = float(sys.argv[2]) if len(sys.argv) > 2 else 60.0
# speedup: ratio of real seconds per CSV seconds.
# Example: CSV is hourly -> speedup=3600 would make 1 hour = 1 second.
# Common choices:
#  - 60   -> 1 minute of CSV time = 1 real second (fast demo)
#  - 3600 -> 1 hour of CSV time = 1 real second (very fast)
#  - 1    -> real-time (1 CSV second = 1 real second) -- not useful for hourly CSV
print(f"Loaded {n} rows from {CSV}. start_index={start_index}, speedup={speedup}")

def iso(ts):
    return pd.to_datetime(ts).isoformat()

def play_loop(start_idx=0):
    if n == 0:
        print("No rows in CSV. Exiting.")
        return

    index = start_idx % n

    while True:
        row = df.iloc[index].to_dict()
        # ensure timestamp is iso
        if "timestamp" in row:
            row["timestamp"] = iso(row["timestamp"])
        # write latest JSON
        OUT.write_text(json.dumps(row))
        # log to console
        ts = row.get("timestamp", "unknown")
        power = row.get("power", None)
        irr = row.get("irradiance", None)
        print(f"[{datetime.now().isoformat(timespec='seconds')}] published idx={index} ts={ts} power={power} irr={irr}")

        # compute sleep using next timestamp delta if possible (wrap around at end)
        try:
            t0 = pd.to_datetime(df.iloc[index]["timestamp"])
            next_idx = (index + 1) % n
            t1 = pd.to_datetime(df.iloc[next_idx]["timestamp"])
            # if wrapping from last -> first, assume continuous timeline:
            # if t1 <= t0, add the difference as if t1 is on next cycle (add one day until > t0)
            if next_idx == 0 and t1 <= t0:
                # try to infer typical step: use average delta of nonzero diffs or fallback to 3600s
                # compute median positive delta
                deltas = []
                for i in range(n-1):
                    d = (pd.to_datetime(df.iloc[i+1]["timestamp"]) - pd.to_datetime(df.iloc[i]["timestamp"])).total_seconds()
                    if d > 0:
                        deltas.append(d)
                median_delta = int(pd.Series(deltas).median()) if deltas else 3600
                t1 = t1 + pd.Timedelta(seconds=median_delta)
            delta_seconds = max(0.0, (t1 - t0).total_seconds())
            sleep_for = max(0.01, delta_seconds / speedup)
        except Exception:
            sleep_for = 0.5

        time.sleep(sleep_for)

        index += 1
        if index >= n:
            index = 0  # restart from beginning

if __name__ == "__main__":
    try:
        play_loop(start_index)
    except KeyboardInterrupt:
        print("\nPublisher stopped by user.")
