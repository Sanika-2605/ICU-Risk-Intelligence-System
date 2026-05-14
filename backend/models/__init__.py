"""
============================================
ICU Risk Intelligence System - Models Package
============================================
Imports all ORM models so they are registered
with SQLAlchemy when the package is imported.
"""

from models.user import User
from models.patient import Patient
from models.prediction import Prediction
from models.alert import Alert

__all__ = ['User', 'Patient', 'Prediction', 'Alert']
