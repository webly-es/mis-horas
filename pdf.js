'use strict';
/* =========================================================
   Informes PDF (semanal y completo) con formato de prueba documental
   ========================================================= */
const PDF = (() => {
  const M = 16;            // margen
  const PW = 210, PH = 297;
  const CW = PW - M * 2;   // ancho útil
  const INK = [20, 22, 30], GREY = [110, 115, 128], LINE = [215, 218, 226], ACC = [79, 70, 229];

  // Helvetica (WinAnsi) no tiene algunos caracteres: los sustituimos
  const clean = (s) => String(s ?? '')
    .replace(/[−–—]/g, '-').replace(/→/g, '->').replace(/[·•]/g, '|').replace(/Δ/g, 'Dif.')
    .replace(/✓/g, 'OK').replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
    .replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ€]/g, '');
  const dur = (m, s) => clean(fmtDur(m, s));
  const dec = (m) => clean(fmtDec(m));
  const both = (m) => `${dur(m, true)} (${dec(m)})`;

  async function sha256(text) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch { return 'no disponible (requiere conexión segura https)'; }
  }

  function newDoc() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...INK);
    const ctx = { doc, y: M };
    ctx.space = (h) => { if (ctx.y + h > PH - 22) { doc.addPage(); ctx.y = M + 4; } };
    ctx.title = (text, sub, ref) => {
      doc.setFillColor(...ACC); doc.rect(0, 0, PW, 4, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...INK);
      doc.text(clean(text), M, 18);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...GREY);
      doc.text(clean(sub), M, 24);
      if (ref) { doc.setFontSize(8); doc.text(clean(ref), PW - M, 12, { align: 'right' }); }
      doc.setDrawColor(...LINE); doc.setLineWidth(0.3); doc.line(M, 28, PW - M, 28);
      ctx.y = 34;
    };
    ctx.h = (text) => {
      ctx.y += 3;
      ctx.space(14);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...ACC);
      doc.text(clean(text).toUpperCase(), M, ctx.y);
      doc.setDrawColor(...LINE); doc.line(M, ctx.y + 1.8, PW - M, ctx.y + 1.8);
      ctx.y += 7; doc.setTextColor(...INK); doc.setFont('helvetica', 'normal');
    };
    ctx.h2 = (text) => {
      ctx.space(12);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(...INK);
      doc.text(clean(text), M, ctx.y); ctx.y += 5; doc.setFont('helvetica', 'normal');
    };
    ctx.p = (text, { size = 9, color = INK, bold = false, gap = 2 } = {}) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(...color);
      const lines = doc.splitTextToSize(clean(text), CW);
      const lh = size * 0.42;
      lines.forEach((ln) => { ctx.space(lh + 1); doc.text(ln, M, ctx.y); ctx.y += lh; });
      ctx.y += gap; doc.setTextColor(...INK); doc.setFont('helvetica', 'normal');
    };
    ctx.table = (head, body, opts = {}) => {
      doc.autoTable({
        startY: ctx.y, head: head ? [head.map(clean)] : undefined, body: body.map((r) => r.map((c) => (typeof c === 'object' && c !== null ? { ...c, content: clean(c.content) } : clean(c)))),
        margin: { left: M, right: M, bottom: 22 }, theme: 'grid',
        styles: { font: 'helvetica', fontSize: 8.4, cellPadding: 1.8, textColor: INK, lineColor: LINE, lineWidth: 0.2, valign: 'middle' },
        headStyles: { fillColor: [241, 242, 248], textColor: INK, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [251, 251, 253] },
        ...opts
      });
      ctx.y = doc.lastAutoTable.finalY + 6;
    };
    ctx.kv = (rows) => ctx.table(null, rows, { theme: 'plain', styles: { fontSize: 9, cellPadding: { top: 1, bottom: 1, left: 0, right: 2 }, textColor: INK }, columnStyles: { 0: { textColor: GREY, cellWidth: 46 } } });
    return ctx;
  }

  function personBlock(ctx) {
    const p = S.profile;
    ctx.h('Datos del trabajador y de la empresa');
    const L = [
      ['Trabajador/a', p.nombre || '-'], ['DNI / NIE', p.dni || '-'], ['Nº Seguridad Social', p.nss || '-'],
      ['Puesto', p.puesto || '-'], ['Nº de empleado', p.numEmpleado || '-'], ['Contacto', [p.telefono, p.email].filter(Boolean).join(' | ') || '-']
    ];
    const R = [
      ['Empresa', p.empresa || '-'], ['CIF', p.cif || '-'], ['Centro de trabajo', p.centro || '-'],
      ['Encargado/a', p.encargado || '-'], ['Fecha de alta', p.fechaAlta ? fmtNum(p.fechaAlta) : '-'], ['Convenio', p.convenio || '-']
    ];
    const rows = L.map((l, i) => [l[0], l[1], R[i][0], R[i][1]]);
    ctx.table(null, rows, {
      theme: 'plain', styles: { fontSize: 8.8, cellPadding: { top: 0.9, bottom: 0.9, left: 0, right: 2 } },
      columnStyles: { 0: { textColor: GREY, cellWidth: 32 }, 1: { cellWidth: 57 }, 2: { textColor: GREY, cellWidth: 32 }, 3: {} }
    });
  }

  function dayRows(w) {
    return w.days.map((d, i) => {
      const date = addDays(w.start, i);
      const worked = dayWorked(d), credit = dayCredit(d, w.jornadaMin);
      return [
        DAYS[i], fmtNum(date), TYPES[d.type].long,
        d.type === 'trabajo' ? ((d.tramos || []).filter(validTramo).map((t) => `${t.in}-${t.out}`).join('  /  ') || 'Sin horario') : '-',
        d.descanso ? `${d.descanso} min` : '-',
        worked ? dur(worked) : credit ? `${dur(credit)}*` : '0h',
        d.nota || ''
      ];
    });
  }
  const dayHead = ['Día', 'Fecha', 'Tipo', 'Horario', 'Desc.', 'Horas', 'Observaciones'];
  const dayCols = { 0: { cellWidth: 19 }, 1: { cellWidth: 19 }, 2: { cellWidth: 27 }, 3: { cellWidth: 33 }, 4: { cellWidth: 15, halign: 'center' }, 5: { cellWidth: 15, halign: 'right', fontStyle: 'bold' }, 6: {} };

  function movRowsFor(movs) {
    return movs.map((m) => [fmtNum(m.date), MOV_KINDS[m.kind].short === 'H−' ? 'H- en contra' : 'H+ a favor', m.concepto || '-', m.nota || '-', { content: dur(movDelta(m), true), styles: { halign: 'right', fontStyle: 'bold', textColor: movDelta(m) < 0 ? [190, 40, 60] : [20, 130, 80] } }]);
  }
  function controlRows(items) {
    return items.map((it) => [fmtNum(it.date), it.mov.concepto || '-', dur(it.official, true), dur(it.app, true),
      { content: it.gap === 0 ? 'Coincide' : dur(it.gap, true), styles: { fontStyle: 'bold', textColor: it.gap === 0 ? [20, 130, 80] : [190, 110, 0] } },
      DEBATE[controlStatus(it)].label, it.mov.nota || '-']);
  }
  const controlHead = ['Fecha', 'Fuente', 'Empresa', 'Mi registro', 'Diferencia', 'Estado', 'Nota'];
  const controlCols = { 0: { cellWidth: 19 }, 2: { cellWidth: 18 }, 3: { cellWidth: 19 }, 4: { cellWidth: 19 }, 5: { cellWidth: 30 } };
  // Notas del debate de cada crédito horario, en orden cronológico
  function debateThreads(ctx, items) {
    const withNotes = items.filter((it) => (it.mov.thread || []).length);
    if (!withNotes.length) return;
    withNotes.forEach((it) => {
      ctx.p(`Debate del crédito horario del ${fmtNum(it.date)} (${DEBATE[controlStatus(it)].label}):`, { size: 8.6, bold: true, gap: 1 });
      ctx.table(['Fecha y hora', 'Nota'], it.mov.thread.map((t) => [fmtTs(t.ts), t.text]), { styles: { fontSize: 7.8, cellPadding: 1.4 }, columnStyles: { 0: { cellWidth: 27 } } });
    });
  }
  function logRows(entries) {
    return entries.map((l) => [fmtTs(l.ts), `${l.action} ${l.kind}${l.ref ? ' (' + l.ref + ')' : ''}`, l.detail || '-']);
  }

  const LEGAL = [
    'Art. 34.9 del Estatuto de los Trabajadores (RDL 2/2015, en la redacción del RD-ley 8/2019): la empresa garantizará el registro diario de jornada, que incluirá el horario concreto de inicio y finalización de la jornada de cada persona trabajadora. Los registros se conservarán durante cuatro años y permanecerán a disposición de las personas trabajadoras, de sus representantes legales y de la Inspección de Trabajo y Seguridad Social.',
    'Art. 34.2 ET: la compensación de las diferencias, por exceso o por defecto, entre la jornada realizada y la jornada ordinaria legal o pactada será exigible según lo acordado en convenio colectivo o, a falta de previsión, por acuerdo entre empresa y representación de los trabajadores. En defecto de pacto, las diferencias derivadas de la distribución irregular de la jornada deberán quedar compensadas en el plazo de doce meses desde que se produzcan.',
    'Art. 34.3 ET: entre el final de una jornada y el comienzo de la siguiente mediarán, como mínimo, doce horas; el número de horas ordinarias de trabajo efectivo no podrá ser superior a nueve diarias, salvo que por convenio o acuerdo se establezca otra distribución (el RD 1561/1995 prevé excepciones para hostelería).',
    'Art. 35 ET: en ausencia de pacto, las horas extraordinarias realizadas deberán compensarse mediante descanso dentro de los cuatro meses siguientes a su realización. A efectos de su cómputo, la jornada de cada trabajador se registrará día a día y se totalizará en el periodo fijado para el abono de las retribuciones, entregando copia del resumen al trabajador.'
  ];
  const DISCLAIMER = 'Las referencias normativas se incluyen a título informativo y deben contrastarse con el convenio colectivo aplicable. No constituyen asesoramiento jurídico; para reclamar se recomienda consultar con un abogado laboralista, graduado social o sindicato.';

  function declaration(ctx, scope) {
    const p = S.profile;
    ctx.h('Declaración del trabajador');
    ctx.p(`Yo, ${p.nombre || '________________________'}${p.dni ? ', con DNI/NIE ' + p.dni : ''}, declaro que los datos contenidos en este documento (${scope}) corresponden a mi registro personal de jornada, anotado por mí en la aplicación "Mis Horas" de forma contemporánea a los hechos, y que reflejan fielmente los horarios realizados, las ausencias y los movimientos de mi bolsa de horas según mi conocimiento. Cualquier modificación posterior queda reflejada con fecha y hora en el historial de cambios.`);
    ctx.space(34);
    ctx.y += 14;
    const { doc } = ctx;
    const w = (CW - 12) / 2;
    doc.setDrawColor(...GREY); doc.setLineWidth(0.3);
    doc.line(M, ctx.y, M + w, ctx.y); doc.line(M + w + 12, ctx.y, PW - M, ctx.y);
    doc.setFontSize(8.5); doc.setTextColor(...GREY);
    doc.text(clean(`Firma del trabajador/a: ${p.nombre || ''}`), M, ctx.y + 4);
    doc.text('Fecha:', M, ctx.y + 9);
    doc.text('Recibí por la empresa (nombre, firma, sello):', M + w + 12, ctx.y + 4);
    doc.text('Fecha:', M + w + 12, ctx.y + 9);
    ctx.y += 16; doc.setTextColor(...INK);
  }

  function footer(ctx, hash, label) {
    const { doc } = ctx;
    const n = doc.getNumberOfPages();
    const gen = fmtTs(new Date().toISOString());
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setDrawColor(...LINE); doc.setLineWidth(0.2); doc.line(M, PH - 15, PW - M, PH - 15);
      doc.setFontSize(7.2); doc.setTextColor(...GREY);
      doc.text(clean(`${label} | ${S.profile.nombre || ''} | Generado el ${gen} con Mis Horas`), M, PH - 11);
      doc.text(clean(`Huella de integridad SHA-256: ${hash}`), M, PH - 7.5);
      doc.text(`Página ${i} de ${n}`, PW - M, PH - 11, { align: 'right' });
    }
  }

  const fileSafe = (s) => clean(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();

  /* ---------- Informe semanal ---------- */
  async function week(id) {
    const w = S.weeks.find((x) => x.id === id);
    if (!w) throw new Error('Semana no encontrada');
    const st = weekStats(w);
    const L = ledger();
    const idx = L.items.findIndex((i) => i.kind === 'semana' && i.week.id === id);
    const it = L.items[idx];
    const balAfter = it.bal;
    const balBefore = balAfter - it.delta - st.movSum; // saldo antes de la semana y de sus cargos
    const controls = L.items.filter((i) => i.kind === 'control' && i.date >= w.start && i.date <= weekEnd(w));
    const alerts = legalAlerts().filter((a) => a.date >= w.start && a.date <= weekEnd(w));
    const range = fmtRange(w.start);
    const logs = S.log.filter((l) => l.kind === 'semana' && (l.ref === range || (l.detail || '').includes(fmtNum(w.start))));

    const ctx = newDoc();
    ctx.title('Registro semanal de jornada y bolsa de horas', `Semana del lunes ${fmtNum(w.start)} al domingo ${fmtNum(weekEnd(w))}`, `Ref. MH-S-${w.start.replace(/-/g, '')}`);
    personBlock(ctx);

    ctx.h('Resumen de la semana');
    ctx.table(['Concepto', 'Horas'], [
      ['Jornada semanal fijada por la empresa', `${dur(w.jornadaMin)} (${clean(fmtDec(w.jornadaMin, false))})`],
      ['Horas trabajadas (descontando descansos)', dur(st.worked)],
      ['Horas computadas por ausencias (vacaciones, festivos, baja)*', dur(st.credited)],
      ['Total horas computables', dur(st.total)],
      [{ content: 'Diferencia semanal (computables - jornada)', styles: { fontStyle: 'bold' } }, { content: both(st.diff), styles: { fontStyle: 'bold' } }],
      ['Cargos de horas registrados en la semana (H+ / H-)', both(st.movSum)],
      ['Saldo acumulado antes de la semana', both(balBefore)],
      [{ content: 'SALDO ACUMULADO AL CIERRE DE LA SEMANA', styles: { fontStyle: 'bold' } }, { content: both(balAfter), styles: { fontStyle: 'bold', textColor: balAfter < 0 ? [190, 40, 60] : [20, 130, 80] } }]
    ], { columnStyles: { 1: { halign: 'right', cellWidth: 48 } } });

    ctx.h('Detalle diario');
    ctx.table(dayHead, dayRows(w), { columnStyles: dayCols });
    ctx.p(`* Las ausencias computables equivalen a la jornada semanal dividida entre ${S.settings.diasLab} días laborables.`, { size: 7.5, color: GREY });

    if (st.movs.length) {
      ctx.h('Cargos de horas (H+ / H-)');
      ctx.table(['Fecha', 'Tipo', 'Concepto', 'Nota / prueba', 'Horas'], movRowsFor(st.movs), { columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 24 }, 4: { cellWidth: 20 } } });
    }
    if (controls.length) {
      ctx.h('Crédito horario comunicado por la empresa');
      ctx.table(controlHead, controlRows(controls), { columnStyles: controlCols });
      debateThreads(ctx, controls);
    }
    if (alerts.length) {
      ctx.h('Incidencias detectadas');
      alerts.forEach((a) => ctx.p(`- ${a.text}`));
    }
    if (w.comment) {
      ctx.h('Comentario del trabajador');
      ctx.p(w.comment);
    }
    ctx.h('Trazabilidad del registro');
    ctx.p(`Semana creada el ${fmtTs(w.createdAt)}${w.updatedAt && w.updatedAt !== w.createdAt ? ` y modificada por última vez el ${fmtTs(w.updatedAt)}` : ' sin modificaciones posteriores'}.`, { size: 8.5 });
    if (logs.length) ctx.table(['Fecha y hora', 'Acción', 'Detalle del cambio'], logRows(logs), { styles: { fontSize: 7.6, cellPadding: 1.4 }, columnStyles: { 0: { cellWidth: 27 }, 1: { cellWidth: 40 } } });

    declaration(ctx, `semana del ${fmtNum(w.start)} al ${fmtNum(weekEnd(w))}`);
    ctx.p('Referencia normativa: art. 34.9 ET (registro diario de jornada) y art. 34.2 ET (compensación de diferencias de jornada). ' + DISCLAIMER, { size: 7.2, color: GREY });

    const hash = await sha256(JSON.stringify({ profile: S.profile, week: w, movs: st.movs, controls: controls.map((c) => c.mov), logs }));
    footer(ctx, hash, `Registro semanal ${fmtNum(w.start)}-${fmtNum(weekEnd(w))}`);
    return { blob: ctx.doc.output('blob'), filename: `registro-semana-${w.start}-${fileSafe(S.profile.nombre || 'trabajador')}.pdf` };
  }

  /* ---------- Informe completo ---------- */
  async function full() {
    const ws = sortedWeeks();
    const L = ledger();
    const ctx = newDoc();
    const first = ws[0], last = ws[ws.length - 1];
    const period = first ? `Periodo registrado: del ${fmtNum(first.start)} al ${fmtNum(weekEnd(last))}` : 'Sin semanas registradas';
    ctx.title('Informe completo de jornada y bolsa de horas', period, `Ref. MH-C-${todayISO().replace(/-/g, '')}`);
    personBlock(ctx);

    // Resumen general
    let jor = 0, worked = 0, credited = 0, wPos = 0, wNeg = 0;
    ws.forEach((w) => { const s = weekStats(w); jor += w.jornadaMin; worked += s.worked; credited += s.credited; if (s.diff > 0) wPos += s.diff; else wNeg += s.diff; });
    let fav = 0, con = 0;
    S.movs.forEach((m) => { const d = movDelta(m); if (d > 0) fav += d; else con += d; });
    const controls = L.items.filter((i) => i.kind === 'control');
    const alerts = legalAlerts();

    ctx.h('Resumen general');
    ctx.table(['Concepto', 'Valor'], [
      ['Semanas registradas', String(ws.length)],
      ['Jornada total fijada por la empresa', dur(jor)],
      ['Horas trabajadas', dur(worked)],
      ['Horas computadas por ausencias', dur(credited)],
      ['Semanas con exceso de horas (H+)', dur(wPos, true)],
      ['Semanas con defecto de horas (H-)', dur(wNeg, true)],
      ['Cargos a favor (cursos, prolongaciones…)', dur(fav, true)],
      ['Cargos en contra (salidas anticipadas, devoluciones…)', dur(con, true)],
      ['Saldo inicial' + (S.settings.saldoInicialFecha ? ` (${fmtNum(S.settings.saldoInicialFecha)})` : ''), both(S.settings.saldoInicial || 0)],
      [{ content: `SALDO ACTUAL a ${fmtNum(todayISO())} (semanas cerradas)`, styles: { fontStyle: 'bold' } }, { content: both(L.current), styles: { fontStyle: 'bold', textColor: L.current < 0 ? [190, 40, 60] : [20, 130, 80] } }],
      ['Saldo previsto al cerrar la semana en curso', both(L.projected)],
      ['Créditos horarios de la empresa que no coinciden', `${controls.filter((c) => c.gap !== 0).length} de ${controls.length}`],
      ['Debates abiertos o reclamados', String(controls.filter(isOpenDebate).length)],
      ['Incidencias de descanso / jornada detectadas', String(alerts.length)]
    ], { columnStyles: { 1: { halign: 'right', cellWidth: 52 } } });

    if (controls.length) {
      ctx.h('Comparativa con el crédito horario comunicado por la empresa');
      ctx.p('Saldo que la empresa indicó en cada fecha frente al saldo resultante de este registro en esa misma fecha (semanas cerradas y cargos hasta ese día).', { size: 8.2, color: GREY });
      ctx.table(controlHead, controlRows(controls), { columnStyles: controlCols });
      debateThreads(ctx, controls);
    }

    ctx.h('Evolución de la bolsa de horas');
    const flowRows = L.items.filter((i) => i.kind !== 'control').map((i) => {
      if (i.kind === 'inicial') return [i.date.startsWith('0000') ? '-' : fmtNum(i.date), 'Saldo inicial', S.settings.saldoInicialNota || '-', '-', '-', dur(i.delta, true), dur(i.bal, true)];
      if (i.kind === 'mov') return [fmtNum(i.date), i.delta >= 0 ? 'Cargo H+' : 'Cargo H-', i.mov.concepto || '-', '-', '-', dur(i.delta, true), dur(i.bal, true)];
      return [fmtNum(i.date), 'Semana' + (i.closed ? '' : ' (en curso)'), `${fmtNum(i.week.start)} - ${fmtNum(weekEnd(i.week))}`, dur(i.week.jornadaMin), dur(i.stats.total), dur(i.delta, true), dur(i.bal, true)];
    });
    ctx.table(['Fecha', 'Tipo', 'Detalle', 'Jornada', 'Horas', 'Diferencia', 'Saldo'], flowRows, {
      styles: { fontSize: 7.8, cellPadding: 1.5 },
      columnStyles: { 0: { cellWidth: 19 }, 1: { cellWidth: 26 }, 3: { halign: 'right', cellWidth: 17 }, 4: { halign: 'right', cellWidth: 19 }, 5: { halign: 'right', cellWidth: 19 }, 6: { halign: 'right', cellWidth: 19, fontStyle: 'bold' } }
    });

    const movs = [...S.movs].filter((m) => m.kind !== 'control').sort((a, b) => a.date.localeCompare(b.date));
    if (movs.length) {
      ctx.h('Cargos de horas registrados');
      ctx.table(['Fecha', 'Tipo', 'Concepto', 'Nota / prueba', 'Horas'], movRowsFor(movs), { columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 24 }, 4: { cellWidth: 20 } } });
    }

    if (alerts.length) {
      ctx.h('Incidencias detectadas automáticamente');
      ctx.table(['Fecha', 'Incidencia'], alerts.map((a) => [fmtNum(a.date), a.text]), { columnStyles: { 0: { cellWidth: 22 } } });
    }

    ctx.h('Detalle por semanas');
    ws.forEach((w) => {
      const s = weekStats(w);
      ctx.space(60);
      ctx.h2(`Semana ${fmtNum(w.start)} - ${fmtNum(weekEnd(w))}   |   Jornada ${dur(w.jornadaMin)}   |   Computadas ${dur(s.total)}   |   Diferencia ${dur(s.diff, true)}`);
      ctx.table(dayHead, dayRows(w), { styles: { fontSize: 7.8, cellPadding: 1.4 }, columnStyles: dayCols });
      if (w.comment) { ctx.p(`Comentario: ${w.comment}`, { size: 8.2, color: [60, 64, 75] }); }
    });
    ctx.p(`* Ausencias computables = jornada semanal ÷ ${S.settings.diasLab} días laborables.`, { size: 7.5, color: GREY });

    ctx.h('Historial completo de cambios');
    ctx.p('Registro automático, no editable desde la aplicación, de cada alta, modificación y eliminación realizada.', { size: 8.2, color: GREY });
    if (S.log.length) ctx.table(['Fecha y hora', 'Acción', 'Detalle'], logRows(S.log), { styles: { fontSize: 7.4, cellPadding: 1.3 }, columnStyles: { 0: { cellWidth: 27 }, 1: { cellWidth: 40 } } });
    else ctx.p('Sin cambios registrados.');

    ctx.h('Marco normativo de referencia');
    LEGAL.forEach((t) => ctx.p(t, { size: 8.2 }));
    ctx.p(DISCLAIMER, { size: 7.6, color: GREY });

    declaration(ctx, 'informe completo');

    const data = { ...S, settings: { ...S.settings, lastBackup: undefined } };
    const hash = await sha256(JSON.stringify(data));
    footer(ctx, hash, 'Informe completo de jornada');
    return { blob: ctx.doc.output('blob'), filename: `informe-completo-horas-${todayISO()}-${fileSafe(S.profile.nombre || 'trabajador')}.pdf` };
  }

  return { week, full };
})();
