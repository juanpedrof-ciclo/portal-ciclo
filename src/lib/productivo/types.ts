export type TipoManejo = "individual" | "lote";

export type GrupoAnimalId =
  | "bufalas_leche"
  | "cerdas_cria"
  | "cerdos_engorde"
  | "cerdos_levante"
  | "pollos";

export type GrupoAnimal = {
  id: GrupoAnimalId;
  nombre: string;
  tipo_manejo: TipoManejo;
  produce_leche: boolean;
  reproductivo: boolean;
  activo: boolean;
  orden: number;
};

export type Reproductor = {
  id: string;
  unidad: "finca";
  nombre: string;
  created_at: string;
  creado_por: string | null;
};

export type Animal = {
  id: string;
  unidad: "finca";
  grupo_id: GrupoAnimalId;
  chapeta: string;
  fecha_nacimiento: string | null;
  fecha_ingreso: string;
  madre_id: string | null;
  notas: string | null;
  created_at: string;
  creado_por: string | null;
};

export type EstadoAnimal = "activo" | "muerto" | "vendido";
export type EstadoReproductivo = "vacia" | "servida" | "prenada" | "lactando";

export type AnimalEstado = Animal & {
  estado: EstadoAnimal;
  estado_reproductivo: EstadoReproductivo | null;
};

export type TipoAlimento = "concentrado" | "pasto" | "otro";

export type AlimentacionRegistro = {
  id: string;
  unidad: "finca";
  grupo_id: GrupoAnimalId;
  fecha: string;
  kg_alimento: number;
  tipo_alimento: TipoAlimento;
  notas: string | null;
  created_at: string;
  creado_por: string | null;
  anulado: boolean;
  anulado_at: string | null;
  anulado_por: string | null;
};

export type Turno = "am" | "pm";

export type LecheRegistro = {
  id: string;
  unidad: "finca";
  animal_id: string;
  fecha: string;
  turno: Turno;
  litros: number;
  notas: string | null;
  created_at: string;
  creado_por: string | null;
  anulado: boolean;
  anulado_at: string | null;
  anulado_por: string | null;
};

export type NacimientoIndividual = {
  id: string;
  unidad: "finca";
  madre_id: string;
  fecha: string;
  num_crias: number;
  crias_vivas: number;
  crias_muertas: number;
  crias_machos: number;
  crias_hembras: number;
  cria_chapeta: string | null;
  cria_animal_id: string | null;
  notas: string | null;
  created_at: string;
  creado_por: string | null;
  anulado: boolean;
  anulado_at: string | null;
  anulado_por: string | null;
};

export type NacimientoLote = {
  id: string;
  unidad: "finca";
  grupo_id: GrupoAnimalId;
  fecha: string;
  cantidad: number;
  notas: string | null;
  created_at: string;
  creado_por: string | null;
  anulado: boolean;
  anulado_at: string | null;
  anulado_por: string | null;
};

export type CausaMuerte = "enfermedad" | "accidente" | "otro";

export type MuerteIndividual = {
  id: string;
  unidad: "finca";
  animal_id: string;
  fecha: string;
  causa: CausaMuerte;
  notas: string | null;
  created_at: string;
  creado_por: string | null;
  anulado: boolean;
  anulado_at: string | null;
  anulado_por: string | null;
};

export type MuerteLote = {
  id: string;
  unidad: "finca";
  grupo_id: GrupoAnimalId;
  fecha: string;
  cantidad: number;
  causa: CausaMuerte;
  notas: string | null;
  created_at: string;
  creado_por: string | null;
  anulado: boolean;
  anulado_at: string | null;
  anulado_por: string | null;
};

export type DestinoSalida = "ciclo_market" | "tercero" | "otro";

export type SalidaIndividual = {
  id: string;
  unidad: "finca";
  animal_id: string;
  fecha: string;
  destino: DestinoSalida;
  comprador: string | null;
  notas: string | null;
  venta_grupo_id: string;
  created_at: string;
  creado_por: string | null;
  anulado: boolean;
  anulado_at: string | null;
  anulado_por: string | null;
};

export type SalidaLote = {
  id: string;
  unidad: "finca";
  grupo_id: GrupoAnimalId;
  fecha: string;
  cantidad: number;
  destino: DestinoSalida;
  comprador: string | null;
  notas: string | null;
  created_at: string;
  creado_por: string | null;
  anulado: boolean;
  anulado_at: string | null;
  anulado_por: string | null;
};

export type TipoServicio = "monta_natural" | "inseminacion_artificial";

export type ServicioReproductivo = {
  id: string;
  unidad: "finca";
  animal_id: string;
  fecha: string;
  tipo: TipoServicio;
  reproductor_id: string | null;
  notas: string | null;
  created_at: string;
  creado_por: string | null;
  anulado: boolean;
  anulado_at: string | null;
  anulado_por: string | null;
};

export type ResultadoPrenez = "prenada" | "vacia";

export type ConfirmacionPrenez = {
  id: string;
  unidad: "finca";
  animal_id: string;
  fecha: string;
  resultado: ResultadoPrenez;
  notas: string | null;
  created_at: string;
  creado_por: string | null;
  anulado: boolean;
  anulado_at: string | null;
  anulado_por: string | null;
};

export type Destete = {
  id: string;
  unidad: "finca";
  animal_id: string;
  fecha: string;
  notas: string | null;
  created_at: string;
  creado_por: string | null;
  anulado: boolean;
  anulado_at: string | null;
  anulado_por: string | null;
};

export type InventarioInicialLote = {
  id: string;
  unidad: "finca";
  grupo_id: GrupoAnimalId;
  fecha: string;
  cantidad: number;
  notas: string | null;
  created_at: string;
  creado_por: string | null;
};

export type VistaInventarioLote = {
  grupo_id: GrupoAnimalId;
  fecha_inicial: string | null;
  cantidad_inicial: number;
  nacidos: number;
  muertos: number;
  vendidos: number;
  cantidad_actual: number;
};

export const TIPO_ALIMENTO_LABELS: Record<TipoAlimento, string> = {
  concentrado: "Concentrado",
  pasto: "Pasto",
  otro: "Otro",
};

export const TURNO_LABELS: Record<Turno, string> = {
  am: "Mañana (AM)",
  pm: "Tarde (PM)",
};

export const CAUSA_MUERTE_LABELS: Record<CausaMuerte, string> = {
  enfermedad: "Enfermedad",
  accidente: "Accidente",
  otro: "Otro",
};

export const DESTINO_SALIDA_LABELS: Record<DestinoSalida, string> = {
  ciclo_market: "Ciclo Market",
  tercero: "Tercero",
  otro: "Otro",
};

export const TIPO_SERVICIO_LABELS: Record<TipoServicio, string> = {
  monta_natural: "Monta natural",
  inseminacion_artificial: "Inseminación artificial",
};

export const RESULTADO_PRENEZ_LABELS: Record<ResultadoPrenez, string> = {
  prenada: "Preñada",
  vacia: "Vacía",
};

export const ESTADO_ANIMAL_LABELS: Record<EstadoAnimal, string> = {
  activo: "Activo",
  muerto: "Muerto",
  vendido: "Vendido",
};

export const ESTADO_REPRODUCTIVO_LABELS: Record<EstadoReproductivo, string> = {
  vacia: "Vacía",
  servida: "Servida",
  prenada: "Preñada",
  lactando: "Lactando",
};

export function formatNumero(value: number, decimales = 1): string {
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimales,
  }).format(value);
}
