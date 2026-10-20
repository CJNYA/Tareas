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


        /* ---------------------------------------------
           PREPARAR ANÁLISIS 1 Y ANÁLISIS 2
        --------------------------------------------- */

        depositos.forEach((deposito) => {

            // Si tiene el análisis antiguo,
            // lo conservamos como Análisis 1.
            if (
                deposito.analisis &&
                !deposito.analisis1
            ) {

                deposito.analisis1 = {
                    ...deposito.analisis,
                    fecha: ""
                };

            }

            // Crear Análisis 2 vacío
            if (!deposito.analisis2) {

                deposito.analisis2 = {
                    fecha: "",
                    glucosa: "",
                    reductores: "",
                    alcohol: "",
                    ph: "",
                    acidez: "",
                    acetico: "",
                    malico: "",
                    sulfurosoLibre: ""
                };

            }

        });

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
    const lista = [];

    // Fermentadores activos con sus 4 vueltas
    depositos
        .filter(
            (deposito) =>
                deposito.tipo === "fermentador" &&
                deposito.activo
        )
        .forEach((deposito) => {
            for (let vuelta = 1; vuelta <= 4; vuelta++) {
                lista.push(`${deposito.nombre}/${vuelta}`);
            }
        });

    // Depósitos y procedencias fijas
    for (let numero = 1; numero <= 23; numero++) {
        lista.push(String(numero));
    }

    lista.push("Auxiliar 1");
    lista.push("Auxiliar 2");
    lista.push("Barricas");
    lista.push("H1");
    lista.push("H2");

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

                actualizarTotalesVino();

    }


/* =====================================================
   TOTALES DE VINOS
===================================================== */

function actualizarTotalesVino() {

    const totalesPorAnada = {};

    /* ==========================================
       RECORRER TODOS LOS MOVIMIENTOS
       ========================================== */

    Object.values(movimientos).forEach(lista => {

        if (!Array.isArray(lista)) {
            return;
        }

        lista.forEach(movimiento => {

            const vino = movimiento.vino;
            const litros =
                parseFloat(movimiento.litros) || 0;

            if (!litros || !vino) {
                return;
            }

            /*
             * Si no hay añada, se agrupa como
             * "Sin añada"
             */
            const anada =
                movimiento.anada !== undefined &&
                movimiento.anada !== null &&
                String(movimiento.anada).trim() !== ""
                    ? String(movimiento.anada).trim()
                    : "Sin añada";

            /*
             * Crear la añada si todavía no existe
             */
            if (!totalesPorAnada[anada]) {

                totalesPorAnada[anada] = {
                    "Yema": 0,
                    "Prensa": 0,
                    "pH": 0,
                    "Barricas": 0,
                    "Duelas": 0,
                    "Joven": 0
                };
            }

            /*
             * Sumar los litros al vino
             * correspondiente de esa añada
             */
            if (
                Object.prototype.hasOwnProperty.call(
                    totalesPorAnada[anada],
                    vino
                )
            ) {

                totalesPorAnada[anada][vino] += litros;
            }

        });

    });


    /* ==========================================
       ORDENAR LAS AÑADAS
       ========================================== */

    const anadasOrdenadas =
        Object.keys(totalesPorAnada).sort((a, b) => {

            if (a === "Sin añada") return 1;
            if (b === "Sin añada") return -1;

            return Number(b) - Number(a);
        });


    /* ==========================================
       CONTENEDOR
       ========================================== */

    const contenedor =
        $("totales-vinos-contenido");

    if (!contenedor) {
        return;
    }


    /* ==========================================
       SI NO HAY MOVIMIENTOS
       ========================================== */

    if (!anadasOrdenadas.length) {

        contenedor.innerHTML = `
            <div class="totales-vinos-vacio">
                No hay movimientos con litros registrados.
            </div>
        `;

        return;
    }


    /* ==========================================
       CREAR TARJETAS DE CADA AÑADA
       ========================================== */

    contenedor.innerHTML =
        anadasOrdenadas.map(anada => {

            const totales =
                totalesPorAnada[anada];

            return `
                <div class="total-anada">

                    <div class="total-anada-titulo">
                        Añada ${escapar(anada)}
                    </div>

                    <div class="total-anada-grid">

                        <div class="total-vino">
                            <span>🍇 Yema</span>
                            <strong>
                                ${formatoNumero(totales.Yema, 0)} L
                            </strong>
                        </div>

                        <div class="total-vino">
                            <span>🍇 Prensa</span>
                            <strong>
                                ${formatoNumero(totales.Prensa, 0)} L
                            </strong>
                        </div>

                        <div class="total-vino">
                            <span>🧪 pH</span>
                            <strong>
                                ${formatoNumero(totales.pH, 0)} L
                            </strong>
                        </div>

                        <div class="total-vino">
                            <span>🪵 Barricas</span>
                            <strong>
                                ${formatoNumero(totales.Barricas, 0)} L
                            </strong>
                        </div>

                        <div class="total-vino">
                            <span>🪵 Duelas</span>
                            <strong>
                                ${formatoNumero(totales.Duelas, 0)} L
                            </strong>
                        </div>

                        <div class="total-vino">
                            <span>🍷 Joven</span>
                            <strong>
                                ${formatoNumero(totales.Joven, 0)} L
                            </strong>
                        </div>

                    </div>

                </div>
            `;

        }).join("");
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
                        colspan="7"
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

                                    <option value="Barricas" ${fila.vino === "Barricas" ? "selected" : ""}>Barricas</option>
                                    <option value="Duelas" ${fila.vino === "Duelas" ? "selected" : ""}>Duelas</option>
                                    <option value="Joven" ${fila.vino === "Joven" ? "selected" : ""}>Joven</option>

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

                            <!-- AÑADA -->
                            <td>
    <input
        type="number"
        min="1900"
        max="2100"
        step="1"
        value="${fila.anada || ""}"
        placeholder="Añada"
        inputmode="numeric"
        data-campo="anada"
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
                                        Añada
                                    </th>

                                    <th>
                                        Variedad Uva / Características
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
        <thead>
            <tr>
                <th>Parámetro</th>
                <th>Análisis 1 (Antes FM)</th>
                <th>Análisis 2 (Después FM)</th>
            </tr>
            <tr>
                <th>Fecha</th>

                <td>
                    <input
                        type="date"
                        value="${escapar(
                            deposito.analisis1?.fecha || ""
                        )}"
                        data-analisis-fecha="analisis1"
                        data-deposito="${deposito.id}">
                </td>

                <td>
                    <input
                        type="date"
                        value="${escapar(
                            deposito.analisis2?.fecha || ""
                        )}"
                        data-analisis-fecha="analisis2"
                        data-deposito="${deposito.id}">
                </td>
            </tr>
        </thead>

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
                "Ácido Málico (g/L)"
            )}

            ${crearCampoAnalisis(
                deposito,
                "sulfurosoLibre",
                "Sulfuroso Libre (mg/L)"
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

    const analisis1 =
        deposito.analisis1 || {};

    const analisis2 =
        deposito.analisis2 || {};

    const valor1 =
        analisis1[clave] || "";

    const valor2 =
        analisis2[clave] || "";

    return `
        <tr>

            <th>
                ${titulo}
            </th>

            <td>
                <input
                    type="text"
                    inputmode="decimal"
                    value="${escapar(valor1)}"
                    data-analisis="${clave}"
                    data-analisis-bloque="analisis1"
                    data-deposito="${deposito.id}">
            </td>

            <td>
                <input
                    type="text"
                    inputmode="decimal"
                    value="${escapar(valor2)}"
                    data-analisis="${clave}"
                    data-analisis-bloque="analisis2"
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

                anada: "",

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

        /* ---------------------------------------------
   CAMPOS DE ANÁLISIS
--------------------------------------------- */

if (
    elemento.dataset &&
    elemento.dataset.analisis
) {

    const idDeposito =
        elemento.dataset.deposito;

    const clave =
        elemento.dataset.analisis;

    const bloque =
        elemento.dataset.analisisBloque;

    const deposito =
        depositos.find(
            (d) =>
                d.id === idDeposito
        );

    if (!deposito) {
        return;
    }

    // Determinar qué análisis estamos modificando
    if (bloque === "analisis1") {

        if (!deposito.analisis1) {
            deposito.analisis1 = {
                fecha: "",
                glucosa: "",
                reductores: "",
                alcohol: "",
                ph: "",
                acidez: "",
                acetico: "",
                malico: "",
                sulfurosoLibre: ""
            };
        }

        deposito.analisis1[clave] =
            elemento.value;

    } else if (bloque === "analisis2") {

        if (!deposito.analisis2) {
            deposito.analisis2 = {
                fecha: "",
                glucosa: "",
                reductores: "",
                alcohol: "",
                ph: "",
                acidez: "",
                acetico: "",
                malico: "",
                sulfurosoLibre: ""
            };
        }

        deposito.analisis2[clave] =
            elemento.value;
    }

    guardar();

    return;
}

/* ---------------------------------------------
   FECHA DE ANÁLISIS
--------------------------------------------- */

if (
    elemento.dataset &&
    elemento.dataset.analisisFecha
) {

    const idDeposito =
        elemento.dataset.deposito;

    const bloque =
        elemento.dataset.analisisFecha;

    const deposito =
        depositos.find(
            (d) =>
                d.id === idDeposito
        );

    if (!deposito) {
        return;
    }

    if (bloque === "analisis1") {

        if (!deposito.analisis1) {
            deposito.analisis1 = {};
        }

        deposito.analisis1.fecha =
            elemento.value;

    } else if (bloque === "analisis2") {

        if (!deposito.analisis2) {
            deposito.analisis2 = {};
        }

        deposito.analisis2.fecha =
            elemento.value;
    }

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
                deposito,
                indice === 0
            );

        }
    );

    pdf.save(
        "Informe_Depositos.pdf"
    );

}

/* =====================================================
   TOTALES DE VINO POR AÑADA PARA PDF
   ===================================================== */

function obtenerTotalesVinoPorAnadaPDF() {

    const totales = {};

    const tiposVino = [
        "Yema",
        "Prensa",
        "pH",
        "Barricas",
        "Duelas",
        "Joven"
    ];

    depositos
        .filter(deposito => deposito.activo)
        .forEach(deposito => {

            const filas = obtenerMovimientos(deposito);

            filas.forEach(fila => {

                const anada =
                    fila.anada !== undefined &&
                    fila.anada !== null &&
                    String(fila.anada).trim() !== ""
                        ? String(fila.anada).trim()
                        : "Sin añada";

                const vino = fila.vino;

                if (!tiposVino.includes(vino)) {
                    return;
                }

                if (!totales[anada]) {

                    totales[anada] = {
                        Yema: 0,
                        Prensa: 0,
                        pH: 0,
                        Barricas: 0,
                        Duelas: 0,
                        Joven: 0
                    };

                }

                totales[anada][vino] += numero(fila.litros);

            });

        });

    const anadas = Object.keys(totales);

    anadas.sort((a, b) => {

        if (a === "Sin añada") return 1;
        if (b === "Sin añada") return -1;

        return Number(b) - Number(a);

    });

    return {
        totales,
        anadas
    };

}


    /* =====================================================
       CREAR PÁGINA PDF
    ===================================================== */

    function crearPaginaPDF(
    pdf,
    deposito,
    esPrimeraPagina = false
) {

        const margen = 12;

        const anchoPagina = 210;

        const anchoContenido =
            anchoPagina -
            margen * 2;


        let y = 15;

        /* ---------------------------------------------
   TOTALES DE VINO POR AÑADA
   SOLO EN LA PRIMERA PÁGINA
--------------------------------------------- */

if (esPrimeraPagina) {

    const datosAnadas =
        obtenerTotalesVinoPorAnadaPDF();

    const totalesAnada =
        datosAnadas.totales;

    const anadas =
        datosAnadas.anadas;

    if (anadas.length > 0) {

        pdf.setFontSize(12);

        pdf.setFont(
            "helvetica",
            "bold"
        );

        pdf.text(
            "TOTALES DE VINO POR AÑADA",
            margen,
            y
        );

        y += 6;

        const columnasAnada = [
            {
                titulo: "Añada",
                ancho: 28
            },
            {
                titulo: "Yema",
                ancho: 25
            },
            {
                titulo: "Prensa",
                ancho: 25
            },
            {
                titulo: "pH",
                ancho: 22
            },
            {
                titulo: "Barricas",
                ancho: 28
            },
            {
                titulo: "Duelas",
                ancho: 28
            },
            {
                titulo: "Joven",
                ancho: 28
            }
        ];

        const altoCabeceraAnada = 7;
        const altoFilaAnada = 6;

        let xAnada = margen;

        pdf.setFontSize(7);

        pdf.setFont(
            "helvetica",
            "bold"
        );

        /* CABECERA */

        columnasAnada.forEach(
            (columna) => {

                pdf.setFillColor(
                    220,
                    239,
                    220
                );

                pdf.rect(
                    xAnada,
                    y,
                    columna.ancho,
                    altoCabeceraAnada,
                    "FD"
                );

                pdf.text(
                    columna.titulo,
                    xAnada + 2,
                    y + 4.5
                );

                xAnada += columna.ancho;

            }
        );

        y += altoCabeceraAnada;

        /* FILAS */

        pdf.setFont(
            "helvetica",
            "normal"
        );

        anadas.forEach(
            (anada) => {

                xAnada = margen;

                const datos =
                    totalesAnada[anada];

                const valoresAnada = [

                    anada,

                    formatoNumero(
                        datos.Yema,
                        0
                    ) + " L",

                    formatoNumero(
                        datos.Prensa,
                        0
                    ) + " L",

                    formatoNumero(
                        datos.pH,
                        0
                    ) + " L",

                    formatoNumero(
                        datos.Barricas,
                        0
                    ) + " L",

                    formatoNumero(
                        datos.Duelas,
                        0
                    ) + " L",

                    formatoNumero(
                        datos.Joven,
                        0
                    ) + " L"

                ];

                columnasAnada.forEach(
                    (columna, indice) => {

                        pdf.rect(
                            xAnada,
                            y,
                            columna.ancho,
                            altoFilaAnada
                        );

                        pdf.text(
                            String(
                                valoresAnada[indice] || ""
                            ),
                            xAnada + 2,
                            y + 4.2
                        );

                        xAnada += columna.ancho;

                    }
                );

                y += altoFilaAnada;

            }
        );

        y += 6;

    }

}


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

/* CAPACIDAD */
pdf.setFont(
    "helvetica",
    "bold"
);

pdf.text(
    "Capacidad:",
    margen,
    y
);

pdf.setFont(
    "helvetica",
    "normal"
);

pdf.text(
    `${formatoNumero(deposito.cap)} L`,
    margen + 21,
    y
);


/* TIPO */
pdf.setFont(
    "helvetica",
    "bold"
);

pdf.text(
    "Tipo:",
    margen + 60,
    y
);

pdf.setFont(
    "helvetica",
    "normal"
);

pdf.text(
    deposito.tipo === "fermentador"
        ? "Fermentador"
        : "Almacenamiento",
    margen + 71,
    y
);

y += 5;


/* ---------------------------------------------
   ESPECIFICACIONES
--------------------------------------------- */

pdf.setFont(
    "helvetica",
    "bold"
);

pdf.text(
    "Especificaciones:",
    margen,
    y
);

pdf.setFont(
    "helvetica",
    "normal"
);

pdf.text(
    String(
        deposito.especificaciones || ""
    ),
    margen + 32,
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
        ancho: 30
    },

    {
        titulo: "Vino",
        ancho: 22
    },

    {
        titulo: "Litros",
        ancho: 22
    },

    {
        titulo: "Añada",
        ancho: 20
    },

    {
        titulo: "Variedad Uva / Características",
        ancho: 52
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

        /* COLOR DE FONDO */
        pdf.setFillColor(
            220,
            239,
            220
        );

        pdf.rect(
            x,
            y,
            columna.ancho,
            altoCabecera,
            "FD"
        );

        pdf.text(
            columna.titulo,
            x + 2,
            y + 5
        );

        x += columna.ancho;
    }
);

/* VOLVER A BLANCO */
pdf.setFillColor(
    255,
    255,
    255
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
        0
    ),

    fila.anada || "",

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

/* COLOR AZUL CLARO */
pdf.setFillColor(
    204,
    229,
    255
);

/* MANTENER EXACTAMENTE
   LAS MISMAS DIMENSIONES
   QUE TENÍA LA FILA ORIGINAL */

pdf.rect(
    margen,
    y,
    anchoContenido,
    8,
    "FD"
);

pdf.text(
    "TOTAL",
    margen + 2,
    y + 5
);

pdf.text(
    formatoNumero(
        totalLitros,
        0
    ) + " L",
    margen + 54,
    y + 5
);

pdf.text(
    "100,00 %",
    margen + 146,
    y + 5
);

/* VOLVER A BLANCO */
pdf.setFillColor(
    255,
    255,
    255
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


// Obtener los dos análisis
const analisis1 =
    deposito.analisis1 || {};

const analisis2 =
    deposito.analisis2 || {};


// Encabezados
const anchoParametro = 75;
const anchoAnalisis = 55;

pdf.setFontSize(8);

pdf.setFont(
    "helvetica",
    "bold"
);


// Cabecera de la tabla

pdf.setFillColor(
    220,
    239,
    220
);

pdf.rect(
    margen,
    y,
    anchoParametro,
    7,
    "FD"
);

pdf.rect(
    margen + anchoParametro,
    y,
    anchoAnalisis,
    7,
    "FD"
);

pdf.rect(
    margen + anchoParametro + anchoAnalisis,
    y,
    anchoAnalisis,
    7,
    "FD"
);

pdf.setFont(
    "helvetica",
    "bold"
);

pdf.text(
    "Parámetro",
    margen + 2,
    y + 4.7
);

pdf.text(
    "Análisis 1 (Antes FM)",
    margen + anchoParametro + 2,
    y + 4.7
);

pdf.text(
    "Análisis 2 (Después FM)",
    margen + anchoParametro + anchoAnalisis + 2,
    y + 4.7
);

y += 7;


// Fechas

/* COLOR ROJO CLARO */
pdf.setFillColor(
    242,
       204,
    204
);

pdf.rect(
    margen,
    y,
    anchoParametro,
    7,
    "FD"
);

pdf.rect(
    margen + anchoParametro,
    y,
    anchoAnalisis,
    7,
    "FD"
);

pdf.rect(
    margen + anchoParametro + anchoAnalisis,
    y,
    anchoAnalisis,
    7,
    "FD"
);

pdf.setFont(
    "helvetica",
    "bold"
);

pdf.text(
    "Fecha",
    margen + 2,
    y + 4.7
);

pdf.setFont(
    "helvetica",
    "normal"
);

pdf.text(
    analisis1.fecha
        ? analisis1.fecha.split("-").reverse().join("/")
        : "",
    margen + anchoParametro + 2,
    y + 4.7
);

pdf.text(
    analisis2.fecha
        ? analisis2.fecha.split("-").reverse().join("/")
        : "",
    margen + anchoParametro + anchoAnalisis + 2,
    y + 4.7
);

y += 7;


// Parámetros

const campos = [
    [
        "Glucosa + Fructosa (g/L)",
        analisis1.glucosa,
        analisis2.glucosa
    ],
    [
        "Azúcares Reductores (g/L)",
        analisis1.reductores,
        analisis2.reductores
    ],
    [
        "Grado Alcohólico (% Vol)",
        analisis1.alcohol,
        analisis2.alcohol
    ],
    [
        "pH (Ud.)",
        analisis1.ph,
        analisis2.ph
    ],
    [
        "Acidez Total (g/L Tartárico)",
        analisis1.acidez,
        analisis2.acidez
    ],
    [
        "Ácido Acético (g/L Acético)",
        analisis1.acetico,
        analisis2.acetico
    ],
    [
        "Ácido Málico (g/L)",
        analisis1.malico,
        analisis2.malico
    ],

    [
    "Sulfuroso Libre (mg/L)",
    analisis1.sulfurosoLibre,
    analisis2.sulfurosoLibre
    ]
];


campos.forEach(
    (campo) => {

        pdf.rect(
            margen,
            y,
            anchoParametro,
            7
        );

        pdf.rect(
            margen + anchoParametro,
            y,
            anchoAnalisis,
            7
        );

        pdf.rect(
            margen + anchoParametro + anchoAnalisis,
            y,
            anchoAnalisis,
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
            margen + anchoParametro + 2,
            y + 4.7
        );

        pdf.text(
            String(
                campo[2] || ""
            ),
            margen + anchoParametro + anchoAnalisis + 2,
            y + 4.7
        );


        y += 7;
    }
);
    }

    /* ---------------------------------------------
           EXPORTAR JSON
        --------------------------------------------- */

        function exportarJSON() {

            const copia = {
                version: 1,
                fecha: new Date().toISOString(),
                depositos: depositos,
                movimientos: movimientos
            };

            const contenido =
                JSON.stringify(
                    copia,
                    null,
                    2
                );

            const blob =
                new Blob(
                    [contenido],
                    {
                        type: "application/json"
                    }
                );

            const enlace =
                document.createElement("a");

            enlace.href =
                URL.createObjectURL(blob);

            enlace.download =
                "Copia_Seguridad_Depositos.json";

            document.body.appendChild(
                enlace
            );

            enlace.click();

            document.body.removeChild(
                enlace
            );

            URL.revokeObjectURL(
                enlace.href
            );
        }


        /* ---------------------------------------------
           IMPORTAR JSON
        --------------------------------------------- */

        function importarJSON(evento) {

            const archivo =
                evento.target.files[0];

            if (!archivo) {
                return;
            }

            const lector =
                new FileReader();

            lector.onload =
                function () {

                    try {

                        const copia =
                            JSON.parse(
                                lector.result
                            );

                        if (
                            !copia ||
                            !Array.isArray(
                                copia.depositos
                            ) ||
                            typeof copia.movimientos !==
                                "object"
                        ) {

                            throw new Error(
                                "El archivo no tiene un formato de copia de seguridad válido."
                            );
                        }

                        const confirmar =
                            confirm(
                                "Se va a restaurar la copia de seguridad.\n\n" +
                                `Depósitos: ${copia.depositos.length}\n\n` +
                                "Los datos actuales del programa serán sustituidos.\n\n" +
                                "¿Quieres continuar?"
                            );

                        if (!confirmar) {
                            evento.target.value =
                                "";
                            return;
                        }

                        depositos =
                            copia.depositos;

                        movimientos =
                            copia.movimientos;

                        guardar();

                        renderizarDepositos();

                        renderizarMovimientos();

                        alert(
                            "Copia de seguridad restaurada correctamente."
                        );

                    }
                    catch (error) {

                        console.error(
                            "Error importando JSON:",
                            error
                        );

                        alert(
                            "No se pudo importar la copia de seguridad.\n\n" +
                            error.message
                        );
                    }

                    evento.target.value =
                        "";
                };


            lector.onerror =
                function () {

                    alert(
                        "No se pudo leer el archivo JSON."
                    );

                    evento.target.value =
                        "";
                };


            lector.readAsText(
                archivo,
                "UTF-8"
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
    function (evento) {

        manejarMovimientos(evento);

        actualizarTotalesVino();
    }
);


        /* ---------------------------------------------
           EXPORTAR PDF
        --------------------------------------------- */

        $("pdf").addEventListener(
            "click",
            exportarPDF
        );

        $("btn-exportar-json").addEventListener(
    "click",
    exportarJSON
);

$("btn-importar-json").addEventListener(
    "click",
    function () {
        $("input-importar-json").click();
    }
);

$("input-importar-json").addEventListener(
    "change",
    importarJSON
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

        