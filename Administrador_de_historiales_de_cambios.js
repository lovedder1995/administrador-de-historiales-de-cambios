#!/usr/bin/env node
import { spawnSync as ejecutar } from "child_process"
import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import prompts from "prompts"
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
/*
| #Administrador_de_historiales_de_cambios Administrador de historiales de cambios
===========================================
= Administrador de historiales de cambios =
===========================================
*/
/*
| #Menú Menú
--------
- Menú -
--------
*/
const Opciones_disponibles = {
    /*
    | #Lista_de_cambios (condicional) Lista de cambios
    [ Lista de cambios ]
    */
    "Lista de cambios": () => {
    /* La lista se la pedimos a Git. */ const git = ejecutar("git", ["status"])

        /* Dando por hecho que recibimos la lista correctamente, */ let texto = ((git.stdout && git.stdout.toString("utf8")) || "") + ((git.stderr && git.stderr.toString("utf8")) || "")
        /* hacemos la siguiente traducción */ texto = texto.replace(
            "Changes to be committed:", "Cambios revisados:").replace(
            "Changes not staged for commit:", "Cambios sin revisar:").replace(
            "Untracked files:", "Cambios sin revisar:")

        /* Estando traducida, la mostramos. */ process.stdout.write(texto); process.exit(git.status ?? 0)},
    /*
    | #Confirmar_la_revisión_de_todos_los_cambios (condicional) Confirmar la revisión de todos los cambios
    [ Confirmar la revisión de todos los cambios ]
    */
    "Confirmar la revisión de todos los cambios": () => {
    /* La confirmación se la pedimos a Git. */ const git = ejecutar("git", ["add", "."])

        /* El mensaje que nos devuelva Git */ let texto = ((git.stdout && git.stdout.toString("utf8")) || "") + ((git.stderr && git.stderr.toString("utf8")) || "")
        /* lo mostramos tal cual como Git nos lo da. */ process.stdout.write(texto); process.exit(git.status ?? 0)},
    /*
    | #Guardar_revisión (condicional) Guardar revisión
    [ Guardar revisión ]
    */
    "Guardar revisión": () => {
    /* Le preguntamos a Git si hay cambios revisados para guardar. */ const cambios_revisados = ejecutar("git", ["diff", "--cached", "--name-only"], { encoding: "utf8" })

        /* Si no hay cambios revisados, */ if (!(!cambios_revisados.error && (cambios_revisados.status ?? 0) === 0 && String(cambios_revisados.stdout || "").trim() !== "")) {
        /* notificamos al usuario. */ console.error("No hay cambios revisados para guardar"); process.exit(1) }

        /* Si sí hay cambios revisados, le preguntamos a Git cuándo fue la revisión anterior. */ let revisión_anterior = ejecutar("git", ["log", "-1", "--pretty=%s"])
        /* En base a la revisión anterior, vamos a calcular cuál será la fecha y número de esta nueva revisión. */ let revisión

        /* También consultamos la fecha de hoy */ const ahora = new Date()
        /* y la acomodamos por año, mes y día (AAAA.M.D). */ const fecha = `${ahora.getFullYear()}.${ahora.getMonth() + 1}.${ahora.getDate()}`

        /* Si no hay una revisión anterior, */ if ((revisión_anterior.status ?? 0) !== 0) {
            /* esta será la primera revisión. Tendrá la fecha de hoy y empezará en 1. */ revisión = `${fecha}-1`

            /* Si sí hay una revisión anterior, */ } else { revisión_anterior = (revisión_anterior.stdout?.toString("utf8") || "").trim()
            /* la comparamos con la fecha hoy para ver si es de hoy mismo. */ const es_de_hoy = revisión_anterior.startsWith(`${fecha}-`)

            /* Si la revisión anterior es de hoy, */ if (es_de_hoy) {
            /* le extraemos el número de revisión, */ const número_de_revisión = revisión_anterior.split("-")[1]
                /* y le incrementamos uno para esta nueva revisión. */ revisión = `${fecha}-${Number(número_de_revisión) + 1}`

            /* Si no es de hoy, */} else {
            /* la nueva revisión tendrá la fecha de hoy y empezará en 1. */ revisión = `${fecha}-1`  } }

        /* Si hay un manifiesto */ const ruta_del_manifiesto = join(process.cwd(), "package.json")
        /* de dependencias de JavaScript, */ if (existsSync(ruta_del_manifiesto)) {
        /* lo leemos, */ const contenido = readFileSync(ruta_del_manifiesto, "utf8")
            /* hacemos que */ const manifiesto = JSON.parse(contenido)
            /* su «versión» coincida con la revisión */ manifiesto.version = revisión
            /* y guardamos los cambios. */ writeFileSync(ruta_del_manifiesto, `${JSON.stringify(manifiesto, null, 2)}\n`, "utf8")

            /* También actualizamos la revisión en el árbol de dependencias. */ ejecutar("npm", ["install", "--package-lock-only"], { shell: true })

            /* Habiendo actualizado el manifiesto y el árbol de dependencias, los agregamos a los cambios revisados. */ ejecutar("git", ["add", "package.json", "package-lock.json"]) }

        /* Si hay */ const ruta_portada = join(process.cwd(), "PORTADA.md")
        /* una portada, */ if (existsSync(ruta_portada)) {
        /* le actualizamos todas las */const portada = readFileSync(ruta_portada, "utf8")
            /* referencias a la revisión */ const readme = portada.split("$revisión").join(revisión)
            /* y guardamos los cambios. */ writeFileSync(join(process.cwd(), "README.md"), readme, "utf8")

            /* Habiendo actualizado la portada, la agregamos a los cambios revisados. */ ejecutar("git", ["add", "README.md"]) }

        /* Teniendo ya la fecha y número de esta nueva revisión, le pedimos a Git que la guarde. */const git = ejecutar("git", ["commit", "-m", revisión])

        /* El mensaje que nos devuelva Git */ let texto = ((git.stdout && git.stdout.toString("utf8")) || "") + ((git.stderr && git.stderr.toString("utf8")) || "")
        /* lo mostramos tal cual como Git nos lo da. */ process.stdout.write(texto); process.exit(git.status ?? 0)},
    /*
    | #Enviar_revisiones_al_servidor (condicional) Enviar revisiones al servidor
    [ Enviar revisiones al servidor ]
    */
    "Enviar revisiones al servidor": () => {
    /* Le preguntamos a Git si está configurada la ubicación del servidor. */ const verificar_remoto = ejecutar("git", ["remote", "get-url", "origin"], { encoding: "utf8" })

        /* Si no está configurada, */ if (verificar_remoto.error || (verificar_remoto.status ?? 0) !== 0) {
        /* lo notificamos */ console.error("No está configurada la ubicación del servidor")
            /* e indicamos cómo configurarla. */ console.error("Ejecuta: git remote add origin <URL>"); process.exit(1) }

        /* Si ya está configurada, enviamos las revisiones. */ const git = ejecutar("git", ["push", "-u", "origin", "main"])

        /* Al enviar las revisiones, Git nos va a mostrar un mensaje en inglés. */ let mensaje_esperado_o_de_error = (git.stdout?.toString("utf8") || "") + (git.stderr?.toString("utf8") || "")

        /* Hay que */ mensaje_esperado_o_de_error = mensaje_esperado_o_de_error.replace(
            /* traducirlo */ "Everything up-to-date",
            /* al español */"No hay revisiones para enviar")
        /* antes de mostrarlo. */ process.stdout.write(mensaje_esperado_o_de_error); process.exit(mensaje_esperado_o_de_error.status ?? 0)},
    /*
    | #Crear_un_historial (condicional) Crear un historial
    [ Crear un historial ]
    */
    "Crear un historial": () => {
    /* Le pedimos a Git que cree el historial de cambios. */ const git = ejecutar("git", ["init"])

        /* Al crear el historial, Git nos va a mostrar un mensaje en inglés. */ let mensaje_esperado_o_de_error = (git.stdout?.toString("utf8") || "") + (git.stderr?.toString("utf8") || "")
        /* Dando por hecho que nos va a mostrar un mensaje de éxito, hay que */ mensaje_esperado_o_de_error = mensaje_esperado_o_de_error.replace(
            /* traducirlo */ "Initialized empty Git repository in",
            /* al español */"Se inició un historial de cambios en")
        /* antes de mostrarlo. */ process.stdout.write(mensaje_esperado_o_de_error); process.exit(git.status ?? 0)},
    /*
    | #Última_revisión (condicional) Última revisión
    [ Última revisión ]
    */
    "Última revisión": () => {
    /* Leemos el manifiesto del proyecto actual */ const ruta_paquete = join(process.cwd(), "package.json")
        /* y mostramos su «versión». */ console.log((JSON.parse(readFileSync(ruta_paquete, "utf8"))).version); process.exit(0)},
    /*
    | #Última_revisión_del_administrador_de_historiales (condicional) Última revisión del administrador de historiales
    [ Última revisión del administrador de historiales ]
    */
    "Última revisión del administrador de historiales": () => {
    /* Leemos el manifiesto del administrador de historiales */ const ruta_paquete = join(__dirname, "..", "package.json")
        /* y mostramos su «versión». */ console.log((JSON.parse(readFileSync(ruta_paquete, "utf8"))).version); process.exit(0) } }

/* El menú */ const elección = await prompts([
    /* nos permitirá */ { message: "Selecciona una opción para compilar:",
        /* seleccionar */ type: "select",
        /* una opción */ name: "opción",
        /* entre las opciones disponibles: */ choices: Object.keys(Opciones_disponibles).map(opción => ({ title: opción, value: opción } ) ) } ] ); if (!elección.opción) process.exit(0)
/*
| #Ejecutar_la_opción_elegida Ejecutar la opción elegida
------------------------------
- Ejecutar la opción elegida -
------------------------------
*/
/*
| #Verificar_que_exista_un_historial_de_cambios_en_la_carpeta (condicional) Verificar que exista un historial de cambios en la carpeta
[ Verificar que exista un historial de cambios en la carpeta ]
*/
/* Para usar una opción (con la excepión de la opción para crear un historial), */ if (elección.opción !== "Crear un historial") {
    /* le debemos preguntar a Git */ const git = ejecutar("git", ["rev-parse", "--is-inside-work-tree"], { encoding: "utf8" })
    /* si existe un historial de cambios en la carpeta. */ const existe_un_historial = !git.error && (git.status ?? 0) === 0 && String(git.stdout || "").trim() === "true"

    /* Si no existe, */  if (!existe_un_historial) {
        /* lo notificamos */ console.error("No hay un historial de cambios en esta carpeta")
        /* e indicamos cómo crear uno. */ console.error("Ejecuta: historial-de-cambios --crear-un-historial"); process.exit(1) } }
/*
| #Ejecutar Ejecutar
[ Ejecutar ]
*/
Opciones_disponibles[elección.opción]()
