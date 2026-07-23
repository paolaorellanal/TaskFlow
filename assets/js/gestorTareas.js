class GestorTareas {
    constructor() {
        this.tareas = this.cargarDesdeLocalStorage();
    }

    agregarTarea(tarea) {
        this.tareas.push(tarea);
        this.guardarEnLocalStorage();
    }

    eliminarTarea(id) {
        this.tareas = this.tareas.filter(
            (tarea) => tarea.id !== id
        );

        this.guardarEnLocalStorage();
    }

    buscarTareaPorId(id) {
        return this.tareas.find(
            (tarea) => tarea.id === id
        );
    }

    editarTarea(id, descripcion, fechaLimite, prioridad) {
        const tarea = this.buscarTareaPorId(id);

        if (!tarea) {
            return false;
        }

        tarea.actualizarDatos(
            descripcion,
            fechaLimite,
            prioridad
        );

        this.guardarEnLocalStorage();

        return true;
    }

    cambiarEstadoTarea(id) {
        const tarea = this.buscarTareaPorId(id);

        if (!tarea) {
            return false;
        }

        tarea.cambiarEstado();
        this.guardarEnLocalStorage();

        return true;
    }

    obtenerTareas() {
        return [...this.tareas];
    }

    guardarEnLocalStorage() {
        localStorage.setItem(
            "taskflow_tareas",
            JSON.stringify(this.tareas)
        );
    }

    cargarDesdeLocalStorage() {
        const datosGuardados = localStorage.getItem(
            "taskflow_tareas"
        );

        if (!datosGuardados) {
            return [];
        }

        try {
            const datos = JSON.parse(datosGuardados);

            return datos.map(
                (tarea) =>
                    new Tarea(
                        tarea.id,
                        tarea.descripcion,
                        tarea.fechaLimite,
                        tarea.prioridad,
                        tarea.estado,
                        tarea.fechaCreacion
                    )
            );
        } catch (error) {
            console.error(
                "No fue posible cargar las tareas:",
                error
            );

            return [];
        }
    }
}