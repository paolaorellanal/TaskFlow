const URL_API = "https://jsonplaceholder.typicode.com/todos?_limit=5";

async function obtenerTareasAPI() {
  try {
    const respuesta = await fetch(URL_API);

    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }

    const datos = await respuesta.json();

    return datos;
  } catch (error) {
    console.error("No fue posible obtener las tareas:", error);

    throw error;
  }
}
