import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "./supabase-browser";

export type ResultadoLogin = { ok: boolean; error: string | null };

export async function iniciarSesion(
    correo: string,
    contrasena: string,
): Promise<ResultadoLogin> {
    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase.auth.signInWithPassword({
        email: correo.trim(),
        password: contrasena,
    });

    if (error) {
        return { ok: false, error: error.message };
    }

    window.dispatchEvent(new CustomEvent("iria:auth-change"));
    return { ok: true, error: null };
}

export async function cerrarSesion(): Promise<void> {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    window.dispatchEvent(new CustomEvent("iria:auth-change"));
}

export async function obtenerSesion(): Promise<Session | null> {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.auth.getSession();
    return data.session;
}

export async function estaAutenticado(): Promise<boolean> {
    return Boolean(await obtenerSesion());
}

export async function obtenerCorreo(): Promise<string | null> {
    const sesion = await obtenerSesion();
    return sesion?.user.email ?? null;
}
