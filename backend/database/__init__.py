"""
============================================
ICU Risk Intelligence System - Database Init
============================================
Creates the shared SQLAlchemy instance used
across the entire application.
"""

from flask_sqlalchemy import SQLAlchemy

# ── Shared DB instance ──────────────────────────────────────────────
db = SQLAlchemy()
