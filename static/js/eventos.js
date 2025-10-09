// eventos.js
import { 
    mostrarToast
} from './funciones.js';

import { map } from './variables.js';

let menuPanelGlobal = null;

// ✅ Función para crear el control de menú de Leaflet
export function crearMenuControl(map) {
    const MenuControl = L.Control.extend({
        options: {
            position: 'topleft'
        },

        onAdd: function(map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-menu');
            container.style.backgroundColor = 'white';
            container.style.borderRadius = '4px';
            container.style.boxShadow = '0 1px 5px rgba(0,0,0,0.4)';
            container.style.cursor = 'pointer';
            container.style.width = '36px';
            container.style.height = '36px';
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.position = 'relative';
            container.style.zIndex = '800'; // ✅ Encima del control de capas

            // Ícono de menú
            container.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2">
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            `;

            // Panel desplegable
            const panel = L.DomUtil.create('div', 'menu-panel', container);
            panel.style.position = 'absolute';
            panel.style.top = '0';
            panel.style.left = '100%';
            panel.style.backgroundColor = 'white';
            panel.style.borderRadius = '8px';
            panel.style.marginLeft = '8px';
            panel.style.boxShadow = '0 2px 10px rgba(0,0,0,0.4)';
            panel.style.padding = '12px';
            panel.style.display = 'none';
            panel.style.minWidth = '220px';
            panel.style.zIndex = '801';
            panel.style.flexDirection = 'column';
            panel.style.gap = '8px';
            // ✅ Animación
            panel.style.opacity = '0';
            panel.style.transform = 'translateY(-10px)';
            panel.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            panel.style.pointerEvents = 'none';

            // Input
            const input = L.DomUtil.create('input', 'partidaInput', panel);
            input.type = 'text';
            input.id = 'partidaInput';
            input.placeholder = 'Buscar partida...';
            input.style.padding = '8px';
            input.style.border = '1px solid #ccc';
            input.style.borderRadius = '4px';
            input.style.fontSize = '14px';
            input.style.width = '100%';
            input.style.boxSizing = 'border-box'; // ✅ Evita que se salga

            // Botones (igual que antes, con boxSizing)
            const createButton = (text, bgColor, onClick) => {
                const btn = L.DomUtil.create('button', '', panel);
                btn.textContent = text;
                btn.style.padding = '8px';
                btn.style.border = 'none';
                btn.style.borderRadius = '4px';
                btn.style.backgroundColor = bgColor;
                btn.style.color = 'white';
                btn.style.cursor = 'pointer';
                btn.style.fontSize = '14px';
                btn.style.width = '100%';
                btn.style.boxSizing = 'border-box';
                btn.onclick = onClick;
                return btn;
            };

            createButton('🔎 Buscar', '#0077b6', () => {
                import('./funciones.js').then(funcs => funcs.buscarPartida());
            });

            createButton('📋 Por descripción', '#023e8a', () => {
                import('./funciones.js').then(funcs => funcs.buscarDesc());
            });

            createButton('🗑️ Limpiar', '#6c757d', () => {
                import('./funciones.js').then(funcs => {
                    funcs.borrarResaltado();
                    funcs.borrarRuta();
                });
            });

            // ✅ Prevenir propagación de clics en el panel
            panel.addEventListener('click', function(e) {
                e.stopPropagation();
            });

            // Input ya existe, así que podemos referenciarlo directamente
            input.addEventListener('click', function(e) {
                e.stopPropagation();
            });


            // Alternar panel con animación
            container.onclick = (e) => {
                e.stopPropagation();
                
                // Cerrar panel de herramientas
                const toolboxPanel = document.getElementById('toolbox-panel');
                if (toolboxPanel && toolboxPanel.style.display === 'block') {
                    toolboxPanel.style.display = 'none';
                }
                
                if (panel.style.opacity === '1') {
                    // Cerrar
                    panel.style.opacity = '0';
                    panel.style.transform = 'translateX(-10px)';
                    panel.style.pointerEvents = 'none';
                    setTimeout(() => {
                        panel.style.display = 'none';
                    }, 200);
                } else {
                    // Abrir
                    panel.style.display = 'flex';
                    setTimeout(() => {
                        panel.style.opacity = '1';
                        panel.style.transform = 'translateX(0)';
                        panel.style.pointerEvents = 'auto';
                        const input = panel.querySelector('#partidaInput');
                        if (input) input.focus();
                    }, 10);
                }
            };
            // Guardar referencia global al panel (solo para cierre desde el mapa)
            menuPanelGlobal = panel;

            // Limpiar referencia cuando se destruye el control (opcional)
            container._cleanup = () => {
                menuPanelGlobal = null;
            };

            return container;
        }
    });

    return new MenuControl();
}

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

// Verificar si un elemento está dentro de un contenedor
function esDescendiente(contenedor, elemento) {
    if (!contenedor || !elemento) return false;
    return contenedor === elemento || contenedor.contains(elemento);
}

// === Manejo de popups (eventos dentro del popup) ===
// Bandera para evitar registrar listeners múltiples veces
let eventosGlobalesRegistrados = false;

export function inicializarEventosPopups() {
    if (eventosGlobalesRegistrados) return;
    eventosGlobalesRegistrados = true;

    // === POPUPS ===
    map.on('popupopen', function(e) {
        const popup = e.popup;
        const content = popup.getElement();

        if (content.popupListener) {
            content.removeEventListener('click', content.popupListener);
        }

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
                const clave = event.target.getAttribute('data-clave');
                const input = event.target.closest('.leaflet-popup-content')?.querySelector('.descripcion-input');
                if (!input) return;

                const descripcion = input.value.trim();
                guardarDescripcionYActualizar(clave, descripcion, input);
                return;
            }
        };

        content.addEventListener('click', listener);
        content.popupListener = listener;
    });

    // === EVENTOS GLOBALES (registrados una sola vez) ===
    
    // Cerrar paneles al hacer clic fuera
    document.addEventListener('click', (e) => {
        // Panel de herramientas
        const toolboxButton = document.getElementById('toolbox-button');
        const toolboxPanel = document.getElementById('toolbox-panel');
        const clickEnToolbox = 
            esDescendiente(toolboxButton, e.target) || 
            esDescendiente(toolboxPanel, e.target);
        
        if (toolboxButton && toolboxPanel && !clickEnToolbox) {
            toolboxPanel.style.display = 'none';
        }
    });

    // Abrir/cerrar panel de herramientas
    document.addEventListener('click', function(e) {
        if (e.target.id === 'toolbox-button') {
            const panel = document.getElementById('toolbox-panel');
            if (panel) {
                // Cerrar panel del hamburguesa
                const menuPanel = document.querySelector('.menu-panel');
                if (menuPanel && menuPanel.style.opacity === '1') {
                    menuPanel.style.opacity = '0';
                    menuPanel.style.transform = 'translateX(-10px)';
                    menuPanel.style.pointerEvents = 'none';
                    setTimeout(() => {
                        menuPanel.style.display = 'none';
                    }, 200);
                }
                panel.style.display = (panel.style.display === 'block') ? 'none' : 'block';
            }
        }
    });

    // Acordeón
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('accordion')) {
            const btn = e.target;
            const panel = btn.nextElementSibling;

            document.querySelectorAll('.accordion').forEach(otherBtn => {
                if (otherBtn !== btn) {
                    otherBtn.classList.remove('active');
                    otherBtn.nextElementSibling.classList.remove('show');
                }
            });

            btn.classList.toggle('active');
            panel.classList.toggle('show');
        }
    });

    // Modales
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('close') && e.target.closest('#modalDesc')) {
            document.getElementById("modalDesc").style.display = "none";
        }
        if (e.target.id === 'modalDesc') {
            e.target.style.display = 'none';
        }
    });

    // Tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modalDesc');
            if (modal && modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        }
    });

    // Filtro tabla
    document.addEventListener('input', function(e) {
        if (e.target.id === 'filtroTabla') {
            const filtro = e.target.value.toLowerCase();
            const filas = document.querySelectorAll("#tablaDescripciones tbody tr");
            filas.forEach(fila => {
                if (fila.cells.length >= 2) {
                    const partida = (fila.cells[0].textContent || '').toLowerCase();
                    const descripcion = (fila.cells[1].textContent || '').toLowerCase();
                    const coincide = partida.includes(filtro) || descripcion.includes(filtro);
                    fila.style.display = coincide ? '' : 'none';
                }
            });
        }
    });

    // Cerrar panel del menú al hacer clic en el mapa
    map.on('click', () => {
        if (menuPanelGlobal && menuPanelGlobal.style.opacity === '1') {
            menuPanelGlobal.style.opacity = '0';
            menuPanelGlobal.style.transform = 'translateX(-10px)';
            menuPanelGlobal.style.pointerEvents = 'none';
            setTimeout(() => {
                menuPanelGlobal.style.display = 'none';
            }, 200);
        }
    });

        // Botón de ayuda y modal
    document.getElementById('help-button')?.addEventListener('click', () => {
        document.getElementById('help-modal').style.display = 'block';
    });

    document.querySelector('.close-help')?.addEventListener('click', () => {
        document.getElementById('help-modal').style.display = 'none';
    });

    // Cerrar modal de ayuda al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (e.target.id === 'help-modal') {
            e.target.style.display = 'none';
        }
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const helpModal = document.getElementById('help-modal');
            if (helpModal && helpModal.style.display === 'block') {
                helpModal.style.display = 'none';
            }
        }
    });

    // Cerrar paneles con la tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Cerrar panel del menú hamburguesa
            const menuPanel = document.querySelector('.menu-panel');
            if (menuPanel && menuPanel.style.opacity === '1') {
                menuPanel.style.opacity = '0';
                menuPanel.style.transform = 'translateX(-10px)';
                menuPanel.style.pointerEvents = 'none';
                setTimeout(() => {
                    menuPanel.style.display = 'none';
                }, 200);
            }

            // Cerrar panel de herramientas
            const toolboxPanel = document.getElementById('toolbox-panel');
            if (toolboxPanel && toolboxPanel.style.display === 'block') {
                toolboxPanel.style.display = 'none';
            }
        }
    });
}