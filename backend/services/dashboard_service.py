"""
============================================
Dashboard Service
============================================
Aggregated data for role-specific dashboards:
Doctor, Nurse, and Admin views.
"""

from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from database import db
from models.patient import Patient
from models.prediction import Prediction
from models.alert import Alert
from models.user import User


def get_doctor_dashboard() -> dict:
    """
    Doctor dashboard data:
    - Total patients
    - High-risk patient count
    - Recent alerts
    - Priority patient list (high-risk, sorted by score desc)
    - Risk level distribution
    """
    total_patients = Patient.query.count()

    # High risk predictions (latest per patient via subquery)
    high_risk = Prediction.query.filter(
        Prediction.risk_level == 'HIGH RISK'
    ).count()

    # Recent alerts (last 10)
    recent_alerts = Alert.query.order_by(
        Alert.created_at.desc()
    ).limit(10).all()

    # Priority patients — patients with high-risk predictions, ordered by score
    priority_predictions = Prediction.query.filter(
        Prediction.risk_level == 'HIGH RISK'
    ).order_by(Prediction.risk_score.desc()).limit(10).all()

    priority_patients = []
    for pred in priority_predictions:
        patient = Patient.query.get(pred.patient_id)
        if patient:
            priority_patients.append({
                'patient': patient.to_dict(),
                'risk_score': round(pred.risk_score, 4),
                'risk_level': pred.risk_level,
                'timestamp': pred.timestamp.isoformat() if pred.timestamp else None,
            })

    # Risk distribution
    risk_distribution = {
        'low': Prediction.query.filter(Prediction.risk_level == 'LOW RISK').count(),
        'medium': Prediction.query.filter(Prediction.risk_level == 'MEDIUM RISK').count(),
        'high': high_risk,
    }

    return {
        'total_patients': total_patients,
        'high_risk_count': high_risk,
        'recent_alerts': [a.to_dict() for a in recent_alerts],
        'priority_patients': priority_patients,
        'risk_distribution': risk_distribution,
    }


def get_nurse_dashboard() -> dict:
    """
    Nurse dashboard data:
    - Current patient vitals (all patients)
    - Recently updated patients
    - Active alerts
    """
    # All patients with vitals
    patients = Patient.query.order_by(Patient.updated_at.desc()).all()
    patient_vitals = []
    for p in patients:
        # Get latest prediction if exists
        latest_pred = Prediction.query.filter_by(
            patient_id=p.id
        ).order_by(Prediction.timestamp.desc()).first()

        patient_vitals.append({
            'patient': p.to_dict(),
            'latest_risk': latest_pred.to_dict() if latest_pred else None,
        })

    # Recently updated (last 24h)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    recent_patients = Patient.query.filter(
        Patient.updated_at >= cutoff
    ).order_by(Patient.updated_at.desc()).all()

    # Active alerts (last 24h)
    active_alerts = Alert.query.filter(
        Alert.created_at >= cutoff
    ).order_by(Alert.created_at.desc()).all()

    return {
        'patient_vitals': patient_vitals,
        'monitoring_count': len(patients),
        'recently_updated': [p.to_dict() for p in recent_patients],
        'active_alerts': [a.to_dict() for a in active_alerts],
    }


def get_admin_dashboard() -> dict:
    """
    Admin dashboard data:
    - Total patients, predictions, alerts, users
    - ICU statistics
    - Risk distribution
    - Daily trends (last 7 days)
    """
    total_patients = Patient.query.count()
    total_predictions = Prediction.query.count()
    total_alerts = Alert.query.count()
    total_users = User.query.count()

    # ICU statistics
    icu_stats = {
        'total_patients': total_patients,
        'total_predictions': total_predictions,
        'total_alerts': total_alerts,
        'total_users': total_users,
        'doctors': User.query.filter_by(role='doctor').count(),
        'nurses': User.query.filter_by(role='nurse').count(),
        'admins': User.query.filter_by(role='admin').count(),
    }

    # Risk distribution
    risk_distribution = {
        'low': Prediction.query.filter(Prediction.risk_level == 'LOW RISK').count(),
        'medium': Prediction.query.filter(Prediction.risk_level == 'MEDIUM RISK').count(),
        'high': Prediction.query.filter(Prediction.risk_level == 'HIGH RISK').count(),
    }

    # Daily trends (last 7 days)
    daily_trends = []
    for i in range(7):
        day = datetime.now(timezone.utc) - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        patients_count = Patient.query.filter(
            Patient.created_at >= day_start,
            Patient.created_at < day_end
        ).count()

        predictions_count = Prediction.query.filter(
            Prediction.timestamp >= day_start,
            Prediction.timestamp < day_end
        ).count()

        alerts_count = Alert.query.filter(
            Alert.created_at >= day_start,
            Alert.created_at < day_end
        ).count()

        daily_trends.append({
            'date': day_start.strftime('%Y-%m-%d'),
            'patients': patients_count,
            'predictions': predictions_count,
            'alerts': alerts_count,
        })

    return {
        'icu_statistics': icu_stats,
        'risk_distribution': risk_distribution,
        'daily_trends': daily_trends,
    }
