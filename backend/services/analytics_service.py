"""
============================================
Analytics Service
============================================
Aggregated analytics for risk distribution
and patient/prediction trends.
"""

from datetime import datetime, timedelta, timezone
from database import db
from models.patient import Patient
from models.prediction import Prediction
from models.alert import Alert


def get_risk_distribution() -> dict:
    """
    Return the count and percentage of predictions
    in each risk category.
    """
    total = Prediction.query.count()
    if total == 0:
        return {
            'total_predictions': 0,
            'distribution': {
                'low':    {'count': 0, 'percentage': 0},
                'medium': {'count': 0, 'percentage': 0},
                'high':   {'count': 0, 'percentage': 0},
            }
        }

    low = Prediction.query.filter(Prediction.risk_level == 'LOW RISK').count()
    medium = Prediction.query.filter(Prediction.risk_level == 'MEDIUM RISK').count()
    high = Prediction.query.filter(Prediction.risk_level == 'HIGH RISK').count()

    return {
        'total_predictions': total,
        'distribution': {
            'low': {
                'count': low,
                'percentage': round((low / total) * 100, 2),
            },
            'medium': {
                'count': medium,
                'percentage': round((medium / total) * 100, 2),
            },
            'high': {
                'count': high,
                'percentage': round((high / total) * 100, 2),
            },
        }
    }


def get_patient_trends(days: int = 30) -> dict:
    """
    Return daily counts of new patients, predictions,
    and alerts over the specified number of days.
    """
    trends = []

    for i in range(days):
        day = datetime.now(timezone.utc) - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        patients = Patient.query.filter(
            Patient.created_at >= day_start,
            Patient.created_at < day_end
        ).count()

        predictions = Prediction.query.filter(
            Prediction.timestamp >= day_start,
            Prediction.timestamp < day_end
        ).count()

        alerts = Alert.query.filter(
            Alert.created_at >= day_start,
            Alert.created_at < day_end
        ).count()

        trends.append({
            'date': day_start.strftime('%Y-%m-%d'),
            'new_patients': patients,
            'predictions': predictions,
            'alerts': alerts,
        })

    # Reverse so oldest day is first
    trends.reverse()

    return {
        'period_days': days,
        'trends': trends,
    }
