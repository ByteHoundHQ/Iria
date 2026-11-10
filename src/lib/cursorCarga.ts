let inicializado = false;
let cargando = false;
let punteroUsado = false;
let posX = 0;
let posY = 0;
let frame: number | null = null;
let cursor: HTMLElement | null = null;
let estado: HTMLElement | null = null;
let elementoActivo: HTMLElement | null = null;

const pintarCursor = () => {
    frame = null;
    if (!cursor) return;
    cursor.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;
};

const programarCursor = () => {
    if (frame === null) frame = window.requestAnimationFrame(pintarCursor);
};

export function estaCargando(): boolean {
    return cargando;
}

/**
 * Activa el cursor de carga. Devuelve false si ya había una carga en curso.
 * Si se activa con teclado (sin puntero), el cursor aparece en el centro
 * del elemento recibido.
 */
export function activarCursorCarga(elemento?: HTMLElement | null): boolean {
    if (cargando) return false;
    cargando = true;

    if (!punteroUsado && elemento) {
        const caja = elemento.getBoundingClientRect();
        posX = caja.left + caja.width / 2;
        posY = caja.top + caja.height / 2;
    }
    pintarCursor();

    elementoActivo = elemento ?? null;
    elementoActivo?.setAttribute("aria-busy", "true");
    document.body.classList.add("cargando");
    if (estado) estado.textContent = "Cargando…";

    return true;
}

export function reiniciarCursorCarga(): void {
    cargando = false;
    elementoActivo?.removeAttribute("aria-busy");
    elementoActivo = null;
    document.body.classList.remove("cargando");
    if (estado) estado.textContent = "";
}

/**
 * Inicializa el cursor una sola vez por página y engancha la delegación
 * para cualquier elemento marcado con [data-cursor-carga].
 */
export function inicializarCursorCarga(): void {
    if (inicializado || typeof document === "undefined") return;
    inicializado = true;

    cursor = document.getElementById("cursor-carga");
    estado = document.getElementById("estado-carga");
    posX = window.innerWidth / 2;
    posY = window.innerHeight / 2;

    document.addEventListener(
        "pointermove",
        (event) => {
            punteroUsado = true;
            posX = event.clientX;
            posY = event.clientY;
            if (cargando) programarCursor();
        },
        { passive: true },
    );

    const objetivoDe = (target: EventTarget | null) =>
        (target as Element | null)?.closest<HTMLElement>(
            "[data-cursor-carga]",
        ) ?? null;

    document.addEventListener("pointerdown", (event) => {
        if (
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }
        const objetivo = objetivoDe(event.target);
        if (objetivo) activarCursorCarga(objetivo);
    });

    document.addEventListener("click", (event) => {
        // event.detail === 0 indica activación por teclado.
        if (event.detail !== 0) return;
        const objetivo = objetivoDe(event.target);
        if (objetivo) activarCursorCarga(objetivo);
    });

    // Al volver con el botón "atrás" (bfcache) hay que limpiar el estado.
    window.addEventListener("pageshow", () => {
        if (cargando) reiniciarCursorCarga();
    });
}
