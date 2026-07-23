class Tarea {
    constructor(
        id,
        descripcion,
        fechaLimite,
        prioridad,
        estado = "pendiente",
        fechaCreacion = new Date().toISOString()
    ) {
        this.id = id;
        this.descripcion = descripcion;
        this.fechaLimite = fechaLimite;
        this.prioridad = prioridad;
        this.estado = estado;
        this.fechaCreacion = fechaCreacion;
    }

    cambiarEstado() {
        this.estado =
            this.estado === "pendiente"
                ? "completada"
                : "pendiente";
    }

    actualizarDatos(descripcion, fechaLimite, prioridad) {
        this.descripcion = descripcion;
        this.fechaLimite = fechaLimite;
        this.prioridad = prioridad;
    }
}