import { query } from '../config/database.js'

const chairs = [
  { id: 'c1', name: 'Sillón 1', room: 'Consultorio A', sort_order: 1 },
  { id: 'c2', name: 'Sillón 2', room: 'Consultorio B', sort_order: 2 },
  { id: 'c3', name: 'Sillón 3', room: 'Cirugía', sort_order: 3 },
]

const availability = []
const schedule = {
  d1: { weekdays: [1, 2, 3, 4, 5], blocks: [['08:00', '13:00'], ['14:00', '18:00']], saturday: ['09:00', '13:00'] },
  d2: { weekdays: [1, 2, 3, 4, 5], blocks: [['09:00', '13:00'], ['14:00', '19:00']], saturday: null },
}
for (const [dentistId, s] of Object.entries(schedule)) {
  for (const weekday of s.weekdays) {
    for (const [start, end] of s.blocks) {
      availability.push({ id: `av-${dentistId}-${weekday}-${start.slice(0, 2)}`, dentist_id: dentistId, weekday, start_time: start, end_time: end })
    }
  }
  if (s.saturday) {
    availability.push({ id: `av-${dentistId}-6-${s.saturday[0].slice(0, 2)}`, dentist_id: dentistId, weekday: 6, start_time: s.saturday[0], end_time: s.saturday[1] })
  }
}

const COMMON =
  'Yo, {{patient}}, declaro que el/la Dr./Dra. {{dentist}} me explicó en lenguaje claro el diagnóstico, el procedimiento propuesto, ' +
  'sus alternativas, beneficios, riesgos y posibles complicaciones. Pude hacer preguntas y fueron respondidas. ' +
  'Autorizo la realización del procedimiento y los actos complementarios que resulten necesarios. Fecha: {{date}}.'

const consentTemplates = [
  {
    id: 'ct-endo',
    code: 'endodoncia',
    title: 'Consentimiento informado — Endodoncia',
    category: 'Endodoncia',
    body:
      'Procedimiento: tratamiento de conductos (endodoncia) en la pieza dental indicada.\n' +
      'Riesgos: dolor o inflamación postoperatoria, fractura de instrumentos, perforaciones, fractura dental posterior, ' +
      'necesidad de retratamiento, cirugía apical o extracción.\n' + COMMON,
  },
  {
    id: 'ct-cirugia',
    code: 'cirugia',
    title: 'Consentimiento informado — Cirugía oral',
    category: 'Cirugía',
    body:
      'Procedimiento: cirugía oral (extracción quirúrgica / implantes / cirugía periodontal).\n' +
      'Riesgos: sangrado, infección, inflamación, hematoma, parestesia transitoria o permanente, comunicación oroantral, ' +
      'fractura de piezas adyacentes, reacción a anestésicos.\n' + COMMON,
  },
  {
    id: 'ct-orto',
    code: 'ortodoncia',
    title: 'Consentimiento informado — Ortodoncia',
    category: 'Ortodoncia',
    body:
      'Procedimiento: tratamiento de ortodoncia con aparatología fija o removible.\n' +
      'Riesgos: descalcificación y caries por higiene deficiente, reabsorción radicular, recidiva, molestias, ' +
      'duración variable según colaboración del paciente y uso de retenedores.\n' + COMMON,
  },
  {
    id: 'ct-blanq',
    code: 'blanqueamiento',
    title: 'Consentimiento informado — Blanqueamiento dental',
    category: 'Estética',
    body:
      'Procedimiento: blanqueamiento dental con agentes oxidantes en consultorio o domiciliario.\n' +
      'Riesgos: sensibilidad dental transitoria, irritación gingival, resultados variables, no actúa sobre restauraciones, ' +
      'posible necesidad de mantenimiento.\n' + COMMON,
  },
]

const medications = [
  ['med1', 'Amoxicilina', 'Cápsulas 500 mg', '1 cápsula cada 8 horas por 7 días', 'Antibiótico'],
  ['med2', 'Amoxicilina + Ácido clavulánico', 'Tabletas 875/125 mg', '1 tableta cada 12 horas por 7 días', 'Antibiótico'],
  ['med3', 'Clindamicina', 'Cápsulas 300 mg', '1 cápsula cada 6 horas por 7 días', 'Antibiótico'],
  ['med4', 'Azitromicina', 'Tabletas 500 mg', '1 tableta al día por 3 días', 'Antibiótico'],
  ['med5', 'Metronidazol', 'Tabletas 500 mg', '1 tableta cada 8 horas por 7 días', 'Antibiótico'],
  ['med6', 'Ibuprofeno', 'Tabletas 400 mg', '1 tableta cada 8 horas con alimentos por 3 días', 'Antiinflamatorio'],
  ['med7', 'Naproxeno', 'Tabletas 550 mg', '1 tableta cada 12 horas con alimentos por 3 días', 'Antiinflamatorio'],
  ['med8', 'Diclofenaco', 'Tabletas 50 mg', '1 tableta cada 8 horas por 3 días', 'Antiinflamatorio'],
  ['med9', 'Dexametasona', 'Tabletas 4 mg', '1 tableta cada 12 horas por 2 días', 'Corticoide'],
  ['med10', 'Paracetamol', 'Tabletas 500 mg', '1 a 2 tabletas cada 6 horas si hay dolor', 'Analgésico'],
  ['med11', 'Acetaminofén + Codeína', 'Tabletas 500/30 mg', '1 tableta cada 8 horas si hay dolor intenso', 'Analgésico'],
  ['med12', 'Clorhexidina 0,12%', 'Colutorio 250 ml', 'Enjuagar 15 ml por 30 segundos cada 12 horas por 7 días', 'Antiséptico'],
  ['med13', 'Nistatina', 'Suspensión oral 100.000 UI/ml', '4 ml cada 6 horas por 10 días', 'Antifúngico'],
  ['med14', 'Fluoruro de sodio 0,05%', 'Colutorio 500 ml', 'Enjuagar 10 ml una vez al día', 'Preventivo'],
  ['med15', 'Lidocaína gel 2%', 'Gel tópico 30 g', 'Aplicar sobre la zona afectada cada 8 horas', 'Anestésico tópico'],
].map(([id, name, presentation, default_dosage, category]) => ({ id, name, presentation, default_dosage, category }))

async function insert(table, columns, rows) {
  for (const row of rows) {
    const params = columns.map((c) => row[c])
    await query(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${params.map((_, i) => `$${i + 1}`).join(', ')}) ON CONFLICT DO NOTHING`,
      params,
    )
  }
}

export async function seedExtras() {
  await insert('dental_chairs', ['id', 'name', 'room', 'sort_order'], chairs)
  const { rows } = await query("SELECT id FROM dentists WHERE id IN ('d1', 'd2')")
  const present = new Set(rows.map((r) => r.id))
  await insert('dentist_availability', ['id', 'dentist_id', 'weekday', 'start_time', 'end_time'], availability.filter((a) => present.has(a.dentist_id)))
  await insert('consent_templates', ['id', 'code', 'title', 'category', 'body'], consentTemplates)
  await insert('medications', ['id', 'name', 'presentation', 'default_dosage', 'category'], medications)
}
