import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../api';
import { pickNameColumn } from '../utils';
import {
  ArrowLeft,
  Users,
  User,
  Shield,
  Star,
  Lock,
  Edit3,
  RefreshCw,
  AlertCircle,
  X,
  Save,
  CheckSquare,
  Square,
  ChevronDown,
  UserCheck,
} from 'lucide-react';

const ROLE_CONFIG = {
  superusuario: { label: 'Superusuario', Icon: Star,   cls: 'role-badge--superusuario' },
  admin:        { label: 'Admin',         Icon: Shield, cls: 'role-badge--admin'        },
  usuario:      { label: 'Estándar',      Icon: User,   cls: 'role-badge--usuario'      },
};

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.usuario;
  const { Icon, label, cls } = cfg;
  return (
    <span className={`role-badge ${cls}`}>
      <Icon size={11} />
      {label}
    </span>
  );
}

// Cambiamos "userRole" por "rolUsuarioLogueado" y "onBack" por "onVolver" para emparejar con App.jsx
export default function AsignacionClientes({ user, rolUsuarioLogueado, onVolver }) {
  const [users,         setUsers        ] = useState([]);
  const [years,         setYears        ] = useState([]);
  const [months,        setMonths       ] = useState([]);
  const [selectedYear,  setSelectedYear ] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const [clients,     setClients    ] = useState([]);
  const [nameKey,     setNameKey    ] = useState(null);
  const [assignments, setAssignments] = useState({});

  const [loading,        setLoading       ] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [error,          setError         ] = useState('');

  const [editingUser, setEditingUser] = useState(null);
  const [editRows,    setEditRows   ] = useState([]);
  const [saving,      setSaving     ] = useState(false);
  const [saveError,   setSaveError  ] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([api.listUsersWithRoles(true), api.listYears()])
      .then(([fetchedUsers, fetchedYears]) => {
        setUsers(fetchedUsers || []);
        const yrs = fetchedYears || [];
        setYears(yrs);
        if (yrs.length) setSelectedYear(yrs[yrs.length - 1]);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedYear) return;
    setSelectedMonth(null);
    setClients([]);
    setAssignments({});
    api
      .listMonths(selectedYear)
      .then((mths) => {
        setMonths(mths || []);
        if (mths && mths.length) setSelectedMonth(mths[mths.length - 1]);
      })
      .catch((err) => console.warn('Error cargando meses:', err));
  }, [selectedYear]);

  useEffect(() => {
    if (!selectedYear || !selectedMonth) return;
    setClientsLoading(true);
    setClients([]);
    setAssignments({});
    Promise.all([
      api.readClients(selectedYear, selectedMonth),
      api.getAssignments(selectedYear, selectedMonth),
    ])
      .then(([clientData, assignData]) => {
        const rows    = clientData.rows    || [];
        const headers = clientData.headers || [];
        setClients(rows);
        setNameKey(pickNameColumn(headers));
        setAssignments(assignData || {});
      })
      .catch((err) => setError(err.message))
      .finally(() => setClientsLoading(false));
  }, [selectedYear, selectedMonth]);

  const canEdit = (targetRole) => {
    // Ahora lee "rolUsuarioLogueado" que viene directo de tu segunda planilla segura
    if (rolUsuarioLogueado === 'superusuario') return true;
    if (rolUsuarioLogueado === 'admin')        return (targetRole || 'usuario') === 'usuario';
    return false;
  };

  const openEdit = (targetUser) => {
    setEditRows([...(assignments[targetUser.name] || [])]);
    setEditingUser(targetUser);
    setSaveError('');
  };

  const closeModal = () => {
    if (saving) return;
    setEditingUser(null);
    setSaveError('');
  };

  const toggleRow = (rowNum) => {
    setEditRows((prev) =>
      prev.includes(rowNum) ? prev.filter((r) => r !== rowNum) : [...prev, rowNum]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await api.saveAssignment({
        year:       selectedYear,
        month:      selectedMonth,
        targetUser: editingUser.name,
        rows:       editRows,
        actorUser:  user,
      });
      setAssignments((prev) => ({ ...prev, [editingUser.name]: [...editRows] }));
      setEditingUser(null);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const unassignedCount = useMemo(() => {
    const allAssigned = new Set(Object.values(assignments).flat());
    return clients.filter((c) => !allAssigned.has(c._row)).length;
  }, [clients, assignments]);

  const modalClients = useMemo(() => {
    if (!editingUser) return [];
    const myRows    = new Set(assignments[editingUser.name] || []);
    const otherRows = new Set(
      Object.entries(assignments)
        .filter(([u]) => u !== editingUser.name)
        .flatMap(([, rows]) => rows)
    );
    return clients.filter((c) => myRows.has(c._row) || !otherRows.has(c._row));
  }, [editingUser, clients, assignments]);

  return (
    <div className="screen" style={{ paddingBottom: '40px' }}>
      <div className="assignment-header">
        <motion.button
          className="btn-ghost"
          onClick={onVolver}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft size={18} /> Volver
        </motion.button>

        <div className="assignment-title">
          <UserCheck size={20} style={{ color: 'var(--primary)' }} />
          <span>Asignación de Clientes</span>
        </div>

        <div className="assignment-period-selectors">
          <div className="custom-select-wrapper">
            <select
              className="field-input"
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(e.target.value)}
              disabled={!years.length || loading}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>

          <div className="custom-select-wrapper">
            <select
              className="field-input"
              value={selectedMonth || ''}
              onChange={(e) => setSelectedMonth(e.target.value)}
              disabled={!months.length || loading || clientsLoading}
            >
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>
        </div>
      </div>

      <div className="assignment-content">
        {loading && (
          <div className="assignment-loading">
            <div className="spinner" />
            <span>Verificando usuarios y permisos…</span>
          </div>
        )}

        {error && !loading && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <>
            {selectedYear && selectedMonth && (
              <div className="assignment-stats">
                <div className="stat-chip">
                  <Users size={13} />
                  <span>
                    {clientsLoading ? '…' : clients.length} clientes — {selectedMonth} {selectedYear}
                  </span>
                </div>
                {!clientsLoading && (
                  <div className="stat-chip">
                    <User size={13} />
                    <span>
                      {unassignedCount === 0 ? 'Todos asignados' : `${unassignedCount} sin asignar`}
                    </span>
                  </div>
                )}
              </div>
            )}
            <div className="assignment-table-wrapper">
              <table className="assignment-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Asignados</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const myCount = assignments[u.name]?.length || 0;
                    const editable = canEdit(u.role);

                    return (
                      <tr key={u.name}>
                        <td style={{ fontWeight: 500 }}>{u.name}</td>
                        <td>
                          <RoleBadge role={u.role} />
                        </td>
                        <td>
                          <span className="clients-count-badge">
                            {clientsLoading ? '...' : `${myCount} asignados`}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-action-edit"
                            disabled={!editable}
                            onClick={() => openEdit(u)}
                            style={{
                              opacity: editable ? 1 : 0.4,
                              cursor: editable ? 'pointer' : 'not-allowed',
                            }}
                          >
                            {editable ? <Edit3 size={14} /> : <Lock size={14} />}
                            <span style={{ marginLeft: '4px' }}>
                              {editable ? 'Asignar' : 'Bloqueado'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* MODAL DE EDICIÓN DE ASIGNACIONES (Movido correctamente dentro del árbol de retorno) */}
      <AnimatePresence>
        {editingUser && (
          <div className="team-modal-overlay" onClick={closeModal}>
            <motion.div
              className="team-modal-card"
              initial={{ scale: 0.93, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 360, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header-container">
                <div className="modal-header-left">
                  <UserCheck size={18} style={{ color: 'var(--primary)' }} />
                  <div>
                    <h4>Gestionar Cartera</h4>
                    <p className="modal-subtitle">Usuario: {editingUser.name}</p>
                  </div>
                </div>
                <button className="btn-close-modal" onClick={closeModal} disabled={saving}>
                  <X size={16} />
                </button>
              </div>

              <div className="modal-body-scroll">
                {saveError && (
                  <div className="error-banner" style={{ marginBottom: '12px' }}>
                    <AlertCircle size={15} />
                    <span>{saveError}</span>
                  </div>
                )}

                <p className="modal-instruction">
                  Selecciona los clientes que tendrá asignados este usuario en el período elegido.
                </p>

                {clientsLoading ? (
                  <div className="modal-loading-state">
                    <div className="spinner" />
                    <span>Actualizando lista de clientes…</span>
                  </div>
                ) : modalClients.length === 0 ? (
                  <div className="modal-empty-state">
                    <p>No hay clientes disponibles para asignar en este período.</p>
                  </div>
                ) : (
                  <div className="modal-checkbox-list">
                    {modalClients.map((client) => {
                      const rowNum = client._row;
                      const isChecked = editRows.includes(rowNum);
                      const clientName = client[nameKey] || `Fila ${rowNum}`;

                      return (
                        <div
                          key={rowNum}
                          className={`modal-checkbox-row ${isChecked ? 'selected' : ''}`}
                          onClick={() => !saving && toggleRow(rowNum)}
                        >
                          <div className="checkbox-box">
                            {isChecked ? (
                              <CheckSquare size={16} className="checked-icon" />
                            ) : (
                              <Square size={16} className="unchecked-icon" />
                            )}
                          </div>
                          <span className="checkbox-label">{clientName}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="modal-footer-actions">
                <button className="btn-secondary" onClick={closeModal} disabled={saving}>
                  Cancelar
                </button>
                <button className="btn-primary" onClick={handleSave} disabled={saving || clientsLoading}>
                  {saving ? (
                    <>
                      <RefreshCw size={14} className="spin" />
                      <span>Guardando…</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
