export const VITAL_RANGES = {
  age:              { min: 0, max: 120, label: 'Age' },
  heart_rate:       { min: 20, max: 250, label: 'Heart Rate (bpm)' },
  systolic_bp:      { min: 50, max: 300, label: 'Systolic BP (mmHg)' },
  diastolic_bp:     { min: 20, max: 200, label: 'Diastolic BP (mmHg)' },
  spo2:             { min: 50, max: 100, label: 'SpO2 (%)' },
  temperature:      { min: 30, max: 45,  label: 'Temperature (°C)' },
  respiratory_rate: { min: 5, max: 60,   label: 'Respiratory Rate' },
};

export function validateVital(key, value) {
  const range = VITAL_RANGES[key];
  if (!range) return null;
  const num = parseFloat(value);
  if (isNaN(num)) return `${range.label} must be a number`;
  if (num < range.min || num > range.max)
    return `${range.label} must be between ${range.min} and ${range.max}`;
  return null;
}

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) ? null : 'Please enter a valid email address';
}

export function validatePassword(password) {
  if (!password || password.length < 6) return 'Password must be at least 6 characters';
  return null;
}
