"""
============================================
User Model
============================================
Represents system users: doctors, nurses, and admins.
Handles password hashing and role-based identity.
"""

from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from database import db


class User(db.Model):
    """ICU system user with role-based access control."""

    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(
        db.String(20),
        nullable=False,
        default='nurse'
    )  # doctor | nurse | admin
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc)
    )

    # ── Relationships ───────────────────────────────────────────────
    patients = db.relationship('Patient', backref='creator', lazy='dynamic')

    # ── Password helpers ────────────────────────────────────────────

    def set_password(self, password: str) -> None:
        """Hash and store the user's password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verify a plaintext password against the stored hash."""
        return check_password_hash(self.password_hash, password)

    # ── Serialization ───────────────────────────────────────────────

    def to_dict(self) -> dict:
        """Return a JSON-safe dictionary representation."""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f'<User {self.email} ({self.role})>'
