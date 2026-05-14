"""
============================================
Database Seed Script
============================================
Populates the database with sample users,
patients, predictions, and alerts for
development and demonstration.

Called automatically on first run if tables are empty.
"""

from datetime import datetime, timedelta, timezone
import random
from database import db
from models.user import User
from models.patient import Patient
from models.prediction import Prediction
from models.alert import Alert


def seed_database():
    """Populate the database with sample data if empty."""

    # Skip if data already exists
    if User.query.first():
        print('[SEED] Database already contains data — skipping.')
        return

    print('[SEED] Populating database with sample data...')

    # ── 1. Create users ─────────────────────────────────────────────
    users_data = [
        {'name': 'Dr. Sarah Chen',       'email': 'doctor@icu.com',   'role': 'doctor',  'password': 'doctor123'},
        {'name': 'Dr. Raj Patel',         'email': 'doctor2@icu.com',  'role': 'doctor',  'password': 'doctor123'},
        {'name': 'Nurse Emily Johnson',   'email': 'nurse@icu.com',    'role': 'nurse',   'password': 'nurse123'},
        {'name': 'Nurse Michael Brown',   'email': 'nurse2@icu.com',   'role': 'nurse',   'password': 'nurse123'},
        {'name': 'Admin Lisa Wang',       'email': 'admin@icu.com',    'role': 'admin',   'password': 'admin123'},
    ]

    users = []
    for ud in users_data:
        user = User(name=ud['name'], email=ud['email'], role=ud['role'])
        user.set_password(ud['password'])
        users.append(user)
        db.session.add(user)

    db.session.flush()  # get IDs

    # ── 2. Create patients ──────────────────────────────────────────
    patients_data = [
        {
            'patient_id': 'ICU-001', 'age': 72, 'heart_rate': 110,
            'blood_pressure': '155/95', 'spo2': 88, 'temperature': 38.8,
            'respiratory_rate': 28,
        },
        {
            'patient_id': 'ICU-002', 'age': 45, 'heart_rate': 78,
            'blood_pressure': '120/80', 'spo2': 97, 'temperature': 36.8,
            'respiratory_rate': 16,
        },
        {
            'patient_id': 'ICU-003', 'age': 68, 'heart_rate': 95,
            'blood_pressure': '140/90', 'spo2': 91, 'temperature': 38.2,
            'respiratory_rate': 24,
        },
        {
            'patient_id': 'ICU-004', 'age': 55, 'heart_rate': 85,
            'blood_pressure': '130/85', 'spo2': 94, 'temperature': 37.1,
            'respiratory_rate': 18,
        },
        {
            'patient_id': 'ICU-005', 'age': 80, 'heart_rate': 120,
            'blood_pressure': '170/100', 'spo2': 85, 'temperature': 39.2,
            'respiratory_rate': 32,
        },
        {
            'patient_id': 'ICU-006', 'age': 33, 'heart_rate': 72,
            'blood_pressure': '115/75', 'spo2': 98, 'temperature': 36.6,
            'respiratory_rate': 14,
        },
        {
            'patient_id': 'ICU-007', 'age': 61, 'heart_rate': 102,
            'blood_pressure': '145/92', 'spo2': 90, 'temperature': 38.5,
            'respiratory_rate': 26,
        },
        {
            'patient_id': 'ICU-008', 'age': 48, 'heart_rate': 88,
            'blood_pressure': '125/82', 'spo2': 95, 'temperature': 37.3,
            'respiratory_rate': 20,
        },
        {
            'patient_id': 'ICU-009', 'age': 76, 'heart_rate': 55,
            'blood_pressure': '100/60', 'spo2': 87, 'temperature': 35.2,
            'respiratory_rate': 30,
        },
        {
            'patient_id': 'ICU-010', 'age': 39, 'heart_rate': 75,
            'blood_pressure': '118/78', 'spo2': 96, 'temperature': 37.0,
            'respiratory_rate': 15,
        },
    ]

    nurse_ids = [u.id for u in users if u.role in ('nurse', 'doctor')]
    patients = []
    for i, pd in enumerate(patients_data):
        now = datetime.now(timezone.utc)
        patient = Patient(
            patient_id=pd['patient_id'],
            age=pd['age'],
            heart_rate=pd['heart_rate'],
            blood_pressure=pd['blood_pressure'],
            spo2=pd['spo2'],
            temperature=pd['temperature'],
            respiratory_rate=pd['respiratory_rate'],
            created_by=nurse_ids[i % len(nurse_ids)],
            created_at=now - timedelta(days=random.randint(0, 6)),
        )
        patients.append(patient)
        db.session.add(patient)

    db.session.flush()

    # ── 3. Create predictions ───────────────────────────────────────
    risk_configs = [
        # (score, level, alert)
        (0.82, 'HIGH RISK',   True),
        (0.25, 'LOW RISK',    False),
        (0.61, 'MEDIUM RISK', False),
        (0.45, 'MEDIUM RISK', False),
        (0.91, 'HIGH RISK',   True),
        (0.15, 'LOW RISK',    False),
        (0.73, 'HIGH RISK',   False),
        (0.38, 'LOW RISK',    False),
        (0.88, 'HIGH RISK',   True),
        (0.22, 'LOW RISK',    False),
    ]

    feature_importance_examples = [
        {'spo2': 35.2, 'heart_rate': 22.1, 'temperature': 18.5, 'respiratory_rate': 10.3, 'age': 8.1, 'systolic_bp': 3.9, 'diastolic_bp': 1.9},
        {'spo2': 12.5, 'heart_rate': 15.0, 'temperature': 10.8, 'respiratory_rate': 18.2, 'age': 20.5, 'systolic_bp': 12.0, 'diastolic_bp': 11.0},
        {'spo2': 28.0, 'heart_rate': 20.5, 'temperature': 22.0, 'respiratory_rate': 12.5, 'age': 8.0, 'systolic_bp': 5.5, 'diastolic_bp': 3.5},
        {'spo2': 18.0, 'heart_rate': 16.5, 'temperature': 14.0, 'respiratory_rate': 15.5, 'age': 16.0, 'systolic_bp': 10.5, 'diastolic_bp': 9.5},
        {'spo2': 40.0, 'heart_rate': 25.0, 'temperature': 15.0, 'respiratory_rate': 8.0, 'age': 6.0, 'systolic_bp': 4.0, 'diastolic_bp': 2.0},
    ]

    predictions = []
    for i, patient in enumerate(patients):
        score, level, alert = risk_configs[i]
        pred = Prediction(
            patient_id=patient.id,
            risk_score=score,
            risk_level=level,
            alert_status=alert,
            timestamp=datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 48)),
        )
        pred.set_feature_importance(
            feature_importance_examples[i % len(feature_importance_examples)]
        )
        predictions.append(pred)
        db.session.add(pred)

    # ── 4. Create alerts ────────────────────────────────────────────
    alert_patients = [p for p, cfg in zip(patients, risk_configs) if cfg[2]]
    alert_messages = [
        (
            'HIGH RISK ALERT: Patient {pid} — Risk Score {score:.2f}. '
            'Immediate clinical review recommended.'
        ),
        (
            'CRITICAL: Patient {pid} showing deteriorating vitals. '
            'SpO2 below safe threshold. Urgent intervention needed.'
        ),
        (
            'WARNING: Patient {pid} cardiac rhythm abnormality detected. '
            'Heart rate exceeding safe ICU parameters.'
        ),
    ]

    for i, patient in enumerate(alert_patients):
        score = [cfg[0] for cfg in risk_configs if cfg[2]][i]
        msg = alert_messages[i % len(alert_messages)].format(
            pid=patient.patient_id, score=score
        )
        alert = Alert(
            patient_id=patient.id,
            alert_message=msg,
            alert_level='critical',
            created_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 24)),
        )
        db.session.add(alert)

    # Add some warning-level alerts too
    warning_alerts = [
        {'patient': patients[2], 'msg': 'Patient ICU-003: Temperature trending upward. Monitor closely.', 'level': 'warning'},
        {'patient': patients[3], 'msg': 'Patient ICU-004: SpO2 dropped below 95%. Consider supplemental O2.', 'level': 'warning'},
        {'patient': patients[6], 'msg': 'Patient ICU-007: Elevated respiratory rate. Possible respiratory distress.', 'level': 'warning'},
    ]
    for wa in warning_alerts:
        alert = Alert(
            patient_id=wa['patient'].id,
            alert_message=wa['msg'],
            alert_level=wa['level'],
            created_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 12)),
        )
        db.session.add(alert)

    db.session.commit()

    print(f'[SEED] Created {len(users)} users')
    print(f'[SEED] Created {len(patients)} patients')
    print(f'[SEED] Created {len(predictions)} predictions')
    print(f'[SEED] Created {len(alert_patients) + len(warning_alerts)} alerts')
    print('[SEED] Database seeding complete!')
