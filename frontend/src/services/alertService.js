import api from './api';

export const getAlerts = async () => {
  const res = await api.get('/api/interventions');
  const data = res.data || [];
  return data.map((intervention) => ({
    id: intervention.id,
    patient_id: intervention.patient_code || intervention.patient_id,
    alert_level:
      intervention.priority === 'critical'
        ? 'critical'
        : intervention.priority === 'high'
        ? 'warning'
        : 'info',
    alert_message: intervention.action_text,
    infection_type: intervention.infection_type,
    priority: intervention.priority,
    status: intervention.status,
    created_at: intervention.created_at,
  }));
};

export const getCriticalAlerts = async () => {
  const alerts = await getAlerts();
  return alerts.filter((a) => a.priority === 'high' || a.priority === 'critical');
};
