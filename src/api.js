import { BACKEND_URL, API_TOKEN } from './config';

// Proveedor seguro que evita el error "Failed to Fetch" usando parámetros web tradicionales
async function requestProvider(url, action, extraParams = {}) {
  const formData = new URLSearchParams();
  formData.append('action', action);
  formData.append('token', API_TOKEN);
  
  // Mapeamos el resto de las variables requeridas
  Object.entries(extraParams).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value);
    }
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded', // Formato inmune al bloqueo de red de Google
      },
      body: formData.toString(),
    });

    if (!response.ok) throw new Error(`Error en el Servidor: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error crítico en la acción [${action}]:`, error);
    throw error;
  }
}

export const api = {
  // Trae los usuarios y sus jerarquías
  listUsersWithRoles: async () => {
    return await requestProvider(BACKEND_URL, 'usersWithRoles');
  },

  // Trae la lista de años habilitados
  listYears: async () => {
    return await requestProvider(BACKEND_URL, 'listYears');
  },

  // Trae la lista de meses vinculados a un año
  listMonths: async (year) => {
    return await requestProvider(BACKEND_URL, 'listMonths', { year });
  },

  // Lee el listado de clientes de la base remota
  readClients: async (year, month) => {
    return await requestProvider(BACKEND_URL, 'readClients', { year, month });
  },

  // Lee el diccionario de asignaciones vigentes
  getAssignments: async (year, month) => {
    return await requestProvider(BACKEND_URL, 'getAssignments', { year, month });
  },

  // Almacena las modificaciones sobre los clientes asignados
  saveAssignment: async ({ year, month, targetUser, rows, actorUser }) => {
    return await requestProvider(BACKEND_URL, 'saveAssignment', {
      year,
      month,
      targetUser,
      rows: JSON.stringify(rows), // Se serializan las filas de forma transparente
      actorUser,
    });
  },
};
