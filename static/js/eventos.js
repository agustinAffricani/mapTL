// eventos.js
import { 
    mostrarToast, 
    centrarEnParcela,
    centrarEnParcelaPorCCA,
    cerrarModal,
    abrirModal
} from './funciones.js';
import { obtenerListaDescripciones } from './fetchs.js';
import { map } from './variables.js';

async function guardarDescripcionYActualizar(pda, descripcion, input, content) {
    try {
        const res = await fetch("/guardar_descripcion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ partida: pda, descripcion })
        });
        const data = await res.json();
        if (data.success) {
            mostrarToast("✅ Descripción guardada");

            // Actualizar en memoria
            import('./variables.js').then(vars => {
                vars.datosGlobales.descripcionesData[pda] = descripcion;
            });

            // ✅ Solo actualizar el valor del input
            input.value = descripcion;

        } else {
            mostrarToast("❌ Error al guardar");
        }
    } catch (err) {
        mostrarToast("❌ Error al guardar");
        console.error(err);
    }
}

// === Manejo de popups (eventos dentro del popup) ===
export function inicializarEventosPopups() {
    // Un solo listener delegado para TODOS los popups
    map.on('popupopen', function(e) {
        const popup = e.popup;
        const content = popup.getElement();

        // Remover listener previo si existe (evitar duplicados)
        if (content.popupListener) {
            content.removeEventListener('click', content.popupListener);
        }

        // Nuevo listener delegado
        const listener = function(event) {
            // Copiar partida
            if (event.target.classList.contains('copy-btn') && event.target.hasAttribute('data-partida')) {
                const partida = event.target.getAttribute('data-partida');
                navigator.clipboard.writeText(partida)
                    .then(() => mostrarToast("✅ Partida copiada: " + partida))
                    .catch(() => mostrarToast("❌ No se pudo copiar"));
                return;
            }

            // Copiar coordenadas
            if (event.target.classList.contains('copy-coords-btn')) {
                const coords = event.target.getAttribute('data-coords');
                navigator.clipboard.writeText(coords)
                    .then(() => mostrarToast("✅ Coordenadas copiadas: " + coords))
                    .catch(() => mostrarToast("❌ No se pudo copiar"));
                return;
            }

            // Guardar descripción
            if (event.target.classList.contains('save-desc-btn')) {
                const clave = event.target.getAttribute('data-clave'); // PDA o CCA
                const input = event.target.closest('.leaflet-popup-content')?.querySelector('.descripcion-input');
                if (!input) return;

                const descripcion = input.value.trim();
                guardarDescripcionYActualizar(clave, descripcion, input);
                return;
            }
        };

        // Asignar listener y guardar referencia
        content.addEventListener('click', listener);
        content.popupListener = listener;
    });

    // Abrir/cerrar panel de herramientas (evento delegado)
    document.addEventListener('click', function(e) {
        if (e.target.id === 'toolbox-button') {
            const panel = document.getElementById('toolbox-panel');
            if (panel) {
                panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
            }
        }
    });

    // Acordeón (evento delegado)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('accordion')) {
            const btn = e.target;
            const panel = btn.nextElementSibling;

            // Cerrar otros acordeones
            document.querySelectorAll('.accordion').forEach(otherBtn => {
                if (otherBtn !== btn) {
                    otherBtn.classList.remove('active');
                    otherBtn.nextElementSibling.classList.remove('show');
                }
            });

            // Alternar el acordeón actual
            btn.classList.toggle('active');
            panel.classList.toggle('show');
        }
    });

    // Cerrar modal con la "X" (evento delegado)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('close') && e.target.closest('#modalDesc')) {
            document.getElementById("modalDesc").style.display = "none";
        }
    });

    // También cerrar si se hace clic fuera del contenido del modal
    document.addEventListener('click', function(e) {
        if (e.target.id === 'modalDesc') {
            e.target.style.display = 'none';
        }
    });

    // Cerrar modal con la tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
            const modal = document.getElementById('modalDesc');
            if (modal && modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        }
    });

    // Tabla buscar por Descripción
    document.getElementById("btnBuscarDesc")?.addEventListener("click", () => {
        obtenerListaDescripciones()
            .then(descripciones => {
                let tbody = document.querySelector("#tablaDescripciones tbody");
                tbody.innerHTML = "";

                Object.entries(descripciones).forEach(([clave, descripcion]) => {
                    let tr = document.createElement("tr");
                    if (/^\d+$/.test(clave)) {
                            tr.innerHTML = `<td>${clave}</td><td>${descripcion}</td>`;
                        } else {
                            tr.innerHTML = `<td>Sin Nro de Partida</td><td>${descripcion}</td>`;
                        }
                    tr.addEventListener("click", () => {
                        // Si la clave es un número (PDA), usar centrarEnParcela
                        // Si no, asumir que es CCA y usar centrarEnParcelaPorCCA
                        if (/^\d+$/.test(clave)) {
                            centrarEnParcela(clave);
                        } else {
                            centrarEnParcelaPorCCA(clave);
                        }
                        cerrarModal();
                    });
                    tbody.appendChild(tr);
                });
                abrirModal();
            })
            .catch(err => console.error("Error:", err));
    });

    // Filtro en tabla de descripciones (evento delegado)
    document.addEventListener('input', function(e) {
        if (e.target.id === 'filtroTabla') {
            const filtro = e.target.value.toLowerCase();
            const filas = document.querySelectorAll("#tablaDescripciones tbody tr");
            
            filas.forEach(fila => {
                // Verificar que la fila tenga al menos 2 celdas
                if (fila.cells.length >= 2) {
                    const partida = (fila.cells[0].textContent || '').toLowerCase();
                    const descripcion = (fila.cells[1].textContent || '').toLowerCase();
                    const coincide = partida.includes(filtro) || descripcion.includes(filtro);
                    fila.style.display = coincide ? '' : 'none';
                }
            });
        }
    });
}