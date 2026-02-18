# serial_to_api.py
import sys
import argparse
import random
import csv
import re
try:
    import serial
except Exception:
    serial = None
import requests
import time
import os

# config
SERIAL_PORT = "COM11"          # replace with your Windows COM port or /dev/ttyUSB0 on Linux
BAUD = 115200
API_URL = "http://localhost:3000/api/ingest"  # your Next.js ingest endpoint

def parse_line(line, pending_data=None):
    """
    Parse both CSV format (voltage,current,power,lightRaw)
    and human-readable format:
      "Voltage: 1.81 V | Current: 0.41 A | Power: 0.74 W"
      "Light (Raw ADC): 11"
    pending_data: dict to accumulate multi-line reads (for human format)
    """
    try:
        line = line.strip()
        if not line:
            return None, pending_data
        
        # Check for human-readable format with "Voltage:" and "Current:"
        if "Voltage:" in line and "Current:" in line and "Power:" in line:
            # Format: "Voltage: X.XX V | Current: Y.YY A | Power: Z.ZZ W"
            v_match = re.search(r'Voltage:\s*([\d.]+)\s*V', line)
            i_match = re.search(r'Current:\s*([\d.]+)\s*A', line)
            p_match = re.search(r'Power:\s*([\d.]+)\s*W', line)
            if v_match and i_match and p_match:
                data = {
                    "voltage": float(v_match.group(1)),
                    "current": float(i_match.group(1)),
                    "power": float(p_match.group(1)),
                    "light_raw": 0  # placeholder, will be updated if Light line follows
                }
                return data, data  # return data and keep as pending for light update
        
        # Check for light line
        elif "Light (Raw ADC):" in line:
            light_match = re.search(r'Light \(Raw ADC\):\s*(\d+)', line)
            if light_match and pending_data:
                pending_data["light_raw"] = int(light_match.group(1))
                result = pending_data.copy()
                return result, None  # return complete data, clear pending
            elif light_match:
                # light line without prior voltage line; ignore
                return None, None
        
        # Fall back to CSV format: voltage,current,power,lightRaw
        elif "," in line:
            parts = line.split(",")
            if len(parts) >= 4:
                v = float(parts[0])
                i = float(parts[1])
                p = float(parts[2])
                light = int(float(parts[3]))
                data = {"voltage": v, "current": i, "power": p, "light_raw": light}
                return data, None
        
        return None, pending_data
    except Exception as e:
        print("parse error:", e, "line:", line)
        return None, pending_data

def main():
    # verify pyserial is available
    if serial is None:
        print("Error: 'pyserial' is not installed. Install it with:")
        print("    pip install pyserial")
        sys.exit(1)

    # try to open serial; allow multiple attempts
    while True:
        try:
            ser = serial.Serial(SERIAL_PORT, BAUD, timeout=2)
            print("Connected to", SERIAL_PORT)
            break
        except Exception as e:
            print("Serial open failed:", e)
            print("Retrying in 2s...")
            time.sleep(2)

    pending_data = None
    while True:
        try:
            line = ser.readline().decode(errors="ignore").strip()
            if not line:
                continue
            # optional: print raw line for debugging
            print("SER:", line)
            data, pending_data = parse_line(line, pending_data)
            if not data:
                continue
            # add device id + timestamp optional
            payload = {
                "device_id": "esp32-01",
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
                **data
            }
            # post to API
            try:
                r = requests.post(API_URL, json=payload, timeout=3)
                print("POST", r.status_code, r.text[:200])
            except Exception as e:
                print("POST failed:", e)
            # small pause between reads
            time.sleep(0.5)
        except KeyboardInterrupt:
            print("Exiting")
            break
        except Exception as e:
            print("Error reading:", e)
            time.sleep(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Serial to API bridge (or simulate data)")
    parser.add_argument("--simulate", action="store_true", help="Run in simulation mode (no serial hardware)")
    parser.add_argument("--file", help="CSV file to read simulated lines from")
    parser.add_argument("--once", action="store_true", help="Send a single sample and exit")
    args = parser.parse_args()

    def post_payload(payload):
        try:
            r = requests.post(API_URL, json=payload, timeout=5)
            print("POST", r.status_code, r.text[:200])
        except Exception as e:
            print("POST failed:", e)

    if args.simulate:
        print("Starting simulation mode")
        # If a file is provided and exists, stream lines from it, otherwise generate synthetic data
        if args.file and os.path.exists(args.file):
            # read CSV lines and loop
            with open(args.file, newline='') as f:
                reader = csv.reader(f)
                rows = list(reader)
            if not rows:
                print("Simulation file empty")
                sys.exit(1)
            idx = 0
            pending_data = None
            while True:
                row = rows[idx % len(rows)]
                idx += 1
                line = ",".join(row)
                print("SIM LINE:", line)
                data, pending_data = parse_line(line, pending_data)
                if data:
                    payload = {"device_id": "sim-01", "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"), **data}
                    post_payload(payload)
                    if args.once:
                        break
                time.sleep(1)
        else:
            # generate synthetic values
            while True:
                v = round(12 + random.uniform(-1, 1), 2)
                i = round(5 + random.uniform(-0.5, 0.5), 2)
                p = round(v * i, 2)
                light = random.randint(0, 1023)
                payload = {"device_id": "sim-01", "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"), "voltage": v, "current": i, "power": p, "light_raw": light}
                print("SIM PAYLOAD:", payload)
                post_payload(payload)
                if args.once:
                    break
                time.sleep(1)
    else:
        main()
