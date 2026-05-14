"""
============================================
Prediction Controller
============================================
Handles HTTP request/response for ML risk
prediction endpoints.
"""

from flask import request
from services.prediction_service import (
    generate_prediction, get_predictions,
    get_high_risk_predictions
)
from utils.response import success_response, error_response


def handle_predict(current_user=None):
    """
    POST /api/predict

    Body: { patient_id: int (primary key) }
    """
    data = request.get_json()
    if not data or 'patient_id' not in data:
        return error_response('patient_id is required', 400)

    try:
        patient_id = int(data['patient_id'])
    except (ValueError, TypeError):
        return error_response('patient_id must be an integer', 400)

    success, result = generate_prediction(patient_id)

    if success:
        return success_response(
            'Prediction generated successfully',
            data=result,
            status_code=201
        )
    else:
        return error_response(result, 400)


def handle_get_predictions(current_user=None):
    """
    GET /api/predictions
    """
    predictions = get_predictions()
    return success_response(
        'Predictions retrieved successfully',
        data={'predictions': predictions, 'total': len(predictions)}
    )


def handle_get_high_risk(current_user=None):
    """
    GET /api/predictions/high-risk
    """
    predictions = get_high_risk_predictions()
    return success_response(
        'High-risk predictions retrieved successfully',
        data={'predictions': predictions, 'total': len(predictions)}
    )
