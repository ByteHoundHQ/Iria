import { defineMiddleware } from "astro:middleware";
import { createClient } from "./lib/supabase";

const RUTAS_PROTEGIDAS = [
    "/seleccion",
    "/dashboard",
    "/client",
    "/calendar",
    "/aproved",
    "/upload",
    "/reportes",
    "/ind_1",
    "/ind_2",
    "/ind_3",
];

function esRutaProtegida(pathname: string): boolean {
    return RUTAS_PROTEGIDAS.some(
        (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`),
    );
}

export const onRequest = defineMiddleware(async (context, next) => {
    const supabase = createClient({
        request: context.request,
        cookies: context.cookies,
    });

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname = context.url.pathname;

    if (esRutaProtegida(pathname) && !user) {
        return context.redirect("/");
    }

    if (pathname === "/" && user) {
        return context.redirect("/seleccion");
    }

    return next();
});
