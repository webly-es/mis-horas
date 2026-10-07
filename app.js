'use strict';
/* =========================================================
   Mis Horas — registro personal de turnos y bolsa de horas
   Datos guardados solo en este dispositivo (localStorage).
   ========================================================= */

const KEY = 'mishoras.v1';
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAYS_LETTER = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const TYPES = {
  trabajo: { label: 'Trabajo', long: 'Trabajo', cls: 't-trabajo', abbr: 'T' },
  libre: { label: 'Libre', long: 'Día libre', cls: 't-libre', abbr: 'L' },
  vacaciones: { label: 'Vacaciones', long: 'Vacaciones', cls: 't-vac', abbr: 'V' },
  nl: { label: 'NL', long: 'NL (nulo / no laborable)', cls: 't-nl', abbr: 'NL' },
  festivo: { label: 'Festivo', long: 'Festivo', cls: 't-fest', abbr: 'F' },
  baja: { label: 'Baja', long: 'Baja / permiso', cls: 't-baja', abbr: 'B' },
  compensacion: { label: 'Compensación', long: 'Compensación (devolución de horas)', cls: 't-comp', abbr: 'C' }
};
const TYPE_ORDER = ['trabajo', 'libre', 'vacaciones', 'nl', 'festivo', 'baja', 'compensacion'];
const CREDIT_TYPES = ['vacaciones', 'festivo', 'baja'];

const MOV_KINDS = {
  favor: { label: 'A mi favor', short: 'H+', sign: 1 },
  contra: { label: 'En contra', short: 'H−', sign: -1 },
  control: { label: 'Control oficial', short: 'Control', sign: 0 }
};
const MOV_PRESETS = {
  favor: ['Curso de formación', 'Me quedé más tarde', 'Entré antes', 'Horas extra', 'Corrección a mi favor'],
  contra: ['Salida anticipada', 'Entrada más tarde', 'Devolución de horas', 'Corrección en contra'],
  control: ['Consultado al encargado', 'Visto en el ordenador', 'Comunicado por la empresa']
};

/* ---------- Iconos ---------- */
const ICON = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  cal: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  check: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13M9 7V4h6v3"/>',
  share: '<path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  download: '<path d="M12 3v13M7 11l5 5 5-5"/><path d="M5 21h14"/>',
  upload: '<path d="M12 21V8M7 13l5-5 5 5"/><path d="M5 3h14"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'
};
const ico = (n) => `<svg viewBox="0 0 24 24">${ICON[n] || ''}</svg>`;

/* ---------- Utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = (n) => String(n).padStart(2, '0');

function parseISO(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function toISO(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function addDays(s, n) { const d = parseISO(s); d.setDate(d.getDate() + n); return toISO(d); }
function todayISO() { return toISO(new Date()); }
function mondayOf(s) { const d = parseISO(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return toISO(d); }
function weekdayIdx(s) { return (parseISO(s).getDay() + 6) % 7; }
function fmtShort(s) { const d = parseISO(s); return `${DAYS_SHORT[(d.getDay() + 6) % 7].toLowerCase()} ${d.getDate()} ${MONTHS[d.getMonth()]}`; }
function fmtDayMonth(s) { const d = parseISO(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; }
function fmtNum(s) { if (!s) return '—'; const d = parseISO(s); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; }
function fmtTs(iso) { const d = new Date(iso); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function fmtRange(start) {
  const a = parseISO(start), b = parseISO(addDays(start, 6));
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`
    : `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
}

function toMin(t) { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function fmtDur(min, sign = false) {
  min = Math.round(min || 0);
  const s = min < 0 ? '−' : (sign && min > 0 ? '+' : '');
  const a = Math.abs(min), h = Math.floor(a / 60), m = a % 60;
  return `${s}${h}h${m ? ' ' + pad(m) + 'm' : ''}`;
}
function fmtDec(min, sign = true) {
  const v = (min || 0) / 60;
  const s = v < 0 ? '−' : (sign && v > 0 ? '+' : '');
  return `${s}${Math.abs(v).toFixed(2).replace('.', ',')} h`;
}
function cls(min) { return min > 0 ? 'pos' : min < 0 ? 'neg' : 'zero'; }
function parseHours(txt) {
  if (txt == null) return null;
  txt = String(txt).trim().replace(',', '.');
  if (!txt) return null;
  if (txt.includes(':')) {
    const [h, m] = txt.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  }
  const v = Number(txt);
  return isNaN(v) || v < 0 ? null : Math.round(v * 60);
}
function hoursText(min) { return min == null ? '' : String(+(min / 60).toFixed(2)).replace('.', ','); }

/* ---------- Estado ---------- */
function defaultState() {
  return {
    version: 1,
    profile: { nombre: '', dni: '', nss: '', puesto: '', numEmpleado: '', telefono: '', email: '', empresa: '', cif: '', centro: '', encargado: '', fechaAlta: '', convenio: '' },
    settings: { diasLab: 5, computan: { vacaciones: true, festivo: true, baja: true }, saldoInicial: 0, saldoInicialFecha: '', saldoInicialNota: '', recordatorioMin: 60, lastBackup: '' },
    weeks: [],
    movs: [],
    log: []
  };
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) { /* datos corruptos: empezar vacío */ }
  return defaultState();
}
function normalize(d) {
  const def = defaultState();
  const out = { ...def, ...d };
  out.profile = { ...def.profile, ...(d.profile || {}) };
  out.settings = { ...def.settings, ...(d.settings || {}) };
  out.settings.computan = { ...def.settings.computan, ...((d.settings || {}).computan || {}) };
  out.weeks = Array.isArray(d.weeks) ? d.weeks : [];
  out.movs = Array.isArray(d.movs) ? d.movs : [];
  out.log = Array.isArray(d.log) ? d.log : [];
  return out;
}
let S = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('No se pudo guardar en el dispositivo', 'error'); }
}
function logEv(action, kind, ref, detail) {
  S.log.push({ ts: new Date().toISOString(), action, kind, ref: ref || '', detail: detail || '' });
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

/* ---------- Cálculos ---------- */
const validTramo = (t) => t && t.in && t.out;
function tramoMin(t) {
  if (!validTramo(t)) return 0;
  const a = toMin(t.in);
  let b = toMin(t.out);
  if (b <= a) b += 1440; // turno que pasa de medianoche
  return b - a;
}
function dayWorked(day) {
  if (!day || day.type !== 'trabajo') return 0;
  const raw = (day.tramos || []).reduce((s, t) => s + tramoMin(t), 0);
  return Math.max(0, raw - (Number(day.descanso) || 0));
}
function dayCredit(day, jornadaMin) {
  if (!day || !CREDIT_TYPES.includes(day.type) || !S.settings.computan[day.type]) return 0;
  return Math.round((jornadaMin || 0) / (S.settings.diasLab || 5));
}
function dayTimes(day) {
  if (!day || day.type !== 'trabajo') return '';
  return (day.tramos || []).filter(validTramo).map((t) => `${t.in}–${t.out}`).join(' · ');
}
function weekEnd(w) { return addDays(w.start, 6); }
function movsInRange(a, b, includeControl = false) {
  return S.movs.filter((m) => m.date >= a && m.date <= b && (includeControl || m.kind !== 'control'))
    .sort((x, y) => x.date.localeCompare(y.date));
}
function movDelta(m) { return (MOV_KINDS[m.kind]?.sign || 0) * (m.minutes || 0); }
function weekStats(w) {
  let worked = 0, credited = 0;
  w.days.forEach((d) => { worked += dayWorked(d); credited += dayCredit(d, w.jornadaMin); });
  const total = worked + credited;
  const diff = total - w.jornadaMin;
  const movs = movsInRange(w.start, weekEnd(w));
  const movSum = movs.reduce((s, m) => s + movDelta(m), 0);
  return { worked, credited, total, diff, movs, movSum, net: diff + movSum };
}
function sortedWeeks(desc = false) {
  const ws = [...S.weeks].sort((a, b) => a.start.localeCompare(b.start));
  return desc ? ws.reverse() : ws;
}
function findDay(iso) {
  const w = S.weeks.find((x) => x.start <= iso && weekEnd(x) >= iso);
  if (!w) return null;
  const idx = weekdayIdx(iso);
  return { week: w, day: w.days[idx], idx };
}

/* Libro de horas: saldo inicial + diferencias semanales + movimientos, en orden cronológico */
function ledger() {
  const today = todayISO();
  const items = [];
  const st = S.settings;
  if (st.saldoInicial || st.saldoInicialFecha) {
    items.push({ kind: 'inicial', date: st.saldoInicialFecha || '0000-01-01', delta: st.saldoInicial || 0, order: 0, closed: true });
  }
  S.weeks.forEach((w) => {
    const ws = weekStats(w);
    items.push({ kind: 'semana', date: weekEnd(w), delta: ws.diff, order: 2, week: w, stats: ws, closed: weekEnd(w) < today });
  });
  S.movs.forEach((m) => {
    if (m.kind === 'control') items.push({ kind: 'control', date: m.date, delta: 0, order: 3, mov: m, closed: true });
    else items.push({ kind: 'mov', date: m.date, delta: movDelta(m), order: 1, mov: m, closed: m.date <= today });
  });
  items.sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);
  let bal = 0;
  items.forEach((it) => {
    if (it.kind === 'control') {
      it.app = bal;
      it.official = it.mov.officialSign * (it.mov.minutes || 0);
      it.gap = it.official - bal;
    } else bal += it.delta;
    it.bal = bal;
  });
  const current = items.filter((i) => i.kind !== 'control' && i.closed).reduce((s, i) => s + i.delta, 0);
  const projected = bal;
  return { items, current, projected };
}

/* Turnos concretos (con fecha y hora) para próximo turno, avisos y calendario */
function allShifts() {
  const list = [];
  S.weeks.forEach((w) => w.days.forEach((d, i) => {
    if (d.type !== 'trabajo') return;
    const date = addDays(w.start, i);
    (d.tramos || []).filter(validTramo).forEach((t) => {
      const s = parseISO(date); s.setMinutes(toMin(t.in));
      const e = parseISO(date); e.setMinutes(toMin(t.out));
      if (e <= s) e.setDate(e.getDate() + 1);
      list.push({ date, start: s, end: e, t });
    });
  }));
  return list.sort((a, b) => a.start - b.start);
}

/* Avisos legales automáticos: descanso entre jornadas < 12 h y más de 9 h ordinarias en un día */
function legalAlerts() {
  const alerts = [];
  const shifts = allShifts();
  for (let i = 1; i < shifts.length; i++) {
    const prev = shifts[i - 1], cur = shifts[i];
    if (prev.date === cur.date) continue;
    // último tramo del día anterior
    const lastPrev = shifts.filter((s) => s.date === prev.date).reduce((a, b) => (b.end > a.end ? b : a));
    const firstCur = shifts.find((s) => s.date === cur.date);
    if (cur !== firstCur) continue;
    const gap = (firstCur.start - lastPrev.end) / 60000;
    if (gap >= 0 && gap < 12 * 60) {
      alerts.push({ date: cur.date, type: 'descanso', text: `Descanso entre jornadas de ${fmtDur(gap)} (del ${fmtNum(prev.date)} al ${fmtNum(cur.date)}), inferior a 12 h.` });
    }
  }
  S.weeks.forEach((w) => w.days.forEach((d, i) => {
    const m = dayWorked(d);
    if (m > 9 * 60) alerts.push({ date: addDays(w.start, i), type: 'jornada', text: `${fmtDur(m)} de trabajo el ${fmtNum(addDays(w.start, i))}, más de 9 h ordinarias en el día.` });
  }));
  return alerts.sort((a, b) => a.date.localeCompare(b.date));
}

/* ---------- UI helpers ---------- */
function toast(msg, type = 'ok') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; }, 2400);
  setTimeout(() => el.remove(), 2800);
}

let sheetEl = null, ignorePop = false;
const pending = [];
// Ejecuta tras cerrar la hoja (su entrada de historial se retira de forma asíncrona)
function afterSheet(fn) { if (ignorePop) pending.push(fn); else fn(); }
function go(hash) { afterSheet(() => { if (location.hash !== hash) location.hash = hash; else route(); }); }
function openSheet(title, body, footer = '', onMount) {
  closeSheet(true);
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `
    <div class="sheet-backdrop" data-close></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet-head"><h3>${esc(title)}</h3><button class="sheet-close" data-close aria-label="Cerrar">${ico('close')}</button></div>
      <div class="sheet-body">${body}</div>
      ${footer ? `<div class="sheet-foot">${footer}</div>` : ''}
    </div>`;
  document.body.appendChild(wrap);
  document.body.style.overflow = 'hidden';
  wrap.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeSheet(); });
  sheetEl = wrap;
  history.pushState({ sheet: true }, '');
  if (onMount) onMount(wrap);
  return wrap;
}
function closeSheet(silent) {
  if (!sheetEl) return;
  sheetEl.remove();
  sheetEl = null;
  document.body.style.overflow = '';
  if (history.state && history.state.sheet) { ignorePop = true; history.back(); }
}
window.addEventListener('popstate', () => {
  if (ignorePop) {
    ignorePop = false;
    pending.splice(0).forEach((fn) => fn());
    return;
  }
  if (sheetEl) { sheetEl.remove(); sheetEl = null; document.body.style.overflow = ''; }
});

function confirmBox(title, msg, okLabel = 'Aceptar', danger = false) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'dialog-wrap';
    wrap.innerHTML = `<div class="sheet-backdrop"></div>
      <div class="dialog"><h4>${esc(title)}</h4><p>${esc(msg)}</p>
      <div class="dlg-actions"><button class="btn" data-r="0">Cancelar</button><button class="btn ${danger ? 'danger' : 'primary'}" data-r="1">${esc(okLabel)}</button></div></div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener('click', (e) => {
      const b = e.target.closest('[data-r]');
      if (b || e.target.classList.contains('sheet-backdrop')) { wrap.remove(); resolve(b ? b.dataset.r === '1' : false); }
    });
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
async function shareOrDownload(blob, filename, share) {
  if (share && navigator.canShare) {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: filename }); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
  }
  downloadBlob(blob, filename);
}

/* ---------- Router ---------- */
const TITLES = { inicio: 'Mis Horas', semanas: 'Semanas', semana: 'Semana', flujo: 'Flujo de horas', perfil: 'Perfil', historial: 'Historial de cambios' };
function route() {
  const [view, id] = (location.hash.replace(/^#\/?/, '') || 'inicio').split('/');
  const fn = VIEWS[view] || VIEWS.inicio;
  $('#view').innerHTML = fn(id);
  $('#view').style.animation = 'none'; void $('#view').offsetWidth; $('#view').style.animation = '';
  const tab = view === 'semana' ? 'semanas' : view === 'historial' ? 'perfil' : view;
  $$('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.tab === tab));
  $('#barTitle').textContent = TITLES[view] || 'Mis Horas';
  $('#backBtn').hidden = !(view === 'semana' || view === 'historial');
  $('#fab').hidden = view === 'perfil' || view === 'historial';
  $('#view').scrollTop = 0;
}
window.addEventListener('hashchange', route);
$('#backBtn').addEventListener('click', () => {
  const v = location.hash.split('/')[1];
  location.hash = v === 'historial' ? '#/perfil' : '#/semanas';
});

/* ---------- Vistas ---------- */
const VIEWS = {};

VIEWS.inicio = () => {
  const p = S.profile;
  const L = ledger();
  const today = todayISO();
  const first = (p.nombre || '').trim().split(/\s+/)[0];
  let html = '';

  if (!p.nombre) {
    html += `<div class="alert info">${ico('user')}<div><b>Configura tu perfil</b>Tu nombre y datos aparecerán en los informes PDF. <button class="link-btn" data-act="editProfile">Completar ahora →</button></div></div><div style="height:12px"></div>`;
  }

  // Tarjeta de saldo
  const c = L.current;
  const state = c > 0 ? ['pos', 'Te deben horas'] : c < 0 ? ['neg', 'Debes horas'] : ['zero', 'En equilibrio'];
  html += `
  <section class="hero is-${state[0]}">
    <div class="hero-label">${first ? `Hola, ${esc(first)} · ` : ''}Saldo de horas <span class="hero-pill ${state[0]}">${state[1]}</span></div>
    <div class="hero-value num ${state[0]}">${fmtDur(c, true)}</div>
    <div class="hero-dec num">${fmtDec(c)} · semanas cerradas y movimientos hasta hoy</div>
    ${sparkline(L.items)}
    <div class="hero-foot">
      <div class="hero-mini"><small>Al cerrar la semana</small><b class="num ${cls(L.projected)}">${fmtDur(L.projected, true)}</b></div>
      <div class="hero-mini"><small>Semanas registradas</small><b class="num">${S.weeks.length}</b></div>
    </div>
  </section>`;

  // Hoy
  html += `<div class="section-title">Hoy</div>`;
  html += todayCard(today);

  // Discrepancia con el último control oficial
  const controls = L.items.filter((i) => i.kind === 'control');
  if (controls.length) {
    const last = controls[controls.length - 1];
    const gap = last.gap;
    html += `<div class="section-title">Último control oficial</div>
    <div class="alert ${gap === 0 ? 'info' : 'warn'}">${ico(gap === 0 ? 'shield' : 'alert')}<div>
      <b>${fmtNum(last.date)} · Empresa: ${fmtDur(last.official, true)} · Mi registro: ${fmtDur(last.app, true)}</b>
      ${gap === 0 ? 'Coincide con tu registro.' : `Diferencia de <b style="display:inline">${fmtDur(Math.abs(gap))}</b> ${gap < 0 ? 'en tu contra: la empresa te computa menos horas de las que has registrado.' : 'a tu favor según la empresa.'}`}
    </div></div>`;
  }

  // Avisos legales recientes (últimos 30 días)
  const recent = legalAlerts().filter((a) => a.date >= addDays(today, -30) && a.date <= addDays(today, 7));
  if (recent.length) {
    html += `<div class="section-title">Avisos</div>`;
    html += recent.slice(-3).map((a) => `<div class="alert neg">${ico('alert')}<div>${esc(a.text)}</div></div>`).join('');
  }

  // Acciones rápidas
  html += `<div class="section-title">Acciones</div>
  <div class="quick">
    <button data-act="newWeek"><span class="qi v">${ico('cal')}</span>Nueva semana</button>
    <button data-act="newMov"><span class="qi t">${ico('clock')}</span>Cargo de horas</button>
    <button data-act="fullPdf"><span class="qi a">${ico('file')}</span>Informe PDF</button>
  </div>`;

  // Recordatorio de copia de seguridad
  const lb = S.settings.lastBackup;
  if (S.weeks.length && (!lb || (Date.now() - new Date(lb)) > 14 * 864e5)) {
    html += `<div style="height:12px"></div><div class="alert info">${ico('download')}<div><b>Haz una copia de seguridad</b>Tus datos solo viven en este móvil. ${lb ? `Última copia: ${fmtTs(lb)}.` : 'Aún no has hecho ninguna.'} <button class="link-btn" data-act="exportJson">Descargar copia →</button></div></div>`;
  }
  return html;
};

function sparkline(items) {
  const pts = items.filter((i) => i.kind !== 'control').map((i) => i.bal);
  if (pts.length < 2) return '';
  const data = [0, ...pts].slice(-16);
  const W = 300, H = 56, min = Math.min(0, ...data), max = Math.max(0, ...data), span = max - min || 1;
  const x = (i) => (i / (data.length - 1)) * W;
  const y = (v) => H - 4 - ((v - min) / span) * (H - 8);
  const path = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${path} L${W},${H} L0,${H} Z`;
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:56px;stroke-width:0">
    <defs><linearGradient id="sg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#8b7cf6" stop-opacity=".35"/><stop offset="1" stop-color="#8b7cf6" stop-opacity="0"/></linearGradient>
    <linearGradient id="sl" x1="0" x2="1"><stop offset="0" stop-color="#8b7cf6"/><stop offset="1" stop-color="#2dd4bf"/></linearGradient></defs>
    <line x1="0" x2="${W}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}" stroke="rgba(255,255,255,.12)" stroke-width="1" stroke-dasharray="3 4" vector-effect="non-scaling-stroke"/>
    <path d="${area}" fill="url(#sg)"/>
    <path d="${path}" fill="none" stroke="url(#sl)" stroke-width="2.4" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
}

function todayCard(today) {
  const f = findDay(today);
  const d = parseISO(today);
  const badge = `<div class="today-badge"><b>${d.getDate()}</b><span>${DAYS_SHORT[weekdayIdx(today)]}</span></div>`;
  if (!f) {
    return `<div class="card"><div class="today">${badge}<div class="today-body">
      <div class="kicker">Sin horario</div><div class="main">Semana no registrada</div>
      <div class="sub">Añade el horario de esta semana para ver tus turnos.</div>
      <button class="btn sm primary" style="margin-top:10px" data-act="newWeek">${ico('plus')} Añadir semana</button>
    </div></div></div>`;
  }
  const { week, day } = f;
  const t = TYPES[day.type];
  const now = new Date();
  let main, sub = '', extra = '';
  if (day.type === 'trabajo') {
    main = dayTimes(day) || 'Sin horario';
    sub = `${fmtDur(dayWorked(day))} de trabajo${day.descanso ? ` · ${day.descanso} min descanso` : ''}`;
  } else {
    main = t.long;
  }
  const next = allShifts().find((s) => s.end > now);
  if (next) {
    if (next.start <= now) extra = `<span class="countdown">En turno hasta las ${next.t.out}</span>`;
    else {
      const mins = Math.round((next.start - now) / 60000);
      const when = next.date === today ? 'Entras' : `Próximo turno ${fmtShort(next.date)} ${next.t.in} ·`;
      extra = `<span class="countdown">${when} en ${mins >= 1440 ? Math.floor(mins / 1440) + 'd ' + fmtDur(mins % 1440) : fmtDur(mins)}</span>`;
    }
  }
  if (day.nota) sub += `${sub ? ' · ' : ''}${esc(day.nota)}`;

  // progreso de la semana
  const ws = weekStats(week);
  let done = 0;
  week.days.forEach((dd, i) => { if (addDays(week.start, i) < today) done += dayWorked(dd) + dayCredit(dd, week.jornadaMin); });
  const pct = Math.min(100, week.jornadaMin ? (done / week.jornadaMin) * 100 : 0);

  return `<a class="card tap" href="#/semana/${week.id}" style="display:block;color:inherit;text-decoration:none">
    <div class="today">${badge}<div class="today-body">
      <div class="kicker ${t.cls}" style="color:var(--c)">${t.label}</div>
      <div class="main num">${esc(main)}</div>
      ${sub ? `<div class="sub">${sub}</div>` : ''}
      ${extra}
    </div></div>
    <div style="margin-top:14px;display:flex;justify-content:space-between;font-size:12.5px;color:var(--muted)">
      <span>Semana: <b class="num" style="color:var(--text)">${fmtDur(done)}</b> de ${fmtDur(week.jornadaMin)}</span>
      <span>Plan: <b class="num ${cls(ws.diff)}">${fmtDur(ws.diff, true)}</b></span>
    </div>
    <div class="progress"><i style="width:${pct.toFixed(1)}%"></i></div>
  </a>`;
}

VIEWS.semanas = () => {
  const ws = sortedWeeks(true);
  if (!ws.length) {
    return `<div class="empty"><div class="em-ic">${ico('cal')}</div><h3>Sin semanas todavía</h3>
      <p>Añade cada semana el horario que te dan y la jornada. Así tendrás tu propio registro.</p>
      <button class="btn primary" data-act="newWeek">${ico('plus')} Añadir primera semana</button></div>`;
  }
  const today = todayISO();
  const L = ledger();
  const balAt = {};
  L.items.forEach((i) => { if (i.kind === 'semana') balAt[i.week.id] = i.bal; });
  return ws.map((w) => {
    const st = weekStats(w);
    const isCur = w.start <= today && weekEnd(w) >= today;
    const isFut = w.start > today;
    return `<a class="card tap week-card" href="#/semana/${w.id}" style="color:inherit;text-decoration:none">
      <div class="week-head">
        <div><div class="week-range">${fmtRange(w.start)}${isCur ? '<span class="badge teal">En curso</span>' : isFut ? '<span class="badge">Próxima</span>' : ''}</div>
          <div class="week-sub num">Jornada ${fmtDur(w.jornadaMin)} · Computadas ${fmtDur(st.total)}${st.movSum ? ` · Mov. ${fmtDur(st.movSum, true)}` : ''}</div></div>
        <div class="week-diff num ${cls(st.diff)}">${fmtDur(st.diff, true)}<small>Saldo ${fmtDur(balAt[w.id], true)}</small></div>
      </div>
      <div class="strip">${w.days.map((d, i) => {
        const date = addDays(w.start, i);
        const t = TYPES[d.type];
        const v = d.type === 'trabajo' ? (dayWorked(d) ? (dayWorked(d) / 60).toFixed(1).replace('.0', '').replace('.', ',') : '–') : t.abbr;
        return `<div class="d ${t.cls} ${date === today ? 'today' : ''}"><b>${DAYS_LETTER[i]}</b><span class="num">${v}</span></div>`;
      }).join('')}</div>
    </a>`;
  }).join('');
};

VIEWS.semana = (id) => {
  const w = S.weeks.find((x) => x.id === id);
  if (!w) return `<div class="empty"><h3>Semana no encontrada</h3><p><a href="#/semanas" class="link-btn">Volver a semanas</a></p></div>`;
  const st = weekStats(w);
  const L = ledger();
  const it = L.items.find((i) => i.kind === 'semana' && i.week.id === id);
  const balAfter = it ? it.bal : 0;
  const today = todayISO();
  const alerts = legalAlerts().filter((a) => a.date >= w.start && a.date <= weekEnd(w));
  const controls = L.items.filter((i) => i.kind === 'control' && i.date >= w.start && i.date <= weekEnd(w));

  let html = `<div style="margin:2px 2px 14px"><div style="font-size:24px;font-weight:800;letter-spacing:-.02em">${fmtRange(w.start)}</div>
    <div class="muted small">Del ${fmtNum(w.start)} al ${fmtNum(weekEnd(w))}</div></div>
  <div class="stats">
    <div class="stat"><small>Jornada semanal</small><b class="num">${fmtDur(w.jornadaMin)}</b></div>
    <div class="stat"><small>Horas computadas</small><b class="num">${fmtDur(st.total)}</b>${st.credited ? `<div class="muted small num">${fmtDur(st.worked)} trab. + ${fmtDur(st.credited)} aus.</div>` : ''}</div>
    <div class="stat"><small>Diferencia semana</small><b class="num ${cls(st.diff)}">${fmtDur(st.diff, true)}</b></div>
    <div class="stat"><small>Movimientos</small><b class="num ${cls(st.movSum)}">${fmtDur(st.movSum, true)}</b></div>
    <div class="stat wide"><div><small>Saldo acumulado al cierre</small><span class="muted small num">${fmtDec(balAfter)}</span></div><b class="num ${cls(balAfter)}">${fmtDur(balAfter, true)}</b></div>
  </div>`;

  html += alerts.map((a) => `<div style="height:12px"></div><div class="alert neg">${ico('alert')}<div>${esc(a.text)}</div></div>`).join('');

  html += `<div class="section-title">Días</div><div class="card">${w.days.map((d, i) => {
    const date = addDays(w.start, i);
    const t = TYPES[d.type];
    const worked = dayWorked(d), credit = dayCredit(d, w.jornadaMin);
    return `<div class="day-row ${date === today ? 'is-today' : ''}">
      <div class="day-dot"><b>${DAYS_SHORT[i]}</b><span class="num">${parseISO(date).getDate()}</span></div>
      <div class="day-info"><span class="day-type ${t.cls}">${t.long}</span>
        ${d.type === 'trabajo' ? `<div class="day-times num">${dayTimes(d) || '<span class="muted">Sin horario</span>'}${d.descanso ? `<span class="muted small"> · ${d.descanso}m desc.</span>` : ''}</div>` : ''}
        ${d.nota ? `<div class="day-note">${esc(d.nota)}</div>` : ''}
      </div>
      <div class="day-hours num">${worked ? fmtDur(worked) : credit ? `<span class="muted">${fmtDur(credit)}</span>` : '<span class="muted">—</span>'}</div>
    </div>`;
  }).join('')}</div>`;

  if (st.movs.length || controls.length) {
    html += `<div class="section-title">Movimientos de la semana</div><div class="card">${[...st.movs.map((m) => movRow(m)), ...controls.map((c) => controlRow(c))].join('')}</div>`;
  }

  if (w.comment) html += `<div class="section-title">Comentario</div><div class="card" style="white-space:pre-wrap;color:var(--text-2)">${esc(w.comment)}</div>`;

  html += `<div class="actions">
    <button class="btn primary" data-act="weekPdf" data-id="${w.id}">${ico('file')} PDF semana</button>
    <button class="btn" data-act="editWeek" data-id="${w.id}">${ico('edit')} Editar</button>
    <button class="btn" data-act="weekPdfShare" data-id="${w.id}">${ico('share')} Compartir</button>
    <button class="btn" data-act="weekIcs" data-id="${w.id}">${ico('bell')} Recordatorios</button>
  </div>
  <button class="btn danger block" style="margin-top:10px" data-act="delWeek" data-id="${w.id}">${ico('trash')} Eliminar semana</button>
  <p class="muted small" style="text-align:center;margin-top:14px">Creada ${fmtTs(w.createdAt)}${w.updatedAt && w.updatedAt !== w.createdAt ? ` · Última edición ${fmtTs(w.updatedAt)}` : ''}</p>`;
  return html;
};

function movRow(m) {
  const k = MOV_KINDS[m.kind];
  const d = movDelta(m);
  return `<button class="ledger-item" style="width:100%;text-align:left" data-act="editMov" data-id="${m.id}">
    <span class="li-icon ${d >= 0 ? 'p' : 'n'}">${ico(d >= 0 ? 'up' : 'down')}</span>
    <span class="li-body"><span class="li-title" style="display:block">${esc(m.concepto || k.label)}</span><span class="li-sub">${fmtShort(m.date)} · ${k.short}${m.nota ? ' · ' + esc(m.nota) : ''}</span></span>
    <span class="li-amt"><b class="num ${cls(d)}">${fmtDur(d, true)}</b></span>
  </button>`;
}
function controlRow(it) {
  const m = it.mov;
  return `<button class="ledger-item" style="width:100%;text-align:left" data-act="editMov" data-id="${m.id}">
    <span class="li-icon c">${ico('flag')}</span>
    <span class="li-body"><span class="li-title" style="display:block">${esc(m.concepto || 'Control oficial')}</span><span class="li-sub num">${fmtShort(m.date)} · Empresa ${fmtDur(it.official, true)} · Yo ${fmtDur(it.app, true)}</span></span>
    <span class="li-amt"><b class="num ${it.gap === 0 ? 'zero' : 'neg'}" style="${it.gap === 0 ? '' : 'color:var(--warn)'}">${it.gap === 0 ? '✓' : 'Δ ' + fmtDur(it.gap, true)}</b><small>diferencia</small></span>
  </button>`;
}

VIEWS.flujo = () => {
  const L = ledger();
  if (!L.items.length) {
    return `<div class="empty"><div class="em-ic">${ico('clock')}</div><h3>Aún no hay movimientos</h3>
      <p>Aquí verás cómo evoluciona tu bolsa de horas: semanas, cargos (cursos, salidas antes…) y controles de la empresa.</p>
      <button class="btn primary" data-act="newMov">${ico('plus')} Añadir cargo de horas</button></div>`;
  }
  let fav = 0, con = 0;
  S.movs.forEach((m) => { const d = movDelta(m); if (d > 0) fav += d; else con += d; });
  let wPos = 0, wNeg = 0;
  S.weeks.forEach((w) => { const d = weekStats(w).diff; if (d > 0) wPos += d; else wNeg += d; });

  let html = `<div class="stats">
    <div class="stat wide"><div><small>Saldo actual</small><span class="muted small num">${fmtDec(L.current)}</span></div><b class="num ${cls(L.current)}">${fmtDur(L.current, true)}</b></div>
    <div class="stat"><small>Semanas (H+ / H−)</small><b class="num"><span class="pos">${fmtDur(wPos, true)}</span> <span class="neg" style="font-size:15px">${fmtDur(wNeg, true)}</span></b></div>
    <div class="stat"><small>Cargos (H+ / H−)</small><b class="num"><span class="pos">${fmtDur(fav, true)}</span> <span class="neg" style="font-size:15px">${fmtDur(con, true)}</span></b></div>
  </div>
  <div class="section-title">Historial <button data-act="newMov">+ Añadir</button></div>
  <div class="card">`;
  html += [...L.items].reverse().map((it) => {
    if (it.kind === 'control') return controlRow(it);
    if (it.kind === 'mov') return movRow(it.mov).replace('</b></span>', `</b><small class="num">saldo ${fmtDur(it.bal, true)}</small></span>`);
    if (it.kind === 'inicial') {
      return `<button class="ledger-item" style="width:100%;text-align:left" data-act="settings">
        <span class="li-icon i">${ico('flag')}</span>
        <span class="li-body"><span class="li-title" style="display:block">Saldo inicial</span><span class="li-sub">${it.date.startsWith('0000') ? 'Sin fecha' : fmtShort(it.date)}${S.settings.saldoInicialNota ? ' · ' + esc(S.settings.saldoInicialNota) : ''}</span></span>
        <span class="li-amt"><b class="num ${cls(it.delta)}">${fmtDur(it.delta, true)}</b><small class="num">saldo ${fmtDur(it.bal, true)}</small></span></button>`;
    }
    const w = it.week;
    return `<a class="ledger-item" style="color:inherit;text-decoration:none" href="#/semana/${w.id}">
      <span class="li-icon w">${ico('cal')}</span>
      <span class="li-body"><span class="li-title" style="display:block">Semana ${fmtRange(w.start)}</span><span class="li-sub num">${fmtDur(it.stats.total)} de ${fmtDur(w.jornadaMin)}${it.closed ? '' : ' · en curso'}</span></span>
      <span class="li-amt"><b class="num ${cls(it.delta)}">${fmtDur(it.delta, true)}</b><small class="num">saldo ${fmtDur(it.bal, true)}</small></span></a>`;
  }).join('');
  html += `</div>`;
  return html;
};

VIEWS.perfil = () => {
  const p = S.profile;
  const initials = (p.nombre || '?').trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toUpperCase();
  const row = (k, v) => v ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : '';
  const st = S.settings;
  return `
  <div class="card">
    <div class="profile-head"><div class="avatar">${esc(initials)}</div>
      <div style="flex:1;min-width:0"><h2>${esc(p.nombre || 'Sin nombre')}</h2><p>${esc([p.puesto, p.empresa].filter(Boolean).join(' · ') || 'Completa tus datos')}</p></div>
      <button class="icon-btn" data-act="editProfile" aria-label="Editar perfil">${ico('edit')}</button></div>
    <dl class="kv">${row('DNI / NIE', p.dni)}${row('Nº Seg. Social', p.nss)}${row('Nº empleado', p.numEmpleado)}${row('Teléfono', p.telefono)}${row('Email', p.email)}${row('Empresa', p.empresa)}${row('CIF', p.cif)}${row('Centro', p.centro)}${row('Encargado', p.encargado)}${row('Fecha de alta', p.fechaAlta ? fmtNum(p.fechaAlta) : '')}${row('Convenio', p.convenio)}</dl>
  </div>

  <div class="section-title">Informes</div>
  <div class="card menu" style="padding:0">
    ${menuItem('fullPdf', 'file', 'Informe completo (PDF)', 'Todo el registro con resumen, semanas, cargos y cambios')}
    ${menuItem('fullPdfShare', 'share', 'Compartir informe completo', 'Enviar por WhatsApp, email…')}
    ${menuItem('goHistory', 'history', 'Historial de cambios', `${S.log.length} registros · no se puede borrar`)}
  </div>

  <div class="section-title">Ajustes</div>
  <div class="card menu" style="padding:0">
    ${menuItem('settings', 'gear', 'Cálculo de horas', `${st.diasLab} días laborables · saldo inicial ${fmtDur(st.saldoInicial, true)}`)}
  </div>

  <div class="section-title">Tus datos</div>
  <div class="card menu" style="padding:0">
    ${menuItem('exportJson', 'download', 'Descargar copia de seguridad', st.lastBackup ? `Última: ${fmtTs(st.lastBackup)}` : 'Nunca · recomendado cada semana')}
    ${menuItem('importJson', 'upload', 'Restaurar copia', 'Recuperar datos desde un archivo .json')}
    ${menuItem('wipe', 'trash', 'Borrar todos los datos', 'No se puede deshacer', 'danger')}
  </div>
  <p class="muted small" style="text-align:center;margin-top:18px">Mis Horas · tus datos se guardan solo en este dispositivo.</p>`;
};
function menuItem(act, icon, title, sub, extra = '') {
  return `<button class="menu-item ${extra}" data-act="${act}"><span class="mi-ic">${ico(icon)}</span><div><b>${title}</b><small>${esc(sub)}</small></div><svg class="chev" viewBox="0 0 24 24">${ICON.chev}</svg></button>`;
}

VIEWS.historial = () => {
  if (!S.log.length) return `<div class="empty"><div class="em-ic">${ico('history')}</div><h3>Sin cambios aún</h3><p>Cada vez que crees, edites o borres algo quedará anotado aquí con fecha y hora.</p></div>`;
  return `<div class="alert info">${ico('shield')}<div>Este historial se genera automáticamente y no se puede editar. Sirve como prueba de cuándo anotaste y modificaste cada dato.</div></div>
  <div style="height:12px"></div>
  <div class="card">${[...S.log].reverse().map((l) => `<div class="log-item"><div class="lt num">${fmtTs(l.ts)} · ${esc(l.action)} ${esc(l.kind)}${l.ref ? ' · ' + esc(l.ref) : ''}</div>${l.detail ? `<div class="ld">${esc(l.detail)}</div>` : ''}</div>`).join('')}</div>`;
};

/* ---------- Editor de semana ---------- */
function blankDay() { return { type: 'trabajo', tramos: [{ in: '', out: '' }], descanso: 0, nota: '' }; }
function suggestStart() {
  const cur = mondayOf(todayISO());
  if (!S.weeks.some((w) => w.start === cur)) return cur;
  let s = cur;
  while (S.weeks.some((w) => w.start === s)) s = addDays(s, 7);
  return s;
}
function recentJornadas() {
  const seen = [];
  sortedWeeks(true).forEach((w) => { if (!seen.includes(w.jornadaMin)) seen.push(w.jornadaMin); });
  return seen.slice(0, 4);
}

function openWeekEditor(id) {
  const orig = id ? S.weeks.find((w) => w.id === id) : null;
  const draft = orig ? JSON.parse(JSON.stringify(orig)) : { id: null, start: suggestStart(), jornadaMin: null, comment: '', days: Array.from({ length: 7 }, blankDay) };
  draft.days.forEach((d) => { if (!d.tramos || !d.tramos.length) d.tramos = [{ in: '', out: '' }]; });
  const recents = recentJornadas();

  const body = `
    <div class="jornada-card">
      <div class="jc-title">¿De cuántas horas es tu jornada esta semana?</div>
      <div class="jc-sub">La que te marca la empresa para esta semana. Se usa para calcular tus H+ / H−.</div>
      <div class="jc-input"><input id="wj" inputmode="decimal" autocomplete="off" placeholder="40" value="${hoursText(draft.jornadaMin)}"><span>horas</span></div>
      ${recents.length ? `<div class="chips">${recents.map((r) => `<button type="button" class="chip" data-s="jr" data-v="${r}">${fmtDur(r)}</button>`).join('')}</div>` : ''}
    </div>
    <label class="field"><span>Semana que empieza el lunes</span><input type="date" id="ws" value="${draft.start}"></label>
    <div class="hint muted small" id="wrange" style="margin:-8px 2px 12px"></div>
    ${!orig && S.weeks.length ? `<button type="button" class="btn sm" data-s="copyPrev" style="margin-bottom:14px">${ico('copy')} Copiar horario de la semana anterior</button>` : ''}
    <div id="wdays"></div>
    <label class="field" style="margin-top:6px"><span>Comentario de la semana (aparece en el PDF)</span><textarea id="wc" placeholder="Ej.: El lunes me hicieron quedarme 1 h más; el horario de la foto no coincide con el del restaurante…">${esc(draft.comment)}</textarea></label>`;
  const footer = `<div class="foot-sum"><span>Computadas <b class="num" id="fTot">0h</b></span><span>Jornada <b class="num" id="fJor">—</b></span><span>Dif. <b class="num" id="fDif">—</b></span></div>
    <button class="btn primary block" data-s="saveWeek">${orig ? 'Guardar cambios' : 'Guardar semana'}</button>`;

  openSheet(orig ? 'Editar semana' : 'Nueva semana', body, footer, (wrap) => {
    const daysEl = $('#wdays', wrap);
    const renderDay = (i) => {
      const d = draft.days[i];
      const date = addDays(draft.start, i);
      const credit = dayCredit(d, draft.jornadaMin || 0);
      return `<div class="day-card" data-i="${i}">
        <div class="dc-head"><div><b>${DAYS[i]}</b><span>${fmtDayMonth(date)}</span></div><div class="dc-total num" data-tot="${i}">${d.type === 'trabajo' ? fmtDur(dayWorked(d)) : credit ? fmtDur(credit) : '—'}</div></div>
        <div class="type-chips">${TYPE_ORDER.map((t) => `<button type="button" class="tchip ${TYPES[t].cls} ${d.type === t ? 'on' : ''}" data-s="type" data-i="${i}" data-t="${t}">${TYPES[t].label}</button>`).join('')}</div>
        ${d.type === 'trabajo' ? `
          ${d.tramos.map((t, j) => `<div class="tramo">
            <input type="time" value="${t.in || ''}" data-f="in" data-i="${i}" data-j="${j}" aria-label="Entrada">
            <span class="arrow">→</span>
            <input type="time" value="${t.out || ''}" data-f="out" data-i="${i}" data-j="${j}" aria-label="Salida">
            ${d.tramos.length > 1 ? `<button type="button" class="icon-btn" data-s="delTramo" data-i="${i}" data-j="${j}" aria-label="Quitar tramo">${ico('close')}</button>` : ''}
          </div>`).join('')}
          <div class="dc-row">
            <button type="button" class="link-btn" data-s="addTramo" data-i="${i}">+ Turno partido</button>
            <label class="mini-field">Descanso <input type="number" min="0" step="5" inputmode="numeric" value="${d.descanso || ''}" placeholder="0" data-f="descanso" data-i="${i}"> min</label>
          </div>` : CREDIT_TYPES.includes(d.type) && S.settings.computan[d.type]
            ? `<div class="dc-credit">Computa como jornada cumplida: ${draft.jornadaMin ? fmtDur(credit) : 'jornada ÷ ' + S.settings.diasLab} (jornada ÷ ${S.settings.diasLab} días).</div>` : ''}
        <input class="dc-nota" placeholder="Nota del día (opcional)" value="${esc(d.nota || '')}" data-f="nota" data-i="${i}">
      </div>`;
    };
    const renderAll = () => { daysEl.innerHTML = draft.days.map((_, i) => renderDay(i)).join(''); updateTotals(); };
    const rerenderDay = (i) => { const el = $(`.day-card[data-i="${i}"]`, daysEl); el.outerHTML = renderDay(i); updateTotals(); };
    const updateTotals = () => {
      let tot = 0;
      draft.days.forEach((d, i) => {
        const v = d.type === 'trabajo' ? dayWorked(d) : dayCredit(d, draft.jornadaMin || 0);
        tot += v;
        const el = $(`[data-tot="${i}"]`, wrap);
        if (el) el.textContent = v ? fmtDur(v) : '—';
      });
      $('#fTot', wrap).textContent = fmtDur(tot);
      $('#fJor', wrap).textContent = draft.jornadaMin != null ? fmtDur(draft.jornadaMin) : '—';
      const dif = draft.jornadaMin != null ? tot - draft.jornadaMin : null;
      const fd = $('#fDif', wrap);
      fd.textContent = dif == null ? '—' : fmtDur(dif, true);
      fd.className = 'num ' + (dif == null ? '' : cls(dif));
      $('#wrange', wrap).textContent = `Del ${fmtShort(draft.start)} al ${fmtShort(addDays(draft.start, 6))}`;
    };
    renderAll();
    if (!orig) setTimeout(() => $('#wj', wrap).focus(), 300);

    $('#wj', wrap).addEventListener('input', (e) => {
      draft.jornadaMin = parseHours(e.target.value);
      e.target.classList.remove('invalid');
      $$('.chip', wrap).forEach((c) => c.classList.toggle('on', Number(c.dataset.v) === draft.jornadaMin));
      draft.days.forEach((d, i) => { if (CREDIT_TYPES.includes(d.type)) rerenderDay(i); });
      updateTotals();
    });
    $('#ws', wrap).addEventListener('change', (e) => {
      if (!e.target.value) return;
      const m = mondayOf(e.target.value);
      if (m !== e.target.value) { e.target.value = m; toast('Ajustado al lunes de esa semana'); }
      draft.start = m;
      renderAll();
    });
    $('#wc', wrap).addEventListener('input', (e) => { draft.comment = e.target.value; });

    wrap.addEventListener('input', (e) => {
      const f = e.target.dataset.f;
      if (!f) return;
      const i = Number(e.target.dataset.i);
      const d = draft.days[i];
      if (f === 'in' || f === 'out') d.tramos[Number(e.target.dataset.j)][f] = e.target.value;
      else if (f === 'descanso') d.descanso = Math.max(0, parseInt(e.target.value, 10) || 0);
      else if (f === 'nota') d.nota = e.target.value;
      updateTotals();
    });

    wrap.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-s]');
      if (!b) return;
      const s = b.dataset.s, i = Number(b.dataset.i);
      if (s === 'jr') {
        draft.jornadaMin = Number(b.dataset.v);
        $('#wj', wrap).value = hoursText(draft.jornadaMin);
        $('#wj', wrap).classList.remove('invalid');
        $$('.chip', wrap).forEach((c) => c.classList.toggle('on', c === b));
        draft.days.forEach((d, k) => { if (CREDIT_TYPES.includes(d.type)) rerenderDay(k); });
        updateTotals();
      } else if (s === 'type') {
        draft.days[i].type = b.dataset.t;
        rerenderDay(i);
      } else if (s === 'addTramo') {
        draft.days[i].tramos.push({ in: '', out: '' });
        rerenderDay(i);
      } else if (s === 'delTramo') {
        draft.days[i].tramos.splice(Number(b.dataset.j), 1);
        rerenderDay(i);
      } else if (s === 'copyPrev') {
        const prev = sortedWeeks(true).find((w) => w.start < draft.start) || sortedWeeks(true)[0];
        if (!prev) return;
        draft.days = prev.days.map((d) => ({ type: d.type, tramos: (d.tramos && d.tramos.length ? d.tramos : [{ in: '', out: '' }]).map((t) => ({ ...t })), descanso: d.descanso || 0, nota: '' }));
        renderAll();
        toast(`Copiado de la semana ${fmtRange(prev.start)}`);
      } else if (s === 'saveWeek') {
        await saveWeek(draft, orig, wrap);
      }
    });
  });
}

function describeDay(d) {
  if (d.type !== 'trabajo') return TYPES[d.type].long;
  const t = (d.tramos || []).filter(validTramo).map((x) => `${x.in}-${x.out}`).join(' y ') || 'sin horario';
  return t + (d.descanso ? ` (desc. ${d.descanso} min)` : '');
}

async function saveWeek(draft, orig, wrap) {
  if (draft.jornadaMin == null) {
    const inp = $('#wj', wrap);
    inp.classList.add('invalid');
    inp.focus();
    inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast('Indica de cuántas horas es la jornada de esta semana', 'error');
    return;
  }
  if (S.weeks.some((w) => w.start === draft.start && (!orig || w.id !== orig.id))) {
    toast('Ya existe una semana que empieza ese lunes', 'error');
    return;
  }
  const clean = JSON.parse(JSON.stringify(draft));
  clean.days.forEach((d) => {
    d.tramos = d.type === 'trabajo' ? d.tramos.filter(validTramo) : [];
    if (d.type !== 'trabajo') d.descanso = 0;
    d.nota = (d.nota || '').trim();
  });
  const emptyWork = clean.days.filter((d) => d.type === 'trabajo' && !d.tramos.length).length;
  if (emptyWork) {
    const ok = await confirmBox('Días sin horario', `Hay ${emptyWork} día(s) marcados como Trabajo sin horas. Computarán 0 h. ¿Guardar igualmente?`, 'Guardar');
    if (!ok) return;
  }
  const now = new Date().toISOString();
  if (orig) {
    const changes = [];
    if (orig.start !== clean.start) changes.push(`Inicio: ${fmtNum(orig.start)} -> ${fmtNum(clean.start)}`);
    if (orig.jornadaMin !== clean.jornadaMin) changes.push(`Jornada: ${fmtDur(orig.jornadaMin)} -> ${fmtDur(clean.jornadaMin)}`);
    clean.days.forEach((d, i) => {
      const a = describeDay(orig.days[i]), b = describeDay(d);
      const date = fmtNum(addDays(clean.start, i));
      if (a !== b) changes.push(`${DAYS_SHORT[i]} ${date}: ${a} -> ${b}`);
      if ((orig.days[i].nota || '') !== d.nota) changes.push(`${DAYS_SHORT[i]} ${date}: nota "${orig.days[i].nota || ''}" -> "${d.nota}"`);
    });
    if ((orig.comment || '') !== (clean.comment || '')) changes.push('Comentario de la semana modificado');
    if (!changes.length) { closeSheet(); return; }
    Object.assign(orig, clean, { updatedAt: now });
    logEv('Editada', 'semana', fmtRange(clean.start), changes.join('\n'));
    toast('Semana actualizada');
  } else {
    clean.id = uid();
    clean.createdAt = now;
    clean.updatedAt = now;
    S.weeks.push(clean);
    logEv('Creada', 'semana', fmtRange(clean.start), `Jornada ${fmtDur(clean.jornadaMin)}\n` + clean.days.map((d, i) => `${DAYS_SHORT[i]} ${fmtNum(addDays(clean.start, i))}: ${describeDay(d)}${d.nota ? ' - ' + d.nota : ''}`).join('\n'));
    toast('Semana guardada');
  }
  save();
  closeSheet();
  go(`#/semana/${orig ? orig.id : clean.id}`);
}

/* ---------- Editor de movimientos ---------- */
function openMovEditor(id, presetKind) {
  const orig = id ? S.movs.find((m) => m.id === id) : null;
  const draft = orig ? { ...orig } : { kind: presetKind || 'favor', date: todayISO(), minutes: 0, officialSign: -1, concepto: '', nota: '' };
  if (draft.officialSign == null) draft.officialSign = -1;

  const body = `
    <div class="seg" id="mk">
      <button type="button" data-k="favor" class="${draft.kind === 'favor' ? 'on pos' : ''}">H+ a favor</button>
      <button type="button" data-k="contra" class="${draft.kind === 'contra' ? 'on neg' : ''}">H− en contra</button>
      <button type="button" data-k="control" class="${draft.kind === 'control' ? 'on warn' : ''}">Control</button>
    </div>
    <p class="muted small" id="mkHelp" style="margin:-4px 2px 14px"></p>
    <label class="field"><span>Fecha</span><input type="date" id="md" value="${draft.date}"></label>
    <div id="signWrap" class="seg" style="display:none">
      <button type="button" data-sg="1" class="${draft.officialSign === 1 ? 'on pos' : ''}">Positivo (+)</button>
      <button type="button" data-sg="-1" class="${draft.officialSign === -1 ? 'on neg' : ''}">Negativo (−)</button>
    </div>
    <div class="field"><span id="amtLabel">Cantidad</span>
      <div class="hm"><label><input id="mh" inputmode="numeric" placeholder="0" value="${draft.minutes ? Math.floor(draft.minutes / 60) : ''}"><em>h</em></label>
      <label><input id="mm" inputmode="numeric" placeholder="0" value="${draft.minutes ? draft.minutes % 60 : ''}"><em>min</em></label></div>
      <div class="hint">También puedes escribir decimales en horas: 2,5 h = 2 h 30 min.</div>
    </div>
    <div id="cmp"></div>
    <label class="field"><span>Concepto</span><input id="mc" value="${esc(draft.concepto)}" placeholder="Ej.: Curso de formación en casa"></label>
    <div class="chips" id="presets" style="margin:-6px 0 14px"></div>
    <label class="field"><span>Nota / prueba (quién, dónde, cómo)</span><textarea id="mn" placeholder="Ej.: Se lo pregunté a [encargado] y lo vimos en el ordenador de la oficina a las 16:10.">${esc(draft.nota)}</textarea></label>`;
  const footer = `<div style="display:flex;gap:10px">${orig ? `<button class="btn danger" data-s="delMov" aria-label="Eliminar">${ico('trash')}</button>` : ''}<button class="btn primary block" style="flex:1" data-s="saveMov">${orig ? 'Guardar cambios' : 'Guardar'}</button></div>`;

  openSheet(orig ? 'Editar movimiento' : 'Cargo de horas', body, footer, (wrap) => {
    const help = {
      favor: 'Horas que te deben: cursos hechos en casa, te quedaste más, entraste antes… Se suman a tu bolsa.',
      contra: 'Horas que debes: te mandaron salir antes, entraste más tarde, te devolvieron horas… Se restan de tu bolsa.',
      control: 'Anota el saldo que te dice la empresa (encargado, ordenador…). No cambia tu saldo: lo compara con tu registro para detectar errores.'
    };
    const readMinutes = () => {
      const hTxt = $('#mh', wrap).value.trim().replace(',', '.');
      const mTxt = $('#mm', wrap).value.trim();
      const h = parseFloat(hTxt) || 0;
      const m = parseInt(mTxt, 10) || 0;
      return Math.round(h * 60) + m;
    };
    const refresh = () => {
      $$('#mk button', wrap).forEach((b) => {
        const on = b.dataset.k === draft.kind;
        b.className = on ? `on ${b.dataset.k === 'favor' ? 'pos' : b.dataset.k === 'contra' ? 'neg' : 'warn'}` : '';
      });
      $('#mkHelp', wrap).textContent = help[draft.kind];
      $('#signWrap', wrap).style.display = draft.kind === 'control' ? '' : 'none';
      $$('#signWrap button', wrap).forEach((b) => { const on = Number(b.dataset.sg) === draft.officialSign; b.className = on ? `on ${draft.officialSign > 0 ? 'pos' : 'neg'}` : ''; });
      $('#amtLabel', wrap).textContent = draft.kind === 'control' ? 'Saldo que dice la empresa' : 'Cantidad de horas';
      $('#presets', wrap).innerHTML = MOV_PRESETS[draft.kind].map((p) => `<button type="button" class="chip" data-p="${esc(p)}">${esc(p)}</button>`).join('');
      compare();
    };
    const compare = () => {
      const el = $('#cmp', wrap);
      if (draft.kind !== 'control') { el.innerHTML = ''; return; }
      // saldo de mi registro a esa fecha (sin contar este control)
      const date = $('#md', wrap).value || todayISO();
      const L = ledger();
      let app = 0;
      L.items.forEach((it) => { if (it.kind !== 'control' && (it.date < date || (it.date === date && it.order <= 2))) app += it.delta; });
      const off = draft.officialSign * readMinutes();
      const gap = off - app;
      el.innerHTML = `<div class="compare" style="margin:-4px 0 14px">
        <div><span class="muted">Según la empresa</span><b class="num ${cls(off)}">${fmtDur(off, true)}</b></div>
        <div><span class="muted">Según mi registro (${fmtNum(date)})</span><b class="num ${cls(app)}">${fmtDur(app, true)}</b></div>
        <div style="border-top:1px solid var(--border);margin-top:4px;padding-top:7px"><span>Diferencia</span><b class="num" style="color:${gap === 0 ? 'var(--pos)' : 'var(--warn)'}">${gap === 0 ? 'Coincide ✓' : fmtDur(gap, true) + (gap < 0 ? ' en tu contra' : '')}</b></div>
      </div>`;
    };
    refresh();

    wrap.addEventListener('input', (e) => { if (['mh', 'mm', 'md'].includes(e.target.id)) compare(); });
    $('#md', wrap).addEventListener('change', compare);
    wrap.addEventListener('click', async (e) => {
      const k = e.target.closest('[data-k]');
      if (k) { draft.kind = k.dataset.k; refresh(); return; }
      const sg = e.target.closest('[data-sg]');
      if (sg) { draft.officialSign = Number(sg.dataset.sg); refresh(); return; }
      const p = e.target.closest('[data-p]');
      if (p) { $('#mc', wrap).value = p.dataset.p; return; }
      const b = e.target.closest('[data-s]');
      if (!b) return;
      if (b.dataset.s === 'delMov') {
        if (await confirmBox('Eliminar movimiento', 'Quedará anotado en el historial de cambios.', 'Eliminar', true)) {
          S.movs = S.movs.filter((m) => m.id !== orig.id);
          logEv('Eliminado', 'movimiento', fmtNum(orig.date), movText(orig));
          save(); closeSheet(); route(); toast('Movimiento eliminado');
        }
        return;
      }
      if (b.dataset.s === 'saveMov') {
        const minutes = readMinutes();
        const date = $('#md', wrap).value;
        if (!date) { toast('Indica la fecha', 'error'); return; }
        if (!minutes && draft.kind !== 'control') { toast('Indica la cantidad de horas', 'error'); return; }
        const data = { kind: draft.kind, date, minutes, officialSign: draft.officialSign, concepto: $('#mc', wrap).value.trim(), nota: $('#mn', wrap).value.trim() };
        const now = new Date().toISOString();
        if (orig) {
          const before = movText(orig);
          Object.assign(orig, data, { updatedAt: now });
          const after = movText(orig);
          if (before !== after) logEv('Editado', 'movimiento', fmtNum(date), `${before}\n-> ${after}`);
          toast('Movimiento actualizado');
        } else {
          const m = { id: uid(), ...data, createdAt: now, updatedAt: now };
          S.movs.push(m);
          logEv('Creado', 'movimiento', fmtNum(date), movText(m));
          toast(draft.kind === 'control' ? 'Control registrado' : 'Movimiento guardado');
        }
        save(); closeSheet(); route();
      }
    });
  });
}
function movText(m) {
  if (m.kind === 'control') return `Control oficial ${fmtNum(m.date)}: empresa indica ${fmtDur(m.officialSign * m.minutes, true)} · ${m.concepto || ''}${m.nota ? ' · ' + m.nota : ''}`;
  return `${MOV_KINDS[m.kind].short} ${fmtDur(movDelta(m), true)} el ${fmtNum(m.date)} · ${m.concepto || ''}${m.nota ? ' · ' + m.nota : ''}`;
}

/* ---------- Perfil y ajustes ---------- */
function openProfileEditor() {
  const p = S.profile;
  const f = (id, label, type = 'text', ph = '') => `<label class="field"><span>${label}</span><input id="p_${id}" type="${type}" value="${esc(p[id])}" placeholder="${ph}"></label>`;
  const body = `
    <div class="form-group-title">Trabajador</div>
    ${f('nombre', 'Nombre y apellidos', 'text', 'Tu nombre completo')}
    <div class="row2">${f('dni', 'DNI / NIE')}${f('nss', 'Nº Seg. Social')}</div>
    <div class="row2">${f('puesto', 'Puesto', 'text', 'Camarero, cocinero…')}${f('numEmpleado', 'Nº empleado')}</div>
    <div class="row2">${f('telefono', 'Teléfono', 'tel')}${f('email', 'Email', 'email')}</div>
    ${f('fechaAlta', 'Fecha de alta en la empresa', 'date')}
    <div class="form-group-title">Empresa</div>
    ${f('empresa', 'Empresa / razón social')}
    <div class="row2">${f('cif', 'CIF')}${f('encargado', 'Encargado/a')}</div>
    ${f('centro', 'Centro de trabajo', 'text', 'Nombre y dirección del restaurante')}
    ${f('convenio', 'Convenio colectivo', 'text', 'Ej.: Hostelería de la provincia')}`;
  openSheet('Mis datos', body, `<button class="btn primary block" data-s="saveP">Guardar</button>`, (wrap) => {
    wrap.addEventListener('click', (e) => {
      if (!e.target.closest('[data-s="saveP"]')) return;
      const changes = [];
      Object.keys(p).forEach((k) => {
        const el = $(`#p_${k}`, wrap);
        if (!el) return;
        const v = el.value.trim();
        if (v !== (p[k] || '')) { changes.push(`${k}: "${p[k] || ''}" -> "${v}"`); p[k] = v; }
      });
      if (changes.length) { logEv('Editado', 'perfil', '', changes.join('\n')); save(); }
      closeSheet(); route(); toast('Datos guardados');
    });
  });
}

function openSettings() {
  const st = S.settings;
  const sIni = st.saldoInicial || 0;
  const body = `
    <div class="form-group-title">Saldo inicial</div>
    <p class="muted small" style="margin:-4px 0 12px">Si ya tenías horas a favor o en contra antes de usar la app, ponlas aquí.</p>
    <div class="seg" id="sgIni"><button type="button" data-v="1" class="${sIni >= 0 ? 'on pos' : ''}">Positivo (+)</button><button type="button" data-v="-1" class="${sIni < 0 ? 'on neg' : ''}">Negativo (−)</button></div>
    <div class="hm field"><label><input id="sh" inputmode="decimal" placeholder="0" value="${sIni ? Math.floor(Math.abs(sIni) / 60) : ''}"><em>h</em></label><label><input id="sm" inputmode="numeric" placeholder="0" value="${sIni ? Math.abs(sIni) % 60 : ''}"><em>min</em></label></div>
    <div class="row2"><label class="field"><span>Fecha del saldo</span><input type="date" id="sf" value="${st.saldoInicialFecha}"></label>
    <label class="field"><span>Origen</span><input id="sn" value="${esc(st.saldoInicialNota)}" placeholder="Ej.: dicho por el encargado"></label></div>

    <div class="form-group-title">Cálculo</div>
    <label class="field"><span>Días laborables por semana</span><input type="number" id="sd" min="1" max="7" inputmode="numeric" value="${st.diasLab}">
    <div class="hint">Un día de vacaciones/festivo/baja computa la jornada semanal ÷ este número.</div></label>
    <div class="card" style="padding:4px 14px">
      ${['vacaciones', 'festivo', 'baja'].map((t) => `<div class="switch-row"><div><b style="font-weight:600">${TYPES[t].long}</b><div class="muted small">Cuenta como jornada cumplida</div></div><label class="switch"><input type="checkbox" data-c="${t}" ${st.computan[t] ? 'checked' : ''}><i></i></label></div>`).join('')}
    </div>
    <p class="muted small" style="margin:10px 2px 0">Libre, NL y Compensación computan 0 h. Un día de Compensación resta de tu bolsa (te devuelven horas).</p>

    <div class="form-group-title">Recordatorios</div>
    <label class="field"><span>Avisar antes de cada turno (minutos)</span><input type="number" id="sr" min="0" step="5" inputmode="numeric" value="${st.recordatorioMin}">
    <div class="hint">Se usa al exportar la semana a tu calendario del móvil.</div></label>`;
  openSheet('Cálculo de horas', body, `<button class="btn primary block" data-s="saveS">Guardar</button>`, (wrap) => {
    let sign = sIni < 0 ? -1 : 1;
    wrap.addEventListener('click', (e) => {
      const sg = e.target.closest('#sgIni [data-v]');
      if (sg) {
        sign = Number(sg.dataset.v);
        $$('#sgIni button', wrap).forEach((b) => { b.className = Number(b.dataset.v) === sign ? `on ${sign > 0 ? 'pos' : 'neg'}` : ''; });
        return;
      }
      if (!e.target.closest('[data-s="saveS"]')) return;
      const h = parseFloat(($('#sh', wrap).value || '0').replace(',', '.')) || 0;
      const m = parseInt($('#sm', wrap).value, 10) || 0;
      const next = {
        saldoInicial: sign * (Math.round(h * 60) + m),
        saldoInicialFecha: $('#sf', wrap).value,
        saldoInicialNota: $('#sn', wrap).value.trim(),
        diasLab: Math.min(7, Math.max(1, parseInt($('#sd', wrap).value, 10) || 5)),
        recordatorioMin: Math.max(0, parseInt($('#sr', wrap).value, 10) || 0),
        computan: Object.fromEntries($$('[data-c]', wrap).map((c) => [c.dataset.c, c.checked]))
      };
      const changes = [];
      if (next.saldoInicial !== st.saldoInicial) changes.push(`Saldo inicial: ${fmtDur(st.saldoInicial, true)} -> ${fmtDur(next.saldoInicial, true)}`);
      if (next.saldoInicialFecha !== st.saldoInicialFecha) changes.push(`Fecha saldo inicial: ${fmtNum(st.saldoInicialFecha)} -> ${fmtNum(next.saldoInicialFecha)}`);
      if (next.diasLab !== st.diasLab) changes.push(`Días laborables: ${st.diasLab} -> ${next.diasLab}`);
      Object.keys(next.computan).forEach((k) => { if (next.computan[k] !== st.computan[k]) changes.push(`${TYPES[k].long} computa: ${st.computan[k] ? 'sí' : 'no'} -> ${next.computan[k] ? 'sí' : 'no'}`); });
      Object.assign(st, next);
      if (changes.length) logEv('Editados', 'ajustes', '', changes.join('\n'));
      save(); closeSheet(); route(); toast('Ajustes guardados');
    });
  });
}

/* ---------- Copias de seguridad ---------- */
function exportJson() {
  S.settings.lastBackup = new Date().toISOString();
  logEv('Exportada', 'copia de seguridad', '', '');
  save();
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `mis-horas-copia-${todayISO()}.json`);
  toast('Copia descargada');
  route();
}
$('#importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data || !Array.isArray(data.weeks) || !data.profile) throw new Error('formato');
    const ok = await confirmBox('Restaurar copia', `La copia tiene ${data.weeks.length} semanas y ${(data.movs || []).length} movimientos. Reemplazará los datos actuales.`, 'Restaurar', true);
    if (!ok) return;
    S = normalize(data);
    logEv('Restaurada', 'copia de seguridad', file.name, `${S.weeks.length} semanas, ${S.movs.length} movimientos`);
    save(); route(); toast('Copia restaurada');
  } catch (err) {
    toast('Archivo no válido', 'error');
  }
});

/* ---------- Calendario (.ics) ---------- */
function weekIcs(w) {
  const dt = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const stamp = dt(new Date());
  const shifts = allShifts().filter((s) => s.date >= w.start && s.date <= weekEnd(w));
  if (!shifts.length) return null;
  const rem = S.settings.recordatorioMin;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mis Horas//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  shifts.forEach((s, i) => {
    lines.push('BEGIN:VEVENT', `UID:${w.id}-${i}-${s.date}@mishoras`, `DTSTAMP:${stamp}`, `DTSTART:${dt(s.start)}`, `DTEND:${dt(s.end)}`,
      `SUMMARY:Turno ${s.t.in}-${s.t.out}`, `DESCRIPTION:Turno de trabajo (Mis Horas)`);
    if (S.profile.centro) lines.push(`LOCATION:${S.profile.centro.replace(/[,;]/g, ' ')}`);
    if (rem > 0) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Turno de trabajo', `TRIGGER:-PT${rem}M`, 'END:VALARM');
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return new Blob([lines.join('\r\n')], { type: 'text/calendar' });
}

/* ---------- Acciones globales ---------- */
const ACT = {
  fab() {
    openSheet('Añadir', `<div class="action-list">
      <button data-close data-act="newWeek"><span class="qi v">${ico('cal')}</span><div><b>Nueva semana</b><small>Horario de cada día y jornada semanal</small></div></button>
      <button data-close data-act="newMov" data-k="favor"><span class="qi t">${ico('up')}</span><div><b>Horas a mi favor (H+)</b><small>Cursos, me quedé más, entré antes…</small></div></button>
      <button data-close data-act="newMov" data-k="contra"><span class="qi" style="background:var(--neg-soft);color:var(--neg)">${ico('down')}</span><div><b>Horas en contra (H−)</b><small>Salí antes, me devolvieron horas…</small></div></button>
      <button data-close data-act="newMov" data-k="control"><span class="qi a">${ico('flag')}</span><div><b>Control oficial de la empresa</b><small>Lo que te dicen que tienes de saldo</small></div></button>
    </div>`);
  },
  newWeek() { afterSheet(() => openWeekEditor()); },
  editWeek(d) { openWeekEditor(d.id); },
  async delWeek(d) {
    const w = S.weeks.find((x) => x.id === d.id);
    if (!w) return;
    if (!(await confirmBox('Eliminar semana', `Se eliminará la semana ${fmtRange(w.start)}. Quedará anotado en el historial de cambios.`, 'Eliminar', true))) return;
    S.weeks = S.weeks.filter((x) => x.id !== d.id);
    logEv('Eliminada', 'semana', fmtRange(w.start), `Jornada ${fmtDur(w.jornadaMin)}\n` + w.days.map((dd, i) => `${DAYS_SHORT[i]}: ${describeDay(dd)}`).join('\n'));
    save();
    go('#/semanas');
    toast('Semana eliminada');
  },
  newMov(d) { afterSheet(() => openMovEditor(null, d.k)); },
  editMov(d) { openMovEditor(d.id); },
  editProfile() { openProfileEditor(); },
  settings() { openSettings(); },
  goHistory() { go('#/historial'); },
  exportJson() { exportJson(); },
  importJson() { $('#importFile').click(); },
  async wipe() {
    if (!(await confirmBox('Borrar todo', 'Se borrarán todas las semanas, movimientos y datos. Descarga antes una copia de seguridad.', 'Borrar todo', true))) return;
    if (!(await confirmBox('¿Seguro?', 'Esta acción no se puede deshacer.', 'Sí, borrar', true))) return;
    S = defaultState(); save(); location.hash = '#/inicio'; route(); toast('Datos borrados');
  },
  async weekPdf(d) { await runPdf(() => PDF.week(d.id), false); },
  async weekPdfShare(d) { await runPdf(() => PDF.week(d.id), true); },
  async fullPdf() { await runPdf(() => PDF.full(), false); },
  async fullPdfShare() { await runPdf(() => PDF.full(), true); },
  weekIcs(d) {
    const w = S.weeks.find((x) => x.id === d.id);
    const blob = w && weekIcs(w);
    if (!blob) { toast('Esta semana no tiene turnos con horario', 'error'); return; }
    shareOrDownload(blob, `turnos-${w.start}.ics`, false);
    toast('Ábrelo para añadir los turnos a tu calendario');
  }
};
async function runPdf(make, share) {
  if (!window.jspdf) { toast('No se pudo cargar el generador de PDF', 'error'); return; }
  try {
    const { blob, filename } = await make();
    await shareOrDownload(blob, filename, share);
    if (!share) toast('PDF generado');
  } catch (e) {
    console.error(e);
    toast('Error al generar el PDF', 'error');
  }
}
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || (sheetEl && sheetEl.contains(el) && !el.hasAttribute('data-close'))) return;
  const fn = ACT[el.dataset.act];
  if (fn) { e.preventDefault(); if (el.hasAttribute('data-close')) closeSheet(); fn(el.dataset, el, e); }
});

/* ---------- Arranque ---------- */
// Bloquea zoom por gestos (iOS ignora user-scalable=no)
['gesturestart', 'gesturechange', 'gestureend'].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault(), { passive: false }));
document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

(function init() {
  const d = new Date();
  $('#barDate').textContent = `${DAYS_SHORT[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  if (!location.hash) history.replaceState(null, '', '#/inicio');
  route();
  // refresca la cuenta atrás del próximo turno
  setInterval(() => { if ((location.hash || '#/inicio').startsWith('#/inicio') && !sheetEl) route(); }, 60000);
})();
