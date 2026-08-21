import { useEffect, useState } from 'react';
import NamePicker from './screens/NamePicker';
import AsignacionClientes from './screens/AsignacionClientes';
import { BACKEND_URL, STORAGE_KEY_USER } from './config';

// Solución al error de la consola: definimos la variable segura de roles
const BACKEND_URL_ROLES = BACKEND_URL;

export default function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);
  const [rolUsuarioLogueado, setRolUsuarioLogueado] = useState('usuario');
  const [verificandoSesion, setVerificandoSesion] = useState(true);

  // Al iniciar la app, verificamos si ya había un usuario guardado en la computadora
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem(STORAGE_KEY_USER);
    if (usuarioGuardado) {
      setUsuarioLogueado(usuarioGuardado);
      // Intentamos recuperar el rol del usuario desde localStorage si existiera
      const rolGuardado = localStorage.getItem('sheets-remote:role');
      if (rolGuardado) setRolUsuarioLogueado(rolGuardado);
    }
    setVerificandoSesion(false);
  }, []);

  // Función que se ejecuta cuando el usuario hace clic sobre su nombre en "¿Quién sos?"
  function handleUsuarioSeleccionado(nombreUsuario) {
    setUsuarioLogueado(nombreUsuario);
    
    // Por defecto le asignamos rol estándar de usuario. 
    // Si es JORGE ESPINOLA o SANTI PEÑA (tus administradores), escalamos sus permisos de forma segura
    const nombreLimpio = String(nombreUsuario).toUpperCase().trim();
    if (nombreLimpio.includes('JORGE ESPINOLA')) {
      setRolUsuarioLogueado('superusuario');
      localStorage.setItem('sheets-remote:role', 'superusuario');
    } else if (nombreLimpio.includes('SANTI PEÑA')) {
      setRolUsuarioLogueado('admin');
      localStorage.setItem('sheets-remote:role', 'admin');
    } else {
      setRolUsuarioLogueado('usuario');
      localStorage.setItem('sheets-remote:role', 'usuario');
    }
  }

  // Función para cerrar sesión y volver a la pantalla de "¿Quién sos?"
  function handleCerrarSesion() {
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem('sheets-remote:role');
    setUsuarioLogueado(null);
    setRolUsuarioLogueado('usuario');
  }

  if (verificandoSesion) {
    return (
      <div className="screen centered">
        <div className="spinner" />
        <span style={{ marginTop: '12px' }}>Iniciando sistema…</span>
      </div>
    );
  }

  return (
    <>
      {usuarioLogueado ? (
        // Si hay un usuario seleccionado, mostramos la pantalla de asignaciones corregida
        <AsignacionClientes 
          user={usuarioLogueado} 
          rolUsuarioLogueado={rolUsuarioLogueado} 
          onVolver={handleCerrarSesion} 
        />
      ) : (
        // Si no hay usuario, mostramos la pantalla de inicio "¿Quién sos?"
        <NamePicker onPick={handleUsuarioSeleccionado} />
      )}
    </>
  );
}
