"""
============================================
Prediction Routes
============================================
Blueprint: /api
Protected — requires JWT + doctor role.
"""

from flask import Blueprint
from middleware.auth import role_required
from controllers.prediction_controller import (
    handle_predict,
    handle_get_predictions,
    handle_get_high_risk,
)

prediction_bp = Blueprint('prediction', __name__, url_prefix='/api')


@prediction_bp.route('/predict', methods=['POST'])
@role_required('doctor')
def predict(**kwargs):
    """Run ML risk prediction for a patient. (Doctor)"""
    return handle_predict(**kwargs)


@prediction_bp.route('/predictions', methods=['GET'])
@role_required('doctor')
def get_predictions(**kwargs):
    """List all predictions. (Doctor)"""
    return handle_get_predictions(**kwargs)


@prediction_bp.route('/predictions/high-risk', methods=['GET'])
@role_required('doctor')
def get_high_risk(**kwargs):
    """List high-risk predictions only. (Doctor)"""
    return handle_get_high_risk(**kwargs)
