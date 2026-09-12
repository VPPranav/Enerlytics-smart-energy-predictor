import os
import requests

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(DATA_DIR, "energydata_complete.csv")
DATA_URL = "https://raw.githubusercontent.com/LuisM78/Appliances-energy-prediction-data/master/energydata_complete.csv"

def download_dataset():
    if os.path.exists(CSV_PATH) and os.path.getsize(CSV_PATH) > 1000000:
        print(f"Dataset already exists at {CSV_PATH} ({os.path.getsize(CSV_PATH):,} bytes). Skipping download.", flush=True)
        return CSV_PATH
    
    print(f"Downloading authentic UCI Appliances Energy Prediction dataset from {DATA_URL}...", flush=True)
    resp = requests.get(DATA_URL, stream=True, timeout=30)
    resp.raise_for_status()
    
    total_downloaded = 0
    with open(CSV_PATH, "wb") as f:
        for chunk in resp.iter_content(chunk_size=1024 * 512):
            if chunk:
                f.write(chunk)
                total_downloaded += len(chunk)
                print(f"Downloaded {total_downloaded / (1024*1024):.2f} MB...", flush=True)
                
    print(f"Successfully saved {total_downloaded:,} bytes to {CSV_PATH}", flush=True)
    return CSV_PATH

if __name__ == "__main__":
    download_dataset()
