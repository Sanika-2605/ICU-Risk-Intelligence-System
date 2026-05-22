import api from './api';

export const getDoctorDashboard = async () => {
  const response = await api.get('/api/patients');
  const patients = response.data || [];

  const highRisk = patients.filter((p) => p.latest_prediction?.overall_risk === 'HIGH');

  const priorityPatients = patients.map((p) => {
    const pred = p.latest_prediction;
    const maxScore = pred
      ? Math.max(pred.vap_score ?? 0, pred.clabsi_score ?? 0, pred.cauti_score ?? 0)
      : 0;
    return {
      patient_id: p.patient_code,
      patient_code: p.patient_code,
      id: p.id,
      risk_score: maxScore,
      risk_level: pred?.overall_risk || 'LOW',
      heart_rate: null,
      blood_pressure: null,
      spo2: null,
      timestamp: pred?.predicted_at || p.created_at,
    };
  });

  return {
    total_patients: patients.length,
    high_risk_count: highRisk.length,
    recent_alerts: [],
    priority_patients: priorityPatients,
  };
};

export const getNurseDashboard = async () => {
  const [patientsRes, tasksRes] = await Promise.all([
    api.get('/api/patients'),
    api.get('/api/nurse-tasks').catch(() => ({ data: [] })),
  ]);

  const patients = patientsRes.data || [];
  const tasks = tasksRes.data || [];

  const patientVitals = patients.map((p) => {
    const pred = p.latest_prediction;
    return {
      patient_id: p.patient_code,
      patient_code: p.patient_code,
      id: p.id,
      heart_rate: null,
      blood_pressure: null,
      spo2: null,
      temperature: null,
      respiratory_rate: null,
      latest_risk: pred ? { risk_level: pred.overall_risk } : null,
    };
  });

  return {
    monitoring_count: patients.length,
    patient_vitals: patientVitals,
    active_alerts: [],
    recently_updated: tasks.slice(0, 5),
  };
};

export const getAdminDashboard = async () => {
  const [patientsRes, statsRes] = await Promise.all([
    api.get('/api/patients'),
    api.get('/api/admin/stats'),
  ]);

  const patients = patientsRes.data || [];
  const stats = statsRes.data || {};

  return {
    icu_statistics: {
      total_patients: patients.length,
      total_alerts: stats.interventions?.pending ?? 0,
      total_users: 2,
      doctors: 1,
      nurses: 1,
      total_predictions: stats.total_predictions ?? 0,
    },
    risk_distribution: {
      high: stats.risk_breakdown?.high ?? 0,
      medium: stats.risk_breakdown?.medium ?? 0,
      low: stats.risk_breakdown?.low ?? 0,
    },
    daily_trends: [],
    recent_history: patients.map((p) => ({
      id: p.patient_code,
      patient_code: p.patient_code,
      riskScore:
        p.latest_prediction?.overall_risk === 'HIGH'
          ? 0.85
          : p.latest_prediction?.overall_risk === 'MEDIUM'
          ? 0.55
          : 0.25,
      category: p.latest_prediction?.overall_risk || 'LOW',
      timestamp: p.latest_prediction?.predicted_at || p.created_at,
    })),
  };
};
