export interface StageDefinition {
  number: number;
  name: string;
  description: string;
  durationDays: number;
  badgeColor: string;
}

export const PRODUCTION_STAGES: StageDefinition[] = [
  {
    number: 1,
    name: 'Preparación de base y 1ra fermentación',
    description: 'Disolución de miel, agua, nutrientes e inoculación de levadura.',
    durationDays: 7,
    badgeColor: 'bg-yellow-950 text-yellow-300 border-yellow-700',
  },
  {
    number: 2,
    name: 'Agregado de frutas y 2da fermentación',
    description: 'Incorporación de frutas/melomel y segunda etapa de fermentación.',
    durationDays: 7,
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
  },
  {
    number: 3,
    name: 'Clarificación',
    description: 'Sedimentación de levaduras y pulpas para limpieza del hidromiel.',
    durationDays: 3,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  {
    number: 4,
    name: 'Trasvase a keg y enfriamiento',
    description: 'Traspaso a barril de servicio/maduración y cold crash.',
    durationDays: 1,
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
  },
  {
    number: 5,
    name: 'Gasificación',
    description: 'Carbonatación forzada en keg a presión y temperatura controlada.',
    durationDays: 1,
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  {
    number: 6,
    name: 'Embotellado y empaque',
    description: 'Envasado en botellas de 330ml, tapado con chapa y etiquetado final.',
    durationDays: 1,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
];

export function getStageByNumber(stageNumber: number): StageDefinition | undefined {
  return PRODUCTION_STAGES.find((s) => s.number === stageNumber);
}

export const TOTAL_PRODUCTION_DAYS = PRODUCTION_STAGES.reduce((acc, s) => acc + s.durationDays, 0); // 20 días
