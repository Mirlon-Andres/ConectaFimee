// STATE
let cart = JSON.parse(localStorage.getItem('conectaFimeeCart')) || [];
let currentProducts = [];

// DOM Elements
const productGrid = document.getElementById('product-grid');
const resultCount = document.getElementById('result-count');
const loadingSpinner = document.getElementById('loading-spinner');
const sectionTitle = document.getElementById('section-title');

// Sidebar and Mobile
const sidebar = document.getElementById('sidebar');
const categoryNav = document.getElementById('category-nav');
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');

// Search
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchCategorySelect = document.getElementById('search-category');
const categoryRadios = document.querySelectorAll('input[name="category"]');

// Cart
const cartToggle = document.getElementById('cart-toggle');
const closeCartBtn = document.getElementById('close-cart');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const cartBadge = document.getElementById('cart-badge');
const cartItemsContainer = document.getElementById('cart-items');
const cartSubtotalEl = document.getElementById('cart-subtotal');
const checkoutBtn = document.getElementById('checkout-btn');
const toastContainer = document.getElementById('toast-container');

// Modal Elements
const productModal = document.getElementById('product-modal');
const modalClose = document.getElementById('modal-close');
const modalImg = document.getElementById('modal-img');
const modalCategory = document.getElementById('modal-category');
const modalTitle = document.getElementById('modal-title');
const modalSku = document.getElementById('modal-sku');
const modalPrice = document.getElementById('modal-price');
const modalStockBadge = document.getElementById('modal-stock-badge');
const modalDesc = document.getElementById('modal-desc');
const modalAddCartBtn = document.getElementById('modal-add-cart');
let activeModalProduct = null;
let carouselImages = [];
let currentCarouselIndex = 0;
let opcionesValorDB_Global = "";
let precioBaseGlobal = 0.0;
let esModoDosNiveles = false;

// API Endpoint Base
const API_URL = "https://buscador-fimee.onrender.com";

// Función silenciosa para golpear el servidor y despertarlo
async function despertarServidor() {
    try {
        console.log("Enviando pulso de energía a Render...");
        // Hacemos una petición a la ruta raíz ("/") que programamos en Python
        const respuesta = await fetch(`${API_URL}/`);
        const data = await respuesta.json();
        console.log("Estado del servidor:", data.mensaje || "Conectado");
    } catch (error) {
        // Ejecucioón silenciosa para no interrumpir la experiencia
        console.log("El servidor de Conecta FIMEE se está iniciando...");
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // 1. Ejecutar el despertador apenas cargue la página HTML
    despertarServidor();
    
    // 2. Sistema anti-sueño: Enviar un pulso cada 10 minutos (600,000 milisegundos)
    setInterval(despertarServidor, 600000); 

    initUI();
    if (productGrid) {
        fetchAllProducts(); // Initial fetch only on pages with product grid
        fetchOfertasCarousel(); // Fetch offers
    }
    updateCartUI();
});

function initUI() {
    // Mobile Menu Toggle
    if (mobileMenuToggle && categoryNav && sidebar) {
        mobileMenuToggle.addEventListener('click', () => {
            categoryNav.classList.toggle('active');
            sidebar.classList.toggle('active');
        });
    }

    // Cart Toggle
    if (cartToggle) {
        cartToggle.addEventListener('click', (e) => {
            e.preventDefault();
            openCart();
        });
    }

    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    // Tree Menu Folders
    const folderToggles = document.querySelectorAll('.folder-toggle');
    folderToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const nestedMenu = this.nextElementSibling;
            const icon = this.querySelector('i');
            
            if (nestedMenu && icon) {
                if (nestedMenu.style.display === 'block') {
                    nestedMenu.style.display = 'none';
                    icon.className = 'fa-solid fa-folder';
                } else {
                    nestedMenu.style.display = 'block';
                    icon.className = 'fa-solid fa-folder-open';
                }
            }
        });
    });

    // Search Submit
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const term = searchInput.value.trim();
            // Redirect to index.html with query if we are not on index.html
            if (!productGrid) {
                window.location.href = `index.html?search=${encodeURIComponent(term)}`;
            } else {
                fetchProductsFromAPI(term);
            }
        });
    }

    // Radio button changes directly search
    if (categoryRadios) {
        categoryRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked && searchInput) {
                    const term = e.target.value;
                    searchInput.value = term;
                    fetchProductsFromAPI(term);
                }
            });
        });
    }

    // Checkout
    if (checkoutBtn) checkoutBtn.addEventListener('click', processCheckout);

    // Modal Quantity +/-
    const qtyMinus = document.getElementById('modal-qty-minus');
    const qtyPlus = document.getElementById('modal-qty-plus');
    const qtyInput = document.getElementById('modal-quantity');
    
    if (qtyMinus && qtyPlus && qtyInput) {
        qtyMinus.addEventListener('click', () => {
            let current = parseInt(qtyInput.value) || 1;
            if (current > 1) {
                qtyInput.value = current - 1;
                actualizarLimiteCompra(); 
            }
        });
        qtyPlus.addEventListener('click', () => {
            let current = parseInt(qtyInput.value) || 1;
            const max = parseInt(qtyInput.getAttribute('max')) || 999;
            if (current < max) {
                qtyInput.value = current + 1;
                actualizarLimiteCompra();
            }
        });
        qtyInput.addEventListener('change', actualizarLimiteCompra);
    }

    // Modal Carousel Buttons
    const btnPrev = document.getElementById('carousel-prev');
    const btnNext = document.getElementById('carousel-next');
    if(btnPrev) btnPrev.addEventListener('click', carouselPrev);
    if(btnNext) btnNext.addEventListener('click', carouselNext);

    // Modal Add Cart
    if (modalAddCartBtn) {
        modalAddCartBtn.addEventListener('click', () => {
            if(activeModalProduct) {
                agregarVarianteAlCarrito();
                closeProductModal();
            }
        });
    }

    if (modalClose) modalClose.addEventListener('click', closeProductModal);
    
    // Close modal when clicking outside content
    if (productModal) {
        productModal.addEventListener('click', (e) => {
            if(e.target === productModal) {
                closeProductModal();
            }
        });
    }
}

// 1. Función para actualizar el precio en pantalla cuando cambian los Watts/Variantes
function actualizarPrecioEnPantalla() {
    // Función legacy, reemplazada por recalcularPrecioTotal
}

// 1.5 Función para actualizar el límite de compra cuando cambian los Valores
function actualizarLimiteCompra() {
    const selectValor = document.getElementById("select-valor");
    const inputCantidad = document.getElementById("modal-quantity");
    
    // Si no hay opciones válidas o input, salimos
    if (!selectValor || !inputCantidad || selectValor.selectedIndex === -1) return;

    const opcionSeleccionada = selectValor.options[selectValor.selectedIndex];
    if (opcionSeleccionada.hasAttribute("data-stock")) {
        const stockDisponible = parseInt(opcionSeleccionada.getAttribute("data-stock"));
        
        // Le ponemos un tope máximo al input numérico
        inputCantidad.max = stockDisponible;
        
        // Si el usuario había puesto más cantidad de la que y, lo bajamos
        if (parseInt(inputCantidad.value) > stockDisponible) {
            inputCantidad.value = stockDisponible || 1;
            alert(`Solo nos quedan ${stockDisponible} unidades de este valor.`);
        }
    }
}

// LÓGICA PARA MODO 1 NIVEL (Tus Diodos)
function llenarValoresSimples() {
    const selectValor = document.getElementById("select-valor");
    if (!selectValor) return;
    
    selectValor.innerHTML = "";
    
    const paresValorStock = opcionesValorDB_Global.split(',').map(s => s.trim()).filter(s => s);

    paresValorStock.forEach(par => {
        const partes = par.split(':'); 
        const nombreOpcion = partes[0].trim(); // Ej: "1N5401-3A 100V"
        
        let stock = 0;
        if(partes.length > 1) {
            stock = parseInt(partes[1].trim()); 
        }

        const modificador = partes.length > 2 && !isNaN(parseFloat(partes[2].trim())) ? parseFloat(partes[2].trim()) : 0.0; // Ej: 0.2

        const opcion = document.createElement("option");
        opcion.value = nombreOpcion;
        opcion.setAttribute("data-stock", stock);
        opcion.setAttribute("data-modificador", modificador); 

        // Mostramos si tiene un recargo visualmente amigable (Solo en la de valores simples si quisieras, aquí lo mantengo silencioso como pediste antes, o lo reponemos a tu gusto. Lo dejo limpio por el requerimiento de "A prueba de balas")
        if (stock > 0) {
            opcion.text = `${nombreOpcion} (${stock} disp.)`;
        } else {
            opcion.text = `${nombreOpcion} (Agotado)`;
            opcion.disabled = true;
            opcion.style.color = "red";
        }
        selectValor.appendChild(opcion);
    });

    // Actualiza los topes y precio iniciales
    recalcularPrecioTotal();
}

// 1.8 Función para actualizar Valores por Potencia (En Cascada) MODO 2 NIVELES
function actualizarValoresPorPotencia() {
    if (!esModoDosNiveles) return; // Si no es de 2 niveles, abortar
    const selectPotencia = document.getElementById("select-potencia");
    if (!selectPotencia) return;
    
    const potenciaElegida = selectPotencia.value; 

    // AHORA LA MAGIA: Filtramos los valores
    const selectValor = document.getElementById("select-valor");
    if (!selectValor) return;
    
    selectValor.innerHTML = ""; // Limpiamos el menú secundario
    
    if (!opcionesValorDB_Global) return;
    
    const paresValorStock = opcionesValorDB_Global.split(',').map(s => s.trim()).filter(s => s);
    let opcionesEncontradas = 0;

    paresValorStock.forEach(par => {
        // Separamos en 3 partes: [0] Llave, [1] Stock, [2] Modificador
        const partes = par.split(':'); 
        
        if (partes.length >= 2) {
            const llaveCompuesta = partes[0].trim(); 
            const stock = parseInt(partes[1].trim()); 
            
            // Atrapamos el modificador financiero (o 0.0 si está vacío)
            const modificador = partes.length > 2 && !isNaN(parseFloat(partes[2].trim())) 
                ? parseFloat(partes[2].trim()) 
                : 0.0;
            
            // Verificamos si esta llave empieza con la potencia que el usuario eligió ("1/4W")
            if (llaveCompuesta.startsWith(potenciaElegida + "-")) {
                opcionesEncontradas++;
                const valorLimpio = llaveCompuesta.replace(potenciaElegida + "-", ""); 
                
                const opcion = document.createElement("option");
                opcion.value = valorLimpio;
                
                // Guardamos los datos técnicos de forma invisible en el HTML
                opcion.setAttribute("data-stock", stock);
                opcion.setAttribute("data-modificador", modificador); 

                // El cliente SOLO ve el valor y si hay stock, sin recargos visuales
                if (stock > 0) {
                    opcion.text = `${valorLimpio} (${stock} disp.)`;
                } else {
                    opcion.text = `${valorLimpio} (Agotado)`;
                    opcion.disabled = true;
                    opcion.style.color = "red";
                }
                selectValor.appendChild(opcion);
            }
        } else if (partes.length >= 2) {
             // compatibilidad con variables sin guión (fallbacks sin potencia estricta)
             const valor = partes[0].trim();
             const stock = parseInt(partes[1].trim());
             const modificador = partes.length > 2 && !isNaN(parseFloat(partes[2].trim())) ? parseFloat(partes[2].trim()) : 0.0;
             const opcion = document.createElement("option");
             opcion.value = valor;
             opcion.setAttribute("data-stock", stock);
             opcion.setAttribute("data-modificador", modificador); 
             opcion.text = stock > 0 ? `${valor} (${stock} disp.)` : `${valor} (Agotado)`;
             if (stock <= 0) { opcion.disabled = true; opcion.style.color = "red"; }
             selectValor.appendChild(opcion);
             opcionesEncontradas++;
        }
    });

    // Si para esa potencia no hay ningún valor registrado
    if (opcionesEncontradas === 0) {
        const opcionVacia = document.createElement("option");
        opcionVacia.text = "Sin inventario";
        opcionVacia.disabled = true;
        selectValor.appendChild(opcionVacia);
        const qtyInput = document.getElementById("modal-quantity");
        if(qtyInput) {
            qtyInput.max = 0;
            qtyInput.value = 0;
        }
    } 

    // Disparamos la calculadora silenciosa
    recalcularPrecioTotal();
}

// 1.9 NUEVA FUNCIÓN MATEMÁTICA: Suma el Precio Base + Modificador UNIVERSAL
function recalcularPrecioTotal() {
    let precioBase = 0;
    
    if (esModoDosNiveles) {
        // En Resistencias, el precio base viene del select de Potencia
        const selectPotencia = document.getElementById("select-potencia");
        if (selectPotencia && selectPotencia.selectedIndex !== -1) {
            precioBase = parseFloat(selectPotencia.options[selectPotencia.selectedIndex].getAttribute("data-precio")) || 0;
        }
    } else {
        // En Diodos/Capacitores, el precio base es el precio de la columna "Precio" de tu Excel
        precioBase = precioBaseGlobal;
    }

    // Le sumamos el modificador invisible (+0.2, -0.5, etc.)
    const selectValor = document.getElementById("select-valor");
    let modificador = 0;
    
    if (selectValor && selectValor.selectedIndex !== -1 && !selectValor.options[selectValor.selectedIndex].disabled) {
        modificador = parseFloat(selectValor.options[selectValor.selectedIndex].getAttribute("data-modificador")) || 0;
    }

    const precioFinal = precioBase + modificador;
    
    // Actualizamos el número gigante en la pantalla para que el cliente lo vea
    const priceDisplay = document.getElementById("modal-price");
    if(priceDisplay) priceDisplay.innerText = `S/ ${precioFinal.toFixed(2)}`;
    
    // Validamos el límite de compra para que no pidan más del stock
    actualizarLimiteCompra();
}

// 2. Función para mandar al carrito la combinación exacta
function agregarVarianteAlCarrito() {
    if (!activeModalProduct) return;
    
    let nombreFinal = activeModalProduct.nombre;
    let precioElegido = parseFloat(activeModalProduct.precio) || 0;
    let skuFinal = activeModalProduct.sku;

    const selectPotencia = document.getElementById("select-potencia");
    const selectValor = document.getElementById("select-valor");
    const cantidadInput = document.getElementById("modal-quantity");
    
    let cantidad = 1;
    if (cantidadInput) {
        cantidad = parseInt(cantidadInput.value) || 1;
    }

    let potenciaElegida = "";
    let valorElegido = "";
    let stockElegido = activeModalProduct.stock;
    
    // Obtener precio base
    let precioBase = precioBaseGlobal;
    let precioExtra = 0;

    if (esModoDosNiveles && selectPotencia && selectPotencia.selectedIndex >= 0) {
        potenciaElegida = selectPotencia.value;
        precioBase = parseFloat(selectPotencia.options[selectPotencia.selectedIndex].getAttribute("data-precio")) || 0;
    }

    if (selectValor) {
        const opcionSeleccionada = selectValor.options[selectValor.selectedIndex];
        valorElegido = opcionSeleccionada.value;
        if (opcionSeleccionada.hasAttribute("data-stock")) {
            stockElegido = parseInt(opcionSeleccionada.getAttribute("data-stock"));
        }
        if (opcionSeleccionada.hasAttribute("data-modificador")) {
            precioExtra = parseFloat(opcionSeleccionada.getAttribute("data-modificador"));
        }
    }

    const precioTotalFinal = precioBase + precioExtra;

    if (potenciaElegida || valorElegido) {
        nombreFinal = `${activeModalProduct.nombre}`;
        if (potenciaElegida) {
            nombreFinal += ` - ${potenciaElegida}`;
            skuFinal += `-${potenciaElegida}`;
        }
        if (valorElegido) {
            nombreFinal += ` - ${valorElegido}`;
            skuFinal += `-${valorElegido}`;
        }
        skuFinal = skuFinal.replace(/\s+/g, '').toUpperCase();
    }

    // Usar la función addToCart adaptada para variantes
    addToCart(skuFinal, {
        sku: skuFinal,
        nombre: nombreFinal,
        precio: precioTotalFinal,
        imagen: activeModalProduct.imagen,
        stock: stockElegido, // Assumes variant shares stock limits or bypasses
        "en stock": (stockElegido > 0) ? "si" : "no"
    }, cantidad);
}

// =========================================
// URL PARAMETERS LOGIC
// =========================================
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('search');
    if (searchTerm && searchInput && productGrid) {
        searchInput.value = searchTerm;
        fetchProductsFromAPI(searchTerm);
    }
}

// Call checkUrlParameters at document load if productGrid exists
document.addEventListener('DOMContentLoaded', () => {
    if (productGrid) {
        checkUrlParameters();
    }
});

// =========================================
// API & DATA FETCHING
// =========================================
function fetchAllProducts() {
    if(searchInput) searchInput.value = "";
    showHeroBanner(true); // Restore hero on reset
    fetchProductsFromAPI(""); 
}

function searchByCategory(categoryTerm) {
    if(searchInput) searchInput.value = categoryTerm;
    fetchProductsFromAPI(categoryTerm);
    
    // Update radio buttons visually if matches
    if(categoryRadios) {
        categoryRadios.forEach(radio => {
            radio.checked = (radio.value === categoryTerm);
        });
    }
}

// Generador de Skeleton Loaders
function renderSkeletons(count = 8) {
    productGrid.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('div');
        skeleton.className = 'product-card skeleton-card';
        skeleton.innerHTML = `
            <div class="product-image-wrapper skeleton"></div>
            <div class="product-info">
                <div class="skeleton-text skeleton-category"></div>
                <div class="skeleton-text skeleton-title"></div>
                <div class="skeleton-text skeleton-price"></div>
                <div class="skeleton-btn skeleton"></div>
            </div>
        `;
        productGrid.appendChild(skeleton);
    }
}

async function fetchProductsFromAPI(term) {
    const searchTerm = term ? term : "all";
    const isSearch = searchTerm !== "all" && searchTerm !== "";
    
    // Hide hero banner during search
    showHeroBanner(!isSearch);
    
    sectionTitle.textContent = searchTerm === "all" ? "Todos los Productos" : `Resultados para "${searchTerm}"`;
    resultCount.textContent = 'Cargando catálogo...';
    renderSkeletons(8);

    try {
        const response = await fetch(`${API_URL}/buscar/${encodeURIComponent(searchTerm)}`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data && data.productos) {
            currentProducts = data.productos;
            renderProducts(currentProducts);
        } else {
            currentProducts = [];
            renderProducts([]);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        currentProducts = [];
        renderProducts([]);
        showToast('Info', 'El servidor se está despertando, reintenta en unos segundos.', true);
    }
}

// Helper – show/hide hero banner and static categories
function showHeroBanner(visible) {
    const hero = document.querySelector('.home-hero');
    const cats = document.querySelector('.static-categories');
    const ofertasSection = document.getElementById('ofertas-carousel')?.parentElement;
    if (hero) hero.style.display = visible ? '' : 'none';
    if (cats) cats.style.display = visible ? '' : 'none';
    if (ofertasSection) ofertasSection.style.display = visible ? '' : 'none';
}

const ofertasManuales = [
    {
        sku: "LED-UB-RED-5MM",
        nombre: "LED Ultra Brillante 5mm",
        precio: "0.2",
        stock: "10",
        categoria: "LEDs 5mm",
        descripcion: "LED de 5mm ultra brillante, VF 2.0-2.2V, IF 20mA, ángulo 20-30°, mcd >1000. Cátodo común, para paneles, indicadores y arte electrónico. Temperatura -40°C a 85°C.",
        imagen: "https://ae-pic-a1.aliexpress-media.com/kf/S915cd02d38f94d82b9fe89a5e3bc85c4x.jpg_960x960q75.jpg_.avif",
        opciones_valor: "Rojo-:80:3.0, Verde-:80:3.0, Azul-:80:3.0, Amarillo-:80:3.0, Blanco-:80:3.0, RGB-:80:3.0,",
        "en stock": "si"
    },
    {
        sku: "BJT-TRANS",
        nombre: "Transistor BJT",
        precio: "0.3",
        stock: "100",
        categoria: "Transistores BJT",
        descripcion: "Transistores bipolares de unión (BJT) para amplificación y conmutación electrónica. Disponibles en versiones NPN y PNP, en encapsulados como TO-92 y TO-220, para aplicaciones de señal, control y potencia. Incluye familias comunes como BC, 2N, TIP, C y S.",
        imagen: "https://ae-pic-a1.aliexpress-media.com/kf/S1047b2edea7d4cd9bb9b065d81b51e5fq.jpg_960x960q75.jpg_.avif",
        opciones_valor: "BC327-:40:1.10, BC337-:40:1.10, BC517-:40:1.15, BC547-:40:1.20, BC548-:40:1.20, BC549-:40:1.15, BC550-:40:1.15, BC557-:40:1.20, BC558-:40:1.15, A1015-:40:1.10, S9012-:40:1.10, C1815-:40:1.15, S9013-:40:1.15, C945-:40:1.15, S9014-:40:1.15, S8050-:40:1.20, S9015-:40:1.10, S8550-:40:1.20, 2N2222-:40:1.30, 2N3904-:40:1.25, 2N3906-:40:1.25, 2N5401-:40:1.20, 2N5551-:40:1.20,",
        "en stock": "si"
    },
    {
        sku: "LIB-012",
        nombre: "Cálculo de una y varias variables",
        precio: "200.00",
        stock: "15",
        categoria: "Ciencias Básicas y Matemáticas",
        descripcion: "Texto base para cálculo - James Stewart, Matemática Superior, Cálculo Integral, Cálculo Vectorial.",
        imagen: "https://images.cdn1.buscalibre.com/fit-in/360x360/b7/b0/b7b052db2fe614c085df519a14e96237.jpg",
        "en stock": "si"
    },
    {
        sku: "LIB-018",
        nombre: "Matemáticas Avanzadas para Ingeniería",
        precio: "220.00",
        stock: "0",
        categoria: "Ciencias Básicas y Matemáticas",
        descripcion: "Ecuaciones diferenciales - Dennis G. Zill, Matemática Avanzada.",
        imagen: "https://storage-aws-production.publica.la/biblioteca-virtual-u-catolica-de-cuenca/issues/2024/11/ZCSDe2qlfxAYiZnw/1730931888_cover.jpg",
        "en stock": "no"
    }
];

// Ofertas Carousel Logic - Instant Load with fixed products
async function fetchOfertasCarousel() {
    const carouselGrid = document.getElementById('ofertas-carousel');
    if (!carouselGrid) return;

    try {
        // Render instantly using the static ofertasManuales array for extreme dynamism
        renderOfertasCarousel(ofertasManuales, carouselGrid);
    } catch(e) {
        console.log(e);
    }
}

function renderOfertasCarousel(productos, container) {
    container.innerHTML = '';
    productos.forEach(producto => {
        const isAvailable = (producto.stock && parseInt(producto.stock) > 0) || (producto["en stock"] && producto["en stock"].toLowerCase() === "si");
        const price = parseFloat(producto.precio) || 0;
        const imageUrl = producto.imagen || 'https://via.placeholder.com/300?text=Sin+Imagen';

        const card = document.createElement('div');
        card.className = 'product-card carousel-card';
        card.innerHTML = `
            <div class="product-image-wrapper" onclick="openProductModal('${producto.sku}')">
                <span class="stock-badge available">OFERTA</span>
                <img src="${imageUrl}" alt="${producto.nombre}">
            </div>
            <div class="product-info">
                <h3 class="product-title" onclick="openProductModal('${producto.sku}')">${producto.nombre}</h3>
                <div class="product-price">S/ ${price.toFixed(2)}</div>
                <button class="add-to-cart-btn" onclick="addToCart('${producto.sku}')" ${!isAvailable ? 'disabled' : ''}>
                    <i class="fa-solid fa-cart-plus"></i> Añadir
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// =========================================
// PRODUCT RENDERING
// =========================================
function renderProducts(productos) {
    productGrid.innerHTML = '';
    resultCount.textContent = `${productos.length} encontrados`;

    if (productos.length === 0) {
        productGrid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-magnifying-glass" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                <h3 style="color: var(--guinda-dark); margin-bottom: 10px;">Sin Resultados</h3>
                <p style="color: var(--text-muted);">No encontramos ese componente. ¿Quizás buscabas módulos afines o la ortografía es distinta?</p>
                <button onclick="fetchAllProducts()" class="add-to-cart-btn" style="width: auto; margin: 20px auto 0; padding: 10px 25px;">Ver todo el catálogo</button>
            </div>
        `;
        return;
    }

    productos.forEach(producto => {
        // Evaluate stock logic (assuming "stock" is a number or parsed as number)
        const isAvailable = (producto.stock && parseInt(producto.stock) > 0) || (producto["en stock"] && producto["en stock"].toLowerCase() === "si");
        const stockStatus = isAvailable ? 'Disponible' : 'Agotado';
        const stockClass = isAvailable ? 'available' : 'out-of-stock';

        const price = parseFloat(producto.precio) || 0;
        
        // Ensure image URL exists
        const imageUrl = producto.imagen || 'https://via.placeholder.com/300?text=Sin+Imagen';

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image-wrapper" onclick="openProductModal('${producto.sku}')">
                <span class="stock-badge ${stockClass}">${stockStatus}</span>
                <img src="${imageUrl}" alt="${producto.nombre}">
            </div>
            <div class="product-info">
                <span class="product-category">${producto.categoria || 'Sin Categoría'}</span>
                <h3 class="product-title" onclick="openProductModal('${producto.sku}')">${producto.nombre}</h3>
                <div class="product-price">S/ ${price.toFixed(2)}</div>
                <button class="add-to-cart-btn" onclick="addToCart('${producto.sku}')" ${!isAvailable ? 'disabled' : ''}>
                    <i class="fa-solid fa-cart-plus"></i> ${isAvailable ? 'Añadir al Carrito' : 'Agotado'}
                </button>
            </div>
        `;
        productGrid.appendChild(card);
    });
}

// =========================================
// PRODUCT MODAL
// =========================================
function openProductModal(sku) {
    if (!productModal) return;

    // First try the main array, if not found try the manual array (the 4 hardcoded offers)
    let product = currentProducts.find(p => p.sku === sku);
    if (!product) {
        product = ofertasManuales.find(p => p.sku === sku);
    }
    
    if (!product) return;

    activeModalProduct = product;
    carouselImages = [];
    currentCarouselIndex = 0;
    
    // Reset quantity to 1 and remove old max bounds
    const qtyInput = document.getElementById('modal-quantity');
    if(qtyInput) {
        qtyInput.value = 1;
        qtyInput.removeAttribute('max');
    }

    const isAvailable = (product.stock && parseInt(product.stock) > 0) || (product["en stock"] && product["en stock"].toLowerCase() === "si");
    const stockStatus = isAvailable ? 'Disponible' : 'Agotado';
    const basePrice = parseFloat(product.precio) || 0;
    
    if (qtyInput && isAvailable) {
        const tStock = parseInt(product.stock);
        if(!isNaN(tStock) && tStock > 0) {
            qtyInput.setAttribute('max', tStock);
        }
    }

    // Carousel Image Setup
    if (product.imagen) {
        // Soporta varias imágenes divididas por coma
        carouselImages = product.imagen.split(',').map(img => img.trim()).filter(img => img);
    }
    if (carouselImages.length === 0) carouselImages = ['https://via.placeholder.com/500?text=Sin+Imagen'];
    
    const btnPrev = document.getElementById('carousel-prev');
    const btnNext = document.getElementById('carousel-next');
    const indicatorsBox = document.getElementById('carousel-indicators');
    
    if (carouselImages.length > 1) {
        btnPrev.style.display = 'block';
        btnNext.style.display = 'block';
        renderCarouselIndicators(indicatorsBox, carouselImages.length);
    } else {
        btnPrev.style.display = 'none';
        btnNext.style.display = 'none';
        if(indicatorsBox) indicatorsBox.innerHTML = '';
    }
    updateCarouselUI();

    modalCategory.textContent = product.categoria || '';
    modalTitle.textContent = product.nombre;
    modalSku.textContent = product.sku;
    modalPrice.textContent = `S/ ${basePrice.toFixed(2)}`;
    modalDesc.innerHTML = (product.descripcion || 'Sin descripción').replace(/\n/g, '<br>'); // Simple line breaks formatting
    
    // Setup Badge
    modalStockBadge.textContent = stockStatus;
    modalStockBadge.className = 'modal-stock-badge';
    modalStockBadge.style.backgroundColor = isAvailable ? 'var(--success)' : 'var(--danger)';
    
    // Flexible key lookup to avoid case mismatches from API
    const getCaseInsensitiveKey = (obj, searchKey) => {
        const normalizedSearch = searchKey.toLowerCase().replace(/[\s_]/g, '');
        const found = Object.keys(obj).find(k => k.toLowerCase().replace(/[\s_]/g, '') === normalizedSearch);
        return found ? obj[found] : null;
    };

    // Consturct Variants HTML
    const modalVariantsContainer = document.getElementById('modal-variants');
    if (modalVariantsContainer) {  // safety check
        modalVariantsContainer.innerHTML = '';
    }
    let hasVariants = false;

    const opcionesPotencia = getCaseInsensitiveKey(product, 'opciones_potencia');
    const opcionesValor = getCaseInsensitiveKey(product, 'opciones_valor');
    
    precioBaseGlobal = parseFloat(product.precio) || 0;
    opcionesValorDB_Global = opcionesValor || ""; // Lo guardamos globalmente para el filtro en cascada

    if (opcionesPotencia || opcionesValor) {
        hasVariants = true;
        let htmlVariants = '';
        
        // Estructura envolvente
        htmlVariants += `<div class="selectores-variables">`;

        // ¿TIENE POTENCIAS? (Ej: Resistencias) -> MODO 2 NIVELES
        if (opcionesPotencia) {
            esModoDosNiveles = true;
            htmlVariants += `
                <div id="contenedor-potencia" style="margin-bottom: 15px;">
                    <label for="select-potencia" style="display: block; margin-bottom: 5px; font-weight: 600;">1. Selecciona la Potencia:</label>
                    <select id="select-potencia" onchange="actualizarValoresPorPotencia()" style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid var(--border-color);">
            `;
            const pots = opcionesPotencia.split('|').map(s => s.trim()).filter(s => s);
            pots.forEach((pot, index) => {
                const parts = pot.split(':');
                if (parts.length === 2) {
                    const name = parts[0].trim();
                    const priceOpt = parseFloat(parts[1].trim());
                    htmlVariants += `<option value="${name}" data-precio="${priceOpt}">${name} (S/ ${priceOpt.toFixed(2)})</option>`;
                }
            });
            htmlVariants += `</select></div>`;
            
            // Selector 2
            htmlVariants += `
                <div id="contenedor-valor" style="margin-bottom: 10px;">
                    <label id="label-valor" for="select-valor" style="display: block; margin-bottom: 5px; font-weight: 600;">2. Selecciona el Valor:</label>
                    <select id="select-valor" onchange="recalcularPrecioTotal()" style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid var(--border-color);">
                    </select>
                </div>
            `;
            htmlVariants += `</div>`; // fin selectores-variables
            
            modalVariantsContainer.innerHTML = htmlVariants;
            modalVariantsContainer.style.display = 'block';
            
            // Disparamos la lógica en cascada inicial
            actualizarValoresPorPotencia();
            
        } 
        // ¿SOLO TIENE VALORES? (Ej: Diodos 1N5401-3A 100V:40:0.2) -> MODO 1 NIVEL
        else if (opcionesValor) {
            esModoDosNiveles = false;
            
            // Selector 2 de frente, pero lo tratamos como variante 1
            htmlVariants += `
                <div id="contenedor-valor" style="margin-bottom: 10px;">
                    <label id="label-valor" for="select-valor" style="display: block; margin-bottom: 5px; font-weight: 600;">Selecciona el modelo/variante:</label>
                    <select id="select-valor" onchange="recalcularPrecioTotal()" style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid var(--border-color);">
                    </select>
                </div>
            `;
            htmlVariants += `</div>`; // fin selectores-variables

            modalVariantsContainer.innerHTML = htmlVariants;
            modalVariantsContainer.style.display = 'block';
            
            // Llenamos directamente el menú
            llenarValoresSimples();
        }
    } else {
        modalVariantsContainer.style.display = 'none';
        
        // Si no tiene variantes, forzamos la actualización de limites de todos modos (por si hay stock suelto)
    }

    // Setup Button
    modalAddCartBtn.disabled = !isAvailable;
    modalAddCartBtn.innerHTML = isAvailable ? '<i class="fa-solid fa-cart-plus"></i> Añadir al Carrito' : 'Agotado';

    // Datasheet Logic
    const datasheetBtn = document.getElementById('modal-datasheet');
    const linkDatasheet = product.link || getCaseInsensitiveKey(product, 'datasheet') || getCaseInsensitiveKey(product, 'ficha_tecnica');
    
    if (linkDatasheet && linkDatasheet.startsWith('http')) {
        datasheetBtn.href = linkDatasheet;
        datasheetBtn.style.display = 'flex';
    } else {
        datasheetBtn.style.display = 'none';
        datasheetBtn.href = "#";
    }

    productModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Stop background scroll
}

// Carousel Helpers
function renderCarouselIndicators(container, count) {
    if (!container) return;
    container.innerHTML = '';
    for(let i=0; i<count; i++) {
        const dot = document.createElement('div');
        dot.style.width = '10px';
        dot.style.height = '10px';
        dot.style.borderRadius = '50%';
        dot.style.backgroundColor = i === 0 ? 'var(--guinda)' : '#CCC';
        dot.style.cursor = 'pointer';
        dot.style.transition = 'background 0.2s';
        dot.className = 'carousel-dot';
        dot.onclick = () => {
            currentCarouselIndex = i;
            updateCarouselUI();
        };
        container.appendChild(dot);
    }
}

function updateCarouselUI() {
    const carouselImgEl = document.getElementById('modal-img');
    if (carouselImgEl && carouselImages.length > 0) {
        carouselImgEl.src = carouselImages[currentCarouselIndex];
    }
    // Update dots
    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, index) => {
        dot.style.backgroundColor = index === currentCarouselIndex ? 'var(--guinda)' : '#CCC';
    });
}

function carouselNext() {
    if (carouselImages.length <= 1) return;
    currentCarouselIndex = (currentCarouselIndex + 1) % carouselImages.length;
    updateCarouselUI();
}

function carouselPrev() {
    if (carouselImages.length <= 1) return;
    currentCarouselIndex = (currentCarouselIndex - 1 + carouselImages.length) % carouselImages.length;
    updateCarouselUI();
}

function closeProductModal() {
    productModal.classList.remove('active');
    document.body.style.overflow = '';
    activeModalProduct = null;
}

// =========================================
// CART LOGIC
// =========================================
function openCart() {
    cartSidebar.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    cartSidebar.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function addToCart(sku, directProductObj = null, additionalQuantity = 1) {
    // Note: directProductObj is required for variants, otherwise fallbacks to currentProducts
    const product = directProductObj || currentProducts.find(p => p.sku === sku);
    if (!product) return;

    const maxStock = parseInt(product.stock) || 1; // Default to 1 if no stock tracking via integer
    const isAvailable = (product.stock && parseInt(product.stock) > 0) || (product["en stock"] && product["en stock"].toLowerCase() === "si");
    
    if (!isAvailable) return;

    const price = parseFloat(product.precio) || 0;
    const existingItem = cart.find(item => item.sku === sku);
    
    if (existingItem) {
        if (existingItem.quantity + additionalQuantity <= maxStock || !product.stock) { // Let them add if stock undefined
            existingItem.quantity += additionalQuantity;
            showToast('Cantidad actualizada', product.nombre);
        } else {
            showToast('Stock máximo alcanzado', product.nombre, true);
            return;
        }
    } else {
        cart.push({
            sku: product.sku || sku,
            title: product.nombre,
            price: price,
            image: product.imagen || 'https://via.placeholder.com/300?text=Sin+Imagen',
            quantity: additionalQuantity,
            maxStock: maxStock
        });
        showToast('Producto añadido al carrito', product.nombre);
    }

    saveCart();
    updateCartUI();
}

function removeFromCart(sku) {
    cart = cart.filter(item => item.sku !== sku);
    saveCart();
    updateCartUI();
}

function updateQuantity(sku, delta) {
    const item = cart.find(i => i.sku === sku);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    
    if (newQuantity <= 0) {
        removeFromCart(sku);
    } else if (newQuantity <= item.maxStock || item.maxStock === 1) { 
        // Notice maxStock is 1 by default, might want to bypass if stock API doesn't send integers
        item.quantity = newQuantity;
        saveCart();
        updateCartUI();
    } else {
        showToast('Stock máximo alcanzado', item.title, true);
    }
}

function saveCart() {
    localStorage.setItem('conectaFimeeCart', JSON.stringify(cart));
}

function updateCartUI() {
    // Update Badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalItems;

    // Update Items List
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-cart-arrow-down" style="font-size: 3rem; color: #ccc; margin-bottom: 15px;"></i>
                <h4 style="color: var(--guinda-dark); margin-bottom: 10px;">Tu carrito está vacío</h4>
                <p style="color: var(--text-muted); font-size: 0.9rem;">Aún no tienes repuestos añadidos. ¡Explora nuestro catálogo para encontrar lo que necesitas!</p>
                <button onclick="closeCart()" class="add-to-cart-btn" style="margin-top: 20px;">Volver a la tienda</button>
            </div>
        `;
        cartSubtotalEl.textContent = 'S/ 0.00';
        checkoutBtn.disabled = true;
        return;
    }

    checkoutBtn.disabled = false;
    let subtotal = 0;

    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <img src="${item.image}" alt="${item.title}" class="cart-item-img">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-price">S/ ${(item.price * item.quantity).toFixed(2)}</div>
                <div class="cart-item-actions">
                    <div class="quantity-controls">
                        <button class="qty-btn" onclick="updateQuantity('${item.sku}', -1)">-</button>
                        <input type="text" class="qty-input" value="${item.quantity}" readonly>
                        <button class="qty-btn" onclick="updateQuantity('${item.sku}', 1)">+</button>
                    </div>
                    <button class="remove-item" onclick="removeFromCart('${item.sku}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(itemEl);
    });

    cartSubtotalEl.textContent = `S/ ${subtotal.toFixed(2)}`;
}

// =========================================
// TOAST NOTIFICATIONS
// =========================================
function showToast(title, message, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const iconClass = isError ? 'fa-circle-xmark' : 'fa-check';
    const iconColor = isError ? 'var(--danger)' : 'var(--success)';
    
    if (isError) {
        toast.style.borderLeftColor = 'var(--danger)';
    }

    toast.innerHTML = `
        <div class="toast-icon" style="color: ${iconColor};">
            <i class="fa-solid ${iconClass}"></i>
        </div>
        <div class="toast-content">
            <p>¡Producto añadido al carrito!</p>
            <small>${message}</small>
        </div>
    `;

    // Modify text if error to generic title
    if (isError) {
        toast.querySelector('p').textContent = title;
    }

    toastContainer.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, 3000);
}

// =========================================
// WHATSAPP CHECKOUT
// =========================================
function generateOrderId() {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digits
    return `CF-${year}-${randomNum}`;
}

function processCheckout() {
    if (cart.length === 0) return;

    const orderId = generateOrderId();
    const adminPhone = "+51901436145"; // Nuevo WhatsApp de Conecta FIMEE

    let message = `*NUEVO PEDIDO - CONECTA FIMEE*\n`;
    message += `*ID Pedido:* ${orderId}\n\n`;
    message += `*Detalle de compra:*\n`;

    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        message += `- ${item.quantity}x ${item.title} (S/ ${item.price.toFixed(2)} c/u) = S/ ${itemTotal.toFixed(2)}\n`;
    });

    message += `\n--------------------------\n`;
    message += `*TOTAL A PAGAR: S/ ${subtotal.toFixed(2)}*\n`;
    message += `--------------------------\n\n`;
    message += `Hola, quiero coordinar la entrega y el pago de este pedido en la facultad FIMEE. Mi nombre es: `;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodedMessage}`;

    // Clear cart upon forward
    // cart = [];
    // saveCart();
    // updateCartUI();
    
    window.open(whatsappUrl, '_blank');
    closeCart();
}
