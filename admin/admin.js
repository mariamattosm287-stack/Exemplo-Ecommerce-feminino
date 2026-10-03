/* =========================================================
   ESSENCE ADMIN — admin.js
   Produtos + Categorias + Coleções + Pedidos
   ========================================================= */

(() => {
  "use strict";

  const STORAGE = {
    products: "essence-admin-products-v2",
    productsLegacy: "essence-admin-products-v1",
    categories: "essence-admin-categories-v2",
    collections: "essence-admin-collections-v2",
    orders: "essence-admin-orders-v2"
  };

  const DEFAULT_CATEGORIES = [
    {
      id: "cat-tops",
      name: "Tops",
      slug: "tops",
      description: "",
      active: true
    },
    {
      id: "cat-bottoms",
      name: "Bottoms",
      slug: "bottoms",
      description: "",
      active: true
    },
    {
      id: "cat-accessories",
      name: "Accessories",
      slug: "accessories",
      description: "",
      active: true
    },
    {
      id: "cat-new",
      name: "New Arrivals",
      slug: "new",
      description: "",
      active: true
    }
  ];

  const DEFAULT_COLLECTIONS = [
    {
      id: "col-flexfit",
      name: "FlexFit Freedom",
      productCount: 12,
      period: "Set–Dez 2026",
      status: "publicada",
      description: ""
    },
    {
      id: "col-summer",
      name: "Summer Glow",
      productCount: 8,
      period: "Nov 2026",
      status: "rascunho",
      description: ""
    },
    {
      id: "col-blackfriday",
      name: "Black Friday",
      productCount: 24,
      period: "Nov 2026",
      status: "agendada",
      description: ""
    }
  ];

  let products = [];
  let categories = [];
  let collections = [];
  let orders = [];

  let editingProductId = null;
  let editingCategoryId = null;
  let editingCollectionId = null;
  let activeOrderId = null;

  let orderFilter = "all";

  let pendingProductImage = "";

  const $ = (id) => document.getElementById(id);

  /* =========================================================
     HELPERS
     ========================================================= */

  function clone(value) {
    return JSON.parse(
      JSON.stringify(value)
    );
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeText(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .trim();
  }

  function slugify(value) {
    return normalizeText(value)
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );
  }

  function formatMoney(value) {
    return Number(value || 0)
      .toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL"
        }
      );
  }

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
    }

    return date.toLocaleDateString(
      "pt-BR"
    );
  }

  function loadList(
    key,
    fallback = []
  ) {
    try {
      const raw =
        localStorage.getItem(key);

      if (!raw) {
        return clone(fallback);
      }

      const parsed =
        JSON.parse(raw);

      return Array.isArray(parsed)
        ? parsed
        : clone(fallback);

    } catch (error) {
      console.warn(
        `Erro ao ler ${key}:`,
        error
      );

      return clone(fallback);
    }
  }

  function saveList(
    key,
    value
  ) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );

    } catch (error) {
      console.error(
        `Erro ao salvar ${key}:`,
        error
      );

      showToast(
        "Não foi possível salvar. Tente novamente. ⚠️"
      );
    }
  }

  /* =========================================================
     BASE DO PAINEL
     ========================================================= */

  window.navigate =
    function navigate(page) {

      document
        .querySelectorAll(
          ".page-content"
        )
        .forEach(
          (el) => {
            el.classList.remove(
              "active"
            );
          }
        );

      document
        .querySelectorAll(
          ".sidebar__item[data-page]"
        )
        .forEach(
          (el) => {

            el.classList.toggle(
              "active",
              el.dataset.page === page
            );

          }
        );

      const target =
        $(`page-${page}`);

      if (target) {
        target.classList.add(
          "active"
        );
      }

      const sidebar =
        $("sidebar");

      if (
        window.innerWidth <= 900
        &&
        sidebar
      ) {
        sidebar.classList.remove(
          "open"
        );
      }
    };

  window.openModal =
    function openModal(id) {

      const modal =
        $(id);

      if (!modal) {
        return;
      }

      modal.classList.add(
        "active"
      );

      modal.style.display =
        "flex";

      document.body.style.overflow =
        "hidden";
    };

  window.closeModal =
    function closeModal(id) {

      const modal =
        $(id);

      if (!modal) {
        return;
      }

      modal.classList.remove(
        "active"
      );

      modal.style.display =
        "";

      document.body.style.overflow =
        "";
    };

  window.showToast =
    function showToast(message) {

      const toast =
        $("toast");

      if (!toast) {
        return;
      }

      toast.textContent =
        message;

      toast.style.transform =
        "translateY(0)";

      toast.style.opacity =
        "1";

      clearTimeout(
        window.__essenceToastTimer
      );

      window.__essenceToastTimer =
        setTimeout(
          () => {

            toast.style.transform =
              "translateY(80px)";

            toast.style.opacity =
              "0";

          },
          2600
        );
    };

  /* =========================================================
     PREPARAR SIDEBAR
     ========================================================= */

  function prepareSidebar() {

    const productBadge =
      document.querySelector(
        '.sidebar__item[data-page="produtos"] .sidebar__item-badge'
      );

    if (productBadge) {
      productBadge.id =
        "sidebar-produtos-count";
    }

    const orderBadge =
      document.querySelector(
        '.sidebar__item[data-page="pedidos"] .sidebar__item-badge'
      );

    if (orderBadge) {
      orderBadge.id =
        "sidebar-pedidos-count";
    }
  }

  /* =========================================================
     DASHBOARD
     ========================================================= */

  function prepareDashboard() {

    const cards =
      document.querySelectorAll(
        "#page-dashboard .stat-card__value"
      );

    if (cards[0]) {
      cards[0].id =
        "dashboard-receita-total";

      cards[0].textContent =
        "R$ 0,00";
    }

    if (cards[1]) {
      cards[1].id =
        "dashboard-pedidos-total";

      cards[1].textContent =
        "0";
    }

    if (cards[2]) {
      cards[2].id =
        "dashboard-ticket-medio";

      cards[2].textContent =
        "R$ 0,00";
    }

    const recentCard =
      Array.from(
        document.querySelectorAll(
          "#page-dashboard .card"
        )
      )
      .find(
        (card) =>
          card
            .querySelector(
              ".card-title"
            )
            ?.textContent
            .trim()
          ===
          "Pedidos Recentes"
      );

    const tbody =
      recentCard
        ?.querySelector(
          "tbody"
        );

    if (tbody) {

      tbody.id =
        "dashboard-orders-tbody";

      tbody.innerHTML =
        "";
    }
  }

  /* =========================================================
     PREPARAR PÁGINA DE PRODUTOS
     ========================================================= */

  function prepareProductPage() {

    const page =
      $("page-produtos");

    if (!page) {
      return;
    }

    const primary =
      page.querySelector(
        ".page-actions .btn--primary"
      );

    if (primary) {

      primary.textContent =
        "+ Novo Produto";

      primary.setAttribute(
        "onclick",
        "openNewProductModal()"
      );
    }

    const search =
      page.querySelector(
        '.section-search input[type="text"]'
      );

    if (search) {

      search.id =
        "produto-busca";

      search.setAttribute(
        "oninput",
        "renderProducts()"
      );
    }

    const toolbarSelect =
      page.querySelector(
        ".section-toolbar select"
      );

    if (toolbarSelect) {

      toolbarSelect.id =
        "produto-filtro-categoria";

      toolbarSelect.setAttribute(
        "onchange",
        "renderProducts()"
      );
    }

    const tbody =
      page.querySelector(
        "tbody"
      );

    if (tbody) {

      tbody.id =
        "produtos-tbody";

      tbody.innerHTML =
        "";
    }

    const footerSpan =
      page.querySelector(
        ".card > div:last-child > span"
      );

    if (footerSpan) {

      footerSpan.id =
        "produtos-resumo";

      footerSpan.textContent =
        "Nenhum produto cadastrado";
    }
  }

  /* =========================================================
     PREPARAR PEDIDOS
     ========================================================= */

  function prepareOrderPage() {

    const page =
      $("page-pedidos");

    if (!page) {
      return;
    }

    page.innerHTML = `

      <div class="page-header">

        <div>
          <h1 class="page-title">
            Pedidos
          </h1>

          <p class="page-subtitle">
            Gerencie e acompanhe os pedidos reais da loja
          </p>
        </div>

        <div class="page-actions">

          <button
            class="btn btn--outline"
            onclick="exportOrdersCSV()"
          >
            📥 Exportar CSV
          </button>

        </div>

      </div>


      <div
        style="
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:12px;
          margin-bottom:20px;
        "
      >

        <div
          class="card card-body"
          style="
            text-align:center;
            cursor:pointer;
          "
          onclick="setOrderFilter('all')"
        >

          <div
            id="pedidos-total"
            style="
              font-size:22px;
              font-weight:700;
            "
          >
            0
          </div>

          <div
            style="
              font-size:12px;
              color:var(--text-light);
              margin-top:4px;
            "
          >
            Total
          </div>

        </div>


        <div
          class="card card-body"
          style="
            text-align:center;
            cursor:pointer;
            border-bottom:3px solid var(--warning);
          "
          onclick="setOrderFilter('preparando')"
        >

          <div
            id="pedidos-preparando"
            style="
              font-size:22px;
              font-weight:700;
              color:var(--warning);
            "
          >
            0
          </div>

          <div
            style="
              font-size:12px;
              color:var(--text-light);
              margin-top:4px;
            "
          >
            Em Preparo
          </div>

        </div>


        <div
          class="card card-body"
          style="
            text-align:center;
            cursor:pointer;
            border-bottom:3px solid var(--info);
          "
          onclick="setOrderFilter('enviado')"
        >

          <div
            id="pedidos-enviados"
            style="
              font-size:22px;
              font-weight:700;
              color:var(--info);
            "
          >
            0
          </div>

          <div
            style="
              font-size:12px;
              color:var(--text-light);
              margin-top:4px;
            "
          >
            Enviados
          </div>

        </div>


        <div
          class="card card-body"
          style="
            text-align:center;
            cursor:pointer;
            border-bottom:3px solid var(--success);
          "
          onclick="setOrderFilter('entregue')"
        >

          <div
            id="pedidos-entregues"
            style="
              font-size:22px;
              font-weight:700;
              color:var(--success);
            "
          >
            0
          </div>

          <div
            style="
              font-size:12px;
              color:var(--text-light);
              margin-top:4px;
            "
          >
            Entregues
          </div>

        </div>

      </div>


      <div class="section-toolbar">

        <div class="section-search">

          <span>
            🔍
          </span>

          <input
            type="text"
            id="pedido-busca"
            placeholder="Buscar pedido ou cliente..."
            oninput="renderOrders()"
          >

        </div>


        <div class="filter-chips">

          <span
            class="filter-chip active"
            data-order-filter="all"
            onclick="setOrderFilter('all')"
          >
            Todos
          </span>

          <span
            class="filter-chip"
            data-order-filter="aguardando"
            onclick="setOrderFilter('aguardando')"
          >
            Aguardando
          </span>

          <span
            class="filter-chip"
            data-order-filter="preparando"
            onclick="setOrderFilter('preparando')"
          >
            Em preparo
          </span>

          <span
            class="filter-chip"
            data-order-filter="enviado"
            onclick="setOrderFilter('enviado')"
          >
            Enviados
          </span>

          <span
            class="filter-chip"
            data-order-filter="entregue"
            onclick="setOrderFilter('entregue')"
          >
            Entregues
          </span>

        </div>

      </div>


      <div class="card">

        <div class="orders-table-wrap">

          <table class="data-table">

            <thead>

              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Produtos</th>
                <th>Total</th>
                <th>Pagamento</th>
                <th>Status</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>

            </thead>

            <tbody
              id="pedidos-tbody"
            ></tbody>

          </table>

        </div>

      </div>

    `;
  }

  /* =========================================================
     PREPARAR CATEGORIAS
     ========================================================= */

  function prepareCategoryPage() {

    const page =
      $("page-categorias");

    if (!page) {
      return;
    }

    page.innerHTML = `

      <div class="page-header">

        <div>

          <h1 class="page-title">
            Categorias
          </h1>

          <p class="page-subtitle">
            Organize seus produtos por categorias
          </p>

        </div>


        <div class="page-actions">

          <button
            class="btn btn--primary"
            onclick="openNewCategoryModal()"
          >
            + Nova Categoria
          </button>

        </div>

      </div>


      <div class="section-toolbar">

        <div class="section-search">

          <span>
            🔍
          </span>

          <input
            type="text"
            id="categoria-busca"
            placeholder="Buscar categoria..."
            oninput="renderCategories()"
          >

        </div>

      </div>


      <div class="card">

        <div class="orders-table-wrap">

          <table class="data-table">

            <thead>

              <tr>
                <th>Nome</th>
                <th>Slug</th>
                <th>Produtos</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>

            </thead>

            <tbody
              id="categorias-tbody"
            ></tbody>

          </table>

        </div>

      </div>

    `;
  }

  /* =========================================================
     PREPARAR COLEÇÕES
     ========================================================= */

  function prepareCollectionPage() {

    const page =
      $("page-colecoes");

    if (!page) {
      return;
    }

    page.innerHTML = `

      <div class="page-header">

        <div>

          <h1 class="page-title">
            Coleções
          </h1>

          <p class="page-subtitle">
            Agrupe produtos em coleções temáticas
          </p>

        </div>


        <div class="page-actions">

          <button
            class="btn btn--primary"
            onclick="openNewCollectionModal()"
          >
            + Nova Coleção
          </button>

        </div>

      </div>


      <div class="section-toolbar">

        <div class="section-search">

          <span>
            🔍
          </span>

          <input
            type="text"
            id="colecao-busca"
            placeholder="Buscar coleção..."
            oninput="renderCollections()"
          >

        </div>

      </div>


      <div class="card">

        <div class="orders-table-wrap">

          <table class="data-table">

            <thead>

              <tr>
                <th>Coleção</th>
                <th>Produtos</th>
                <th>Período</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>

            </thead>

            <tbody
              id="colecoes-tbody"
            ></tbody>

          </table>

        </div>

      </div>

    `;
  }

  /* =========================================================
     CRIAR / SUBSTITUIR MODAIS
     ========================================================= */

  function replaceOrCreateModal(
    id,
    html
  ) {

    const old =
      $(id);

    if (old) {

      old.outerHTML =
        html;

      return;
    }

    document.body.insertAdjacentHTML(
      "beforeend",
      html
    );
  }

  function prepareModals() {

    /* ===============================
       MODAL PRODUTO
       =============================== */

    replaceOrCreateModal(
      "modal-produto",
      `

      <div
        class="modal-overlay"
        id="modal-produto"
        onclick="
          if(event.target===this)
            closeModal('modal-produto')
        "
      >

        <div class="modal">

          <div class="modal__header">

            <h2
              class="modal__title"
              id="produto-modal-title"
            >
              Novo Produto
            </h2>

            <button
              class="modal__close"
              onclick="
                closeModal('modal-produto')
              "
            >
              ✕
            </button>

          </div>


          <div class="modal__body">

            <div class="form-group">

              <label class="form-label">
                Nome do Produto *
              </label>

              <input
                type="text"
                class="form-control"
                id="produto-nome"
                placeholder="Ex: High-Waist Training Leggings"
              >

            </div>


            <div class="form-grid-2">

              <div class="form-group">

                <label class="form-label">
                  Preço (R$) *
                </label>

                <input
                  type="number"
                  class="form-control"
                  id="produto-preco"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                >

              </div>


              <div class="form-group">

                <label class="form-label">
                  Preço Promocional
                </label>

                <input
                  type="number"
                  class="form-control"
                  id="produto-preco-promocional"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                >

              </div>

            </div>


            <div class="form-grid-2">

              <div class="form-group">

                <label class="form-label">
                  Categoria
                </label>

                <select
                  class="form-control"
                  id="produto-categoria"
                ></select>

              </div>


              <div class="form-group">

                <label class="form-label">
                  Estoque
                </label>

                <input
                  type="number"
                  class="form-control"
                  id="produto-estoque"
                  placeholder="0"
                  min="0"
                  step="1"
                >

              </div>

            </div>


            <div class="form-group">

              <label class="form-label">
                Descrição
              </label>

              <textarea
                class="form-control"
                id="produto-descricao"
                rows="3"
                placeholder="Descreva o produto..."
              ></textarea>

            </div>


            <div class="form-group">

              <label class="form-label">
                Imagem
              </label>

              <div
                class="image-upload"
                id="produto-image-upload"
                style="
                  cursor:pointer;
                  position:relative;
                "
              >

                <input
                  type="file"
                  id="produto-imagem"
                  accept="image/png,image/jpeg,image/webp"
                  style="display:none;"
                >

                <img
                  id="produto-imagem-preview"
                  alt="Prévia"
                  style="
                    display:none;
                    width:72px;
                    height:72px;
                    object-fit:cover;
                    border-radius:10px;
                    margin-right:12px;
                  "
                >

                <div
                  class="image-upload__icon"
                  id="produto-image-icon"
                >
                  🖼️
                </div>

                <div class="image-upload__text">

                  <strong
                    id="produto-image-label"
                  >
                    Clique para enviar
                  </strong>

                  ou arraste a imagem aqui

                  <br>

                  <small
                    style="
                      color:var(--text-light);
                    "
                  >
                    PNG, JPG ou WEBP
                  </small>

                </div>

              </div>

            </div>


            <div class="form-group">

              <label class="form-label">
                Tamanhos disponíveis
              </label>

              <div
                style="
                  display:flex;
                  gap:8px;
                  flex-wrap:wrap;
                "
              >

                ${[
                  "XS",
                  "S",
                  "M",
                  "L",
                  "XL",
                  "XXL"
                ]
                .map(
                  (size) => `

                    <label
                      style="
                        display:flex;
                        align-items:center;
                        gap:5px;
                        font-size:13px;
                      "
                    >

                      <input
                        type="checkbox"
                        class="produto-tamanho"
                        value="${size}"
                        ${
                          size !== "XXL"
                            ? "checked"
                            : ""
                        }
                      >

                      ${size}

                    </label>

                  `
                )
                .join("")}

              </div>

            </div>


            <div class="toggle-wrap">

              <label class="toggle">

                <input
                  type="checkbox"
                  id="produto-publicado"
                  checked
                >

                <span
                  class="toggle-slider"
                ></span>

              </label>

              <span
                style="font-size:13px;"
              >
                Publicar produto imediatamente
              </span>

            </div>

          </div>


          <div class="modal__footer">

            <button
              class="btn btn--outline"
              onclick="
                closeModal('modal-produto')
              "
            >
              Cancelar
            </button>

            <button
              class="btn btn--primary"
              id="produto-save-button"
              onclick="saveProduct()"
            >
              Criar Produto
            </button>

          </div>

        </div>

      </div>

      `
    );

    /* ===============================
       MODAL CATEGORIA
       =============================== */

    replaceOrCreateModal(
      "modal-categoria",
      `

      <div
        class="modal-overlay"
        id="modal-categoria"
        onclick="
          if(event.target===this)
            closeModal('modal-categoria')
        "
      >

        <div class="modal">

          <div class="modal__header">

            <h2
              class="modal__title"
              id="categoria-modal-title"
            >
              Nova Categoria
            </h2>

            <button
              class="modal__close"
              onclick="
                closeModal('modal-categoria')
              "
            >
              ✕
            </button>

          </div>


          <div class="modal__body">

            <div class="form-group">

              <label class="form-label">
                Nome *
              </label>

              <input
                type="text"
                class="form-control"
                id="categoria-nome"
                placeholder="Ex: Leggings"
              >

            </div>


            <div class="form-group">

              <label class="form-label">
                Slug
              </label>

              <input
                type="text"
                class="form-control"
                id="categoria-slug"
                placeholder="leggings"
              >

            </div>


            <div class="form-group">

              <label class="form-label">
                Descrição
              </label>

              <textarea
                class="form-control"
                id="categoria-descricao"
                rows="2"
              ></textarea>

            </div>


            <div class="toggle-wrap">

              <label class="toggle">

                <input
                  type="checkbox"
                  id="categoria-ativa"
                  checked
                >

                <span
                  class="toggle-slider"
                ></span>

              </label>

              <span
                style="font-size:13px;"
              >
                Categoria ativa
              </span>

            </div>

          </div>


          <div class="modal__footer">

            <button
              class="btn btn--outline"
              onclick="
                closeModal('modal-categoria')
              "
            >
              Cancelar
            </button>

            <button
              class="btn btn--primary"
              id="categoria-save-button"
              onclick="saveCategory()"
            >
              Criar Categoria
            </button>

          </div>

        </div>

      </div>

      `
    );

    /* ===============================
       MODAL COLEÇÃO
       =============================== */

    replaceOrCreateModal(
      "modal-colecao",
      `

      <div
        class="modal-overlay"
        id="modal-colecao"
        onclick="
          if(event.target===this)
            closeModal('modal-colecao')
        "
      >

        <div class="modal">

          <div class="modal__header">

            <h2
              class="modal__title"
              id="colecao-modal-title"
            >
              Nova Coleção
            </h2>

            <button
              class="modal__close"
              onclick="
                closeModal('modal-colecao')
              "
            >
              ✕
            </button>

          </div>


          <div class="modal__body">

            <div class="form-group">

              <label class="form-label">
                Nome da Coleção *
              </label>

              <input
                type="text"
                class="form-control"
                id="colecao-nome"
                placeholder="Ex: Verão 2027"
              >

            </div>


            <div class="form-grid-2">

              <div class="form-group">

                <label class="form-label">
                  Quantidade de Produtos
                </label>

                <input
                  type="number"
                  class="form-control"
                  id="colecao-produtos"
                  min="0"
                  step="1"
                  value="0"
                >

              </div>


              <div class="form-group">

                <label class="form-label">
                  Status
                </label>

                <select
                  class="form-control"
                  id="colecao-status"
                >

                  <option value="publicada">
                    Publicada
                  </option>

                  <option value="rascunho">
                    Rascunho
                  </option>

                  <option value="agendada">
                    Agendada
                  </option>

                </select>

              </div>

            </div>


            <div class="form-group">

              <label class="form-label">
                Período
              </label>

              <input
                type="text"
                class="form-control"
                id="colecao-periodo"
                placeholder="Ex: Nov 2026 – Jan 2027"
              >

            </div>


            <div class="form-group">

              <label class="form-label">
                Descrição
              </label>

              <textarea
                class="form-control"
                id="colecao-descricao"
                rows="3"
              ></textarea>

            </div>

          </div>


          <div class="modal__footer">

            <button
              class="btn btn--outline"
              onclick="
                closeModal('modal-colecao')
              "
            >
              Cancelar
            </button>

            <button
              class="btn btn--primary"
              id="colecao-save-button"
              onclick="saveCollection()"
            >
              Criar Coleção
            </button>

          </div>

        </div>

      </div>

      `
    );

    /* ===============================
       MODAL PEDIDO
       =============================== */

    replaceOrCreateModal(
      "modal-pedido",
      `

      <div
        class="modal-overlay"
        id="modal-pedido"
        onclick="
          if(event.target===this)
            closeModal('modal-pedido')
        "
      >

        <div class="modal">

          <div class="modal__header">

            <h2
              class="modal__title"
              id="pedido-modal-title"
            >
              Detalhes do Pedido
            </h2>

            <button
              class="modal__close"
              onclick="
                closeModal('modal-pedido')
              "
            >
              ✕
            </button>

          </div>


          <div class="modal__body">

            <div class="form-grid-2">

              <div class="form-group">

                <label class="form-label">
                  Número
                </label>

                <input
                  type="text"
                  class="form-control pedido-field"
                  id="pedido-numero"
                  disabled
                >

              </div>


              <div class="form-group">

                <label class="form-label">
                  Data
                </label>

                <input
                  type="text"
                  class="form-control pedido-field"
                  id="pedido-data"
                  disabled
                >

              </div>

            </div>


            <div class="form-group">

              <label class="form-label">
                Cliente
              </label>

              <input
                type="text"
                class="form-control pedido-field"
                id="pedido-cliente"
                disabled
              >

            </div>


            <div class="form-group">

              <label class="form-label">
                Telefone / WhatsApp
              </label>

              <input
                type="text"
                class="form-control pedido-field"
                id="pedido-telefone"
                disabled
              >

            </div>


            <div class="form-group">

              <label class="form-label">
                Produtos
              </label>

              <textarea
                class="form-control pedido-field"
                id="pedido-itens"
                rows="4"
                disabled
              ></textarea>

            </div>


            <div class="form-grid-2">

              <div class="form-group">

                <label class="form-label">
                  Total (R$)
                </label>

                <input
                  type="number"
                  class="form-control pedido-field"
                  id="pedido-total-valor"
                  min="0"
                  step="0.01"
                  disabled
                >

              </div>


              <div class="form-group">

                <label class="form-label">
                  Pagamento
                </label>

                <select
                  class="form-control pedido-field"
                  id="pedido-pagamento"
                  disabled
                >

                  <option value="pendente">
                    Pendente
                  </option>

                  <option value="aprovado">
                    Aprovado
                  </option>

                  <option value="recusado">
                    Recusado
                  </option>

                </select>

              </div>

            </div>


            <div class="form-group">

              <label class="form-label">
                Status do Pedido
              </label>

              <select
                class="form-control pedido-field"
                id="pedido-status"
                disabled
              >

                <option value="aguardando">
                  Aguardando confirmação
                </option>

                <option value="confirmado">
                  Confirmado
                </option>

                <option value="pagamento">
                  Aguardando pagamento
                </option>

                <option value="pago">
                  Pago
                </option>

                <option value="preparando">
                  Em preparação
                </option>

                <option value="pronto">
                  Pronto para retirada
                </option>

                <option value="enviado">
                  Enviado
                </option>

                <option value="entregue">
                  Entregue
                </option>

                <option value="cancelado">
                  Cancelado
                </option>

              </select>

            </div>


            <div class="form-group">

              <label class="form-label">
                Observações
              </label>

              <textarea
                class="form-control pedido-field"
                id="pedido-observacoes"
                rows="3"
                disabled
              ></textarea>

            </div>

          </div>


          <div class="modal__footer">

            <button
              class="btn btn--outline"
              onclick="
                closeModal('modal-pedido')
              "
            >
              Fechar
            </button>

            <button
              class="btn btn--primary"
              id="pedido-edit-button"
              onclick="enableOrderEdit()"
            >
              Editar Pedido
            </button>

            <button
              class="btn btn--primary"
              id="pedido-save-button"
              onclick="saveOrder()"
              style="display:none;"
            >
              Salvar Alterações
            </button>

          </div>

        </div>

      </div>

      `
    );
  }

  /* =========================================================
     PRODUTOS
     ========================================================= */

  function productStatus(
    product
  ) {

    if (!product.published) {

      return {
        text: "Rascunho",
        cls: "badge--gray"
      };
    }

    if (
      Number(product.stock) <= 0
    ) {

      return {
        text: "Sem estoque",
        cls: "badge--red"
      };
    }

    return {
      text: "Ativo",
      cls: "badge--green"
    };
  }

  function updateProductCategoryOptions(
    selected = null
  ) {

    const active =
      categories.filter(
        (category) =>
          category.active
      );

    const select =
      $("produto-categoria");

    const filter =
      $("produto-filtro-categoria");


    if (select) {

      const previous =
        selected ??
        select.value;

      select.innerHTML =
        active.length

        ?

        active
          .map(
            (category) => `

              <option
                value="${escapeHtml(category.name)}"
              >
                ${escapeHtml(category.name)}
              </option>

            `
          )
          .join("")

        :

        `
          <option value="Sem categoria">
            Sem categoria
          </option>
        `;


      if (
        [...select.options]
          .some(
            (option) =>
              option.value === previous
          )
      ) {

        select.value =
          previous;
      }
    }


    if (filter) {

      const previous =
        filter.value;

      filter.innerHTML =
        `

          <option value="">
            Todas as categorias
          </option>

        `

        +

        categories
          .map(
            (category) => `

              <option
                value="${escapeHtml(category.name)}"
              >
                ${escapeHtml(category.name)}
              </option>

            `
          )
          .join("");


      if (
        [...filter.options]
          .some(
            (option) =>
              option.value === previous
          )
      ) {

        filter.value =
          previous;
      }
    }
  }

  window.renderProducts =
    function renderProducts() {

      const tbody =
        $("produtos-tbody");

      if (!tbody) {
        return;
      }


      const search =
        normalizeText(
          $("produto-busca")
            ?.value
          ||
          ""
        );


      const categoryFilter =
        $("produto-filtro-categoria")
          ?.value
        ||
        "";


      const visible =
        products.filter(
          (product) => {

            const matchSearch =

              !search

              ||

              normalizeText(
                product.name
              )
              .includes(search)

              ||

              normalizeText(
                product.sku
              )
              .includes(search)

              ||

              normalizeText(
                product.category
              )
              .includes(search);


            const matchCategory =

              !categoryFilter

              ||

              product.category
              ===
              categoryFilter;


            return (
              matchSearch
              &&
              matchCategory
            );
          }
        );


      if (!visible.length) {

        tbody.innerHTML = `

          <tr>

            <td
              colspan="8"
              style="
                text-align:center;
                padding:42px 16px;
                color:var(--text-light);
              "
            >

              ${
                products.length

                ?

                "Nenhum produto encontrado."

                :

                `
                  Nenhum produto cadastrado.
                  Clique em
                  <strong>
                    + Novo Produto
                  </strong>.
                `
              }

            </td>

          </tr>

        `;

      } else {

        tbody.innerHTML =
          visible
            .map(
              (product) => {

                const status =
                  productStatus(
                    product
                  );


                const price =
                  Number(
                    product.salePrice
                  ) > 0

                  ?

                  product.salePrice

                  :

                  product.price;


                const oldPrice =
                  Number(
                    product.salePrice
                  ) > 0

                  ?

                  `

                    <div
                      style="
                        font-size:11px;
                        color:var(--text-light);
                        text-decoration:line-through;
                      "
                    >
                      ${formatMoney(product.price)}
                    </div>

                  `

                  :

                  "";


                const image =
                  product.image

                  ?

                  `

                    <img
                      src="${escapeHtml(product.image)}"
                      alt="${escapeHtml(product.name)}"
                      style="
                        width:46px;
                        height:58px;
                        border-radius:8px;
                        object-fit:cover;
                      "
                    >

                  `

                  :

                  `

                    <div
                      style="
                        width:46px;
                        height:58px;
                        border-radius:8px;
                        background:var(--bg);
                        display:flex;
                        align-items:center;
                        justify-content:center;
                      "
                    >
                      🛍️
                    </div>

                  `;


                return `

                  <tr>

                    <td>
                      <input type="checkbox">
                    </td>


                    <td>

                      <div
                        style="
                          display:flex;
                          align-items:center;
                          gap:10px;
                        "
                      >

                        ${image}


                        <div>

                          <strong>
                            ${escapeHtml(product.name)}
                          </strong>


                          ${
                            product.description

                            ?

                            `

                              <div
                                style="
                                  font-size:11px;
                                  color:var(--text-light);
                                  max-width:230px;
                                  white-space:nowrap;
                                  overflow:hidden;
                                  text-overflow:ellipsis;
                                "
                              >
                                ${escapeHtml(product.description)}
                              </div>

                            `

                            :

                            ""
                          }

                        </div>

                      </div>

                    </td>


                    <td>

                      <code>
                        ${escapeHtml(product.sku)}
                      </code>

                    </td>


                    <td>
                      ${escapeHtml(
                        product.category
                        ||
                        "Sem categoria"
                      )}
                    </td>


                    <td>

                      <strong>
                        ${formatMoney(price)}
                      </strong>

                      ${oldPrice}

                    </td>


                    <td>
                      ${Number(product.stock) || 0}
                    </td>


                    <td>

                      <span
                        class="badge ${status.cls}"
                      >
                        ${status.text}
                      </span>

                    </td>


                    <td class="action-btns">

                      <button
                        class="btn btn--ghost btn--icon"
                        title="Editar"
                        onclick="
                          editProduct('${escapeHtml(product.id)}')
                        "
                      >
                        ✏️
                      </button>


                      <button
                        class="btn btn--ghost btn--icon"
                        title="Excluir"
                        onclick="
                          deleteProduct('${escapeHtml(product.id)}')
                        "
                      >
                        🗑️
                      </button>

                    </td>

                  </tr>

                `;

              }
            )
            .join("");
      }


      if (
        $("produtos-resumo")
      ) {

        $("produtos-resumo")
          .textContent =

          products.length

          ?

          `${visible.length} de ${products.length} produto${products.length === 1 ? "" : "s"}`

          :

          "Nenhum produto cadastrado";
      }


      if (
        $("sidebar-produtos-count")
      ) {

        $("sidebar-produtos-count")
          .textContent =
          products.length;
      }


      renderCategories();
    };

  function resetProductForm() {

    editingProductId =
      null;

    pendingProductImage =
      "";


    $("produto-nome").value =
      "";

    $("produto-preco").value =
      "";

    $("produto-preco-promocional").value =
      "";

    $("produto-estoque").value =
      "";

    $("produto-descricao").value =
      "";

    $("produto-publicado").checked =
      true;


    document
      .querySelectorAll(
        ".produto-tamanho"
      )
      .forEach(
        (checkbox) => {

          checkbox.checked =
            checkbox.value
            !==
            "XXL";

        }
      );


    $("produto-imagem").value =
      "";


    updateProductCategoryOptions();

    updateImagePreview(
      ""
    );
  }

  function updateImagePreview(
    src
  ) {

    const preview =
      $("produto-imagem-preview");

    const icon =
      $("produto-image-icon");

    const label =
      $("produto-image-label");


    if (
      !preview
      ||
      !icon
      ||
      !label
    ) {
      return;
    }


    if (src) {

      preview.src =
        src;

      preview.style.display =
        "block";

      icon.style.display =
        "none";

      label.textContent =
        "Trocar imagem";

    } else {

      preview.removeAttribute(
        "src"
      );

      preview.style.display =
        "none";

      icon.style.display =
        "";

      label.textContent =
        "Clique para enviar";
    }
  }

  function compressImage(
    file
  ) {

    return new Promise(
      (
        resolve,
        reject
      ) => {

        if (
          !file
          ||
          !file.type
            .startsWith("image/")
        ) {

          reject(
            new Error(
              "Arquivo inválido"
            )
          );

          return;
        }


        const reader =
          new FileReader();


        reader.onerror =
          reject;


        reader.onload =
          () => {

            const img =
              new Image();


            img.onerror =
              reject;


            img.onload =
              () => {

                const maxSide =
                  1000;


                const scale =
                  Math.min(
                    1,
                    maxSide
                    /
                    Math.max(
                      img.width,
                      img.height
                    )
                  );


                const canvas =
                  document.createElement(
                    "canvas"
                  );


                canvas.width =
                  Math.max(
                    1,
                    Math.round(
                      img.width
                      *
                      scale
                    )
                  );


                canvas.height =
                  Math.max(
                    1,
                    Math.round(
                      img.height
                      *
                      scale
                    )
                  );


                canvas
                  .getContext("2d")
                  .drawImage(
                    img,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                  );


                resolve(
                  canvas.toDataURL(
                    "image/jpeg",
                    0.82
                  )
                );
              };


            img.src =
              reader.result;
          };


        reader.readAsDataURL(
          file
        );
      }
    );
  }

  async function handleProductImage(
    file
  ) {

    try {

      pendingProductImage =
        await compressImage(
          file
        );

      updateImagePreview(
        pendingProductImage
      );

    } catch (error) {

      console.error(
        error
      );

      showToast(
        "Não consegui processar essa imagem. ⚠️"
      );
    }
  }

  function bindImageUpload() {

    const zone =
      $("produto-image-upload");

    const input =
      $("produto-imagem");


    if (
      !zone
      ||
      !input
    ) {
      return;
    }


    zone.addEventListener(
      "click",
      (event) => {

        if (
          event.target
          !==
          input
        ) {

          input.click();
        }
      }
    );


    input.addEventListener(
      "change",
      () => {

        if (
          input.files?.[0]
        ) {

          handleProductImage(
            input.files[0]
          );
        }
      }
    );


    [
      "dragenter",
      "dragover"
    ]
    .forEach(
      (eventName) => {

        zone.addEventListener(
          eventName,
          (event) => {

            event.preventDefault();

            zone.style.borderColor =
              "var(--primary)";
          }
        );
      }
    );


    [
      "dragleave",
      "drop"
    ]
    .forEach(
      (eventName) => {

        zone.addEventListener(
          eventName,
          (event) => {

            event.preventDefault();

            zone.style.borderColor =
              "";
          }
        );
      }
    );


    zone.addEventListener(
      "drop",
      (event) => {

        const file =
          event
            .dataTransfer
            ?.files
            ?.[0];


        if (file) {

          handleProductImage(
            file
          );
        }
      }
    );
  }

  window.openNewProductModal =
    function () {

      resetProductForm();


      $("produto-modal-title")
        .textContent =
        "Novo Produto";


      $("produto-save-button")
        .textContent =
        "Criar Produto";


      openModal(
        "modal-produto"
      );
    };

  window.editProduct =
    function (id) {

      const product =
        products.find(
          (item) =>
            String(item.id)
            ===
            String(id)
        );


      if (!product) {

        return showToast(
          "Produto não encontrado. ⚠️"
        );
      }


      editingProductId =
        product.id;


      pendingProductImage =
        product.image
        ||
        "";


      $("produto-modal-title")
        .textContent =
        "Editar Produto";


      $("produto-save-button")
        .textContent =
        "Salvar Alterações";


      $("produto-nome").value =
        product.name
        ||
        "";


      $("produto-preco").value =
        product.price
        ||
        "";


      $("produto-preco-promocional").value =
        product.salePrice
        ||
        "";


      $("produto-estoque").value =
        product.stock
        ??
        0;


      $("produto-descricao").value =
        product.description
        ||
        "";


      $("produto-publicado").checked =
        product.published
        !==
        false;


      updateProductCategoryOptions(
        product.category
      );


      const sizes =
        Array.isArray(
          product.sizes
        )

        ?

        product.sizes

        :

        [];


      document
        .querySelectorAll(
          ".produto-tamanho"
        )
        .forEach(
          (checkbox) => {

            checkbox.checked =
              sizes.includes(
                checkbox.value
              );
          }
        );


      updateImagePreview(
        pendingProductImage
      );


      openModal(
        "modal-produto"
      );
    };

  function makeSku(
    name,
    id
  ) {

    const base =
      String(
        name
        ||
        "PROD"
      )

      .normalize(
        "NFD"
      )

      .replace(
        /[\u0300-\u036f]/g,
        ""
      )

      .toUpperCase()

      .replace(
        /[^A-Z0-9]+/g,
        "-"
      )

      .replace(
        /^-|-$/g,
        ""
      )

      .slice(
        0,
        16
      )

      ||

      "PROD";


    return (
      `${base}-${String(id).slice(-4)}`
    );
  }

  window.saveProduct =
    function () {

      const name =
        $("produto-nome")
          .value
          .trim();


      const price =
        Number(
          $("produto-preco")
            .value
        );


      const salePrice =
        Number(
          $("produto-preco-promocional")
            .value
          ||
          0
        );


      const stock =
        Math.max(
          0,
          parseInt(
            $("produto-estoque")
              .value
            ||
            "0",
            10
          )
        );


      if (!name) {

        $("produto-nome")
          .focus();

        return showToast(
          "Preencha o nome do produto. ⚠️"
        );
      }


      if (
        !Number.isFinite(price)
        ||
        price <= 0
      ) {

        $("produto-preco")
          .focus();

        return showToast(
          "Informe um preço válido. ⚠️"
        );
      }


      if (
        salePrice < 0

        ||

        (
          salePrice > 0
          &&
          salePrice >= price
        )
      ) {

        $("produto-preco-promocional")
          .focus();

        return showToast(
          "O preço promocional precisa ser menor que o preço normal. ⚠️"
        );
      }


      const sizes =
        [
          ...document.querySelectorAll(
            ".produto-tamanho:checked"
          )
        ]
        .map(
          (el) =>
            el.value
        );


      const data = {

        name,

        category:
          $("produto-categoria")
            .value
          ||
          "Sem categoria",

        price,

        salePrice,

        stock,

        description:
          $("produto-descricao")
            .value
            .trim(),

        image:
          pendingProductImage,

        sizes,

        published:
          $("produto-publicado")
            .checked,

        updatedAt:
          new Date()
            .toISOString()
      };


      if (
        editingProductId
        !==
        null
      ) {

        const index =
          products.findIndex(
            (item) =>
              String(item.id)
              ===
              String(editingProductId)
          );


        if (
          index === -1
        ) {

          return showToast(
            "Produto não encontrado. ⚠️"
          );
        }


        products[index] = {

          ...products[index],

          ...data
        };


        showToast(
          "Produto atualizado com sucesso! ✅"
        );

      } else {

        const id =
          `prod-${Date.now()}`;


        products.unshift({

          id,

          sku:
            makeSku(
              name,
              id
            ),

          createdAt:
            new Date()
              .toISOString(),

          ...data
        });


        showToast(
          "Produto criado com sucesso! ✅"
        );
      }


      saveList(
        STORAGE.products,
        products
      );


      renderProducts();


      closeModal(
        "modal-produto"
      );
    };

  window.deleteProduct =
    function (id) {

      const product =
        products.find(
          (item) =>
            String(item.id)
            ===
            String(id)
        );


      if (!product) {
        return;
      }


      if (
        !confirm(
          `Excluir "${product.name}"?`
        )
      ) {
        return;
      }


      products =
        products.filter(
          (item) =>
            String(item.id)
            !==
            String(id)
        );


      saveList(
        STORAGE.products,
        products
      );


      renderProducts();


      showToast(
        "Produto excluído. 🗑️"
      );
    };

  /* =========================================================
     CATEGORIAS
     ========================================================= */

  function categoryProductCount(
    name
  ) {

    return products
      .filter(
        (product) =>
          product.category
          ===
          name
      )
      .length;
  }

  window.renderCategories =
    function renderCategories() {

      const tbody =
        $("categorias-tbody");

      if (!tbody) {
        return;
      }


      const search =
        normalizeText(
          $("categoria-busca")
            ?.value
          ||
          ""
        );


      const visible =
        categories.filter(
          (category) =>

            !search

            ||

            normalizeText(
              category.name
            )
            .includes(search)

            ||

            normalizeText(
              category.slug
            )
            .includes(search)
        );


      tbody.innerHTML =

        visible.length

        ?

        visible
          .map(
            (category) => `

              <tr>

                <td>

                  <strong>
                    ${escapeHtml(category.name)}
                  </strong>

                  ${
                    category.description

                    ?

                    `

                      <div
                        style="
                          font-size:11px;
                          color:var(--text-light);
                          margin-top:3px;
                        "
                      >
                        ${escapeHtml(category.description)}
                      </div>

                    `

                    :

                    ""
                  }

                </td>


                <td>

                  <code
                    style="
                      background:var(--bg);
                      padding:2px 8px;
                      border-radius:5px;
                    "
                  >
                    /${escapeHtml(category.slug)}
                  </code>

                </td>


                <td>
                  ${categoryProductCount(category.name)}
                </td>


                <td>

                  <span
                    class="badge ${
                      category.active
                      ?
                      "badge--green"
                      :
                      "badge--gray"
                    }"
                  >
                    ${
                      category.active
                      ?
                      "Ativa"
                      :
                      "Inativa"
                    }
                  </span>

                </td>


                <td class="action-btns">

                  <button
                    class="btn btn--ghost btn--icon"
                    title="Editar"
                    onclick="
                      editCategory('${escapeHtml(category.id)}')
                    "
                  >
                    ✏️
                  </button>


                  <button
                    class="btn btn--ghost btn--icon"
                    title="Excluir"
                    onclick="
                      deleteCategory('${escapeHtml(category.id)}')
                    "
                  >
                    🗑️
                  </button>

                </td>

              </tr>

            `
          )
          .join("")

        :

        `

          <tr>

            <td
              colspan="5"
              style="
                text-align:center;
                padding:42px 16px;
                color:var(--text-light);
              "
            >
              Nenhuma categoria encontrada.
            </td>

          </tr>

        `;
    };

  window.openNewCategoryModal =
    function () {

      editingCategoryId =
        null;


      $("categoria-modal-title")
        .textContent =
        "Nova Categoria";


      $("categoria-save-button")
        .textContent =
        "Criar Categoria";


      $("categoria-nome").value =
        "";

      $("categoria-slug").value =
        "";

      $("categoria-descricao").value =
        "";

      $("categoria-ativa").checked =
        true;


      openModal(
        "modal-categoria"
      );
    };

  window.editCategory =
    function (id) {

      const category =
        categories.find(
          (item) =>
            String(item.id)
            ===
            String(id)
        );


      if (!category) {

        return showToast(
          "Categoria não encontrada. ⚠️"
        );
      }


      editingCategoryId =
        category.id;


      $("categoria-modal-title")
        .textContent =
        "Editar Categoria";


      $("categoria-save-button")
        .textContent =
        "Salvar Alterações";


      $("categoria-nome").value =
        category.name
        ||
        "";


      $("categoria-slug").value =
        category.slug
        ||
        "";


      $("categoria-descricao").value =
        category.description
        ||
        "";


      $("categoria-ativa").checked =
        category.active
        !==
        false;


      openModal(
        "modal-categoria"
      );
    };

  window.saveCategory =
    function () {

      const name =
        $("categoria-nome")
          .value
          .trim();


      const slug =
        slugify(

          $("categoria-slug")
            .value
            .trim()

          ||

          name
        );


      if (!name) {

        return showToast(
          "Informe o nome da categoria. ⚠️"
        );
      }


      if (!slug) {

        return showToast(
          "Informe um slug válido. ⚠️"
        );
      }


      const duplicate =
        categories.some(
          (category) =>

            String(category.id)
            !==
            String(editingCategoryId)

            &&

            (
              normalizeText(
                category.name
              )
              ===
              normalizeText(
                name
              )

              ||

              category.slug
              ===
              slug
            )
        );


      if (duplicate) {

        return showToast(
          "Já existe uma categoria com esse nome ou slug. ⚠️"
        );
      }


      const data = {

        name,

        slug,

        description:
          $("categoria-descricao")
            .value
            .trim(),

        active:
          $("categoria-ativa")
            .checked
      };


      if (
        editingCategoryId
        !==
        null
      ) {

        const index =
          categories.findIndex(
            (item) =>
              String(item.id)
              ===
              String(editingCategoryId)
          );


        if (
          index === -1
        ) {

          return showToast(
            "Categoria não encontrada. ⚠️"
          );
        }


        const oldName =
          categories[index]
            .name;


        categories[index] = {

          ...categories[index],

          ...data
        };


        if (
          oldName
          !==
          name
        ) {

          products =
            products.map(
              (product) =>

                product.category
                ===
                oldName

                ?

                {
                  ...product,
                  category: name
                }

                :

                product
            );


          saveList(
            STORAGE.products,
            products
          );
        }


        showToast(
          "Categoria atualizada com sucesso! ✅"
        );

      } else {

        categories.push({

          id:
            `cat-${Date.now()}`,

          ...data
        });


        showToast(
          "Categoria criada com sucesso! ✅"
        );
      }


      saveList(
        STORAGE.categories,
        categories
      );


      updateProductCategoryOptions();

      renderCategories();

      renderProducts();


      closeModal(
        "modal-categoria"
      );
    };

  window.deleteCategory =
    function (id) {

      const category =
        categories.find(
          (item) =>
            String(item.id)
            ===
            String(id)
        );


      if (!category) {
        return;
      }


      const count =
        categoryProductCount(
          category.name
        );


      if (
        count > 0
      ) {

        return showToast(
          `Essa categoria tem ${count} produto${count === 1 ? "" : "s"}. Mova antes de excluir. ⚠️`
        );
      }


      if (
        !confirm(
          `Excluir a categoria "${category.name}"?`
        )
      ) {
        return;
      }


      categories =
        categories.filter(
          (item) =>
            String(item.id)
            !==
            String(id)
        );


      saveList(
        STORAGE.categories,
        categories
      );


      updateProductCategoryOptions();

      renderCategories();


      showToast(
        "Categoria excluída. 🗑️"
      );
    };

  /* =========================================================
     COLEÇÕES
     ========================================================= */

  function collectionStatus(
    status
  ) {

    const map = {

      publicada: {
        text: "Publicada",
        cls: "badge--green"
      },

      rascunho: {
        text: "Rascunho",
        cls: "badge--yellow"
      },

      agendada: {
        text: "Agendada",
        cls: "badge--gray"
      }
    };


    return (
      map[status]
      ||
      map.rascunho
    );
  }

  window.renderCollections =
    function renderCollections() {

      const tbody =
        $("colecoes-tbody");

      if (!tbody) {
        return;
      }


      const search =
        normalizeText(
          $("colecao-busca")
            ?.value
          ||
          ""
        );


      const visible =
        collections.filter(
          (collection) =>

            !search

            ||

            normalizeText(
              collection.name
            )
            .includes(search)

            ||

            normalizeText(
              collection.period
            )
            .includes(search)
        );


      tbody.innerHTML =

        visible.length

        ?

        visible
          .map(
            (collection) => {

              const status =
                collectionStatus(
                  collection.status
                );


              return `

                <tr>

                  <td>

                    <strong>
                      ${escapeHtml(collection.name)}
                    </strong>


                    ${
                      collection.description

                      ?

                      `

                        <div
                          style="
                            font-size:11px;
                            color:var(--text-light);
                            margin-top:3px;
                          "
                        >
                          ${escapeHtml(collection.description)}
                        </div>

                      `

                      :

                      ""
                    }

                  </td>


                  <td>
                    ${Number(collection.productCount) || 0}
                  </td>


                  <td>
                    ${escapeHtml(
                      collection.period
                      ||
                      "—"
                    )}
                  </td>


                  <td>

                    <span
                      class="badge ${status.cls}"
                    >
                      ${status.text}
                    </span>

                  </td>


                  <td class="action-btns">

                    <button
                      class="btn btn--ghost btn--icon"
                      title="Editar"
                      onclick="
                        editCollection('${escapeHtml(collection.id)}')
                      "
                    >
                      ✏️
                    </button>


                    <button
                      class="btn btn--ghost btn--icon"
                      title="Excluir"
                      onclick="
                        deleteCollection('${escapeHtml(collection.id)}')
                      "
                    >
                      🗑️
                    </button>

                  </td>

                </tr>

              `;
            }
          )
          .join("")

        :

        `

          <tr>

            <td
              colspan="5"
              style="
                text-align:center;
                padding:42px 16px;
                color:var(--text-light);
              "
            >
              Nenhuma coleção encontrada.
            </td>

          </tr>

        `;
    };

  window.openNewCollectionModal =
    function () {

      editingCollectionId =
        null;


      $("colecao-modal-title")
        .textContent =
        "Nova Coleção";


      $("colecao-save-button")
        .textContent =
        "Criar Coleção";


      $("colecao-nome").value =
        "";

      $("colecao-produtos").value =
        "0";

      $("colecao-periodo").value =
        "";

      $("colecao-status").value =
        "publicada";

      $("colecao-descricao").value =
        "";


      openModal(
        "modal-colecao"
      );
    };

  window.editCollection =
    function (id) {

      const collection =
        collections.find(
          (item) =>
            String(item.id)
            ===
            String(id)
        );


      if (!collection) {

        return showToast(
          "Coleção não encontrada. ⚠️"
        );
      }


      editingCollectionId =
        collection.id;


      $("colecao-modal-title")
        .textContent =
        "Editar Coleção";


      $("colecao-save-button")
        .textContent =
        "Salvar Alterações";


      $("colecao-nome").value =
        collection.name
        ||
        "";


      $("colecao-produtos").value =
        Number(
          collection.productCount
        )
        ||
        0;


      $("colecao-periodo").value =
        collection.period
        ||
        "";


      $("colecao-status").value =
        collection.status
        ||
        "publicada";


      $("colecao-descricao").value =
        collection.description
        ||
        "";


      openModal(
        "modal-colecao"
      );
    };

  window.saveCollection =
    function () {

      const name =
        $("colecao-nome")
          .value
          .trim();


      if (!name) {

        return showToast(
          "Informe o nome da coleção. ⚠️"
        );
      }


      const data = {

        name,

        productCount:
          Math.max(
            0,
            parseInt(
              $("colecao-produtos")
                .value
              ||
              "0",
              10
            )
          ),

        period:
          $("colecao-periodo")
            .value
            .trim(),

        status:
          $("colecao-status")
            .value,

        description:
          $("colecao-descricao")
            .value
            .trim()
      };


      if (
        editingCollectionId
        !==
        null
      ) {

        const index =
          collections.findIndex(
            (item) =>
              String(item.id)
              ===
              String(editingCollectionId)
          );


        if (
          index === -1
        ) {

          return showToast(
            "Coleção não encontrada. ⚠️"
          );
        }


        collections[index] = {

          ...collections[index],

          ...data
        };


        showToast(
          "Coleção atualizada com sucesso! ✅"
        );

      } else {

        collections.unshift({

          id:
            `col-${Date.now()}`,

          ...data
        });


        showToast(
          "Coleção criada com sucesso! ✅"
        );
      }


      saveList(
        STORAGE.collections,
        collections
      );


      renderCollections();


      closeModal(
        "modal-colecao"
      );
    };

  window.deleteCollection =
    function (id) {

      const collection =
        collections.find(
          (item) =>
            String(item.id)
            ===
            String(id)
        );


      if (!collection) {
        return;
      }


      if (
        !confirm(
          `Excluir a coleção "${collection.name}"?`
        )
      ) {
        return;
      }


      collections =
        collections.filter(
          (item) =>
            String(item.id)
            !==
            String(id)
        );


      saveList(
        STORAGE.collections,
        collections
      );


      renderCollections();


      showToast(
        "Coleção excluída. 🗑️"
      );
    };

  /* =========================================================
     PEDIDOS
     ========================================================= */

  function orderStatus(
    status
  ) {

    const map = {

      aguardando: {
        text: "Aguardando confirmação",
        cls: "badge--yellow"
      },

      confirmado: {
        text: "Confirmado",
        cls: "badge--blue"
      },

      pagamento: {
        text: "Aguardando pagamento",
        cls: "badge--yellow"
      },

      pago: {
        text: "Pago",
        cls: "badge--green"
      },

      preparando: {
        text: "Em preparação",
        cls: "badge--yellow"
      },

      pronto: {
        text: "Pronto para retirada",
        cls: "badge--purple"
      },

      enviado: {
        text: "Enviado",
        cls: "badge--blue"
      },

      entregue: {
        text: "Entregue",
        cls: "badge--green"
      },

      cancelado: {
        text: "Cancelado",
        cls: "badge--red"
      }
    };


    return (
      map[status]
      ||
      map.aguardando
    );
  }

  function paymentStatus(
    status
  ) {

    const map = {

      pendente: {
        text: "Pendente",
        cls: "badge--yellow"
      },

      aprovado: {
        text: "Aprovado",
        cls: "badge--green"
      },

      recusado: {
        text: "Recusado",
        cls: "badge--red"
      }
    };


    return (
      map[status]
      ||
      map.pendente
    );
  }

  function orderItemsText(
    order
  ) {

    if (
      order.itemsText
    ) {
      return order.itemsText;
    }


    if (
      !Array.isArray(
        order.items
      )
    ) {
      return "";
    }


    return order.items
      .map(
        (item) => {

          if (
            typeof item
            ===
            "string"
          ) {
            return item;
          }


          const qty =
            Number(
              item.quantity
              ||
              item.qty
              ||
              1
            );


          const name =
            item.name
            ||
            item.productName
            ||
            "Produto";


          const variant =
            item.variant
            ||
            item.size
            ||
            "";


          return (
            `${qty}x ${name}${variant ? ` — ${variant}` : ""}`
          );
        }
      )
      .join("\n");
  }

  function orderItemCount(
    order
  ) {

    if (
      Array.isArray(
        order.items
      )
      &&
      order.items.length
    ) {

      return order.items.length;
    }


    if (
      Number(
        order.itemCount
      ) > 0
    ) {

      return Number(
        order.itemCount
      );
    }


    const text =
      orderItemsText(
        order
      );


    return text

      ?

      text
        .split("\n")
        .filter(
          (line) =>
            line.trim()
        )
        .length

      :

      0;
  }

  function normalizeOrder(
    raw = {}
  ) {

    const now =
      new Date()
        .toISOString();


    const number =
      raw.number
      ||
      raw.orderNumber
      ||
      raw.id
      ||
      `${Date.now()}`;


    const id =
      String(
        raw.id
        ||
        number
      );


    return {

      id,

      number:
        String(number)
          .startsWith("#")

        ?

        String(number)

        :

        `#${number}`,

      customer:
        raw.customer
        ||
        raw.customerName
        ||
        raw.name
        ||
        "Cliente",

      phone:
        raw.phone
        ||
        raw.whatsapp
        ||
        "",

      items:
        Array.isArray(
          raw.items
        )

        ?

        raw.items

        :

        [],

      itemsText:
        raw.itemsText
        ||
        "",

      itemCount:
        Number(
          raw.itemCount
          ||
          raw.itemsCount
          ||
          0
        ),

      total:
        Number(
          raw.total
          ||
          raw.totalValue
          ||
          0
        ),

      paymentStatus:
        raw.paymentStatus
        ||
        raw.payment
        ||
        "pendente",

      status:
        raw.status
        ||
        "aguardando",

      date:
        raw.date
        ||
        raw.createdAt
        ||
        now,

      notes:
        raw.notes
        ||
        raw.observations
        ||
        ""
    };
  }

  window.setOrderFilter =
    function (
      filter
    ) {

      orderFilter =
        filter;


      document
        .querySelectorAll(
          "[data-order-filter]"
        )
        .forEach(
          (chip) => {

            chip.classList.toggle(
              "active",
              chip.dataset.orderFilter
              ===
              filter
            );
          }
        );


      renderOrders();
    };

  window.filterOrders =
    window.setOrderFilter;

  window.renderOrders =
    function renderOrders() {

      const tbody =
        $("pedidos-tbody");


      if (!tbody) {
        return;
      }


      const search =
        normalizeText(
          $("pedido-busca")
            ?.value
          ||
          ""
        );


      const visible =
        orders

          .filter(
            (order) => {

              const statusMatch =

                orderFilter
                ===
                "all"

                ||

                order.status
                ===
                orderFilter;


              const searchMatch =

                !search

                ||

                normalizeText(
                  order.number
                )
                .includes(search)

                ||

                normalizeText(
                  order.customer
                )
                .includes(search)

                ||

                normalizeText(
                  order.phone
                )
                .includes(search);


              return (
                statusMatch
                &&
                searchMatch
              );
            }
          )

          .sort(
            (a, b) =>
              new Date(b.date)
              -
              new Date(a.date)
          );


      tbody.innerHTML =

        visible.length

        ?

        visible
          .map(
            (order) => {

              const status =
                orderStatus(
                  order.status
                );


              const payment =
                paymentStatus(
                  order.paymentStatus
                );


              const count =
                orderItemCount(
                  order
                );


              return `

                <tr>

                  <td>

                    <strong>
                      ${escapeHtml(order.number)}
                    </strong>

                  </td>


                  <td>
                    ${escapeHtml(order.customer)}
                  </td>


                  <td>
                    ${count}
                    ${
                      count === 1
                      ?
                      "item"
                      :
                      "itens"
                    }
                  </td>


                  <td>
                    ${formatMoney(order.total)}
                  </td>


                  <td>

                    <span
                      class="badge ${payment.cls}"
                    >
                      ${payment.text}
                    </span>

                  </td>


                  <td>

                    <span
                      class="badge ${status.cls}"
                    >
                      ${status.text}
                    </span>

                  </td>


                  <td>
                    ${formatDate(order.date)}
                  </td>


                  <td class="action-btns">

                    <button
                      class="btn btn--ghost btn--icon"
                      title="Ver"
                      onclick="
                        viewOrder('${escapeHtml(order.id)}')
                      "
                    >
                      👁
                    </button>


                    <button
                      class="btn btn--ghost btn--icon"
                      title="Editar"
                      onclick="
                        editOrder('${escapeHtml(order.id)}')
                      "
                    >
                      ✏️
                    </button>

                  </td>

                </tr>

              `;
            }
          )
          .join("")

        :

        `

          <tr>

            <td
              colspan="8"
              style="
                text-align:center;
                padding:42px 16px;
                color:var(--text-light);
              "
            >

              ${
                orders.length

                ?

                "Nenhum pedido encontrado com esse filtro."

                :

                "Nenhum pedido real recebido ainda."
              }

            </td>

          </tr>

        `;


      updateOrderStats();

      renderDashboardOrders();
    };

  function updateOrderStats() {

    const total =
      orders.length;


    const preparing =
      orders.filter(
        (order) =>
          order.status
          ===
          "preparando"
      )
      .length;


    const sent =
      orders.filter(
        (order) =>
          order.status
          ===
          "enviado"
      )
      .length;


    const delivered =
      orders.filter(
        (order) =>
          order.status
          ===
          "entregue"
      )
      .length;


    const revenue =
      orders

        .filter(
          (order) =>
            order.status
            !==
            "cancelado"
        )

        .reduce(
          (
            sum,
            order
          ) =>
            sum
            +
            Number(
              order.total
              ||
              0
            ),
          0
        );


    const ticket =
      total
      ?
      revenue / total
      :
      0;


    if (
      $("pedidos-total")
    ) {

      $("pedidos-total")
        .textContent =
        total;
    }


    if (
      $("pedidos-preparando")
    ) {

      $("pedidos-preparando")
        .textContent =
        preparing;
    }


    if (
      $("pedidos-enviados")
    ) {

      $("pedidos-enviados")
        .textContent =
        sent;
    }


    if (
      $("pedidos-entregues")
    ) {

      $("pedidos-entregues")
        .textContent =
        delivered;
    }


    if (
      $("sidebar-pedidos-count")
    ) {

      $("sidebar-pedidos-count")
        .textContent =
        total;
    }


    if (
      $("dashboard-pedidos-total")
    ) {

      $("dashboard-pedidos-total")
        .textContent =
        total;
    }


    if (
      $("dashboard-receita-total")
    ) {

      $("dashboard-receita-total")
        .textContent =
        formatMoney(
          revenue
        );
    }


    if (
      $("dashboard-ticket-medio")
    ) {

      $("dashboard-ticket-medio")
        .textContent =
        formatMoney(
          ticket
        );
    }
  }

  function renderDashboardOrders() {

    const tbody =
      $("dashboard-orders-tbody");


    if (!tbody) {
      return;
    }


    const recent =
      [...orders]

        .sort(
          (a, b) =>
            new Date(b.date)
            -
            new Date(a.date)
        )

        .slice(
          0,
          5
        );


    tbody.innerHTML =

      recent.length

      ?

      recent
        .map(
          (order) => {

            const status =
              orderStatus(
                order.status
              );


            const count =
              orderItemCount(
                order
              );


            return `

              <tr>

                <td>

                  <strong>
                    ${escapeHtml(order.number)}
                  </strong>

                </td>


                <td>
                  ${escapeHtml(order.customer)}
                </td>


                <td>
                  ${count}
                  ${
                    count === 1
                    ?
                    "item"
                    :
                    "itens"
                  }
                </td>


                <td>
                  ${formatMoney(order.total)}
                </td>


                <td>

                  <span
                    class="badge ${status.cls}"
                  >
                    ${status.text}
                  </span>

                </td>


                <td>
                  ${formatDate(order.date)}
                </td>


                <td class="action-btns">

                  <button
                    class="btn btn--ghost btn--icon"
                    title="Ver"
                    onclick="
                      viewOrder('${escapeHtml(order.id)}')
                    "
                  >
                    👁
                  </button>

                </td>

              </tr>

            `;
          }
        )
        .join("")

      :

      `

        <tr>

          <td
            colspan="7"
            style="
              text-align:center;
              padding:32px 16px;
              color:var(--text-light);
            "
          >
            Nenhum pedido real recebido ainda.
          </td>

        </tr>

      `;
  }

  function fillOrderModal(
    order
  ) {

    $("pedido-numero").value =
      order.number
      ||
      "";


    $("pedido-data").value =
      formatDate(
        order.date
      );


    $("pedido-cliente").value =
      order.customer
      ||
      "";


    $("pedido-telefone").value =
      order.phone
      ||
      "";


    $("pedido-itens").value =
      orderItemsText(
        order
      );


    $("pedido-total-valor").value =
      Number(
        order.total
        ||
        0
      );


    $("pedido-pagamento").value =
      order.paymentStatus
      ||
      "pendente";


    $("pedido-status").value =
      order.status
      ||
      "aguardando";


    $("pedido-observacoes").value =
      order.notes
      ||
      "";
  }

  function setOrderEditable(
    editable
  ) {

    document
      .querySelectorAll(
        ".pedido-field"
      )
      .forEach(
        (field) => {

          if (
            [
              "pedido-numero",
              "pedido-data"
            ]
            .includes(
              field.id
            )
          ) {

            field.disabled =
              true;

          } else {

            field.disabled =
              !editable;
          }
        }
      );


    $("pedido-edit-button")
      .style.display =
      editable
      ?
      "none"
      :
      "";


    $("pedido-save-button")
      .style.display =
      editable
      ?
      ""
      :
      "none";


    $("pedido-modal-title")
      .textContent =
      editable

      ?

      "Editar Pedido"

      :

      "Detalhes do Pedido";
  }

  window.viewOrder =
    function (id) {

      const order =
        orders.find(
          (item) =>
            String(item.id)
            ===
            String(id)
        );


      if (!order) {

        return showToast(
          "Pedido não encontrado. ⚠️"
        );
      }


      activeOrderId =
        order.id;


      fillOrderModal(
        order
      );


      setOrderEditable(
        false
      );


      openModal(
        "modal-pedido"
      );
    };

  window.editOrder =
    function (id) {

      const order =
        orders.find(
          (item) =>
            String(item.id)
            ===
            String(id)
        );


      if (!order) {

        return showToast(
          "Pedido não encontrado. ⚠️"
        );
      }


      activeOrderId =
        order.id;


      fillOrderModal(
        order
      );


      setOrderEditable(
        true
      );


      openModal(
        "modal-pedido"
      );
    };

  window.enableOrderEdit =
    function () {

      if (
        !activeOrderId
      ) {
        return;
      }


      setOrderEditable(
        true
      );
    };

  window.saveOrder =
    function () {

      const index =
        orders.findIndex(
          (item) =>
            String(item.id)
            ===
            String(activeOrderId)
        );


      if (
        index === -1
      ) {

        return showToast(
          "Pedido não encontrado. ⚠️"
        );
      }


      const itemsText =
        $("pedido-itens")
          .value
          .trim();


      orders[index] = {

        ...orders[index],

        customer:
          $("pedido-cliente")
            .value
            .trim()

          ||

          "Cliente",

        phone:
          $("pedido-telefone")
            .value
            .trim(),

        itemsText,

        itemCount:
          itemsText

          ?

          itemsText
            .split("\n")
            .filter(
              (line) =>
                line.trim()
            )
            .length

          :

          0,

        total:
          Math.max(
            0,
            Number(
              $("pedido-total-valor")
                .value
              ||
              0
            )
          ),

        paymentStatus:
          $("pedido-pagamento")
            .value,

        status:
          $("pedido-status")
            .value,

        notes:
          $("pedido-observacoes")
            .value
            .trim(),

        updatedAt:
          new Date()
            .toISOString()
      };


      saveList(
        STORAGE.orders,
        orders
      );


      renderOrders();


      closeModal(
        "modal-pedido"
      );


      showToast(
        "Pedido atualizado com sucesso! ✅"
      );
    };

  /* =========================================================
     RECEBER PEDIDO DA LOJA
     ========================================================= */

  window.addOrderToAdmin =
    function (
      rawOrder
    ) {

      const order =
        normalizeOrder(
          rawOrder
        );


      const index =
        orders.findIndex(
          (item) =>

            String(item.id)
            ===
            String(order.id)

            ||

            String(item.number)
            ===
            String(order.number)
        );


      if (
        index >= 0
      ) {

        orders[index] = {

          ...orders[index],

          ...order
        };

      } else {

        orders.unshift(
          order
        );
      }


      saveList(
        STORAGE.orders,
        orders
      );


      renderOrders();


      return order;
    };

  /* =========================================================
     EXPORTAR PEDIDOS
     ========================================================= */

  window.exportOrdersCSV =
    function () {

      if (
        !orders.length
      ) {

        return showToast(
          "Não há pedidos para exportar. ⚠️"
        );
      }


      const headers = [

        "Pedido",
        "Cliente",
        "Telefone",
        "Itens",
        "Total",
        "Pagamento",
        "Status",
        "Data"

      ];


      const rows =
        orders.map(
          (order) => [

            order.number,

            order.customer,

            order.phone,

            orderItemsText(
              order
            )
            .replace(
              /\n/g,
              " | "
            ),

            Number(
              order.total
              ||
              0
            )
            .toFixed(2),

            paymentStatus(
              order.paymentStatus
            )
            .text,

            orderStatus(
              order.status
            )
            .text,

            formatDate(
              order.date
            )

          ]
        );


      const csv =
        [
          headers,
          ...rows
        ]

        .map(
          (row) =>

            row
              .map(
                (value) =>

                  `"${String(
                    value
                    ??
                    ""
                  )
                  .replace(
                    /"/g,
                    '""'
                  )}"`

              )
              .join(";")
        )

        .join("\n");


      const blob =
        new Blob(

          [
            "\uFEFF"
            +
            csv
          ],

          {
            type:
              "text/csv;charset=utf-8;"
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );


      link.href =
        url;


      link.download =
        `pedidos-${
          new Date()
            .toISOString()
            .slice(
              0,
              10
            )
        }.csv`;


      document.body.appendChild(
        link
      );


      link.click();


      link.remove();


      URL.revokeObjectURL(
        url
      );
    };

  /* =========================================================
     CARREGAR DADOS
     ========================================================= */

  function loadData() {

    products =
      loadList(
        STORAGE.products,
        []
      );


    /*
     * Migra produtos da versão anterior,
     * caso você já tenha cadastrado algum
     * com o código que te mandei antes.
     */

    if (
      !products.length
    ) {

      const legacy =
        loadList(
          STORAGE.productsLegacy,
          []
        );


      if (
        legacy.length
      ) {

        products =
          legacy;


        saveList(
          STORAGE.products,
          products
        );
      }
    }


    categories =
      loadList(
        STORAGE.categories,
        DEFAULT_CATEGORIES
      );


    collections =
      loadList(
        STORAGE.collections,
        DEFAULT_COLLECTIONS
      );


    /*
     * MUITO IMPORTANTE:
     *
     * os pedidos começam vazios.
     *
     * Os pedidos fake que estavam
     * escritos no HTML NÃO são importados.
     */

    orders =
      loadList(
        STORAGE.orders,
        []
      );
  }

  /* =========================================================
     INICIALIZAR
     ========================================================= */

  function init() {

    prepareSidebar();

    prepareDashboard();

    prepareProductPage();

    prepareOrderPage();

    prepareCategoryPage();

    prepareCollectionPage();

    prepareModals();


    loadData();


    bindImageUpload();


    updateProductCategoryOptions();


    renderProducts();

    renderCategories();

    renderCollections();

    renderOrders();


    /*
     * Se outra aba/página do mesmo domínio
     * alterar o localStorage, atualiza
     * automaticamente o painel.
     */

    window.addEventListener(
      "storage",
      (event) => {

        if (
          event.key
          ===
          STORAGE.orders
        ) {

          orders =
            loadList(
              STORAGE.orders,
              []
            );

          renderOrders();
        }


        if (
          event.key
          ===
          STORAGE.products
        ) {

          products =
            loadList(
              STORAGE.products,
              []
            );

          renderProducts();
        }


        if (
          event.key
          ===
          STORAGE.categories
        ) {

          categories =
            loadList(
              STORAGE.categories,
              DEFAULT_CATEGORIES
            );


          updateProductCategoryOptions();

          renderCategories();

          renderProducts();
        }


        if (
          event.key
          ===
          STORAGE.collections
        ) {

          collections =
            loadList(
              STORAGE.collections,
              DEFAULT_COLLECTIONS
            );


          renderCollections();
        }
      }
    );
  }


  if (
    document.readyState
    ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  } else {

    init();
  }

})();
