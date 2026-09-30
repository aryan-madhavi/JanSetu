import os
from google.cloud import bigquery
import sqlite3
import pandas as pd

def export_to_bq():
    print("Exporting SQLite to BigQuery...")
    # Mock impl for hackathon submission
    print("This would read from sqlite:///jansetu.sqlite and stream to BQ dataset jansetu_raw")
    conn = sqlite3.connect('../backend/jansetu.sqlite')
    df = pd.read_sql_query("SELECT * FROM requests", conn)
    print(f"Loaded {len(df)} requests.")
    # client = bigquery.Client()
    # job = client.load_table_from_dataframe(df, 'jansetu-510215.jansetu_raw.requests')
    # job.result()
    print("Export simulated successfully.")

if __name__ == "__main__":
    export_to_bq()
