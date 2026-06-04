import * as api from "../../helpers/api";
// crear un dropdown para filtrar

export const dropdownFiltro = async(esVoluntario = false) => {
    const dropdown = document.createElement("select");
    dropdown.classList.add("dropdown-filtro");

    // crear una opción para mostrar independientemente del estado
    const todos = document.createElement("option");
    todos.textContent = "Todos"
    todos.value = 0;

    dropdown.append(todos);

    if (esVoluntario) {
        // -------------------------------------------------------------
        // OPCIONES DE FILTRADO PREDETERMINADAS PARA EL VOLUNTARIO
        // -------------------------------------------------------------
        // Qué hace: Define la lista estática de estados por los cuales el voluntario puede filtrar sus planes.
        // Por qué existe: Permite al voluntario segmentar y ubicar rápidamente planes según si están en borrador, enviados, aprobados o rechazados.
        // Qué problema resuelve: Agrega las opciones de "Enviado" y "Aprobado" que antes no estaban disponibles en el menú de filtros del voluntario.
        const opciones = [
            { id: 2, name: "Pendiente" },
            { id: 1, name: "Enviado" },
            { id: 7, name: "Aprobado" },
            { id: 4, name: "Rechazado" },
            { id: 5, name: "Rechazado con observaciones" },
            { id: 3, name: "Por definir" }
        ];
        opciones.forEach(opt => {
            const option = document.createElement("option");
            option.textContent = opt.name;
            option.value = opt.id;
            option.classList.add("dropdown-filtro__item");
            dropdown.append(option);
        });
    } else {
        // agarrar los estados de planes familiares desde la DB
        const estados = await api.get("statusPlans")

        estados.forEach(estado => {
            const option = document.createElement("option");
            option.textContent = estado.name;
            option.value = estado.id
            option.classList.add("dropdown-filtro__item")
            dropdown.append(option)
        })
    }

    return dropdown
}

