export interface Calendario {
    id: string;
    nombre: string;
    color: string;
}

export interface Miembro {
    id: string;
    nombre: string;
    color: string;
}

export interface Evento {
    id?: string;
    fecha: string;
    calendario: string;
    tipo: string;
    titulo: string;
    detalle?: string;
    asignado?: string;
}

export const CALENDARIOS: Calendario[] = [
    { id: "importante", nombre: "Importante", color: "#6e0d0d" },
    { id: "bravar", nombre: "Bravar", color: "#a9cfe4" },
    { id: "dega", nombre: "Degá", color: "#5f4a3f" },
    { id: "calesa", nombre: "Calesa", color: "#96605a" },
    { id: "ibis", nombre: "Ibis", color: "#e9d583" },
];

export const MIEMBROS: Miembro[] = [
    { id: "vanessa", nombre: "Vanessa", color: "#c3e1f2" },
    { id: "daniela", nombre: "Daniela", color: "#f2e7ae" },
    { id: "monica", nombre: "Mónica", color: "#6e0d0d" },
    { id: "diego", nombre: "Diego", color: "#4a352d" },
    { id: "paulina", nombre: "Paulina", color: "#96605a" },
];

export const TIPOS: Record<string, string> = {
    parrilla: "Parrilla",
    subir: "Por subir",
    imagen: "Imagen",
    nota: "Nota",
};

export const MESES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
];

export const KEY_NOTAS = "iria_calendar_notas";
export const KEY_OCULTOS = "iria_calendar_calendarios_ocultos";

export const POR_CALENDARIO = Object.fromEntries(
    CALENDARIOS.map((c) => [c.id, c]),
) as Record<string, Calendario>;

export const POR_MIEMBRO = Object.fromEntries(
    MIEMBROS.map((m) => [m.id, m]),
) as Record<string, Miembro>;

const pad = (n: number) => String(n).padStart(2, "0");

export function aFecha(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function crearSemillas(): Evento[] {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = hoy.getMonth();
    const enMes = (dia: number) => `${y}-${pad(m + 1)}-${pad(dia)}`;

    return [
        {
            fecha: enMes(3),
            calendario: "importante",
            tipo: "nota",
            titulo: "Entrega de reporte mensual",
            asignado: "monica",
        },
        {
            fecha: enMes(3),
            calendario: "ibis",
            tipo: "parrilla",
            titulo: "Parrilla Ibis Chihuahua",
            asignado: "vanessa",
        },
        {
            fecha: enMes(5),
            calendario: "bravar",
            tipo: "subir",
            titulo: "Subir 2 reels Bravar",
            asignado: "diego",
        },
        {
            fecha: enMes(6),
            calendario: "calesa",
            tipo: "imagen",
            titulo: "Sesión de fotos Calesa",
            asignado: "paulina",
        },
        {
            fecha: enMes(8),
            calendario: "dega",
            tipo: "nota",
            titulo: "Llamar a Degá",
            asignado: "vanessa",
        },
        {
            fecha: enMes(10),
            calendario: "importante",
            tipo: "nota",
            titulo: "Confirmar junta con clientes",
            asignado: "monica",
        },
        {
            fecha: enMes(10),
            calendario: "ibis",
            tipo: "imagen",
            titulo: "Crear 4 banners Ibis",
            asignado: "daniela",
        },
        {
            fecha: enMes(12),
            calendario: "bravar",
            tipo: "parrilla",
            titulo: "Aprobar parrilla Bravar",
            asignado: "diego",
        },
        {
            fecha: enMes(14),
            calendario: "calesa",
            tipo: "nota",
            titulo: "Enviar factura Calesa",
            asignado: "paulina",
        },
        {
            fecha: enMes(17),
            calendario: "dega",
            tipo: "subir",
            titulo: "Subir menú Degá",
            asignado: "vanessa",
        },
        {
            fecha: enMes(20),
            calendario: "importante",
            tipo: "nota",
            titulo: "Revisión de cuentas",
            asignado: "monica",
        },
        {
            fecha: enMes(22),
            calendario: "ibis",
            tipo: "parrilla",
            titulo: "Parrilla semanal Ibis",
            asignado: "daniela",
        },
        {
            fecha: enMes(24),
            calendario: "bravar",
            tipo: "imagen",
            titulo: "Portada Bravar",
            asignado: "diego",
        },
        {
            fecha: enMes(26),
            calendario: "calesa",
            tipo: "subir",
            titulo: "Subir carrusel Calesa",
            asignado: "paulina",
        },
    ];
}

export function leerNotas(): Evento[] {
    try {
        const crudo = JSON.parse(window.localStorage.getItem(KEY_NOTAS) ?? "[]");
        if (!Array.isArray(crudo)) return [];
        return crudo
            .filter((n) => n && n.fecha && n.titulo)
            .map((n) => ({
                ...n,
                calendario: POR_CALENDARIO[n.calendario]
                    ? n.calendario
                    : "importante",
                asignado: POR_MIEMBRO[n.asignado] ? n.asignado : "",
            }));
    } catch {
        return [];
    }
}

export function guardarNotas(notas: Evento[]) {
    try {
        window.localStorage.setItem(KEY_NOTAS, JSON.stringify(notas));
    } catch {
        /* sin almacenamiento disponible */
    }
}

export function formatearFechaCorta(fecha: string): string {
    const [, m, d] = fecha.split("-").map(Number);
    if (!m || !d) return fecha;
    return `${d} ${MESES[m - 1].slice(0, 3).toLowerCase()}`;
}
