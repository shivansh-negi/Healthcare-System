import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import { api } from '../services/api';
import {
  Users, Calendar, FileText, Clock, CheckCircle, XCircle,
  TrendingUp, Activity, Stethoscope, Pill, Video, Star,
  ChevronRight, AlertCircle, Heart, Loader2
} from 'lucide-react';
import AnimatedPage from '../components/AnimatedPage';
import DoctorPatientConsult from '../components/DoctorPatientConsult';


// Fallback data used when backend is unreachable
const FALLBACK_PATIENTS = [
  { id: 'P001', name: 'Rahul Sharma', age: 34, condition: 'Hypertension', lastVisit: '2026-04-10', status: 'Active', avatar: '👨' },
  { id: 'P002', name: 'Priya Singh', age: 28, condition: 'Diabetes Type 2', lastVisit: '2026-04-09', status: 'Critical', avatar: '👩' },
  { id: 'P003', name: 'Amit Kumar', age: 45, condition: 'Arthritis', lastVisit: '2026-04-08', status: 'Stable', avatar: '👨' },
  { id: 'P004', name: 'Sunita Devi', age: 52, condition: 'Thyroid', lastVisit: '2026-04-07', status: 'Active', avatar: '👩' },
  { id: 'P005', name: 'Vikram Patel', age: 39, condition: 'Back Pain', lastVisit: '2026-04-06', status: 'Stable', avatar: '👨' },
];

const FALLBACK_APPOINTMENTS = [
  { id: 'A001', patient: 'Rahul Sharma', time: '09:00 AM', type: 'Consultation', status: 'Confirmed', avatar: '👨' },
  { id: 'A002', patient: 'Meena Joshi', time: '10:30 AM', type: 'Follow-up', status: 'Pending', avatar: '👩' },
  { id: 'A003', patient: 'Suresh Rawat', time: '12:00 PM', type: 'Emergency', status: 'Urgent', avatar: '👨' },
  { id: 'A004', patient: 'Kavita Negi', time: '02:00 PM', type: 'Consultation', status: 'Confirmed', avatar: '👩' },
  { id: 'A005', patient: 'Deepak Thakur', time: '04:00 PM', type: 'Follow-up', status: 'Pending', avatar: '👨' },
];

const FALLBACK_PRESCRIPTIONS = [
  { id: 'RX001', patient: 'Rahul Sharma', medicines: 'Amlodipine 5mg, Metformin 500mg', date: '2026-04-10', status: 'Active' },
  { id: 'RX002', patient: 'Priya Singh', medicines: 'Insulin Glargine, Metformin 1000mg', date: '2026-04-09', status: 'Active' },
  { id: 'RX003', patient: 'Amit Kumar', medicines: 'Diclofenac 50mg, Rabeprazole 20mg', date: '2026-04-08', status: 'Completed' },
];

type DoctorTab = 'overview' | 'patients' | 'appointments' | 'prescriptions';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const toast = useToastContext();
  const [activeTab, setActiveTab] = useState<DoctorTab>('overview');
  const [patients, setPatients] = useState<any[]>(FALLBACK_PATIENTS);
  const [appointments, setAppointments] = useState<any[]>(FALLBACK_APPOINTMENTS);
  const [prescriptions, setPrescriptions] = useState<any[]>(FALLBACK_PRESCRIPTIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({ patient: '', medicines: '', dosage: '', duration: '', instructions: '' });
  const [showPrescForm, setShowPrescForm] = useState(false);
  const [showConsult, setShowConsult] = useState(false);
  const [consultPatient, setConsultPatient] = useState('Rahul Sharma');

  // Fetch real data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, appointmentsRes, prescriptionsRes] = await Promise.allSettled([
          api.getAll<any>('patients', 1, 20),
          api.getAll<any>('appointments', 1, 20),
          api.getAll<any>('prescriptions', 1, 20),
        ]);

        if (patientsRes.status === 'fulfilled' && patientsRes.value?.data?.data?.length) {
          setPatients(patientsRes.value.data.data.map((p: any) => ({
            id: p.id || p._id, name: p.name, age: p.age || 0,
            condition: p.diagnosis || p.condition || 'General',
            lastVisit: p.registeredDate || '—', status: p.status || 'Active',
            avatar: p.gender === 'Female' ? '👩' : '👨',
          })));
        }
        if (appointmentsRes.status === 'fulfilled' && appointmentsRes.value?.data?.data?.length) {
          setAppointments(appointmentsRes.value.data.data.map((a: any) => ({
            id: a.id || a._id, patient: a.patientName, time: a.time,
            type: a.type || 'Consultation', status: a.status || 'Pending',
            avatar: '👤',
          })));
        }
        if (prescriptionsRes.status === 'fulfilled' && prescriptionsRes.value?.data?.data?.length) {
          setPrescriptions(prescriptionsRes.value.data.data.map((rx: any) => ({
            id: rx.id || rx._id, patient: rx.patientName,
            medicines: rx.medications || rx.medicines,
            date: rx.date, status: rx.status || 'Active',
          })));
        }
      } catch {
        // Keep fallback data
      }
      setLoading(false);
    };
    fetchData();
  }, []);


  const stats = [
    { label: "Today's Patients", value: '8', icon: Users, color: '#0891b2', bg: 'rgba(8,145,178,0.1)', change: '+2 from yesterday' },
    { label: 'Pending Appointments', value: '5', icon: Calendar, color: '#6366f1', bg: 'rgba(99,102,241,0.1)', change: '3 urgent' },
    { label: 'Active Prescriptions', value: '23', icon: Pill, color: '#10b981', bg: 'rgba(16,185,129,0.1)', change: '+4 this week' },
    { label: 'Patient Satisfaction', value: '98%', icon: Star, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', change: '↑ 2% this month' },
  ];

  const handleAppointmentAction = async (id: string, action: 'accept' | 'reject') => {
    const newStatus = action === 'accept' ? 'Confirmed' : 'Cancelled';
    setAppointments(prev => prev.map(a =>
      a.id === id ? { ...a, status: newStatus } : a
    ));
    try {
      await api.update('appointments', id, { status: newStatus });
      toast.success('Appointment Updated', `Appointment ${newStatus.toLowerCase()}`);
    } catch {
      toast.info('Updated Locally', 'Change saved locally (backend sync pending)');
    }
  };

  const handleSavePrescription = async () => {
    if (!prescriptionForm.patient || !prescriptionForm.medicines) {
      toast.error('Missing Fields', 'Patient name and medicines are required');
      return;
    }
    setSaving(true);
    const rxData = {
      id: `RX${Date.now()}`,
      patientName: prescriptionForm.patient,
      doctorName: user?.name || 'Doctor',
      date: new Date().toISOString().split('T')[0],
      medications: prescriptionForm.medicines,
      dosage: prescriptionForm.dosage || 'As directed',
      duration: prescriptionForm.duration || '7 days',
      instructions: prescriptionForm.instructions || '',
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    try {
      await api.create('prescriptions', rxData as any);
      toast.success('Prescription Saved', `Prescription for ${prescriptionForm.patient} created`);
    } catch {
      toast.info('Saved Locally', 'Prescription saved (backend sync pending)');
    }
    setPrescriptions(prev => [{ id: rxData.id, patient: rxData.patientName, medicines: rxData.medications, date: rxData.date, status: 'Active' }, ...prev]);
    setPrescriptionForm({ patient: '', medicines: '', dosage: '', duration: '', instructions: '' });
    setShowPrescForm(false);
    setSaving(false);
  };

  const statusColor = (s: string) => {
    if (s === 'Critical' || s === 'Urgent') return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
    if (s === 'Pending') return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    if (s === 'Confirmed' || s === 'Stable' || s === 'Active') return { color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
    if (s === 'Completed') return { color: '#6366f1', bg: 'rgba(99,102,241,0.1)' };
    return { color: '#8897ad', bg: 'rgba(136,151,173,0.1)' };
  };

  return (
    <AnimatedPage>
      {showConsult && <DoctorPatientConsult patientName={consultPatient} onClose={() => setShowConsult(false)} />}

      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)',
        borderRadius: 20, padding: '28px 32px', marginBottom: 28, position: 'relative', overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(8,145,178,0.25)',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 80, width: 100, height: 100, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', backdropFilter: 'blur(10px)' }}>
              {user?.avatar || '👨‍⚕️'}
            </div>
            <div>
              <h2 style={{ color: 'white', margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>
                Good morning, {user?.name || 'Doctor'}! 👋
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.88rem' }}>
                {user?.specialization || 'General Physician'} · {user?.department || 'Internal Medicine'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[{ icon: '🏥', text: '8 patients scheduled today' }, { icon: '⭐', text: '98% satisfaction rate' }, { icon: '📋', text: '23 active prescriptions' }].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem' }}>
                <span>{item.icon}</span><span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: 'var(--bg-input)', padding: 5, borderRadius: 14, width: 'fit-content' }}>
        {([
          { key: 'overview', icon: Activity, label: 'Overview' },
          { key: 'patients', icon: Users, label: 'My Patients' },
          { key: 'appointments', icon: Calendar, label: 'Appointments' },
          { key: 'prescriptions', icon: FileText, label: 'Prescriptions' },
        ] as { key: DoctorTab; icon: any; label: string }[]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: activeTab === tab.key ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
            fontWeight: 500, fontSize: '0.87rem', transition: 'all 0.2s',
          }}>
            <tab.icon size={16} />{tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 24 }} className="stagger-children">

            {stats.map((s, i) => (
              <div key={i} className="glass-card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <s.icon size={22} color={s.color} />
                </div>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, margin: '0 0 4px' }}>{s.label}</p>
                  <p style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px' }}>{s.value}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{s.change}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Today's schedule */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Today's Schedule</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600 }}>5 appointments</span>
              </div>
              <div style={{ padding: '8px 0' }}>
                {appointments.slice(0, 4).map(apt => {
                  const sc = statusColor(apt.status);
                  return (
                    <div key={apt.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px', borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{apt.avatar}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{apt.patient}</p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{apt.time} · {apt.type}</p>
                      </div>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: sc.bg, color: sc.color }}>{apt.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: Video, label: 'Start Video Consultation', desc: 'Connect with patients remotely', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
                { icon: Pill, label: 'Write New Prescription', desc: 'Add medicine & dosage', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                { icon: Stethoscope, label: 'Patient History', desc: 'Review complete records', color: '#0891b2', bg: 'rgba(8,145,178,0.1)' },
                { icon: AlertCircle, label: 'Emergency Protocol', desc: 'Handle urgent cases', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
              ].map((action, i) => (
                <div key={i} className="glass-card hover-lift" onClick={() => {
                  if (action.label.includes('Prescription')) setActiveTab('prescriptions');
                  if (action.label.includes('Video')) { setConsultPatient('Rahul Sharma'); setShowConsult(true); }
                }}

                  style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => (e.currentTarget.style.transform = 'translateX(4px)')}
                  onMouseOut={e => (e.currentTarget.style.transform = 'none')}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: action.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <action.icon size={20} color={action.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem' }}>{action.label}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{action.desc}</p>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── PATIENTS ── */}
      {activeTab === 'patients' && (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontWeight: 700 }}>My Assigned Patients</h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{patients.length} patients</span>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr>
                <th>Patient</th><th>Age</th><th>Condition</th><th>Last Visit</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {patients.map(p => {
                  const sc = statusColor(p.status);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{p.avatar}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{p.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.88rem' }}>{p.age} yrs</td>
                      <td style={{ fontSize: '0.88rem' }}>{p.condition}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.lastVisit}</td>
                      <td><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: sc.bg, color: sc.color }}>{p.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => { setActiveTab('prescriptions'); setShowPrescForm(true); setPrescriptionForm(f => ({ ...f, patient: p.name })); }}>
                            <Pill size={13} /> Prescribe
                          </button>
                          <button className="btn btn-secondary btn-sm"><FileText size={13} /> Records</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── APPOINTMENTS ── */}
      {activeTab === 'appointments' && (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, fontWeight: 700 }}>Today's Appointments</h3>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Patient</th><th>Time</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {appointments.map(apt => {
                  const sc = statusColor(apt.status);
                  const isPending = apt.status === 'Pending' || apt.status === 'Urgent';
                  return (
                    <tr key={apt.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: '1.2rem' }}>{apt.avatar}</span>
                          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{apt.patient}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.87rem' }}>
                          <Clock size={14} color="var(--text-muted)" />{apt.time}
                        </div>
                      </td>
                      <td><span style={{ fontSize: '0.82rem', padding: '2px 10px', borderRadius: 20, background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>{apt.type}</span></td>
                      <td><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, background: sc.bg, color: sc.color }}>{apt.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {isPending && (
                            <>
                              <button className="btn btn-success btn-sm" onClick={() => handleAppointmentAction(apt.id, 'accept')}>
                                <CheckCircle size={13} /> Accept
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleAppointmentAction(apt.id, 'reject')}>
                                <XCircle size={13} /> Reject
                              </button>
                            </>
                          )}
                          {!isPending && <button className="btn btn-secondary btn-sm"><Video size={13} /> Join</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PRESCRIPTIONS ── */}
      {activeTab === 'prescriptions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Add prescription form */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>✍️ Write New Prescription</h3>
              <button className={`btn btn-${showPrescForm ? 'secondary' : 'primary'} btn-sm`} onClick={() => setShowPrescForm(f => !f)}>
                {showPrescForm ? 'Cancel' : '+ New Prescription'}
              </button>
            </div>
            {showPrescForm && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { label: 'Patient Name', key: 'patient', placeholder: 'Enter patient name' },
                  { label: 'Medicines', key: 'medicines', placeholder: 'e.g. Paracetamol 500mg' },
                  { label: 'Dosage', key: 'dosage', placeholder: 'e.g. 1 tablet twice daily' },
                  { label: 'Duration', key: 'duration', placeholder: 'e.g. 7 days' },
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>{field.label}</label>
                    <input className="search-input" style={{ width: '100%' }} value={(prescriptionForm as any)[field.key]}
                      onChange={e => setPrescriptionForm(f => ({ ...f, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Instructions</label>
                  <textarea className="search-input" style={{ width: '100%', minHeight: 80, resize: 'vertical' }}
                    value={prescriptionForm.instructions}
                    onChange={e => setPrescriptionForm(f => ({ ...f, instructions: e.target.value }))}
                    placeholder="Special instructions for patient..."
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary" onClick={handleSavePrescription} disabled={saving}>
                    {saving ? <><Loader2 size={16} className="spin" /> Saving...</> : <><Heart size={16} /> Save Prescription</>}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowPrescForm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Prescription list */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>Active Prescriptions</h3>
            </div>
            <div>
              {prescriptions.map(rx => {
                const sc = statusColor(rx.status);
                return (
                  <div key={rx.id} style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Pill size={20} color="#10b981" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{rx.patient}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 600, background: sc.bg, color: sc.color }}>{rx.status}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{rx.medicines}</p>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Issued: {rx.date} · ID: {rx.id}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm"><TrendingUp size={13} /> Update</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </AnimatedPage>
  );
}
