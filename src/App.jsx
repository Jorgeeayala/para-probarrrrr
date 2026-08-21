import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import NamePicker from './screens/NamePicker';
import YearPicker from './screens/YearPicker';
import MonthPicker from './screens/MonthPicker';
import ClientList from './screens/ClientList';
import ClientDetail from './screens/ClientDetail';
import NewClient from './screens/NewClient';
import AsignacionClientes from './screens/AsignacionClientes';
import AppSplashLoader from './components/AppSplashLoader';
import { api } from './api';
import { STORAGE_KEY_USER } from './config';
import { formatPeriodLabel } from './utils';
import { FileSpreadsheet, Calendar, User, Sun, Moon, Menu, X, UserCog, Loader2 } from 'lucide-react';
import './styles.css';

const pageVariants = {
  initial: { opacity: 0, y: 22, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 320, damping: 28 },
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.97,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

export default function App() {
  const [user, setUser] = useState(() => localStorage.getItem(STORAGE_KEY_USER));
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [showAssignment, setShowAssignment] = useState(false);
  const [year, setYear] = useState(null);
  const [month, setMonth] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [creatingWithHeaders, setCreatingWithHeaders] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
    if (!user) {
      setUserRole(null);
      setRoleLoading(false);
      return;
    }
    setRoleLoading(true);

    fetch(BACKEND_URL_ROLES, {
      method: "POST",
      body: JSON.stringify({
        accion: "obtenerRol",
        correo: user,
        token: API_TOKEN
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setUserRole(data.rol ? data.rol.toLowerCase().trim() : 'usuario');
      })
      .catch((err) => {
        console.warn('Error al verificar rol seguro:', err);
        setUserRole('usuario');
      })
      .finally(() => {
        setRoleLoading(false);
      });
  }, [user]); 
  
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);

    // Mantiene los íconos de la barra de estado (hora, batería, señal)
    // legibles según el tema: claros sobre el fondo oscuro de la app,
    // oscuros sobre el fondo claro. Solo aplica en la app nativa (no
    // hace nada en el navegador/PWA web).
    // Mantiene los íconos de las barras del sistema (hora/batería arriba,
    // gestos abajo) legibles según el tema. Desde Capacitor 8.3+ esto se
    // hace con el SystemBars nativo (no el plugin @capacitor/status-bar
    // viejo, que en Android 16 quedó sin efecto porque el sistema fuerza
    // el modo "edge-to-edge" y ya no deja pintar un color de fondo fijo).
    if (Capacitor.isNativePlatform()) {
      SystemBars.setStyle({
        style: theme === 'dark' ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
      }).catch(() => {});
    }
  }, [theme]);

  // Botón / gesto "atrás" del sistema en Android: en vez de cerrar la app
  // de una, navega hacia atrás DENTRO de la app, con la misma prioridad
  // que ya usan los botones "volver" de cada pantalla. Si no hay nada más
  // atrás (estamos en la pantalla de elegir año, la primera pantalla real
  // después de elegir usuario), ahí sí cierra la app.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = CapacitorApp.addListener('backButton', () => {
      if (showAssignment) {
        setShowAssignment(false);
      } else if (creatingWithHeaders) {
        setCreatingWithHeaders(null);
      } else if (selectedClient) {
        setSelectedClient(null);
      } else if (month) {
        setMonth(null);
      } else if (year) {
        setYear(null);
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
  }, [showAssignment, creatingWithHeaders, selectedClient, month, year]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [year, month, selectedClient, creatingWithHeaders, showAssignment]);

  function handlePickUser(chosenUser) {
    setUser(chosenUser);
    setShowAssignment(false);
  }

  const canAccessAssignments = userRole === 'admin' || userRole === 'superusuario';

  // Navbar for authenticated screens
  const renderNavbar = () => {
    return (
      <>
      <header className="app-navbar">
        <div className="navbar-content">
          <motion.div
            className="brand-badge hide-mobile"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setShowAssignment(false);
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="brand-icon-wrapper">
              <FileSpreadsheet size={20} />
            </div>
            <span>Control Clientes</span>
          </motion.div>

          <div className="nav-pills">
            {user && (
              <motion.button
                className="mobile-menu-btn"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setMobileMenuOpen(true)}
                title="Menú"
                aria-label="Abrir menú"
              >
                <Menu size={18} />
              </motion.button>
            )}

            {/* Asignación de Clientes Pill (Desktop) con Skeleton/Loader de seguridad */}
            {user && roleLoading && (
              <div className="pill-btn hide-mobile role-nav-loading" title="Verificando permisos...">
                <Loader2 size={14} className="spin" />
                <span style={{ fontSize: '12px' }}>Verificando...</span>
              </div>
            )}

            {user && !roleLoading && canAccessAssignments && (
              <motion.button
                className={`pill-btn hide-mobile ${showAssignment ? 'active' : ''}`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowAssignment((prev) => !prev);
                  setSelectedClient(null);
                  setCreatingWithHeaders(null);
                }}
                title="Asignación de Clientes (Solo Administradores y Superusuarios)"
              >
                <UserCog size={15} />
                <span>Asignación de Clientes</span>
              </motion.button>
            )}

            {user && !showAssignment && year && month && (
              <motion.button
                className="pill-btn active period-pill"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedClient(null);
                  setCreatingWithHeaders(null);
                  setMonth(null);
                }}
                title="Cambiar mes o año"
              >
                <Calendar size={14} />
                <span>{formatPeriodLabel(month, year)}</span>
              </motion.button>
            )}

            <motion.button
              className="theme-toggle-btn hide-mobile"
              whileHover={{ scale: 1.08, rotate: 12 }}
              whileTap={{ scale: 0.9, rotate: -20 }}
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={theme}
                  initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                </motion.div>
              </AnimatePresence>
            </motion.button>

            {user && (
              <motion.button
                className="pill-btn"
                title={`Usuario actual: ${user} (${userRole || 'Verificando'}) - Haz clic para cambiar`}
                onClick={() => {
                  setUser(null);
                  setUserRole(null);
                  setShowAssignment(false);
                  localStorage.removeItem(STORAGE_KEY_USER);
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                style={{ cursor: 'pointer', gap: '6px' }}
              >
                <div className="avatar-badge" style={{ display: 'flex', alignItems: 'center' }}>
                  <User size={14} />
                </div>
                <span className="nav-user-name" style={{ fontSize: '13px', fontWeight: 600 }}>
                  {user}
                </span>
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && user && (
          <>
            <motion.div
              className="mobile-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="mobile-drawer-panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              <div className="mobile-drawer-header">
                <span className="mobile-drawer-title">Menú</span>
                <button
                  type="button"
                  className="mobile-drawer-close"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Cerrar menú"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Botón Asignación de Clientes en Drawer Mobile */}
              {roleLoading ? (
                <div className="mobile-menu-item" style={{ opacity: 0.7 }}>
                  <Loader2 size={17} className="spin" />
                  <span>Verificando permisos...</span>
                </div>
              ) : canAccessAssignments ? (
                <button
                  type="button"
                  className={`mobile-menu-item ${showAssignment ? 'active-menu-item' : ''}`}
                  onClick={() => {
                    setShowAssignment((prev) => !prev);
                    setSelectedClient(null);
                    setCreatingWithHeaders(null);
                    setMobileMenuOpen(false);
                  }}
                >
                  <UserCog size={17} style={{ color: 'var(--primary)' }} />
                  <span>Asignación de Clientes</span>
                </button>
              ) : null}

              <button
                type="button"
                className="mobile-menu-item"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
                <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
    );
  };

  const getScreenContent = () => {
    if (!user) {
      return (
        <motion.div key="name-picker" variants={pageVariants} initial="initial" animate="animate" exit="exit">
          <NamePicker onPick={handlePickUser} />
        </motion.div>
      );
    }

    if (showAssignment) {
      return (
        <motion.div key="assignment-screen" variants={pageVariants} initial="initial" animate="animate" exit="exit">
          <AsignacionClientes
            user={user}
            userRole={userRole}
            onBack={() => setShowAssignment(false)}
          />
        </motion.div>
      );
    }

    if (!year) {
      return (
        <motion.div key="year-picker" variants={pageVariants} initial="initial" animate="animate" exit="exit">
          <YearPicker onPick={setYear} user={user} />
        </motion.div>
      );
    }

    if (!month) {
      return (
        <motion.div key={`month-picker-${year}`} variants={pageVariants} initial="initial" animate="animate" exit="exit">
          <MonthPicker year={year} onPick={setMonth} onChangeYear={() => setYear(null)} />
        </motion.div>
      );
    }

    if (creatingWithHeaders) {
      return (
        <motion.div key={`new-client-${year}-${month}`} variants={pageVariants} initial="initial" animate="animate" exit="exit">
          <NewClient
            user={user}
            year={year}
            month={month}
            headers={creatingWithHeaders}
            onCancel={() => setCreatingWithHeaders(null)}
            onCreated={() => {
              setCreatingWithHeaders(null);
              setRefreshKey((k) => k + 1);
            }}
          />
        </motion.div>
      );
    }

    if (selectedClient) {
      return (
        <motion.div
          key={`client-detail-${selectedClient._row}-${year}-${month}`}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <ClientDetail
            user={user}
            year={year}
            month={month}
            client={selectedClient}
            onBack={() => setSelectedClient(null)}
          />
        </motion.div>
      );
    }

    return (
      <motion.div key={`client-list-${year}-${month}-${refreshKey}`} variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <ClientList
          user={user}
          year={year}
          month={month}
          onSelect={setSelectedClient}
          onChangeMonth={() => setMonth(null)}
          onNewClient={setCreatingWithHeaders}
        />
      </motion.div>
    );
  };

  return (
    <div className="app-container">
      <AppSplashLoader videoSrc="/loading.mp4" minDurationMs={2200} />
      {renderNavbar()}
      {/* mode="popLayout" en vez de "wait": con "wait", la pantalla que
          sale tenía que desmontarse del todo (y ClientDetail terminar su
          carga inicial) ANTES de que la nueva empezara a aparecer -- ese
          hueco se sentía como un microcorte al entrar/salir de un
          cliente. Con "popLayout" ambas se animan superpuestas (la que
          sale se saca del flujo normal así no empuja el layout), sin
          instante en blanco en el medio. */}
      <AnimatePresence mode="popLayout">
        {getScreenContent()}
      </AnimatePresence>
    </div>
  );
}

