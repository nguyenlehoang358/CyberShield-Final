import joblib
from sklearn.ensemble import IsolationForest
import os

# Features extracted: [hour_of_day, consecutive_failures, login_duration_ms]
X = [
    # Normal Logins
    [9, 0, 1200], [14, 1, 900], [10, 0, 1500], [11, 0, 1100], [18, 0, 800],
    [9, 2, 2000], [13, 0, 1000], [16, 1, 1300], [8, 0, 950],
    
    # Anomalous Logins (e.g., automated scripts in the middle of the night)
    [3, 5, 200], [2, 10, 150], [4, 8, 300], [1, 20, 50], [3, 15, 100]
]

# IsolationForest is excellent for anomaly detection
clf = IsolationForest(contamination=0.2, random_state=42)

print("Training Anomaly Detection Model...")
clf.fit(X)

# Save the model
model_path = os.path.join(os.path.dirname(__file__), 'anomaly_model.joblib')
joblib.dump(clf, model_path)
print(f"Anomaly model trained and saved to {model_path}.")
