document.addEventListener("DOMContentLoaded", () => {
  const gestorTareas = new GestorTareas();

  // =====================================================
  // ELEMENTOS DEL DOM
  // =====================================================

  const formulario = document.getElementById("formularioTarea");
  const tareaId = document.getElementById("tareaId");
  const descripcion = document.getElementById("descripcion");
  const fechaLimite = document.getElementById("fechaLimite");
  const hoy = new Date().toISOString().split("T")[0];
  fechaLimite.min = hoy;
  const prioridad = document.getElementById("prioridad");

  const btnGuardar = document.getElementById("btnGuardar");
  const btnCancelarEdicion = document.getElementById("btnCancelarEdicion");

  const btnCargarApi = document.getElementById("btnCargarApi");
  const buscador = document.getElementById("buscador");

  const listaTareas = document.getElementById("listaTareas");
  const contenedorMensajes = document.getElementById("contenedorMensajes");

  const contadorPendientes = document.getElementById("contadorPendientes");

  const totalTareas = document.getElementById("totalTareas");
  const totalPendientes = document.getElementById("totalPendientes");
  const totalCompletadas = document.getElementById("totalCompletadas");

  // =====================================================
  // VARIABLES GENERALES
  // =====================================================

  let filtroActual = "todas";
  let textoBusqueda = "";
  let temporizadorMensaje = null;

  // =====================================================
  // FUNCIONES AUXILIARES
  // =====================================================

  const generarId = () => {
    if (window.crypto && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const escaparHTML = (texto) => {
    const elemento = document.createElement("div");
    elemento.textContent = texto;
    return elemento.innerHTML;
  };

  const mostrarMensaje = (mensaje, tipo = "success", tiempo = 3000) => {
    /*
     * Si existe un temporizador anterior, se elimina.
     * Esto evita que una notificación antigua borre una nueva.
     */
    if (temporizadorMensaje) {
      clearTimeout(temporizadorMensaje);
    }

    contenedorMensajes.innerHTML = `
            <div
                class="alert alert-${tipo} alert-dismissible fade show"
                role="alert"
            >
                ${escaparHTML(mensaje)}

                <button
                    type="button"
                    class="btn-close"
                    data-bs-dismiss="alert"
                    aria-label="Cerrar"
                ></button>
            </div>
        `;

    temporizadorMensaje = setTimeout(() => {
      contenedorMensajes.innerHTML = "";
      temporizadorMensaje = null;
    }, tiempo);
  };

  const mostrarNotificacionAsincrona = (mensaje) => {
    setTimeout(() => {
      mostrarMensaje(mensaje, "info", 4000);
    }, 2000);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return "Sin fecha límite";
    }

    const fechaObjeto = new Date(`${fecha}T00:00:00`);

    if (Number.isNaN(fechaObjeto.getTime())) {
      return "Fecha no válida";
    }

    return fechaObjeto.toLocaleDateString("es-CL");
  };

  const calcularTiempoRestante = (fecha) => {
    if (!fecha) {
      return "Sin fecha límite";
    }

    const ahora = new Date();

    /*
     * Se considera el final del día seleccionado como fecha límite.
     */
    const limite = new Date(`${fecha}T23:59:59`);

    if (Number.isNaN(limite.getTime())) {
      return "Fecha no válida";
    }

    const diferencia = limite.getTime() - ahora.getTime();

    if (diferencia <= 0) {
      return "Plazo vencido";
    }

    const milisegundosPorMinuto = 1000 * 60;
    const milisegundosPorHora = milisegundosPorMinuto * 60;
    const milisegundosPorDia = milisegundosPorHora * 24;

    const dias = Math.floor(diferencia / milisegundosPorDia);

    const horas = Math.floor(
      (diferencia % milisegundosPorDia) / milisegundosPorHora,
    );

    const minutos = Math.floor(
      (diferencia % milisegundosPorHora) / milisegundosPorMinuto,
    );

    if (dias > 0) {
      return `${dias} días, ${horas} horas y ${minutos} minutos`;
    }

    if (horas > 0) {
      return `${horas} horas y ${minutos} minutos`;
    }

    return `${minutos} minutos`;
  };

  const obtenerClasePrioridad = (prioridadTarea) => {
    switch (prioridadTarea) {
      case "alta":
        return "danger";

      case "media":
        return "warning";

      case "baja":
        return "success";

      default:
        return "secondary";
    }
  };

  // =====================================================
  // FILTRADO DE TAREAS
  // =====================================================

  const obtenerTareasFiltradas = () => {
    let tareas = gestorTareas.obtenerTareas();

    if (filtroActual === "pendientes") {
      tareas = tareas.filter((tarea) => tarea.estado === "pendiente");
    }

    if (filtroActual === "completadas") {
      tareas = tareas.filter((tarea) => tarea.estado === "completada");
    }

    if (textoBusqueda !== "") {
      tareas = tareas.filter((tarea) =>
        tarea.descripcion.toLowerCase().includes(textoBusqueda),
      );
    }

    return tareas;
  };

  // =====================================================
  // CONTADORES
  // =====================================================

  const actualizarContadores = () => {
    const tareas = gestorTareas.obtenerTareas();

    const pendientes = tareas.filter(
      (tarea) => tarea.estado === "pendiente",
    ).length;

    const completadas = tareas.filter(
      (tarea) => tarea.estado === "completada",
    ).length;

    contadorPendientes.textContent = pendientes;
    totalTareas.textContent = tareas.length;
    totalPendientes.textContent = pendientes;
    totalCompletadas.textContent = completadas;
  };

  // =====================================================
  // RENDERIZAR TAREAS
  // =====================================================

  const renderizarTareas = () => {
    const tareas = obtenerTareasFiltradas();

    if (tareas.length === 0) {
      listaTareas.innerHTML = `
                <div class="estado-vacio text-center py-5">
                    <i class="bi bi-clipboard-check"></i>

                    <h3 class="h5 mt-3">
                        No hay tareas para mostrar
                    </h3>

                    <p class="text-muted mb-0">
                        Agrega una nueva tarea o cambia los filtros.
                    </p>
                </div>
            `;

      actualizarContadores();
      return;
    }

    listaTareas.innerHTML = tareas
      .map((tarea) => {
        const tareaCompletada = tarea.estado === "completada";

        const claseCompletada = tareaCompletada ? "tarea-completada" : "";

        const iconoEstado = tareaCompletada
          ? "bi-arrow-counterclockwise"
          : "bi-check2-circle";

        const tituloEstado = tareaCompletada
          ? "Marcar como pendiente"
          : "Marcar como completada";

        const clasePrioridad = obtenerClasePrioridad(tarea.prioridad);

        return `
                    <article
                        class="tarea ${claseCompletada}"
                        data-id="${tarea.id}"
                    >
                        <div
                            class="d-flex justify-content-between gap-3"
                        >
                            <div class="flex-grow-1">
                                <h3
                                    class="h5 descripcion-tarea"
                                >
                                    ${escaparHTML(tarea.descripcion)}
                                </h3>

                                <p class="mb-2 text-muted">
                                    <i
                                        class="bi bi-calendar-event"
                                    ></i>

                                    Fecha límite:
                                    ${formatearFecha(tarea.fechaLimite)}
                                </p>

                                <p class="mb-2 text-muted">
                                    <i
                                        class="bi bi-hourglass-split"
                                    ></i>

                                    Tiempo restante:
                                    ${calcularTiempoRestante(tarea.fechaLimite)}
                                </p>

                                <p class="mb-0">
                                    Prioridad:

                                    <span
                                        class="badge bg-${clasePrioridad}"
                                    >
                                        ${escaparHTML(tarea.prioridad)}
                                    </span>
                                </p>
                            </div>

                            <div
                                class="d-flex flex-column gap-2"
                            >
                                <button
                                    type="button"
                                    class="
                                        btn
                                        btn-sm
                                        btn-outline-success
                                        btn-estado
                                    "
                                    data-id="${tarea.id}"
                                    title="${tituloEstado}"
                                >
                                    <i
                                        class="bi ${iconoEstado}"
                                    ></i>
                                </button>

                                <button
                                    type="button"
                                    class="
                                        btn
                                        btn-sm
                                        btn-outline-primary
                                        btn-editar
                                    "
                                    data-id="${tarea.id}"
                                    title="Editar tarea"
                                >
                                    <i class="bi bi-pencil"></i>
                                </button>

                                <button
                                    type="button"
                                    class="
                                        btn
                                        btn-sm
                                        btn-outline-danger
                                        btn-eliminar
                                    "
                                    data-id="${tarea.id}"
                                    title="Eliminar tarea"
                                >
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </article>
                `;
      })
      .join("");

    actualizarContadores();
  };

  // =====================================================
  // FORMULARIO
  // =====================================================

  const limpiarFormulario = () => {
    formulario.reset();
    tareaId.value = "";

    btnGuardar.disabled = false;

    btnGuardar.innerHTML = `
            <i class="bi bi-floppy"></i>
            Guardar tarea
        `;

    btnCancelarEdicion.classList.add("d-none");
  };

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const descripcionValor = descripcion.value.trim();

    const fechaLimiteValor = fechaLimite.value;

    const prioridadValor = prioridad.value;

    if (
      descripcionValor === "" ||
      fechaLimiteValor === "" ||
      prioridadValor === ""
    ) {
      mostrarMensaje("Debes completar todos los campos.", "warning");

      return;
    }

    // Validar que la fecha no sea anterior a hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaSeleccionada = new Date(fechaLimiteValor);

    if (fechaSeleccionada < hoy) {
      mostrarMensaje("La fecha límite no puede ser anterior a hoy.", "warning");
      return;
    }
   
  
    /*
     * EDICIÓN DE UNA TAREA
     */
    if (tareaId.value !== "") {
      const resultado = gestorTareas.editarTarea(
        tareaId.value,
        descripcionValor,
        fechaLimiteValor,
        prioridadValor,
      );

      if (!resultado) {
        mostrarMensaje("No fue posible encontrar la tarea.", "danger");

        return;
      }

      limpiarFormulario();
      renderizarTareas();

      mostrarMensaje("Tarea actualizada correctamente.");

      return;
    }

    /*
     * CREACIÓN DE UNA TAREA
     */
    const nuevaTarea = new Tarea(
      generarId(),
      descripcionValor,
      fechaLimiteValor,
      prioridadValor,
    );

    btnGuardar.disabled = true;

    btnGuardar.innerHTML = `
            <span
                class="spinner-border spinner-border-sm"
                aria-hidden="true"
            ></span>

            Guardando...
        `;

    /*
     * Simulación de una operación asíncrona.
     */
    setTimeout(() => {
      try {
        gestorTareas.agregarTarea(nuevaTarea);

        limpiarFormulario();
        renderizarTareas();

        mostrarMensaje("Tarea agregada correctamente.", "success", 2500);

        mostrarNotificacionAsincrona(
          "La tarea fue almacenada y está disponible en tu lista.",
        );
      } catch (error) {
        console.error("Error al guardar la tarea:", error);

        btnGuardar.disabled = false;

        btnGuardar.innerHTML = `
                    <i class="bi bi-floppy"></i>
                    Guardar tarea
                `;

        mostrarMensaje("Ocurrió un error al guardar la tarea.", "danger");
      }
    }, 1000);
  });

  // =====================================================
  // BOTONES DE LAS TAREAS
  // =====================================================

  listaTareas.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button");

    if (!boton) {
      return;
    }

    const id = boton.dataset.id;

    /*
     * ELIMINAR
     */
    if (boton.classList.contains("btn-eliminar")) {
      const confirmar = confirm("¿Estás segura de eliminar esta tarea?");

      if (!confirmar) {
        return;
      }

      gestorTareas.eliminarTarea(id);

      mostrarMensaje("Tarea eliminada correctamente.", "danger");

      renderizarTareas();
      return;
    }

    /*
     * CAMBIAR ESTADO
     */
    if (boton.classList.contains("btn-estado")) {
      const resultado = gestorTareas.cambiarEstadoTarea(id);

      if (!resultado) {
        mostrarMensaje("No fue posible cambiar el estado.", "danger");

        return;
      }

      mostrarMensaje("Estado actualizado correctamente.");

      renderizarTareas();
      return;
    }

    /*
     * EDITAR
     */
    if (boton.classList.contains("btn-editar")) {
      const tarea = gestorTareas.buscarTareaPorId(id);

      if (!tarea) {
        mostrarMensaje("No fue posible encontrar la tarea.", "danger");

        return;
      }

      tareaId.value = tarea.id;
      descripcion.value = tarea.descripcion;
      fechaLimite.value = tarea.fechaLimite;
      prioridad.value = tarea.prioridad;

      btnGuardar.innerHTML = `
                <i class="bi bi-pencil-square"></i>
                Actualizar tarea
            `;

      btnCancelarEdicion.classList.remove("d-none");

      descripcion.focus();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  });

  // =====================================================
  // CANCELAR EDICIÓN
  // =====================================================

  btnCancelarEdicion.addEventListener("click", () => {
    limpiarFormulario();

    mostrarMensaje("Edición cancelada.", "secondary");
  });

  // =====================================================
  // FILTROS
  // =====================================================

  document.querySelectorAll(".filtro").forEach((boton) => {
    boton.addEventListener("click", () => {
      document.querySelectorAll(".filtro").forEach((elemento) => {
        elemento.classList.remove("activo");
      });

      boton.classList.add("activo");

      filtroActual = boton.dataset.filtro;

      renderizarTareas();
    });
  });

  // =====================================================
  // BUSCADOR
  // =====================================================

  buscador.addEventListener("keyup", () => {
    textoBusqueda = buscador.value.trim().toLowerCase();

    renderizarTareas();
  });

  // =====================================================
  // EVENTO MOUSEOVER
  // =====================================================

  listaTareas.addEventListener("mouseover", (evento) => {
    const tarjeta = evento.target.closest(".tarea");

    if (!tarjeta) {
      return;
    }

    tarjeta.setAttribute(
      "title",
      "Puedes completar, editar o eliminar esta tarea",
    );
  });

  // =====================================================
  // CARGAR TAREAS DESDE API
  // =====================================================

  btnCargarApi.addEventListener("click", async () => {
    btnCargarApi.disabled = true;

    btnCargarApi.innerHTML = `
                <span
                    class="spinner-border spinner-border-sm"
                    aria-hidden="true"
                ></span>

                Cargando...
            `;

    try {
      const tareasAPI = await obtenerTareasAPI();

      const yaSeCargoLaApi = localStorage.getItem("taskflow_api_cargada");

      if (yaSeCargoLaApi === "true") {
        mostrarMensaje(
          "Las tareas de la API ya fueron cargadas anteriormente.",
          "warning",
        );

        return;
      }
      /*
       * Se utiliza destructuring para extraer
       * las propiedades de cada elemento.
       */
      tareasAPI.forEach((item) => {
        const { title, completed } = item;

        const nuevaTarea = new Tarea(
          generarId(),
          title,
          "",
          "media",
          completed ? "completada" : "pendiente",
        );

        gestorTareas.agregarTarea(nuevaTarea);
      });

      localStorage.setItem("taskflow_api_cargada", "true");

      renderizarTareas();

      mostrarMensaje(
        `${tareasAPI.length} tareas fueron cargadas desde la API.`,
      );
    } catch (error) {
      console.error("Error al consultar la API:", error);

      mostrarMensaje(
        "No fue posible cargar las tareas desde la API.",
        "danger",
      );
    } finally {
      btnCargarApi.disabled = false;

      btnCargarApi.innerHTML = `
                    <i
                        class="bi bi-cloud-download"
                    ></i>

                    Cargar tareas API
                `;

      const btnReiniciar = document.getElementById("btnReiniciar");
    }
  });

  // =====================================================
  // ACTUALIZACIÓN AUTOMÁTICA
  // =====================================================

  /*
   * Actualiza el tiempo restante cada minuto.
   */

  btnReiniciar.addEventListener("click", () => {
    const confirmar = confirm(
      "¿Deseas eliminar todas las tareas y reiniciar la aplicación?",
    );

    if (!confirmar) {
      return;
    }

    localStorage.removeItem("taskflow_tareas");
    localStorage.removeItem("taskflow_api_cargada");

    mostrarMensaje("Aplicación reiniciada correctamente.", "success");

    setTimeout(() => {
      location.reload();
    }, 1200);
  });
  setInterval(() => {
    renderizarTareas();
  }, 60000);

  // Primera carga de tareas.
  renderizarTareas();
});
