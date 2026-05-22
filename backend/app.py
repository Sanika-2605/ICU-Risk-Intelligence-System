"""
multicare-predict — FastAPI backend
ICU Infection Risk Prediction (VAP, CLABSI, CAUTI)
Simple x-user-id header auth. No JWT.
"""

import os
import json
import pickle
import warnings
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

import numpy as np
import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

warnings.filterwarnings("ignore")
load_dotenv()

# ─── Globals (populated on startup) ─────────────────────────────────────────

models: dict = {}
explainers: dict = {}
feature_order: list = []
training_medians: dict = {}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# ─── Lifespan ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(_: FastAPI):
    global models, explainers, feature_order, training_medians

    for infection in ["vap", "clabsi", "cauti"]:
        with open(os.path.join(BASE_DIR, f"model/{infection}_model.pkl"), "rb") as f:
            models[infection] = pickle.load(f)
        with open(os.path.join(BASE_DIR, f"model/{infection}_explainer.pkl"), "rb") as f:
            explainers[infection] = pickle.load(f)

    with open(os.path.join(BASE_DIR, "model/feature_order.json")) as f:
        feature_order = json.load(f)

    train_df = pd.read_csv(
        os.path.join(BASE_DIR, "data/processed/training_data_v2.csv")
    )
    training_medians = train_df[feature_order].median().to_dict()

    print("✅ Models loaded:", list(models.keys()))
    print("✅ Features:", feature_order)
    print("✅ Supabase connected")
    yield


# ─── App ────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="multicare-predict API",
    description="ICU Infection Risk Prediction System",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# ─── Supabase ────────────────────────────────────────────────────────────────

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY"),
)


# ─── Column sets for Supabase tables ────────────────────────────────────────

VITALS_COLS = {
    "heart_rate", "blood_pressure_sys", "blood_pressure_dia",
    "respiratory_rate", "temperature", "spo2",
    "wbc_count", "lactate", "creatinine", "glucose", "platelet_count",
}

DEVICE_COLS = {
    "ventilator_duration", "fio2", "peep",
    "catheter_duration", "central_line_duration",
    "tidal_volume", "urine_output",
}


# ─── Auth helper ─────────────────────────────────────────────────────────────

def get_current_user(x_user_id: str = Header(None)) -> dict:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Login required. Send x-user-id header.")
    result = supabase.table("users").select("*").eq("id", x_user_id).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="User not found")
    return result.data[0]


# ─── Pydantic schemas ────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class PatientCreate(BaseModel):
    patient_code: str
    age: int
    gender: str
    bmi: Optional[float] = None


class VitalsInput(BaseModel):
    patient_id: str
    heart_rate: Optional[float] = None
    blood_pressure_sys: Optional[float] = None
    respiratory_rate: Optional[float] = None
    temperature: Optional[float] = None
    spo2: Optional[float] = None
    wbc_count: Optional[float] = None
    lactate: Optional[float] = None
    creatinine: Optional[float] = None
    glucose: Optional[float] = None
    platelet_count: Optional[float] = None
    ventilator_duration: Optional[float] = None
    fio2: Optional[float] = None
    peep: Optional[float] = None
    catheter_duration: Optional[float] = None
    central_line_duration: Optional[float] = None


class InterventionCreate(BaseModel):
    patient_id: str
    action_text: str
    infection_type: str
    priority: str = "medium"


class NurseTaskUpdate(BaseModel):
    task_status: str
    notes: Optional[str] = None


# ─── Prediction helper ────────────────────────────────────────────────────────

def run_prediction(vitals: dict) -> dict:
    row = {}
    for feat in feature_order:
        val = vitals.get(feat)
        if val is None or (isinstance(val, float) and np.isnan(val)):
            row[feat] = training_medians.get(feat, 0)
        else:
            row[feat] = float(val)

    X = pd.DataFrame([row])[feature_order]

    results = {}
    shap_results = {}

    for infection in ["vap", "clabsi", "cauti"]:
        prob = float(models[infection].predict_proba(X)[0][1])
        results[f"{infection}_score"] = round(prob, 3)

        if prob >= 0.70:
            level = "HIGH"
        elif prob >= 0.40:
            level = "MEDIUM"
        else:
            level = "LOW"
        results[f"{infection}_level"] = level

        shap_vals = explainers[infection].shap_values(X)
        if isinstance(shap_vals, list):
            shap_vals = shap_vals[1]

        shap_series = pd.Series(shap_vals[0], index=feature_order)
        top3 = shap_series.abs().nlargest(3)

        shap_results[infection] = {}
        for i, feat in enumerate(top3.index):
            shap_results[infection][f"feature{i+1}"] = {
                "name": feat,
                "value": round(float(row[feat]), 3),
                "shap": round(float(shap_series[feat]), 3),
                "direction": "up" if shap_series[feat] > 0 else "down",
            }

    max_score = max(
        results["vap_score"], results["clabsi_score"], results["cauti_score"]
    )
    if max_score >= 0.70:
        overall = "HIGH"
    elif max_score >= 0.40:
        overall = "MEDIUM"
    else:
        overall = "LOW"

    results["overall_risk"] = overall
    results["shap_vap"] = shap_results["vap"]
    results["shap_clabsi"] = shap_results["clabsi"]
    results["shap_cauti"] = shap_results["cauti"]

    return results


# ─── Endpoints ───────────────────────────────────────────────────────────────

# 1. Health check
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "models_loaded": len(models) == 3,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# 2. Login
@app.post("/api/auth/login")
def login(req: LoginRequest):
    result = supabase.table("users").select("*").eq("email", req.email).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = result.data[0]

    demo_passwords = {
        "doctor@icu.com": "doctor123",
        "nurse@icu.com": "nurse123",
        "admin@icu.com": "admin123",
    }
    expected = demo_passwords.get(req.email)
    if req.password != expected:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        }
    }


# 3. Get all active patients
@app.get("/api/patients")
def get_patients(x_user_id: str = Header(None)):
    get_current_user(x_user_id)

    patients = (
        supabase.table("patients").select("*").eq("icu_status", "active").execute()
    )

    result = []
    for p in patients.data:
        pred = (
            supabase.table("predictions")
            .select("*")
            .eq("patient_id", p["id"])
            .order("predicted_at", desc=True)
            .limit(1)
            .execute()
        )
        p["latest_prediction"] = pred.data[0] if pred.data else None
        result.append(p)

    risk_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2, None: 3}
    result.sort(
        key=lambda x: risk_order.get(
            x["latest_prediction"]["overall_risk"]
            if x.get("latest_prediction")
            else None,
            3,
        )
    )
    return result


# 4. Get single patient detail
@app.get("/api/patients/{patient_id}")
def get_patient(patient_id: str, x_user_id: str = Header(None)):
    get_current_user(x_user_id)

    patient = supabase.table("patients").select("*").eq("id", patient_id).execute()
    if not patient.data:
        raise HTTPException(status_code=404, detail="Patient not found")

    p = patient.data[0]

    pred = (
        supabase.table("predictions")
        .select("*")
        .eq("patient_id", patient_id)
        .order("predicted_at", desc=True)
        .limit(1)
        .execute()
    )
    vitals = (
        supabase.table("vitals")
        .select("*")
        .eq("patient_id", patient_id)
        .order("recorded_at", desc=True)
        .limit(1)
        .execute()
    )
    interventions = (
        supabase.table("interventions")
        .select("*")
        .eq("patient_id", patient_id)
        .neq("status", "completed")
        .execute()
    )

    return {
        **p,
        "latest_prediction": pred.data[0] if pred.data else None,
        "latest_vitals": vitals.data[0] if vitals.data else None,
        "active_interventions": interventions.data,
    }


# 5. Create patient
@app.post("/api/patients")
def create_patient(patient: PatientCreate, x_user_id: str = Header(None)):
    current_user = get_current_user(x_user_id)
    if current_user["role"] not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Only doctors can add patients")

    result = supabase.table("patients").insert(patient.model_dump()).execute()
    return result.data[0]


# 6. Predict (main endpoint)
@app.post("/api/predict")
def predict(vitals: VitalsInput, x_user_id: str = Header(None)):
    get_current_user(x_user_id)

    vitals_dict = vitals.model_dump()
    patient_id = vitals_dict.pop("patient_id")

    prediction = run_prediction(vitals_dict)

    vitals_to_save = {
        "patient_id": patient_id,
        **{k: v for k, v in vitals_dict.items() if v is not None and k in VITALS_COLS},
    }
    supabase.table("vitals").insert(vitals_to_save).execute()

    device_to_save = {
        "patient_id": patient_id,
        **{k: v for k, v in vitals_dict.items() if v is not None and k in DEVICE_COLS},
    }
    if len(device_to_save) > 1:
        supabase.table("device_data").insert(device_to_save).execute()

    supabase.table("predictions").insert(
        {
            "patient_id": patient_id,
            "vap_score": prediction["vap_score"],
            "clabsi_score": prediction["clabsi_score"],
            "cauti_score": prediction["cauti_score"],
            "overall_risk": prediction["overall_risk"],
            "shap_vap": prediction["shap_vap"],
            "shap_clabsi": prediction["shap_clabsi"],
            "shap_cauti": prediction["shap_cauti"],
        }
    ).execute()

    return {
        "patient_id": patient_id,
        "prediction": prediction,
        "predicted_at": datetime.now(timezone.utc).isoformat(),
    }


# 7. Prediction history
@app.get("/api/predictions/{patient_id}")
def get_predictions(patient_id: str, limit: int = 10, x_user_id: str = Header(None)):
    get_current_user(x_user_id)

    result = (
        supabase.table("predictions")
        .select("*")
        .eq("patient_id", patient_id)
        .order("predicted_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data


# 8. Create intervention (doctor only)
@app.post("/api/interventions")
def create_intervention(data: InterventionCreate, x_user_id: str = Header(None)):
    current_user = get_current_user(x_user_id)
    if current_user["role"] not in ["doctor", "admin"]:
        raise HTTPException(status_code=403, detail="Only doctors can assign interventions")

    intervention = (
        supabase.table("interventions")
        .insert({**data.model_dump(), "doctor_id": current_user["id"], "status": "pending"})
        .execute()
    )

    supabase.table("nurse_tasks").insert(
        {
            "intervention_id": intervention.data[0]["id"],
            "patient_id": data.patient_id,
            "task_status": "pending",
        }
    ).execute()

    return intervention.data[0]


# 9. Get interventions (enriched with patient_code)
@app.get("/api/interventions")
def get_interventions(
    patient_id: Optional[str] = None, x_user_id: str = Header(None)
):
    current_user = get_current_user(x_user_id)

    interventions = supabase.table("interventions").select("*").execute().data

    for inv in interventions:
        patient = (
            supabase.table("patients")
            .select("patient_code")
            .eq("id", inv["patient_id"])
            .execute()
        )
        inv["patient_code"] = patient.data[0]["patient_code"] if patient.data else "Unknown"

    if patient_id:
        interventions = [i for i in interventions if i["patient_id"] == patient_id]

    if current_user["role"] == "nurse":
        interventions = [i for i in interventions if i["status"] != "completed"]

    return interventions


# 10. Get nurse tasks (enriched with intervention + patient_code)
@app.get("/api/nurse-tasks")
def get_nurse_tasks(x_user_id: str = Header(None)):
    get_current_user(x_user_id)

    tasks = (
        supabase.table("nurse_tasks")
        .select("*")
        .eq("task_status", "pending")
        .execute()
        .data
    )

    enriched = []
    for task in tasks:
        inv = (
            supabase.table("interventions")
            .select("*")
            .eq("id", task["intervention_id"])
            .execute()
        )
        if inv.data:
            task["intervention"] = inv.data[0]
            patient = (
                supabase.table("patients")
                .select("patient_code")
                .eq("id", task["patient_id"])
                .execute()
            )
            task["patient_code"] = patient.data[0]["patient_code"] if patient.data else "Unknown"
        enriched.append(task)

    return enriched


# 11. Update nurse task
@app.put("/api/nurse-tasks/{task_id}")
def update_nurse_task(
    task_id: str, update: NurseTaskUpdate, x_user_id: str = Header(None)
):
    current_user = get_current_user(x_user_id)
    if current_user["role"] not in ["nurse", "admin"]:
        raise HTTPException(status_code=403, detail="Only nurses can update tasks")

    data = update.model_dump()
    if update.task_status == "completed":
        data["completed_at"] = datetime.now(timezone.utc).isoformat()

    result = supabase.table("nurse_tasks").update(data).eq("id", task_id).execute()

    if update.task_status == "completed" and result.data:
        task = result.data[0]
        supabase.table("interventions").update({"status": "completed"}).eq(
            "id", task["intervention_id"]
        ).execute()

    return result.data[0]


# 12. Admin stats
@app.get("/api/admin/stats")
def admin_stats(x_user_id: str = Header(None)):
    current_user = get_current_user(x_user_id)
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    patients = (
        supabase.table("patients").select("id").eq("icu_status", "active").execute()
    )
    predictions = supabase.table("predictions").select("overall_risk").execute()
    interventions = supabase.table("interventions").select("status").execute()

    high = sum(1 for p in predictions.data if p["overall_risk"] == "HIGH")
    medium = sum(1 for p in predictions.data if p["overall_risk"] == "MEDIUM")
    low = sum(1 for p in predictions.data if p["overall_risk"] == "LOW")
    pending = sum(1 for i in interventions.data if i["status"] == "pending")
    completed = sum(1 for i in interventions.data if i["status"] == "completed")

    return {
        "active_patients": len(patients.data),
        "risk_breakdown": {"high": high, "medium": medium, "low": low},
        "interventions": {"pending": pending, "completed": completed},
        "total_predictions": len(predictions.data),
    }


# 13. Admin — list all users
@app.get("/api/admin/users")
def get_all_users(x_user_id: str = Header(None)):
    current_user = get_current_user(x_user_id)
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = (
        supabase.table("users")
        .select("id, name, email, role, created_at")
        .execute()
    )
    return result.data


# ─── Entry point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
