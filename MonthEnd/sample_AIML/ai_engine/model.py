import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler


def has_minimum_data(df):
    return not df.empty and df.drop_duplicates().shape[0] >= 5


def detect_ml_anomalies(df):
    model = IsolationForest(contamination=0.15, random_state=42)
    preds = model.fit_predict(df[["amount"]])
    return df[preds == -1]


def detect_spending_modes(df):
    daily = df.groupby(df["date"].dt.date).agg(
        total=("amount", "sum"),
        count=("amount", "count")
    )

    if len(daily) < 3:
        return {}

    X = StandardScaler().fit_transform(daily)
    kmeans = KMeans(n_clusters=3, random_state=42)
    daily["cluster"] = kmeans.fit_predict(X)

    return daily.groupby("cluster").mean().to_dict("index")


def allowance_metrics(df, allowance):
    spent = df["amount"].sum()
    return {
        "spent": round(spent, 2),
        "remaining": round(allowance - spent, 2)
    }
