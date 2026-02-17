#!/usr/bin/env node
import { spawnSync as ejecutar } from "child_process"
import { readFileSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import prompts from "prompts"
/*
=========================================
= Administrador de historial de cambios =
=========================================
*/
/*
--------------------------------------------------------------
- Verificar que exista un historial de cambios en la carpeta -
--------------------------------------------------------------
*/
/* Antes que nada, le preguntamos a Git */ const git = ejecutar("git", ["rev-parse", "--is-inside-work-tree"], { encoding: "utf8" })
/* si existe un historial de cambios en la carpeta. */ const existe_un_historial = !git.error && (git.status ?? 0) === 0 && String(git.stdout || "").trim() === "true"

/* Si no existe, */  if (!existe_un_historial) {
    /* lo notificamos */ console.error("No hay un historial de cambios en esta carpeta")
    /* e indicamos cómo crear uno. */ console.error("Ejecuta: historial-de-cambios --crear"); process.exit(1) }
/*
------------
- Opciones -
------------
*/
/* Podemos elegir entre */ let opciones_elegidas = process.argv.slice(2)
/* las siguientes opciones: */const opciones_disponibles = {
    "lista-de-cambios": "git status",
    "guardar-revisión": "git commit -m <REVISIÓN>",
    "enviar-revisiones-al-servidor": "git push -u origin main",
    "crear-un-historial": "git init" }

/* Si no se elige ninguna, */ if (opciones_elegidas.length === 0) {
    /* vamos a mostrar */ const opciones_para_menu = Object.entries(opciones_disponibles).map(([opción, descripción]) => ({
        /* un menú */ title: `${opción.padEnd(Math.max(...Object.keys(opciones_disponibles).map(opción => opción.length)))}  ${descripción}`,
        /* interactivo. */ value: opción } ) )

    /* El menú */ const respuesta = await prompts({
        /* nos permitirá */ message: "Selecciona una opción:",
        /* seleccionar */ type: "select",
        /* una opción */ name: "opción",
        /* entre las opciones disponibles. */ choices: opciones_para_menu } )

    /* Si queremos, podemos cancelar y salir del menú. */ if (!respuesta.opción) { console.log("Operación cancelada"); process.exit(0) }
    /* Y si se elige una opción, podemos continuar. */ opciones_elegidas = [`--${respuesta.opción}`] }

/* Si no usamos el menú y se elige manualmente una opción */ if (!Object.keys(opciones_disponibles)
    /* que no está entre las opciones disponibles, */ .includes(opciones_elegidas[0].substring(2))) {
    /* mostramos un mensaje de error. */ console.error("Opción no reconocida:", opciones_elegidas[0]); process.exit(1) }
/*
[ Crear un historial ]
*/
/* Si queremos crear un historial, */ if (opciones_elegidas.includes("--crear-un-historial")) {
    /* se lo pedimos a Git. */ const git = ejecutar("git", ["init"])

    /* Al crear el historial, Git nos va a mostrar */ let mensaje_esperado_o_de_error = (git.stdout?.toString("utf8") || "") + (git.stderr?.toString("utf8") || "")
    /* un mensaje en inglés. */ let mensaje = mensaje_esperado_o_de_error?.toString("utf8") || ""
    /* Dando por hecho que nos va a mostrar un mensaje de éxito, hay que */ mensaje = mensaje.replace(
    /* traducirlo */ "Initialized empty Git repository in",
        /* al español */"Se inició un historial de cambios en")
    /* antes de mostrarlo. */ process.stdout.write(mensaje); process.exit(git.status ?? 0)
/*
[ Lista de cambios ]
*/
/* Si queremos ver la lista de cambios, */ } else if (opciones_elegidas.includes("--lista-de-cambios")) {
    /* se la pedimos a Git. */ const git = ejecutar("git", ["status"])
    /* Dando por hecho que recibimos la lista correctamente, */ let texto = ((git.stdout && git.stdout.toString("utf8")) || "") + ((git.stderr && git.stderr.toString("utf8")) || "")
    /* hacemos la siguiente traducción */ texto = texto.replace(
        "Changes to be committed:", "Cambios revisados:").replace(
        "Changes not staged for commit:", "Cambios sin revisar:").replace(
        "Untracked files:", "Cambios sin revisar:")

    /* Estando traducida, la mostramos. */ process.stdout.write(texto); process.exit(git.status ?? 0)
/*
[ Guardar revisión ]
*/
/* Si queremos guardar una revisión, */ } else if (opciones_elegidas.includes("--guardar-revisión")) {
    /* primero le preguntamos a Git si hay cambios revisados para guardar. */ const cambios_revisados = ejecutar("git", ["diff", "--cached", "--name-only"], { encoding: "utf8" })

    /* Si no hay cambios revisados, */ if (!(!cambios_revisados.error && (cambios_revisados.status ?? 0) === 0 && String(cambios_revisados.stdout || "").trim() !== "")) {
        /* notificamos al usuario. */ console.error("No hay cambios revisados para guardar"); process.exit(1) }

    /* Si sí hay cambios revisados, le preguntamos a Git cuándo fue la revisión anterior. */ let revisión_anterior = ejecutar("git", ["log", "-1", "--pretty=%s"])
    /* En base a la revisión anterior, vamos a calcular cuál será la fecha y número de esta nueva revisión. */ let revisión

    /* También consultamos la fecha de hoy */ const ahora = new Date()
    /* y la acomodamos por año, mes y día (AAAA.M.D). */ const fecha = `${ahora.getFullYear()}.${ahora.getMonth() + 1}.${ahora.getDate()}`

    /* Si no hay una revisión anterior, */ if ((revisión_anterior.status ?? 0) !== 0) {
    /* esta será la primera revisión. Tendrá la fecha de hoy y empezará en 1. */ revisión = `${fecha}-1`

    /* Si sí hay una */ } else {
        /* revisión anterior, */ revisión_anterior = (revisión_anterior.stdout?.toString("utf8") || "").trim()
        /* la comparamos con la fecha hoy para ver si es de hoy mismo. */ const es_de_hoy = revisión_anterior.startsWith(`${fecha}-`)

        /* Si la revisión anterior es de hoy, */ if (es_de_hoy) {
            /* le extraemos el número de revisión, */ const número_de_revisión = revisión_anterior.split("-")[1]
            /* y le incrementamos uno para esta nueva revisión. */ revisión = `${fecha}-${Number(número_de_revisión) + 1}`

            /* Si no es de hoy, */} else {
            /* la nueva revisión tendrá la fecha de hoy y empezará en 1. */ revisión = `${fecha}-1`  } }

    /* Si hay un manifiesto */ const ruta_paquete = join(process.cwd(), "package.json")
    /* de paquete de JavaScript, */ if (existsSync(ruta_paquete)) {
        /* lo leemos, */ const contenido = readFileSync(ruta_paquete, "utf8")
        /* hacemos que */ const manifiesto = JSON.parse(contenido)
        /* su «versión» coincida con la revisión */ manifiesto.version = revisión
        /* y guardamos los cambios. */ writeFileSync(ruta_paquete, `${JSON.stringify(manifiesto, null, 2)}\n`, "utf8")

        /* Habiendo actualizado el manifiesto, lo agregamos a los cambios revisados. */ ejecutar("git", ["add", "package.json"]) }

    /* Si hay */ const ruta_portada = join(process.cwd(), "PORTADA.md")
    /* una portada, */ if (existsSync(ruta_portada)) {
        /* le actualizamos todas las */const portada = readFileSync(ruta_portada, "utf8")
        /* referencias a la revisión */ const readme = portada.split("$revisión").join(revisión)
        /* y guardamos los cambios. */ writeFileSync(join(process.cwd(), "README.md"), readme, "utf8")

        /* Habiendo actualizado la portada, la agregamos a los cambios revisados. */ ejecutar("git", ["add", "README.md"]) }

    /* Teniendo ya la fecha y número de esta nueva revisión, le pedimos a Git que la guarde. */const git = ejecutar("git", ["commit", "-m", revisión])

    /* El mensaje que nos devuelva Git */ let texto = ((git.stdout && git.stdout.toString("utf8")) || "") + ((git.stderr && git.stderr.toString("utf8")) || "")
    /* lo mostramos tal cual como Git nos lo da. */ process.stdout.write(texto); process.exit(git.status ?? 0)
/*
[ Enviar revisiones al servidor ]
*/
/* Si queremos enviar las revisiones al servidor, */ } else if (opciones_elegidas.includes("--enviar-revisiones-al-servidor")) {
    /* primero verificamos que esté configurada la ubicación del servidor. */ const verificar_remoto = ejecutar("git", ["remote", "get-url", "origin"], { encoding: "utf8" })

    /* Si no está configurada, */ if (verificar_remoto.error || (verificar_remoto.status ?? 0) !== 0) {
        /* lo notificamos */ console.error("No está configurada la ubicación del servidor")
        /* e indicamos cómo configurarla. */ console.error("Ejecuta: git remote add origin <URL>"); process.exit(1) }

    /* Si ya está configurada, enviamos las revisiones. */ const git = ejecutar("git", ["push", "-u", "origin", "main"])

    /* El mensaje que nos devuelva Git */ let texto = ((git.stdout && git.stdout.toString("utf8")) || "") + ((git.stderr && git.stderr.toString("utf8")) || "")
    /* lo mostramos tal cual como Git nos lo da. */ process.stdout.write(texto); process.exit(git.status ?? 0) }
