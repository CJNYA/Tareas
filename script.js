/* =========================================================
   DEPÓSITOS Y MOVIMIENTOS - GESTIÓN DE BODEGA
   Versión manual
   ========================================================= */

(() => {

    "use strict";


    /* =====================================================
       CONFIGURACIÓN
    ===================================================== */

    const STORAGE_DEPOSITOS = "bodega_depositos_v1";
    const STORAGE_MOVIMIENTOS = "bodega_movimientos_v1";


    /* =====================================================
       VARIABLES
    ===================================================== */

    let depositos = [];
    let movimientos = {};


    /* =====================================================
       FUNCIONES AUXILIARES
    ===================================================== */

    const $ = (id) => document.getElementById(id);


    function generarId() {

        return Date.now().toString(36) +
            Math.random().toString(36).slice(2, 8);

    }


    function escapar(valor) {

        return String(valor ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

    }


    function numero(valor) {

        let n = Number(
            String(valor ?? "")
                .replace(",", ".")
        );

        return Number.isFinite(n) ? n : 0;

    }


    function formatoNumero(valor, decimales = 0) {

        return Number(valor || 0).toLocaleString(
            "es-ES",
            {
                minimumFractionDigits: decimales,
                maximumFractionDigits: decimales
            }
        );

    }


    /* =====================================================
       GUARDADO AUTOMÁTICO
    ===================================================== */

    function guardar() {

        localStorage.setItem(
            STORAGE_DEPOSITOS,
            JSON.stringify(depositos)
        );

        localStorage.setItem(
            STORAGE_MOVIMIENTOS,
            JSON.stringify(movimientos)
        );

        $("guardado").textContent = "Guardado";
    }


    /* =====================================================
       CARGAR DATOS
    ===================================================== */

    function cargar() {

        try {

            depositos =
                JSON.parse(
                    localStorage.getItem(STORAGE_DEPOSITOS)
                ) || [];


            movimientos =
                JSON.parse(
                    localStorage.getItem(STORAGE_MOVIMIENTOS)
                ) || {};

        } catch (error) {

            console.error(
                "Error cargando los datos:",
                error
            );

            depositos = [];

            movimientos = {};
        }

    }


    /* =====================================================
       NAVEGACIÓN
    ===================================================== */

    function configurarNavegacion() {

        document
            .querySelectorAll(".nav-btn")
            .forEach((boton) => {

                boton.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(".nav-btn")
                            .forEach((b) => {

                                b.classList.remove("active");

                            });


                        boton.classList.add("active");


                        document
                            .querySelectorAll(".page")
                            .forEach((pagina) => {

                                pagina.classList.remove("active");

                            });


                        const pagina =
                            $(boton.dataset.page);

                        if (pagina) {

                            pagina.classList.add("active");

                        }


                        if (
                            boton.dataset.page ===
                            "movimientos"
                        ) {

                            renderizarMovimientos();

                        }

                    }
                );

            });

    }


    /* =====================================================
       DEPÓSITOS
    ===================================================== */

    function renderizarDepositos() {

        const tbody = $("depBody");

        const vacio = $("depEmpty");


        if (!depositos.length) {

            tbody.innerHTML = "";

            vacio.style.display = "block";

            return;

        }


        vacio.style.display = "none";


        tbody.innerHTML =
            depositos.map((deposito) => {

                const tipo =
                    deposito.tipo === "fermentador"
                        ? "Fermentador"
                        : "Almacenamiento";


                const estado =
                    deposito.activo

                        ? `<span style="
                            color:#2e7d32;
                            font-weight:bold;">
                            Activo
                           </span>`

                        : `<span style="
                            color:#777;
                            font-weight:bold;">
                            Desactivado
                           </span>`;


                return `

                    <tr>

                        <td>
                            <b>
                                ${escapar(deposito.nombre)}
                            </b>
                        </td>


                        <td>
                            ${tipo}
                        </td>


                        <td>
                            ${formatoNumero(deposito.cap)} L
                        </td>


                        <td>
                            ${estado}
                        </td>


                        <td>

                            <div class="actions">

                                <button
                                    class="small-btn"
                                    data-accion="editar"
                                    data-id="${deposito.id}">

                                    ✏️ Editar

                                </button>


                                <button
                                    class="small-btn"
                                    data-accion="activar"
                                    data-id="${deposito.id}">

                                    ${
                                        deposito.activo
                                            ? "🔴 Desactivar"
                                            : "🟢 Activar"
                                    }

                                </button>


                                <button
                                    class="small-btn"
                                    data-accion="eliminar"
                                    data-id="${deposito.id}">

                                    🗑️ Eliminar

                                </button>

                            </div>

                        </td>

                    </tr>

                `;

            }).join("");

    }


    /* =====================================================
       MODAL
    ===================================================== */

    function abrirModal(deposito = null) {

        $("did").value =
            deposito?.id || "";


        $("nombre").value =
            deposito?.nombre || "";


        $("capacidad").value =
            deposito?.cap ?? "";


        $("tipo").value =
            deposito?.tipo || "fermentador";


        $("activo").checked =
            deposito
                ? Boolean(deposito.activo)
                : true;


        $("mtitle").textContent =
            deposito
                ? "Editar depósito"
                : "Añadir depósito";


        $("modal").classList.remove("hidden");


        setTimeout(() => {

            $("nombre").focus();

        }, 50);

    }


    function cerrarModal() {

        $("modal").classList.add("hidden");

    }


    /* =====================================================
       GUARDAR DEPÓSITO
    ===================================================== */

    function guardarDeposito(evento) {

        evento.preventDefault();


        const idDeposito =
            $("did").value;


        const nombre =
            $("nombre").value.trim();


        const capacidad =
            numero($("capacidad").value);


        const tipo =
            $("tipo").value;


        const activo =
            $("activo").checked;


        if (!nombre) {

            alert(
                "Escribe el número o nombre del depósito."
            );

            return;

        }


        if (capacidad < 0) {

            alert(
                "La capacidad no puede ser negativa."
            );

            return;

        }


        const existe =
            depositos.some((deposito) => {

                return deposito.id !== idDeposito &&
                    deposito.nombre
                        .toLowerCase()
                        === nombre.toLowerCase();

            });


        if (existe) {

            alert(
                "Ya existe un depósito con ese nombre."
            );

            return;

        }


        /* ---------------------------------------------
           EDITAR
        --------------------------------------------- */

        if (idDeposito) {

            const deposito =
                depositos.find(
                    (d) => d.id === idDeposito
                );


            if (deposito) {

                deposito.nombre = nombre;

                deposito.cap = capacidad;

                deposito.tipo = tipo;

                deposito.activo = activo;

            }

        }


        /* ---------------------------------------------
           NUEVO
        --------------------------------------------- */

        else {

            const nuevo = {

                id: generarId(),

                nombre: nombre,

                cap: capacidad,

                tipo: tipo,

                activo: activo

            };


            depositos.push(nuevo);


            movimientos[nuevo.id] = [];

        }


        guardar();


        renderizarDepositos();

        renderizarMovimientos();


        cerrarModal();

    }


    /* =====================================================
       ACCIONES DE DEPÓSITOS
    ===================================================== */

    function accionesDepositos(evento) {

        const boton =
            evento.target.closest(
                "[data-accion]"
            );


        if (!boton) {

            return;

        }


        const idDeposito =
            boton.dataset.id;


        const deposito =
            depositos.find(
                (d) => d.id === idDeposito
            );


        if (!deposito) {

            return;

        }


        const accion =
            boton.dataset.accion;


        /* ---------------------------------------------
           EDITAR
        --------------------------------------------- */

        if (accion === "editar") {

            abrirModal(deposito);

            return;

        }


        /* ---------------------------------------------
           ACTIVAR / DESACTIVAR
        --------------------------------------------- */

        if (accion === "activar") {

            deposito.activo =
                !deposito.activo;


            guardar();

            renderizarDepositos();

            renderizarMovimientos();

            return;

        }


        /* ---------------------------------------------
           ELIMINAR
        --------------------------------------------- */

        if (accion === "eliminar") {

            const confirmar =
                confirm(
                    `¿Quieres eliminar el depósito "${deposito.nombre}" y todos sus movimientos?`
                );


            if (!confirmar) {

                return;

            }


            depositos =
                depositos.filter(
                    (d) => d.id !== idDeposito
                );


            delete movimientos[idDeposito];


            guardar();


            renderizarDepositos();

            renderizarMovimientos();

        }

    }


    /* =====================================================
       OBTENER MOVIMIENTOS DE UN DEPÓSITO
    ===================================================== */

    function obtenerMovimientos(deposito) {

        if (!movimientos[deposito.id]) {

            movimientos[deposito.id] = [];

        }


        return movimientos[deposito.id];

    }


    /* =====================================================
       LISTA DE PROCEDENCIAS
       
       Cada fermentador genera:
       
       17/1
       17/2
       17/3
       17/4
    ===================================================== */

    function obtenerProcedencias() {
funcfunction obtenerProcedencias() {
    const lista = [];
    depositos
        .filter((deposito) => deposito.tipo === "fermentador")
        .forEach((deposito) => {
            for (let vuelta = 1; vuelta <= 4; vuelta++) {
                lista.push(`${deposito.nombre}/${vuelta}`);
            }
        });
    return lista;
}


    /* =====================================================
       OPCIONES SELECT
    ===================================================== */

    function crearOpciones(lista, valorSeleccionado) {

        let html =
            `<option value="">
                Seleccionar
             </option>`;


        lista.forEach((valor) => {

            html += `

                <option
                    value="${escapar(valor)}"
                    ${
                        valor === valorSeleccionado
                            ? "selected"
                            : ""
                    }>

                    ${escapar(valor)}

                </option>

            `;

        });


        return html;

    }


    /* =====================================================
       RENDERIZAR MOVIMIENTOS
    ===================================================== */

    function renderizarMovimientos() {

        const contenedor =
            $("movBody");


        const vacio =
            $("movEmpty");


        const activos =
            depositos.filter(
                (deposito) =>
                    deposito.activo
            );


        if (!activos.length) {

            contenedor.innerHTML = "";

            vacio.style.display = "block";

            return;

        }


        vacio.style.display = "none";


        contenedor.innerHTML =
            activos
                .map(
                    (deposito) =>
                        crearTarjetaDeposito(deposito)
                )
                .join("");

    }


    /* =====================================================
       CREAR TARJETA DE DEPÓSITO
    ===================================================== */

    function crearTarjetaDeposito(deposito) {

        const filas =
            obtenerMovimientos(deposito);


        const totalLitros =
            filas.reduce(
                (total, fila) =>
                    total + numero(fila.litros),
                0
            );


        const procedencias =
            obtenerProcedencias();


        let filasHTML = "";


        if (!filas.length) {

            filasHTML = `

                <tr>

                    <td
                        colspan="6"
                        style="
                            text-align:center;
                            color:#68757b;
                            padding:20px;">

                        No hay movimientos.
                        Pulsa "Añadir fila".

                    </td>

                </tr>

            `;

        }


        else {

            filasHTML =
                filas.map((fila) => {

                    const litros =
                        numero(fila.litros);


                    const porcentaje =
                        totalLitros > 0
                            ? litros /
                              totalLitros *
                              100
                            : 0;


                    return `

                        <tr>

                            <!-- PROCEDENCIA -->

                            <td>

                                <select

                                    data-campo="procedencia"

                                    data-deposito="${deposito.id}"

                                    data-fila="${fila.id}">

                                    ${crearOpciones(
                                        procedencias,
                                        fila.procedencia
                                    )}

                                </select>

                            </td>


                            <!-- VINO -->

                            <td>

                                <select

                                    data-campo="vino"

                                    data-deposito="${deposito.id}"

                                    data-fila="${fila.id}">

                                    <option
                                        value="Yema"
                                        ${
                                            fila.vino === "Yema"
                                                ? "selected"
                                                : ""
                                        }>

                                        Yema

                                    </option>


                                    <option
                                        value="Prensa"
                                        ${
                                            fila.vino === "Prensa"
                                                ? "selected"
                                                : ""
                                        }>

                                        Prensa

                                    </option>


                                    <option
                                        value="pH"
                                        ${
                                            fila.vino === "pH"
                                                ? "selected"
                                                : ""
                                        }>

                                        pH

                                    </option>

                                </select>

                            </td>


                            <!-- LITROS -->

                            <td>

                                <input

                                    type="number"

                                    min="0"

                                    step="0.01"

                                    value="${litros || ""}"

                                    inputmode="decimal"

                                    data-campo="litros"

                                    data-deposito="${deposito.id}"

                                    data-fila="${fila.id}">

                            </td>


                            <!-- VARIEDAD -->

                            <td>

                                <input

                                    type="text"

                                    value="${escapar(
                                        fila.variedad || ""
                                    )}"

                                    placeholder="Variedad"

                                    data-campo="variedad"

                                    data-deposito="${deposito.id}"

                                    data-fila="${fila.id}">

                            </td>


                            <!-- PORCENTAJE -->

                            <td class="percent">

                                ${formatoNumero(
                                    porcentaje,
                                    2
                                )} %

                            </td>


                            <!-- ACCIÓN -->

                            <td>

                                <button

                                    class="delete-row"

                                    title="Eliminar fila"

                                    data-eliminar-fila="true"

                                    data-deposito="${deposito.id}"

                                    data-fila="${fila.id}">

                                    ×

                                </button>

                            </td>

                        </tr>

                    `;

                }).join("");

        }


        return `

            <article class="deposit-card">


                <!-- CABECERA -->

               <div class="deposit-header">

    <div class="deposit-title-row">

        <div>

            <h3>
                Depósito ${escapar(deposito.nombre)}
            </h3>

            <div class="deposit-meta">

                Capacidad:

                <b>
                    ${formatoNumero(deposito.cap)}
                    L
                </b>

                ·

                Tipo:

                <b>

                    ${
                        deposito.tipo === "fermentador"
                            ? "Fermentador"
                            : "Almacenamiento"
                    }

                </b>

            </div>

        </div>


        <div class="deposit-specifications">

            <label>
                Especificaciones
            </label>

            <input
                type="text"
                placeholder="Características o especificaciones..."
                value="${escapar(deposito.especificaciones || "")}"
                data-especificaciones="${deposito.id}"
            >

        </div>

    </div>

</div>



                <div class="deposit-content">


                    <!-- TABLA MOVIMIENTOS -->

                    <div class="table-container">

                        <table class="movement-table">

                            <thead>

                                <tr>

                                    <th>
                                        Procedencia
                                    </th>

                                    <th>
                                        Vino
                                    </th>

                                    <th>
                                        Litros
                                    </th>

                                    <th>
                                        Variedad Uva
                                    </th>

                                    <th>
                                        %
                                    </th>

                                    <th>
                                        Acción
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                ${filasHTML}

                            </tbody>

                        </table>

                    </div>



                    <!-- PIE MOVIMIENTOS -->

                    <div class="movement-footer">


                        <button

                            class="btn btn-outline"

                            data-anadir-fila="true"

                            data-deposito="${deposito.id}">

                            ＋ Añadir fila

                        </button>



                        <div class="totals">

                            <span>

                                Litros:

                                <strong>

                                    ${formatoNumero(
                                        totalLitros,
                                        
                                    )} L

                                </strong>

                            </span>


                            <span>

                                Porcentaje:

                                <strong>
                                    100,00 %
                                </strong>

                            </span>

                        </div>


                    </div>



                    <!-- ANÁLISIS -->

                    <div class="analysis">

                        <h4>
                            Informe de Análisis 
                        </h4>


                        <table>

                            <tbody>

                                ${crearCampoAnalisis(
                                    deposito,
                                    "glucosa",
                                    "Glucosa + Fructosa (g/L)"
                                )}


                                ${crearCampoAnalisis(
                                    deposito,
                                    "reductores",
                                    "Azúcares Reductores (g/L)"
                                )}


                                ${crearCampoAnalisis(
                                    deposito,
                                    "alcohol",
                                    "Grado Alcohólico (% Vol)"
                                )}


                                ${crearCampoAnalisis(
                                    deposito,
                                    "ph",
                                    "pH (Ud.)"
                                )}


                                ${crearCampoAnalisis(
                                    deposito,
                                    "acidez",
                                    "Acidez Total (g/L Tartárico)"
                                )}


                                ${crearCampoAnalisis(
                                    deposito,
                                    "acetico",
                                    "Ácido Acético (g/L Acético)"
                                )}


                                ${crearCampoAnalisis(
                                    deposito,
                                    "malico",
                                    "Ácido Málico"
                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </article>

        `;

    }


    /* =====================================================
       CAMPOS DE ANÁLISIS
    ===================================================== */

    function crearCampoAnalisis(
        deposito,
        clave,
        titulo
    ) {

        const analisis =
            deposito.analisis || {};


        const valor =
            analisis[clave] || "";


        return `

            <tr>

                <th>

                    ${titulo}

                </th>


                <td>

                    <input

                        type="text"

                        inputmode="decimal"

                        value="${escapar(valor)}"

                        data-analisis="${clave}"

                        data-deposito="${deposito.id}">

                </td>

            </tr>

        `;

    }


    /* =====================================================
       EVENTOS DE MOVIMIENTOS
    ===================================================== */

    function manejarMovimientos(evento) {

        const elemento =
            evento.target;


        /* ---------------------------------------------
           AÑADIR FILA
        --------------------------------------------- */

        const botonAnadir =
            elemento.closest(
                "[data-anadir-fila]"
            );


        if (botonAnadir) {

            const idDeposito =
                botonAnadir.dataset.deposito;


            if (!movimientos[idDeposito]) {

                movimientos[idDeposito] = [];

            }


            movimientos[idDeposito].push({

                id: generarId(),

                procedencia: "",

                vino: "Yema",

                litros: 0,

                variedad: ""

            });


            guardar();


            renderizarMovimientos();


            return;

        }


        /* ---------------------------------------------
           ELIMINAR FILA
        --------------------------------------------- */

        const botonEliminar =
            elemento.closest(
                "[data-eliminar-fila]"
            );


        if (botonEliminar) {

            const idDeposito =
                botonEliminar.dataset.deposito;


            const idFila =
                botonEliminar.dataset.fila;


            if (!movimientos[idDeposito]) {

                return;

            }


            movimientos[idDeposito] =
                movimientos[idDeposito]
                    .filter(
                        (fila) =>
                            fila.id !== idFila
                    );


            guardar();


            renderizarMovimientos();


            return;

        }

        /* ---------------------------------------------
   ESPECIFICACIONES DEL DEPÓSITO
--------------------------------------------- */

if (
    elemento.dataset &&
    elemento.dataset.especificaciones
) {

    const idDeposito =
        elemento.dataset.especificaciones;

    const deposito =
        depositos.find(
            (d) => d.id === idDeposito
        );

    if (!deposito) {
        return;
    }

    deposito.especificaciones =
        elemento.value;

    guardar();

    return;
}


        /* ---------------------------------------------
           CAMPO DE ANÁLISIS
        --------------------------------------------- */

        if (
            elemento.dataset &&
            elemento.dataset.analisis
        ) {

            const idDeposito =
                elemento.dataset.deposito;


            const clave =
                elemento.dataset.analisis;


            const deposito =
                depositos.find(
                    (d) =>
                        d.id === idDeposito
                );


            if (!deposito) {

                return;

            }


            if (!deposito.analisis) {

                deposito.analisis = {};

            }


            deposito.analisis[clave] =
                elemento.value;


            guardar();


            return;

        }


        /* ---------------------------------------------
           CAMPO DE MOVIMIENTO
        --------------------------------------------- */

        if (
            elemento.dataset &&
            elemento.dataset.campo
        ) {

            const idDeposito =
                elemento.dataset.deposito;


            const idFila =
                elemento.dataset.fila;


            const campo =
                elemento.dataset.campo;


            const filas =
                movimientos[idDeposito];


            if (!filas) {

                return;

            }


            const fila =
                filas.find(
                    (f) =>
                        f.id === idFila
                );


            if (!fila) {

                return;

            }


            if (campo === "litros") {

                fila.litros =
                    numero(elemento.value);

            }

            else {

                fila[campo] =
                    elemento.value;

            }


            /*
             * Guardamos inmediatamente.
             *
             * IMPORTANTE:
             * No reconstruimos la tabla mientras
             * se escribe para no cerrar el teclado
             * del móvil.
             */

            guardar();


            /*
             * El porcentaje solamente necesita
             * recalcularse cuando terminamos de
             * modificar los litros.
             */

            if (
                campo === "litros" &&
                evento.type === "change"
            ) {

                renderizarMovimientos();

            }

        }

    }


    /* =====================================================
       EXPORTAR PDF
    ===================================================== */

    function exportarPDF() {

        if (!window.jspdf) {

            alert(
                "No se pudo cargar la librería PDF. " +
                "Comprueba la conexión a Internet y vuelve a intentarlo."
            );

            return;

        }


        const activos =
            depositos.filter(
                (deposito) =>
                    deposito.activo
            );


        if (!activos.length) {

            alert(
                "No hay depósitos activos para exportar."
            );

            return;

        }


        const {
            jsPDF
        } = window.jspdf;


        const pdf =
            new jsPDF();


        activos.forEach(
            (deposito, indice) => {

                if (indice > 0) {

                    pdf.addPage();

                }


                crearPaginaPDF(
                    pdf,
                    deposito
                );

            }
        );


        pdf.save(
            "Informe_Depositos.pdf"
        );

    }


    /* =====================================================
       CREAR PÁGINA PDF
    ===================================================== */

    function crearPaginaPDF(
        pdf,
        deposito
    ) {

        const margen = 12;

        const anchoPagina = 210;

        const anchoContenido =
            anchoPagina -
            margen * 2;


        let y = 15;


        /* ---------------------------------------------
           TÍTULO
        --------------------------------------------- */

        pdf.setFontSize(16);

        pdf.setFont(
            "helvetica",
            "bold"
        );


        pdf.text(
            "Depósito " +
            String(deposito.nombre),
            margen,
            y
        );


        y += 7;


        /* ---------------------------------------------
           INFORMACIÓN DEPÓSITO
        --------------------------------------------- */

        pdf.setFontSize(9);

        pdf.setFont(
            "helvetica",
            "normal"
        );


        pdf.text(
            `Capacidad: ${formatoNumero(
                deposito.cap
            )} L · Tipo: ${
                deposito.tipo === "fermentador"
                    ? "Fermentador"
                    : "Almacenamiento"
            }`,
            margen,
            y
        );


        y += 8;


        /* ---------------------------------------------
           MOVIMIENTOS
        --------------------------------------------- */

        const filas =
            obtenerMovimientos(deposito);


        const totalLitros =
            filas.reduce(
                (total, fila) =>
                    total +
                    numero(fila.litros),
                0
            );


        const columnas = [

            {
                titulo: "Procedencia",
                ancho: 32
            },

            {
                titulo: "Vino",
                ancho: 24
            },

            {
                titulo: "Litros",
                ancho: 25
            },

            {
                titulo: "Variedad",
                ancho: 65
            },

            {
                titulo: "%",
                ancho: 40
            }

        ];


        const altoCabecera = 8;

        const altoFila = 7;


        let x = margen;


        /* ---------------------------------------------
           CABECERAS
        --------------------------------------------- */

        pdf.setFontSize(8);

        pdf.setFont(
            "helvetica",
            "bold"
        );


        columnas.forEach(
            (columna) => {

                pdf.rect(
                    x,
                    y,
                    columna.ancho,
                    altoCabecera
                );


                pdf.text(
                    columna.titulo,
                    x + 2,
                    y + 5
                );


                x += columna.ancho;

            }
        );


        y += altoCabecera;


        /* ---------------------------------------------
           FILAS
        --------------------------------------------- */

        pdf.setFont(
            "helvetica",
            "normal"
        );


        filas.forEach(
            (fila) => {

                x = margen;


                const porcentaje =
                    totalLitros > 0
                        ? numero(fila.litros) /
                          totalLitros *
                          100
                        : 0;


                const valores = [

                    fila.procedencia || "",

                    fila.vino || "",

                    formatoNumero(
                        fila.litros,
                        2
                    ),

                    fila.variedad || "",

                    formatoNumero(
                        porcentaje,
                        2
                    ) + " %"

                ];


                columnas.forEach(
                    (columna, indice) => {

                        pdf.rect(
                            x,
                            y,
                            columna.ancho,
                            altoFila
                        );


                        let texto =
                            String(
                                valores[indice]
                                || ""
                            );


                        /*
                         * Evitamos que un texto
                         * demasiado largo salga
                         * fuera de la celda.
                         */

                        if (
                            texto.length > 30
                        ) {

                            texto =
                                texto.substring(
                                    0,
                                    30
                                ) + "...";

                        }


                        pdf.text(
                            texto,
                            x + 2,
                            y + 4.8
                        );


                        x += columna.ancho;

                    }
                );


                y += altoFila;

            }
        );


        /* ---------------------------------------------
           TOTAL
        --------------------------------------------- */

        pdf.setFont(
            "helvetica",
            "bold"
        );


        pdf.rect(
            margen,
            y,
            anchoContenido,
            8
        );


        pdf.text(
            "TOTAL",
            margen + 2,
            y + 5
        );


        pdf.text(
            formatoNumero(
                totalLitros,
                2
            ) + " L",
            margen + 55,
            y + 5
        );


        pdf.text(
            "100,00 %",
            margen + 145,
            y + 5
        );


        y += 14;


        /* ---------------------------------------------
           ANÁLISIS
        --------------------------------------------- */

        pdf.setFontSize(12);

        pdf.text(
            "Análisis",
            margen,
            y
        );


        y += 6;


        const analisis =
            deposito.analisis || {};


        const campos = [

            [
                "Glucosa + Fructosa (g/L)",
                analisis.glucosa
            ],

            [
                "Azúcares Reductores (g/L)",
                analisis.reductores
            ],

            [
                "Grado Alcohólico (% Vol)",
                analisis.alcohol
            ],

            [
                "pH (Ud.)",
                analisis.ph
            ],

            [
                "Acidez Total (g/L Tartárico)",
                analisis.acidez
            ],

            [
                "Ácido Acético (g/L Acético)",
                analisis.acetico
            ],

            [
                "Ácido Málico",
                analisis.malico
            ]

        ];


        pdf.setFontSize(8);


        campos.forEach(
            (campo) => {

                pdf.rect(
                    margen,
                    y,
                    93,
                    7
                );


                pdf.rect(
                    margen + 93,
                    y,
                    93,
                    7
                );


                pdf.setFont(
                    "helvetica",
                    "bold"
                );


                pdf.text(
                    campo[0],
                    margen + 2,
                    y + 4.7
                );


                pdf.setFont(
                    "helvetica",
                    "normal"
                );


                pdf.text(
                    String(
                        campo[1] || ""
                    ),
                    margen + 95,
                    y + 4.7
                );


                y += 7;

            }
        );

    }


    /* =====================================================
       INICIALIZACIÓN
    ===================================================== */

    function iniciar() {

        cargar();


        renderizarDepositos();


        renderizarMovimientos();


        configurarNavegacion();


        /* ---------------------------------------------
           NUEVO DEPÓSITO
        --------------------------------------------- */

        $("nuevo").addEventListener(
            "click",
            () => {

                abrirModal();

            }
        );


        /* ---------------------------------------------
           CERRAR MODAL
        --------------------------------------------- */

        $("cerrar").addEventListener(
            "click",
            cerrarModal
        );


        $("cancelar").addEventListener(
            "click",
            cerrarModal
        );


        document
            .querySelector(".modal-background")
            .addEventListener(
                "click",
                cerrarModal
            );


        /* ---------------------------------------------
           FORMULARIO
        --------------------------------------------- */

        $("form").addEventListener(
            "submit",
            guardarDeposito
        );


        /* ---------------------------------------------
           ACCIONES DEPÓSITOS
        --------------------------------------------- */

        $("depBody").addEventListener(
            "click",
            accionesDepositos
        );


        /* ---------------------------------------------
           MOVIMIENTOS
        --------------------------------------------- */

        $("movBody").addEventListener(
            "click",
            manejarMovimientos
        );


        $("movBody").addEventListener(
            "input",
            manejarMovimientos
        );


        $("movBody").addEventListener(
            "change",
            manejarMovimientos
        );


        /* ---------------------------------------------
           EXPORTAR PDF
        --------------------------------------------- */

        $("pdf").addEventListener(
            "click",
            exportarPDF
        );

    }


    /* =====================================================
       ARRANQUE
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            iniciar
        );

    }

    else {

        iniciar();

    }


})();
