import js from "eslint-js-autocontenido"
import stylistic from "stylistic-eslint-plugin-autocontenido"
import globals from "globals"
export default [
/*
===========================
= Configuración de ESLint =
===========================
*/
    /* Usar la configuración recomendada */ js.configs.recommended, {

        /* Analizar los archivos con las siguientes extensiones: */ files: [
            "**/*.js",
            "**/*.mjs" ],

        /* Aceptar solo JavaScript moderno */ languageOptions: { ecmaVersion: "latest", sourceType: "module",

            /* Tomar en cuenta las variables */ globals: {
                /* de Node */ ...globals.node } },
        /*
        ---------------
        - Extensiones -
        ---------------
        */
        /* - Stylistic: Para el formato del código. */ plugins: { "@stylistic": stylistic },
        /*
        ---------------------
        - Reglas de formato -
        ---------------------
        */
        /* - Los archivos siempre deben terminar con una línea vacía */ rules: { "@stylistic/eol-last": "error",
            /* - No se deben usar tabuladores, solo espacios. */ "@stylistic/no-tabs": "error",
            /* - No debe haber espacios en blanco al final de las líneas */ "@stylistic/no-trailing-spaces": "error",
            /* - La sangría se debe hacer de 4 en 4 espacios */ "@stylistic/indent": ["error", 4],
            /* - Los textos deben ser formados con comillas dobles */ "@stylistic/quotes": ["error", "double"],
            /* - No se deben usar puntos y comas al final de las líneas */ "@stylistic/semi": ["error", "never"],
            /* - El útlimo elemento de una lista no debe tener una coma al final */ "@stylistic/comma-dangle": ["error", "never"] } } ]
