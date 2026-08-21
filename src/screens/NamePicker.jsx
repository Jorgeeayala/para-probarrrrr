import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { api } from '../api';
import { STORAGE_KEY_USER } from '../config';
import { Users, AlertCircle, RefreshCw } from 'lucide-react';

export default function NamePicker({ onPick }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function loadUsers() {
    setLoading(true);
    setError('');

    api
      .listUsersWithRoles()
      .then((data) => {
        // Atajamos si el backend de Google devuelve un error estructurado
        if (data && data.ok === false) {
          setError(data.error || 'Error del servidor en Google Sheets.');
          setUsers([]);
          return;
        }

        // Si es la lista esperada, la guardamos. Si no, protegemos el .map()
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          console.error("Respuesta inválida del servidor:", data);
          setError('El servidor no devolvió una lista de usuarios válida.');
          setUsers([]);
        }
      })
      .catch((err) => {
        console.error("Error de conexión:", err);
        setError(err.message || 'Error de red al conectar con el servidor.');
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function choose(name) {
    localStorage.setItem(STORAGE_KEY_USER, name);
    onPick(name);
  }

  return (
    <div className="screen centered">
      <motion.div
        className="hero-card"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      >
        <motion.div
          className="picker-icon-box"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.15 }}
        >
          <Users size={28} />
        </motion.div>

        <h2>¿Quién sos?</h2>
        <p className="text-muted">Selecciona tu usuario para ingresar al sistema</p>

        {loading && (
          <div className="loading-state" style={{ margin: '20px 0', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 10px' }} />
            <span>Cargando lista de usuarios…</span>
          </div>
        )}

        {/* TU BANNER DE ERROR CON BOTÓN REINTENTAR */}
        {error && (
          <motion.div
            className="error-banner"
            style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', textAlign: 'left', marginTop: '16px' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Error de conexión</strong>
              <div style={{ fontSize: '13px', marginTop: '2px' }}>{error}</div>
              <motion.button
                className="btn-secondary"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                style={{ marginTop: '10px', padding: '6px 12px', fontSize: '13px' }}
                onClick={loadUsers}
              >
                <RefreshCw size={14} style={{ marginRight: '6px' }} /> Reintentar
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* LISTADO DE USUARIOS EVITANDO PANTALLA EN BLANCO */}
        {!loading && !error && users.length > 0 && (
          <div className="users-list" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {users.map((u) => (
              <button
                key={u.name}
                className="btn-user-select"
                onClick={() => choose(u.name)}
                style={{ padding: '12px', textAlign: 'left', cursor: 'pointer' }}
              >
                <strong>{u.name}</strong>
                <span style={{ fontSize: '12px', display: 'block', opacity: 0.7 }}>
                  Rol: {u.role}
                </span>
              </button>
            ))}
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <p className="text-muted" style={{ marginTop: '20px', textAlign: 'center' }}>
            No se encontraron usuarios registrados en la planilla.
          </p>
        )}
      </motion.div>
    </div>
  );
}
