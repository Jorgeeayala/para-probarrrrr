// ────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN INICIAL (Poné acá los datos de tu planilla)
// ────────────────────────────────────────────────────────────────────────
const ADMIN_SPREADSHEET_ID = '1nBm41JkdXsxnb10G7yYcdXOXvEHU3BYbfDlccsWcpa4'; // ID de tu planilla principal
const USERS_SHEET_NAME     = 'Usuarios';      // Nombre de la pestaña de usuarios
const PLANILLAS_SHEET_NAME = 'Planillas';     // Nombre de la pestaña de meses/años
const ASIGNACIONES_SHEET_NAME = 'Asignaciones'; // Nombre de la pestaña de asignaciones

function getAdminSpreadsheet() {
  return SpreadsheetApp.openById(ADMIN_SPREADSHEET_ID);
}

// Token de seguridad básico para que nadie use tu backend sin permiso
const API_TOKEN = 'TU_TOKEN_SECRETO_AQUÍ'; 

function isAuthorized(token) {
  return token === API_TOKEN;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function unauthorizedResponse() {
  return jsonResponse({ ok: false, error: 'No autorizado' });
}

// ────────────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL: RECIBE LAS ÓRDENES DE REACT
// ────────────────────────────────────────────────────────────────────────
function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Body inválido, se esperaba JSON' });
  }

  // Si en tu frontend no usás token todavía, podés comentar la siguiente línea:
  // if (!isAuthorized(body.token)) return unauthorizedResponse();

  const action = body.action;

  // ACCIÓN QUE TE DABA EL ERROR 🌟
  if (action === 'usersWithRoles') {
    try {
      const allowedUsers = getAllowedUsers();
      const mappedUsers = allowedUsers.map(function(u) {
        return {
          name: u.nombre,
          role: (u.rol || 'usuario').toLowerCase().trim()
        };
      });
      return jsonResponse(mappedUsers);
    } catch (err) {
      return jsonResponse({ ok: false, error: err.message });
    }
  }

  if (action === 'listYears') {
    try {
      return jsonResponse(getAvailableYears());
    } catch (err) { return jsonResponse({ ok: false, error: err.message }); }
  }

  if (action === 'listMonths') {
    try {
      return jsonResponse(getMonthsForYear(body.year));
    } catch (err) { return jsonResponse({ ok: false, error: err.message }); }
  }

  if (action === 'getAssignments') {
    try {
      return jsonResponse(loadAssignmentsData(body.year, body.month));
    } catch (err) { return jsonResponse({ ok: false, error: err.message }); }
  }

  if (action === 'saveAssignment') {
    try {
      saveAssignmentData(body.year, body.month, body.targetUser, body.rows);
      return jsonResponse({ ok: true, message: 'Asignación guardada correctamente' });
    } catch (err) { return jsonResponse({ ok: false, error: err.message }); }
  }

  return jsonResponse({ ok: false, error: 'Acción desconocida: ' + action });
}

// ────────────────────────────────────────────────────────────────────────
// FUNCIONES INTERNAS: LEEN Y ESCRIBEN EN TU GOOGLE SHEETS
// ────────────────────────────────────────────────────────────────────────
function getAllowedUsers() {
  const ss = getAdminSpreadsheet();
  const sheet = ss.getSheetByName(USERS_SHEET_NAME);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  const users = [];
  // Asume que la fila 1 son encabezados: Nombre, Rol
  for (var i = 1; i < values.length; i++) {
    if (values[i][0]) {
      users.push({
        nombre: String(values[i][0]).trim(),
        rol: String(values[i][1] || 'usuario').toLowerCase().trim()
      });
    }
  }
  return users;
}

function getAvailableYears() {
  const ss = getAdminSpreadsheet();
  const sheet = ss.getSheetByName(PLANILLAS_SHEET_NAME);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  const years = [];
  for (var i = 1; i < values.length; i++) {
    var y = String(values[i][0]).trim(); // Columna 1: Año
    if (y && years.indexOf(y) === -1) years.push(y);
  }
  return years;
}

function getMonthsForYear(year) {
  const ss = getAdminSpreadsheet();
  const sheet = ss.getSheetByName(PLANILLAS_SHEET_NAME);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  const months = [];
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(year)) {
      var m = String(values[i][1]).trim(); // Columna 2: Mes
      if (m && months.indexOf(m) === -1) months.push(m);
    }
  }
  return months;
}

function loadAssignmentsData(year, month) {
  const ss = getAdminSpreadsheet();
  const sheet = ss.getSheetByName(ASIGNACIONES_SHEET_NAME);
  if (!sheet) return {};
  const values = sheet.getDataRange().getValues();
  const assignments = {};
  // Formato esperado en la hoja: Año | Mes | Usuario | FilaCliente
  for (var i = 1; i < values.length; i++) {
    var vYear  = String(values[i][0]).trim();
    var vMonth = String(values[i][1]).trim();
    var vUser  = String(values[i][2]).trim();
    var vRow   = Number(values[i][3]);

    if (vYear === String(year) && vMonth === String(month) && vUser) {
      if (!assignments[vUser]) assignments[vUser] = [];
      if (!isNaN(vRow)) assignments[vUser].push(vRow);
    }
  }
  return assignments;
}

function saveAssignmentData(year, month, targetUser, rows) {
  const ss = getAdminSpreadsheet();
  var sheet = ss.getSheetByName(ASIGNACIONES_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(ASIGNACIONES_SHEET_NAME);
    sheet.appendRow(['Año', 'Mes', 'Usuario', 'FilaCliente']);
  }
  
  const values = sheet.getDataRange().getValues();
  // Borramos asignaciones viejas de este usuario para este mes/año para no duplicar
  for (var i = values.length - 1; i >= 1; i--) {
    if (String(values[i][0]).trim() === String(year) &&
        String(values[i][1]).trim() === String(month) &&
        String(values[i][2]).trim() === String(targetUser)) {
      sheet.deleteRow(i + 1);
    }
  }
  
  // Insertamos las nuevas filas asignadas
  if (rows && rows.length) {
    rows.forEach(function(rowNum) {
      sheet.appendRow([year, month, targetUser, rowNum]);
    });
  }
}
