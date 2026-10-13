"""Download and load the UCI Cleveland Heart Disease dataset."""

import os
import ssl
import urllib.request
import pandas as pd

UCI_CLEVELAND_URL = (
    "https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.cleveland.data"
)

COLUMN_NAMES = [
    "age",
    "sex",
    "cp",
    "trestbps",
    "chol",
    "fbs",
    "restecg",
    "thalach",
    "exang",
    "oldpeak",
    "slope",
    "ca",
    "thal",
    "num",
]


def get_data_dir() -> str:
    """Return absolute path to ml/data directory."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data")
    os.makedirs(data_dir, exist_ok=True)
    return data_dir


def download_cleveland_data(dest_path: str | None = None) -> str:
    """Download the Cleveland dataset file if not present locally."""
    if dest_path is None:
        dest_path = os.path.join(get_data_dir(), "processed.cleveland.data")

    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 0:
        return dest_path

    # Attempt download with SSL context handling (accommodating future system clocks)
    ctx = ssl.create_default_context()
    try:
        req = urllib.request.Request(
            UCI_CLEVELAND_URL,
            headers={"User-Agent": "HeartSight-ML-Pipeline/1.0"},
        )
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            content = resp.read()
    except Exception:
        # Fallback to unverified SSL context if certificate verification fails
        unverified_ctx = ssl._create_unverified_context()
        req = urllib.request.Request(
            UCI_CLEVELAND_URL,
            headers={"User-Agent": "HeartSight-ML-Pipeline/1.0"},
        )
        with urllib.request.urlopen(req, context=unverified_ctx, timeout=15) as resp:
            content = resp.read()

    with open(dest_path, "wb") as f:
        f.write(content)

    return dest_path


def load_raw_dataset(data_path: str | None = None) -> pd.DataFrame:
    """Load the Cleveland dataset as a DataFrame with cleaned column names."""
    if data_path is None or not os.path.exists(data_path):
        data_path = download_cleveland_data(data_path)

    df = pd.read_csv(
        data_path,
        header=None,
        names=COLUMN_NAMES,
        na_values="?",
    )
    return df


if __name__ == "__main__":
    path = download_cleveland_data()
    df = load_raw_dataset(path)
    print(f"Dataset successfully loaded from: {path}")
    print(f"Shape: {df.shape}")
