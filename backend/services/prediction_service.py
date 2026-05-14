"""
============================================
Prediction Service
============================================
Orchestrates ML risk predictions for patients.
Stores results and triggers alerts when risk is high.
"""

from database import db
from models.patient import Patient
from models.prediction import Prediction
from services.alert_service import create_alert

ALERT_THRESHOLD = 0.75

def _classify_risk(score: float) -> str:
    if score <= 0.39:
        return 'LOW RISK'
    elif score <= 0.69:
        return 'MEDIUM RISK'
    else:
        return 'HIGH RISK'

def _calculate_risk(patient_data: dict) -> dict:
    score = 0.0
    age = float(patient_data.get('age', 50))
    hr = float(patient_data.get('heart_rate', 80))
    spo2 = float(patient_data.get('spo2', 95))
    temp = float(patient_data.get('temperature', 37))
    rr = float(patient_data.get('respiratory_rate', 18))

    if age > 65:
        score += 0.15
    if hr > 100 or hr < 50:
        score += 0.20
    if spo2 < 90:
        score += 0.30
    elif spo2 < 94:
        score += 0.15
    if temp > 38.5 or temp < 35.5:
        score += 0.15
    if rr > 25 or rr < 10:
        score += 0.10

    score = min(score, 1.0)
    risk_level = _classify_risk(score)

    importance = {
        'spo2': 30.0,
        'heart_rate': 25.0,
        'temperature': 15.0,
        'respiratory_rate': 10.0,
        'age': 10.0,
        'systolic_bp': 5.0,
        'diastolic_bp': 5.0,
    }

    return {
        'risk_score': round(score, 4),
        'risk_level': risk_level,
        'feature_importance': importance,
        'alert_triggered': score >= ALERT_THRESHOLD,
    }


def generate_prediction(patient_id: int) -> tuple:
    """
    Run risk prediction for a patient.

    Args:
        patient_id: Primary key of the Patient record.

    Returns:
        (success: bool, result: dict | str)
    """
    patient = Patient.query.get(patient_id)
    if not patient:
        return False, 'Patient not found'

    # Prepare input features
    systolic, diastolic = patient.parse_blood_pressure()
    patient_data = {
        'age': patient.age,
        'heart_rate': patient.heart_rate,
        'spo2': patient.spo2,
        'temperature': patient.temperature,
        'respiratory_rate': patient.respiratory_rate,
        'systolic_bp': systolic,
        'diastolic_bp': diastolic,
    }

    # Run prediction
    result = _calculate_risk(patient_data)

    # Store prediction
    prediction = Prediction(
        patient_id=patient.id,
        risk_score=result['risk_score'],
        risk_level=result['risk_level'],
        alert_status=result['alert_triggered'],
    )
    prediction.set_feature_importance(result['feature_importance'])

    try:
        db.session.add(prediction)

        # Trigger alert if high risk
        if result['alert_triggered']:
            alert_msg = (
                f"HIGH RISK ALERT: Patient {patient.patient_id} — "
                f"Risk Score {result['risk_score']:.2f} ({result['risk_level']}). "
                f"Immediate clinical review recommended."
            )
            create_alert(
                patient_id=patient.id,
                message=alert_msg,
                level='critical'
            )

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return False, f'Database error: {str(e)}'

    return True, {
        'patient_id': patient.patient_id,
        'risk_score': result['risk_score'],
        'risk_level': result['risk_level'],
        'feature_importance': result['feature_importance'],
        'alert_triggered': result['alert_triggered'],
    }


def get_predictions() -> list:
    """Return all predictions, most recent first."""
    predictions = Prediction.query.order_by(
        Prediction.timestamp.desc()
    ).all()
    return [p.to_dict() for p in predictions]


def get_high_risk_predictions() -> list:
    """Return predictions with HIGH RISK level."""
    predictions = Prediction.query.filter(
        Prediction.risk_level == 'HIGH RISK'
    ).order_by(Prediction.timestamp.desc()).all()
    return [p.to_dict() for p in predictions]


def get_prediction_count() -> int:
    """Total number of predictions."""
    return Prediction.query.count()
