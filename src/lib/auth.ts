const AUTH_KEY = "iria_auth";
const USER_KEY = "iria_user";

function enNavegador(): boolean {
    return (
        typeof window !== "undefined" && typeof sessionStorage !== "undefined"
    );
}

export function estaAutenticado(): boolean {
    if (!enNavegador()) return false;
    return sessionStorage.getItem(AUTH_KEY) === "true";
}

export function obtenerCorreo(): string | null {
    if (!enNavegador()) return null;
    return sessionStorage.getItem(USER_KEY);
}

export function credencialesConfiguradas(): boolean {
    return Boolean(
        import.meta.env.PUBLIC_AUTH_EMAIL &&
            import.meta.env.PUBLIC_AUTH_PASSWORD,
    );
}

export function iniciarSesion(correo: string, contrasena: string): boolean {
    if (!enNavegador()) return false;

    const AUTH_EMAIL = import.meta.env.PUBLIC_AUTH_EMAIL;
    const AUTH_PASSWORD = import.meta.env.PUBLIC_AUTH_PASSWORD;

    const correoLimpio = correo.trim();

    if (!AUTH_EMAIL || !AUTH_PASSWORD) return false;

    if (correoLimpio === AUTH_EMAIL && contrasena === AUTH_PASSWORD) {
        sessionStorage.setItem(AUTH_KEY, "true");
        sessionStorage.setItem(USER_KEY, correoLimpio);
        window.dispatchEvent(new CustomEvent("iria:auth-change"));
        return true;
    }

    return false;
}

export function cerrarSesion(): void {
    if (!enNavegador()) return;
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(USER_KEY);
    window.dispatchEvent(new CustomEvent("iria:auth-change"));
}
