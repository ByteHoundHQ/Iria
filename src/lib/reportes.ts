/* Lógica de la página de reportes: datos, gráficas, tablas y presentación. */

type MetricaId = "alcance" | "interacciones" | "seguidores";

interface Fila {
    fecha: string;
    valor: number;
}

interface Foto {
    src: string;
    nombre: string;
}

interface Seccion {
    filas: Fila[];
    fotos: Foto[];
}

type Estado = Record<MetricaId, Seccion>;

interface Resumen {
    ultimo: number;
    primero: number;
    promedio: number;
    maximo: number;
    variacion: number | null;
}

const CLAVE = "iria_reportes_meta_v1";
const IDS: MetricaId[] = ["alcance", "interacciones", "seguidores"];
const NOMBRES: Record<MetricaId, string> = {
    alcance: "Alcance",
    interacciones: "Interacciones",
    seguidores: "Seguidores",
};
const MAX_FOTOS = 10;
const VISTAS: string[] = [...IDS, "presentacion"];

let estado: Estado = cargarEstado();
let temporizadorToast = 0;

function idMetrica(valor: string | null | undefined): MetricaId {
    return IDS.find((id) => id === valor) ?? "alcance";
}

function estadoInicial(): Estado {
    return {
        alcance: { filas: [], fotos: [] },
        interacciones: { filas: [], fotos: [] },
        seguidores: { filas: [], fotos: [] },
    };
}

function normalizarEstado(bruto: unknown): Estado {
    const base = estadoInicial();
    if (!bruto || typeof bruto !== "object") return base;
    const registro = bruto as Record<string, Partial<Seccion> | undefined>;
    for (const id of IDS) {
        const seccion = registro[id];
        if (!seccion || typeof seccion !== "object") continue;
        if (Array.isArray(seccion.filas)) {
            base[id].filas = seccion.filas
                .filter(
                    (fila) =>
                        fila &&
                        fila.fecha != null &&
                        Number.isFinite(Number(fila.valor)),
                )
                .map((fila) => ({
                    fecha: String(fila.fecha),
                    valor: Number(fila.valor),
                }));
        }
        if (Array.isArray(seccion.fotos)) {
            base[id].fotos = seccion.fotos
                .filter((foto) => foto && typeof foto.src === "string")
                .map((foto) => ({
                    src: foto.src,
                    nombre: String(foto.nombre || "Captura"),
                }));
        }
    }
    return base;
}

function cargarEstado(): Estado {
    try {
        const crudo = localStorage.getItem(CLAVE);
        if (!crudo) return estadoInicial();
        return normalizarEstado(JSON.parse(crudo));
    } catch {
        return estadoInicial();
    }
}

function guardarEstado(): boolean {
    try {
        localStorage.setItem(CLAVE, JSON.stringify(estado));
        return true;
    } catch {
        toast("Sin espacio para guardar todo. Elimina algunas fotos.");
        return false;
    }
}

function toast(mensaje: string): void {
    const aviso = document.getElementById("rep-toast");
    if (!aviso) return;
    aviso.textContent = mensaje;
    aviso.classList.add("visible");
    window.clearTimeout(temporizadorToast);
    temporizadorToast = window.setTimeout(
        () => aviso.classList.remove("visible"),
        3400,
    );
}

/* ---------- Utilidades de formato ---------- */
const fmtNumero = new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 2,
});
const fmtCompacto = new Intl.NumberFormat("es-MX", {
    notation: "compact",
    maximumFractionDigits: 1,
});

function fmtNum(valor: number): string {
    return fmtNumero.format(Number(valor));
}

function fechaISO(anio: number, mes: number, dia: number): string {
    const a = String(anio).padStart(4, "0");
    const m = String(mes).padStart(2, "0");
    const d = String(dia).padStart(2, "0");
    const prueba = new Date(Number(a), Number(m) - 1, Number(d));
    if (
        prueba.getFullYear() !== Number(a) ||
        prueba.getMonth() !== Number(m) - 1 ||
        prueba.getDate() !== Number(d)
    ) {
        return "";
    }
    return `${a}-${m}-${d}`;
}

function hoyISO(): string {
    const hoy = new Date();
    return fechaISO(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());
}

function parseFecha(valor: unknown): string {
    const texto = String(valor ?? "").trim();
    if (!texto) return "";
    let coincidencia = texto.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (coincidencia) {
        return fechaISO(
            Number(coincidencia[1]),
            Number(coincidencia[2]),
            Number(coincidencia[3]),
        );
    }
    coincidencia = texto.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
    if (coincidencia) {
        const uno = Number(coincidencia[1]);
        const dos = Number(coincidencia[2]);
        let anio = Number(coincidencia[3]);
        if (anio < 100) anio += 2000;
        let dia = uno;
        let mes = dos;
        if (uno > 12 && dos <= 12) {
            dia = uno;
            mes = dos;
        } else if (dos > 12 && uno <= 12) {
            dia = dos;
            mes = uno;
        }
        return fechaISO(anio, mes, dia);
    }
    const fecha = new Date(texto);
    if (!Number.isNaN(fecha.getTime())) {
        return fechaISO(fecha.getFullYear(), fecha.getMonth() + 1, fecha.getDate());
    }
    return texto;
}

function aFecha(valor: unknown): Date | null {
    const coincidencia = String(valor ?? "").match(
        /^(\d{4})-(\d{2})-(\d{2})$/,
    );
    if (!coincidencia) return null;
    return new Date(
        Number(coincidencia[1]),
        Number(coincidencia[2]) - 1,
        Number(coincidencia[3]),
    );
}

function fmtFechaCorta(
    fecha: string,
    opciones?: Intl.DateTimeFormatOptions,
): string {
    const valor = aFecha(fecha);
    if (!valor) return String(fecha);
    const formato: Intl.DateTimeFormatOptions = opciones ?? {
        day: "2-digit",
        month: "short",
    };
    return valor.toLocaleDateString("es-MX", formato);
}

function fmtFechaTitulo(fecha: string): string {
    const valor = aFecha(fecha);
    if (!valor) return String(fecha);
    return valor.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function parseNumero(valor: unknown): number {
    if (typeof valor === "number") {
        return Number.isFinite(valor) ? valor : NaN;
    }
    let texto = String(valor ?? "")
        .trim()
        .replace(/\s/g, "")
        .replace(/%/g, "");
    if (!texto) return NaN;
    if (/^-?\d{1,3}(,\d{3})+$/.test(texto)) {
        texto = texto.replace(/,/g, "");
    } else if (/^-?\d{1,3}(\.\d{3})+$/.test(texto)) {
        texto = texto.replace(/\./g, "");
    }
    const coma = texto.lastIndexOf(",");
    const punto = texto.lastIndexOf(".");
    if (coma > punto) {
        texto = texto.replace(/\./g, "").replace(/,/g, ".");
    } else {
        texto = texto.replace(/,/g, "");
    }
    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : NaN;
}

function normalizarTexto(valor: unknown): string {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function escaparHtml(valor: unknown): string {
    const mapa: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    };
    return String(valor).replace(/[&<>"']/g, (c) => mapa[c]);
}

function tiempoFila(fecha: string): number {
    const valor = aFecha(fecha);
    return valor ? valor.getTime() : Number.POSITIVE_INFINITY;
}

function ordenarFilas(filas: Fila[]): Fila[] {
    return [...filas].sort((a, b) => {
        const ta = tiempoFila(a.fecha);
        const tb = tiempoFila(b.fecha);
        if (ta === tb) return 0;
        return ta - tb;
    });
}

/* ---------- Lectura de archivos CSV / JSON ---------- */
function detectarDelimitador(texto: string): string {
    const primera = texto.split(/\r?\n/).find((linea) => linea.trim()) || "";
    const candidatos: Array<[string, number]> = [
        [",", (primera.match(/,/g) || []).length],
        [";", (primera.match(/;/g) || []).length],
        ["\t", (primera.match(/\t/g) || []).length],
    ];
    candidatos.sort((a, b) => b[1] - a[1]);
    return candidatos[0][1] > 0 ? candidatos[0][0] : ",";
}

function parsearCSV(texto: string): string[][] {
    const delimitador = detectarDelimitador(texto);
    const filas: string[][] = [];
    let campo = "";
    let fila: string[] = [];
    let enComillas = false;
    for (let i = 0; i < texto.length; i++) {
        const caracter = texto[i];
        if (enComillas) {
            if (caracter === '"') {
                if (texto[i + 1] === '"') {
                    campo += '"';
                    i++;
                } else {
                    enComillas = false;
                }
            } else {
                campo += caracter;
            }
        } else if (caracter === '"') {
            enComillas = true;
        } else if (caracter === delimitador) {
            fila.push(campo);
            campo = "";
        } else if (caracter === "\n") {
            fila.push(campo);
            campo = "";
            if (fila.some((celda) => String(celda).trim() !== "")) {
                filas.push(fila);
            }
            fila = [];
        } else if (caracter === "\r") {
            continue;
        } else {
            campo += caracter;
        }
    }
    if (campo !== "" || fila.length) {
        fila.push(campo);
        if (fila.some((celda) => String(celda).trim() !== "")) {
            filas.push(fila);
        }
    }
    return filas;
}

function indiceFecha(celdas: string[]): number {
    return celdas.findIndex((celda) =>
        /(fecha|date|dia|periodo|mes|day|semana)/.test(celda),
    );
}

function indiceValor(celdas: string[], metrica: MetricaId): number {
    const patrones: Record<MetricaId, RegExp> = {
        alcance: /(alcance|reach)/,
        interacciones: /(interaccion|interaction|engagement)/,
        seguidores: /(seguidor|follower)/,
    };
    return celdas.findIndex((celda) => patrones[metrica].test(celda));
}

function detectarColumnas(matriz: string[][]): {
    colFecha: number;
    colValor: number;
} {
    const columnas = Math.max(...matriz.map((fila) => fila.length));
    let colFecha = -1;
    let colValor = -1;
    for (let c = 0; c < columnas; c++) {
        const valores = matriz
            .slice(0, 24)
            .map((fila) => fila[c])
            .filter((valor) => valor != null && String(valor).trim() !== "");
        if (!valores.length) continue;
        const fechas = valores.filter((valor) => {
            const texto = String(valor).trim();
            return (
                /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(texto) ||
                /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(texto)
            );
        }).length;
        const numeros = valores.filter((valor) =>
            Number.isFinite(parseNumero(valor)),
        ).length;
        if (fechas >= valores.length * 0.6 && fechas > 0) {
            if (colFecha === -1) colFecha = c;
        } else if (
            numeros >= valores.length * 0.6 &&
            numeros > 0 &&
            c !== colFecha &&
            colValor === -1
        ) {
            colValor = c;
        }
    }
    if (colFecha === -1) colFecha = 0;
    if (colValor === -1) colValor = colFecha === 0 ? 1 : 0;
    return { colFecha, colValor };
}

function filasDesdeCSV(texto: string, metrica: MetricaId): Fila[] {
    const matriz = parsearCSV(texto).filter((fila) =>
        fila.some((celda) => String(celda).trim() !== ""),
    );
    if (!matriz.length) return [];
    let cabecera = -1;
    let colFecha = -1;
    let colValor = -1;
    let respaldo = -1;
    for (let i = 0; i < Math.min(matriz.length, 12); i++) {
        const celdas = matriz[i].map(normalizarTexto);
        const fecha = indiceFecha(celdas);
        const valor = indiceValor(celdas, metrica);
        if (fecha !== -1 && valor !== -1) {
            cabecera = i;
            colFecha = fecha;
            colValor = valor;
            break;
        }
        if (fecha !== -1 && respaldo === -1) {
            respaldo = i;
            colFecha = fecha;
        }
    }
    if (cabecera === -1) cabecera = respaldo;

    let datos: string[][];
    if (cabecera === -1) {
        datos = matriz;
        const detectadas = detectarColumnas(matriz);
        colFecha = detectadas.colFecha;
        colValor = detectadas.colValor;
    } else {
        datos = matriz.slice(cabecera + 1);
        if (colValor === -1) {
            colValor = matriz[cabecera].findIndex(
                (celda, indice) =>
                    indice !== colFecha &&
                    /(valor|value|total|resultado|metric|cantidad|count|number)/.test(
                        normalizarTexto(celda),
                    ),
            );
            if (colValor === -1) {
                colValor = colFecha === 0 ? 1 : 0;
            }
        }
    }

    const filas: Fila[] = [];
    datos.forEach((celdas, indice) => {
        const fecha = parseFecha(celdas[colFecha] ?? "");
        const valor = parseNumero(celdas[colValor] ?? "");
        if (!Number.isFinite(valor)) return;
        filas.push({
            fecha: fecha || `Dato ${indice + 1}`,
            valor,
        });
    });
    return filas;
}

function filasDesdeJSON(texto: string, metrica: MetricaId): Fila[] {
    /* El JSON externo es arbitrario: se valida campo por campo. */
    const datos = JSON.parse(texto) as Record<string, any>;
    let lista: any[] = [];
    if (Array.isArray(datos)) lista = datos;
    else if (datos && typeof datos === "object") {
        if (
            datos.metricas &&
            datos.metricas[metrica] &&
            Array.isArray(datos.metricas[metrica].filas)
        ) {
            lista = datos.metricas[metrica].filas;
        } else if (Array.isArray(datos.data)) lista = datos.data;
        else if (Array.isArray(datos.filas)) lista = datos.filas;
        else if (Array.isArray(datos[metrica])) lista = datos[metrica];
        else {
            lista = Object.entries(datos)
                .filter(([, valor]) => typeof valor === "number")
                .map(([fecha, valor]) => [fecha, valor]);
        }
    }
    const filas: Fila[] = [];
    lista.forEach((elemento, indice) => {
        let fecha: unknown = "";
        let valor = NaN;
        if (Array.isArray(elemento)) {
            fecha = elemento[0];
            valor = parseNumero(elemento[1]);
        } else if (elemento && typeof elemento === "object") {
            fecha =
                elemento.fecha ??
                elemento.date ??
                elemento.Fecha ??
                elemento.Date ??
                elemento.dia ??
                elemento.day ??
                "";
            valor = parseNumero(
                elemento.valor ??
                    elemento.value ??
                    elemento.Valor ??
                    elemento[metrica] ??
                    elemento.total,
            );
        }
        if (!Number.isFinite(valor)) return;
        filas.push({
            fecha: parseFecha(fecha) || `Dato ${indice + 1}`,
            valor,
        });
    });
    return filas;
}

/* ---------- Gráfica de línea ---------- */
function pasoBonito(rango: number, divisiones: number): number {
    const bruto = Math.abs(rango) / Math.max(1, divisiones);
    if (!Number.isFinite(bruto) || bruto <= 0) return 1;
    const potencia = Math.pow(10, Math.floor(Math.log10(bruto)));
    const proporcion = bruto / potencia;
    const multiplicador =
        proporcion > 5 ? 10 : proporcion > 2 ? 5 : proporcion > 1 ? 2 : 1;
    return multiplicador * potencia;
}

function dibujarGrafica(
    host: HTMLElement | null,
    filas: Fila[],
    id: MetricaId,
): void {
    if (!host) return;
    if (!filas || !filas.length) {
        host.hidden = true;
        host.replaceChildren();
        return;
    }
    host.hidden = false;
    const orden = ordenarFilas(filas);
    const W = 900;
    const H = 340;
    const margen = { arriba: 26, derecha: 30, abajo: 48, izquierda: 78 };
    const ancho = W - margen.izquierda - margen.derecha;
    const alto = H - margen.arriba - margen.abajo;
    const valores = orden.map((fila) => fila.valor);
    const minimo = Math.min(...valores);
    const maximo = Math.max(...valores);
    const rango = maximo - minimo;
    const paso = pasoBonito(
        rango || Math.max(1, Math.abs(maximo) * 0.4 || 1),
        4,
    );
    const piso = Math.floor(minimo / paso) * paso;
    const techo = Math.max(piso + paso, Math.ceil(maximo / paso) * paso);
    const x = (indice: number): number =>
        orden.length === 1
            ? margen.izquierda + ancho / 2
            : margen.izquierda + (ancho * indice) / (orden.length - 1);
    const y = (valor: number): number =>
        margen.arriba + alto * (1 - (valor - piso) / (techo - piso));
    const base = margen.arriba + alto;
    const uid = `${id}-${Math.random().toString(36).slice(2, 8)}`;
    const partes: string[] = [];
    partes.push(
        `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Diagrama de línea de ${escaparHtml(NOMBRES[id])}">`,
    );
    partes.push(
        `<defs><linearGradient id="area-${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2c6076" stop-opacity="0.20"></stop><stop offset="100%" stop-color="#2c6076" stop-opacity="0"></stop></linearGradient></defs>`,
    );
    const marcas: number[] = [];
    for (let valor = piso; valor <= techo + paso * 0.5; valor += paso) {
        marcas.push(valor);
    }
    marcas.forEach((valor) => {
        const py = y(valor);
        partes.push(
            `<line x1="${margen.izquierda}" y1="${py.toFixed(2)}" x2="${margen.izquierda + ancho}" y2="${py.toFixed(2)}" stroke="#d8dee4" stroke-width="1"></line>`,
        );
        partes.push(
            `<text x="${margen.izquierda - 12}" y="${(py + 4).toFixed(2)}" text-anchor="end" fill="#6b7785" font-size="12">${escaparHtml(fmtCompacto.format(valor))}</text>`,
        );
    });
    partes.push(
        `<line x1="${margen.izquierda}" y1="${base}" x2="${margen.izquierda + ancho}" y2="${base}" stroke="#bcc5cd" stroke-width="1.2"></line>`,
    );
    const puntos: Array<[number, number]> = orden.map(
        (fila, indice): [number, number] => [x(indice), y(fila.valor)],
    );
    let trazo: string;
    if (puntos.length === 1) {
        trazo = `M${margen.izquierda.toFixed(2)} ${puntos[0][1].toFixed(2)} L${(margen.izquierda + ancho).toFixed(2)} ${puntos[0][1].toFixed(2)}`;
    } else {
        trazo = puntos
            .map(
                ([px, py], indice) =>
                    `${indice === 0 ? "M" : "L"}${px.toFixed(2)} ${py.toFixed(2)}`,
            )
            .join(" ");
    }
    partes.push(
        `<path d="${trazo} L${(margen.izquierda + ancho).toFixed(2)} ${base} L${margen.izquierda.toFixed(2)} ${base} Z" fill="url(#area-${uid})"></path>`,
    );
    partes.push(
        `<path d="${trazo}" fill="none" stroke="#2c6076" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>`,
    );
    puntos.forEach(([px, py], indice) => {
        partes.push(
            `<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="4.5" fill="#ffffff" stroke="#2c6076" stroke-width="2.5"><title>${escaparHtml(fmtFechaTitulo(orden[indice].fecha))}: ${escaparHtml(fmtNum(orden[indice].valor))}</title></circle>`,
        );
    });
    const indices = new Set<number>();
    if (orden.length <= 7) {
        orden.forEach((_, indice) => indices.add(indice));
    } else {
        for (let k = 0; k < 7; k++) {
            indices.add(Math.round((k * (orden.length - 1)) / 6));
        }
    }
    [...indices]
        .sort((a, b) => a - b)
        .forEach((indice) => {
            const px = x(indice);
            const anclaje =
                orden.length === 1
                    ? "middle"
                    : indice === 0
                      ? "start"
                      : indice === orden.length - 1
                        ? "end"
                        : "middle";
            partes.push(
                `<text x="${px.toFixed(2)}" y="${(base + 24).toFixed(2)}" text-anchor="${anclaje}" fill="#6b7785" font-size="12">${escaparHtml(fmtFechaCorta(orden[indice].fecha))}</text>`,
            );
        });
    partes.push("</svg>");
    host.innerHTML = partes.join("");
}

/* ---------- Tablas ---------- */
function crearCelda(texto: string, clase?: string): HTMLTableCellElement {
    const celda = document.createElement("td");
    if (clase) celda.className = clase;
    celda.textContent = texto;
    return celda;
}

function porcentajeCambio(actual: number, anterior: number): number | null {
    if (!Number.isFinite(anterior) || anterior === 0) return null;
    return ((actual - anterior) / Math.abs(anterior)) * 100;
}

function crearFilaCambio(
    actual: number,
    anterior: number,
): HTMLTableCellElement {
    const cambio = porcentajeCambio(actual, anterior);
    if (cambio === null) return crearCelda("—", "cambio");
    return crearCelda(
        `${cambio >= 0 ? "+" : ""}${cambio.toFixed(1)}%`,
        `cambio ${cambio >= 0 ? "sube" : "baja"}`,
    );
}

function llenarTabla(id: MetricaId): void {
    const tabla = document.querySelector<HTMLTableElement>(
        `table[data-tabla="${id}"]`,
    );
    if (!tabla) return;
    const cuerpo = tabla.querySelector<HTMLTableSectionElement>("tbody");
    if (!cuerpo) return;
    const orden = ordenarFilas(estado[id].filas);
    cuerpo.replaceChildren();
    orden.forEach((fila, indice) => {
        const tr = document.createElement("tr");
        tr.append(crearCelda(fmtFechaTitulo(fila.fecha)));
        tr.append(crearCelda(fmtNum(fila.valor), "num"));
        tr.append(
            indice === 0
                ? crearCelda("—", "cambio")
                : crearFilaCambio(fila.valor, orden[indice - 1].valor),
        );
        const acciones = document.createElement("td");
        acciones.className = "celda-acciones";
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "btn-eliminar";
        boton.textContent = "Eliminar";
        boton.setAttribute(
            "aria-label",
            `Eliminar el dato del ${fmtFechaTitulo(fila.fecha)}`,
        );
        boton.addEventListener("click", () => {
            estado[id].filas = estado[id].filas.filter(
                (registro) => registro.fecha !== fila.fecha,
            );
            guardarEstado();
            actualizarTodo();
            toast("Registro eliminado.");
        });
        acciones.append(boton);
        tr.append(acciones);
        cuerpo.append(tr);
    });
    const contenedor = tabla.closest<HTMLElement>(".tabla-wrap");
    if (contenedor) contenedor.hidden = orden.length === 0;
    const vacio = document.querySelector<HTMLElement>(
        `[data-vacio-tabla="${id}"]`,
    );
    if (vacio) vacio.hidden = orden.length > 0;
}

function llenarTablaPresentacion(id: MetricaId): void {
    const tabla = document.querySelector<HTMLTableElement>(
        `table[data-pres-tabla="${id}"]`,
    );
    if (!tabla) return;
    const cuerpo = tabla.querySelector<HTMLTableSectionElement>("tbody");
    if (!cuerpo) return;
    const orden = ordenarFilas(estado[id].filas);
    cuerpo.replaceChildren();
    orden.forEach((fila, indice) => {
        const tr = document.createElement("tr");
        tr.append(crearCelda(fmtFechaTitulo(fila.fecha)));
        tr.append(crearCelda(fmtNum(fila.valor), "num"));
        tr.append(
            indice === 0
                ? crearCelda("—", "cambio")
                : crearFilaCambio(fila.valor, orden[indice - 1].valor),
        );
        cuerpo.append(tr);
    });
    const contenedor = document.querySelector<HTMLElement>(
        `[data-pres-tabla-wrap="${id}"]`,
    );
    if (contenedor) contenedor.hidden = orden.length === 0;
}

/* ---------- Galerías ---------- */
function abrirLightbox(foto: Foto): void {
    const caja = document.getElementById("lightbox");
    const imagen = document.querySelector<HTMLImageElement>("#lightbox-img");
    const leyenda = document.getElementById("lightbox-caption");
    if (!caja || !imagen || !leyenda) return;
    imagen.src = foto.src;
    imagen.alt = foto.nombre;
    leyenda.textContent = foto.nombre;
    caja.hidden = false;
    document.body.style.overflow = "hidden";
}

function cerrarLightbox(): void {
    const caja = document.getElementById("lightbox");
    if (!caja || caja.hidden) return;
    caja.hidden = true;
    document.body.style.overflow = "";
    const imagen = document.querySelector<HTMLImageElement>("#lightbox-img");
    if (imagen) imagen.removeAttribute("src");
}

function llenarGaleria(id: MetricaId): void {
    const contenedor = document.querySelector<HTMLElement>(
        `[data-galeria="${id}"]`,
    );
    if (!contenedor) return;
    contenedor.replaceChildren();
    estado[id].fotos.forEach((foto) => {
        const figura = document.createElement("figure");
        figura.className = "foto";
        const abrir = document.createElement("button");
        abrir.type = "button";
        abrir.className = "foto-abrir";
        abrir.setAttribute("aria-label", `Ver captura: ${foto.nombre}`);
        const imagen = document.createElement("img");
        imagen.src = foto.src;
        imagen.alt = foto.nombre;
        imagen.loading = "lazy";
        abrir.append(imagen);
        abrir.addEventListener("click", () => abrirLightbox(foto));
        const borrar = document.createElement("button");
        borrar.type = "button";
        borrar.className = "foto-eliminar";
        borrar.textContent = "×";
        borrar.setAttribute(
            "aria-label",
            `Eliminar captura: ${foto.nombre}`,
        );
        borrar.addEventListener("click", () => {
            estado[id].fotos = estado[id].fotos.filter(
                (registro) => registro !== foto,
            );
            guardarEstado();
            actualizarTodo();
            toast("Foto eliminada.");
        });
        figura.append(abrir, borrar);
        contenedor.append(figura);
    });
    if (estado[id].fotos.length < MAX_FOTOS) {
        const agregar = document.createElement("button");
        agregar.type = "button";
        agregar.className = "foto-agregar";
        agregar.innerHTML =
            '<strong aria-hidden="true">+</strong><span>Agregar foto</span>';
        agregar.setAttribute("aria-label", `Agregar fotos de ${NOMBRES[id]}`);
        agregar.addEventListener("click", () => {
            document
                .querySelector<HTMLInputElement>(`[data-fotos-input="${id}"]`)
                ?.click();
        });
        contenedor.append(agregar);
    }
}

function llenarGaleriaPresentacion(id: MetricaId): void {
    const contenedor = document.querySelector<HTMLElement>(
        `[data-pres-galeria="${id}"]`,
    );
    if (!contenedor) return;
    contenedor.replaceChildren();
    estado[id].fotos.forEach((foto) => {
        const figura = document.createElement("figure");
        figura.className = "foto";
        const abrir = document.createElement("button");
        abrir.type = "button";
        abrir.className = "foto-abrir";
        abrir.setAttribute("aria-label", `Ver captura: ${foto.nombre}`);
        const imagen = document.createElement("img");
        imagen.src = foto.src;
        imagen.alt = foto.nombre;
        imagen.loading = "lazy";
        abrir.append(imagen);
        abrir.addEventListener("click", () => abrirLightbox(foto));
        figura.append(abrir);
        contenedor.append(figura);
    });
    contenedor.hidden = estado[id].fotos.length === 0;
    const etiqueta = document.querySelector<HTMLElement>(
        `[data-pres-fotos-label="${id}"]`,
    );
    if (etiqueta) etiqueta.hidden = estado[id].fotos.length === 0;
}

/* ---------- Resumen y presentación ---------- */
function resumenFilas(filas: Fila[]): Resumen {
    const orden = ordenarFilas(filas);
    const valores = orden.map((fila) => fila.valor);
    const ultimo = valores[valores.length - 1];
    const primero = valores[0];
    const promedio =
        valores.reduce((total, valor) => total + valor, 0) / valores.length;
    const maximo = Math.max(...valores);
    const variacion =
        primero === 0 ? null : ((ultimo - primero) / Math.abs(primero)) * 100;
    return { ultimo, primero, promedio, maximo, variacion };
}

function agregarKpi(
    contenedor: HTMLElement,
    etiqueta: string,
    valor: string,
    clase?: string,
): void {
    const caja = document.createElement("div");
    caja.className = "pres-kpi";
    const titulo = document.createElement("span");
    titulo.textContent = etiqueta;
    const dato = document.createElement("strong");
    dato.textContent = valor;
    if (clase) dato.classList.add(clase);
    caja.append(titulo, dato);
    contenedor.append(caja);
}

function actualizarPresentacion(): number {
    const fechaEl = document.querySelector<HTMLElement>("[data-pres-fecha]");
    if (fechaEl) {
        fechaEl.textContent = `Generado el ${new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}`;
    }
    let secciones = 0;
    IDS.forEach((id) => {
        const bloque = document.querySelector<HTMLElement>(
            `[data-pres-bloque="${id}"]`,
        );
        if (!bloque) return;
        const filas = estado[id].filas;
        const fotos = estado[id].fotos;
        const tieneDatos = filas.length > 0 || fotos.length > 0;
        bloque.hidden = !tieneDatos;
        if (!tieneDatos) return;
        secciones++;
        const orden = ordenarFilas(filas);
        const rango = document.querySelector<HTMLElement>(
            `[data-pres-rango="${id}"]`,
        );
        if (rango) {
            if (!orden.length) {
                rango.textContent = "Capturas sin datos numéricos";
            } else if (orden.length === 1) {
                rango.textContent = fmtFechaTitulo(orden[0].fecha);
            } else {
                const opciones: Intl.DateTimeFormatOptions = {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                };
                rango.textContent = `${fmtFechaCorta(orden[0].fecha, opciones)} — ${fmtFechaCorta(orden[orden.length - 1].fecha, opciones)}`;
            }
        }
        const kpis = document.querySelector<HTMLElement>(
            `[data-pres-kpis="${id}"]`,
        );
        if (kpis) {
            kpis.replaceChildren();
            if (filas.length) {
                const resumen = resumenFilas(filas);
                agregarKpi(kpis, "Último dato", fmtNum(resumen.ultimo));
                agregarKpi(
                    kpis,
                    "Promedio",
                    fmtNum(Math.round(resumen.promedio * 100) / 100),
                );
                agregarKpi(kpis, "Máximo", fmtNum(resumen.maximo));
                agregarKpi(
                    kpis,
                    "Variación",
                    resumen.variacion === null
                        ? "—"
                        : `${resumen.variacion >= 0 ? "+" : ""}${resumen.variacion.toFixed(1)}%`,
                    resumen.variacion === null
                        ? ""
                        : resumen.variacion >= 0
                          ? "sube"
                          : "baja",
                );
                agregarKpi(kpis, "Registros", String(filas.length));
            }
            kpis.hidden = filas.length === 0;
        }
        const grafica = document.querySelector<HTMLElement>(
            `[data-pres-grafica="${id}"]`,
        );
        if (grafica) {
            dibujarGrafica(grafica, filas, id);
            grafica.hidden = filas.length === 0;
        }
        llenarTablaPresentacion(id);
        llenarGaleriaPresentacion(id);
    });
    const vacio = document.querySelector<HTMLElement>("[data-pres-vacio]");
    if (vacio) vacio.hidden = secciones > 0;
    return secciones;
}

/* ---------- Fotos ---------- */
function comprimirImagen(archivo: File): Promise<string> {
    return new Promise((resolver, rechazar) => {
        const url = URL.createObjectURL(archivo);
        const imagen = new Image();
        imagen.onload = () => {
            try {
                const maximo = 900;
                const escala = Math.min(
                    1,
                    maximo /
                        Math.max(
                            imagen.naturalWidth || 1,
                            imagen.naturalHeight || 1,
                        ),
                );
                const ancho = Math.max(
                    1,
                    Math.round((imagen.naturalWidth || 1) * escala),
                );
                const alto = Math.max(
                    1,
                    Math.round((imagen.naturalHeight || 1) * escala),
                );
                const lienzo = document.createElement("canvas");
                lienzo.width = ancho;
                lienzo.height = alto;
                const contexto = lienzo.getContext("2d");
                if (!contexto) throw new Error("Canvas no disponible");
                contexto.fillStyle = "#ffffff";
                contexto.fillRect(0, 0, ancho, alto);
                contexto.drawImage(imagen, 0, 0, ancho, alto);
                resolver(lienzo.toDataURL("image/jpeg", 0.72));
            } catch (error) {
                rechazar(error);
            } finally {
                URL.revokeObjectURL(url);
            }
        };
        imagen.onerror = () => {
            URL.revokeObjectURL(url);
            rechazar(new Error("Formato de imagen no compatible"));
        };
        imagen.src = url;
    });
}

async function agregarFotos(id: MetricaId, archivos: FileList): Promise<void> {
    const lista = Array.from(archivos);
    const espacio = MAX_FOTOS - estado[id].fotos.length;
    if (espacio <= 0) {
        toast(`Puedes guardar hasta ${MAX_FOTOS} fotos por métrica.`);
        return;
    }
    if (lista.length > espacio) {
        toast(
            `Se agregarán ${espacio} de ${lista.length} fotos (límite ${MAX_FOTOS}).`,
        );
    }
    let agregadas = 0;
    for (const archivo of lista.slice(0, espacio)) {
        if (!archivo.type.startsWith("image/")) continue;
        try {
            const src = await comprimirImagen(archivo);
            estado[id].fotos.push({
                src,
                nombre: archivo.name.replace(/\.[^.]+$/, ""),
            });
            agregadas++;
        } catch {
            toast(`No se pudo procesar ${archivo.name}.`);
        }
    }
    if (!agregadas) return;
    guardarEstado();
    actualizarTodo();
    toast(
        `${agregadas} ${agregadas === 1 ? "foto agregada" : "fotos agregadas"}.`,
    );
}

/* ---------- Importación ---------- */
async function importarArchivo(id: MetricaId, archivo: File): Promise<void> {
    try {
        const texto = await archivo.text();
        if (!texto.trim()) {
            throw new Error("El archivo está vacío.");
        }
        const esJSON =
            /\.json$/i.test(archivo.name) ||
            texto.trim().startsWith("[") ||
            texto.trim().startsWith("{");
        const filas = esJSON
            ? filasDesdeJSON(texto, id)
            : filasDesdeCSV(texto, id);
        if (!filas.length) {
            throw new Error(
                "No se encontraron filas con fecha y valor válidos.",
            );
        }
        let nuevas = 0;
        let actualizadas = 0;
        filas.forEach((fila) => {
            const existente = estado[id].filas.find(
                (registro) => registro.fecha === fila.fecha,
            );
            if (existente) {
                existente.valor = fila.valor;
                actualizadas++;
            } else {
                estado[id].filas.push(fila);
                nuevas++;
            }
        });
        guardarEstado();
        actualizarTodo();
        toast(
            `${NOMBRES[id]}: ${nuevas} datos nuevos, ${actualizadas} actualizados.`,
        );
    } catch (error) {
        toast(
            error instanceof Error
                ? error.message
                : "No se pudo leer el archivo.",
        );
    }
}

/* ---------- Actualización general ---------- */
function actualizarTodo(): void {
    IDS.forEach((id) => {
        const filas = estado[id].filas;
        const fotos = estado[id].fotos;
        const orden = ordenarFilas(filas);
        const subtitulo = document.querySelector<HTMLElement>(
            `[data-sub="${id}"]`,
        );
        if (subtitulo) {
            if (!filas.length && !fotos.length) {
                subtitulo.textContent = "Sin datos.";
            } else {
                const partes: string[] = [];
                if (filas.length) {
                    partes.push(
                        `${filas.length} ${filas.length === 1 ? "registro" : "registros"}`,
                    );
                }
                if (fotos.length) {
                    partes.push(
                        `${fotos.length} ${fotos.length === 1 ? "foto" : "fotos"}`,
                    );
                }
                if (orden.length) {
                    partes.push(
                        orden.length === 1
                            ? fmtFechaCorta(orden[0].fecha, {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                              })
                            : `${fmtFechaCorta(orden[0].fecha)} – ${fmtFechaCorta(orden[orden.length - 1].fecha)}`,
                    );
                }
                subtitulo.textContent = partes.join(" · ");
            }
        }
        const rango = document.querySelector<HTMLElement>(
            `[data-rango="${id}"]`,
        );
        if (rango) {
            rango.textContent = !orden.length
                ? ""
                : orden.length === 1
                  ? fmtFechaTitulo(orden[0].fecha)
                  : `${fmtFechaCorta(orden[0].fecha)} — ${fmtFechaCorta(orden[orden.length - 1].fecha)}`;
        }
        const vacio = document.querySelector<HTMLElement>(
            `[data-vacio="${id}"]`,
        );
        if (vacio) vacio.hidden = filas.length > 0;
        dibujarGrafica(
            document.querySelector<HTMLElement>(`[data-grafica="${id}"]`),
            filas,
            id,
        );
        llenarTabla(id);
        llenarGaleria(id);
        const conteo = document.querySelector<HTMLElement>(
            `[data-conteo="${id}"]`,
        );
        if (conteo) {
            conteo.textContent = `${filas.length} ${filas.length === 1 ? "registro" : "registros"}`;
        }
        const conteoFotos = document.querySelector<HTMLElement>(
            `[data-conteo-fotos="${id}"]`,
        );
        if (conteoFotos) {
            conteoFotos.textContent = `${fotos.length} ${fotos.length === 1 ? "foto" : "fotos"}`;
        }
        const cuenta = document.querySelector<HTMLElement>(
            `[data-cuenta="${id}"]`,
        );
        if (cuenta) cuenta.textContent = String(filas.length);
    });
    const secciones = actualizarPresentacion();
    const cuentaPresentacion = document.querySelector<HTMLElement>(
        '[data-cuenta="presentacion"]',
    );
    if (cuentaPresentacion) {
        cuentaPresentacion.textContent = String(secciones);
    }
}

/* ---------- Navegación ---------- */
function vistaDesdeHash(): string {
    const vista = window.location.hash.replace("#", "");
    return VISTAS.includes(vista) ? vista : "alcance";
}

function mostrarVista(id: string): void {
    const destino = VISTAS.includes(id) ? id : "alcance";
    document.querySelectorAll<HTMLElement>("[data-vista]").forEach((seccion) => {
        seccion.hidden = seccion.getAttribute("data-vista") !== destino;
    });
    document.querySelectorAll<HTMLElement>("[data-ir]").forEach((boton) => {
        const activo = boton.getAttribute("data-ir") === destino;
        if (activo) boton.setAttribute("aria-current", "true");
        else boton.removeAttribute("aria-current");
    });
    cerrarLightbox();
}

function irA(id: string): void {
    if (window.location.hash === `#${id}`) mostrarVista(id);
    else window.location.hash = id;
}

/* ---------- Formulario manual ---------- */
function alternarManual(id: MetricaId, mostrar: boolean): void {
    const formulario = document.querySelector<HTMLFormElement>(
        `[data-form="${id}"]`,
    );
    const boton = document.querySelector<HTMLButtonElement>(
        `[data-accion="manual"][data-metrica="${id}"]`,
    );
    if (!formulario || !boton) return;
    formulario.hidden = !mostrar;
    boton.setAttribute("aria-expanded", String(mostrar));
    if (mostrar) {
        const fecha = formulario.querySelector<HTMLInputElement>(
            'input[name="fecha"]',
        );
        const valor = formulario.querySelector<HTMLInputElement>(
            'input[name="valor"]',
        );
        if (fecha && !fecha.value) fecha.value = hoyISO();
        if (valor) valor.focus();
    }
}

/* ---------- Exportación ---------- */
function exportarDatos(): void {
    const contenido = JSON.stringify(
        {
            generado: new Date().toISOString(),
            metricas: estado,
        },
        null,
        2,
    );
    const blob = new Blob([contenido], {
        type: "application/json",
    });
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(blob);
    enlace.download = `reportes-${hoyISO()}.json`;
    enlace.click();
    window.setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
    toast("Datos exportados.");
}

/* ---------- Arranque ---------- */
export function inicializarReportes(): void {
    document.querySelectorAll<HTMLButtonElement>("[data-accion]").forEach(
        (boton) => {
            const accion = boton.getAttribute("data-accion");
            const id = idMetrica(boton.getAttribute("data-metrica"));
            if (accion === "importar") {
                boton.addEventListener("click", () => {
                    document
                        .querySelector<HTMLInputElement>(`[data-file="${id}"]`)
                        ?.click();
                });
            } else if (accion === "manual") {
                boton.addEventListener("click", () => {
                    const formulario = document.querySelector<HTMLFormElement>(
                        `[data-form="${id}"]`,
                    );
                    alternarManual(id, formulario?.hidden !== false);
                });
            } else if (accion === "cerrar-manual") {
                boton.addEventListener("click", () => alternarManual(id, false));
            } else if (accion === "limpiar") {
                boton.addEventListener("click", () => {
                    const confirmado = window.confirm(
                        `¿Eliminar todos los datos y fotos de ${NOMBRES[id]}?`,
                    );
                    if (!confirmado) return;
                    estado[id] = { filas: [], fotos: [] };
                    guardarEstado();
                    actualizarTodo();
                    toast("Sección limpiada.");
                });
            } else if (accion === "fotos") {
                boton.addEventListener("click", () => {
                    document
                        .querySelector<HTMLInputElement>(
                            `[data-fotos-input="${id}"]`,
                        )
                        ?.click();
                });
            } else if (accion === "exportar") {
                boton.addEventListener("click", exportarDatos);
            } else if (accion === "imprimir") {
                boton.addEventListener("click", () => window.print());
            }
        },
    );

    document
        .querySelectorAll<HTMLFormElement>("[data-form]")
        .forEach((formulario) => {
            const id = idMetrica(formulario.getAttribute("data-form"));
            formulario.addEventListener("submit", (evento) => {
                evento.preventDefault();
                const datos = new FormData(formulario);
                const fechaCruda = String(datos.get("fecha") || "").trim();
                const valor = Number(datos.get("valor"));
                if (!fechaCruda || !Number.isFinite(valor)) {
                    toast("Completa la fecha y un valor numérico.");
                    return;
                }
                const fecha = parseFecha(fechaCruda) || fechaCruda;
                const existente = estado[id].filas.find(
                    (registro) => registro.fecha === fecha,
                );
                if (existente) {
                    existente.valor = valor;
                    toast(`Dato del ${fmtFechaTitulo(fecha)} actualizado.`);
                } else {
                    estado[id].filas.push({ fecha, valor });
                    toast(
                        `Dato agregado: ${fmtFechaCorta(fecha)} · ${fmtNum(valor)}.`,
                    );
                }
                guardarEstado();
                actualizarTodo();
                formulario.reset();
                const campoFecha = formulario.querySelector<HTMLInputElement>(
                    'input[name="fecha"]',
                );
                const campoValor = formulario.querySelector<HTMLInputElement>(
                    'input[name="valor"]',
                );
                if (campoFecha) campoFecha.value = hoyISO();
                if (campoValor) campoValor.focus();
            });
        });

    document
        .querySelectorAll<HTMLInputElement>("[data-file]")
        .forEach((input) => {
            const id = idMetrica(input.getAttribute("data-file"));
            input.addEventListener("change", () => {
                const archivo = input.files && input.files[0];
                if (archivo) importarArchivo(id, archivo);
                input.value = "";
            });
        });

    document
        .querySelectorAll<HTMLInputElement>("[data-fotos-input]")
        .forEach((input) => {
            const id = idMetrica(input.getAttribute("data-fotos-input"));
            input.addEventListener("change", () => {
                if (input.files && input.files.length) {
                    agregarFotos(id, input.files);
                }
                input.value = "";
            });
        });

    document.querySelectorAll<HTMLElement>("[data-ir]").forEach((boton) => {
        boton.addEventListener("click", () => {
            irA(boton.getAttribute("data-ir") || "alcance");
        });
    });

    /* ---------- Menú de importación ---------- */
    const botonImportar = document.getElementById("btn-importar");
    const menuImportar = document.getElementById("menu-importar");

    function cerrarMenu(): void {
        if (!menuImportar || !botonImportar) return;
        menuImportar.hidden = true;
        botonImportar.setAttribute("aria-expanded", "false");
    }

    botonImportar?.addEventListener("click", (evento) => {
        evento.stopPropagation();
        if (!menuImportar) return;
        const abrir = menuImportar.hidden;
        menuImportar.hidden = !abrir;
        botonImportar.setAttribute("aria-expanded", String(abrir));
    });

    document
        .querySelectorAll<HTMLButtonElement>("[data-importar]")
        .forEach((boton) => {
            boton.addEventListener("click", () => {
                const id = idMetrica(boton.getAttribute("data-importar"));
                cerrarMenu();
                mostrarVista(id);
                if (window.location.hash !== `#${id}`) {
                    window.location.hash = id;
                }
                document
                    .querySelector<HTMLInputElement>(`[data-file="${id}"]`)
                    ?.click();
            });
        });

    document.addEventListener("click", (evento) => {
        if (
            menuImportar &&
            !menuImportar.hidden &&
            evento.target instanceof Node &&
            !menuImportar.contains(evento.target) &&
            !botonImportar?.contains(evento.target)
        ) {
            cerrarMenu();
        }
    });

    /* ---------- Lightbox ---------- */
    document
        .querySelector<HTMLButtonElement>(".lightbox-cerrar")
        ?.addEventListener("click", cerrarLightbox);
    document
        .getElementById("lightbox")
        ?.addEventListener("click", (evento) => {
            if (evento.target === evento.currentTarget) cerrarLightbox();
        });
    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") {
            cerrarLightbox();
            cerrarMenu();
        }
    });

    window.addEventListener("hashchange", () => {
        mostrarVista(vistaDesdeHash());
    });

    document
        .querySelectorAll<HTMLInputElement>('input[name="fecha"]')
        .forEach((campo) => {
            if (!campo.value) campo.value = hoyISO();
        });

    mostrarVista(vistaDesdeHash());
    actualizarTodo();
}
