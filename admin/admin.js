(() => {
  'use strict';

  const KEYS = {
    products: 'essence-v3-products',
    categories: 'essence-v3-categories',
    collections: 'essence-v3-collections',
    orders: 'essence-v3-orders',
    clients: 'essence-v3-clients'
  };

  let products = load(KEYS.products, []);
  let categories = load(KEYS.categories, []);
  let collections = load(KEYS.collections, []);
  let orders = load(KEYS.orders, []);
  let clients = load(KEYS.clients, []);

  let editingProductId = null;
  let editingCategoryId = null;
  let editingCollectionId = null;
  let pendingImage = '';

  const $ = (id) => document.getElementById(id);

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);

      if (!raw) {
        return structuredCloneSafe(fallback);
      }

      const parsed = JSON.parse(raw);

      return Array.isArray(parsed)
        ? parsed
        : structuredCloneSafe(fallback);

    } catch (e) {
      console.warn('Falha ao ler', key, e);

      return structuredCloneSafe(fallback);
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    } catch (e) {
      console.error(
        'Falha ao salvar',
        key,
        e
      );

      toast(
        'Não foi possível salvar. Tente uma imagem menor. ⚠️'
      );
    }
  }

  function structuredCloneSafe(value) {
    return JSON.parse(
      JSON.stringify(value)
    );
  }

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function money(value) {
    return Number(value || 0)
      .toLocaleString(
        'pt-BR',
        {
          style: 'currency',
          currency: 'BRL'
        }
      );
  }

  function slugify(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .toLowerCase()
      .trim()
      .replace(
        /[^a-z0-9]+/g,
        '-'
      )
      .replace(
        /^-+|-+$/g,
        ''
      );
  }

  function uid(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function toast(message) {
    let el = $('toast');

    if (!el) {
      el = document.createElement('div');

      el.id = 'toast';

      Object.assign(
        el.style,
        {
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: '99999',
          background: '#1e1e2e',
          color: '#fff',
          padding: '12px 18px',
          borderRadius: '10px',
          fontSize: '13px',
          boxShadow:
            '0 8px 24px rgba(0,0,0,.2)',
          opacity: '0',
          transform:
            'translateY(20px)',
          transition:
            '.25s ease'
        }
      );

      document.body.appendChild(el);
    }

    el.textContent = message;

    el.style.opacity = '1';

    el.style.transform =
      'translateY(0)';

    clearTimeout(
      window.__essenceToast
    );

    window.__essenceToast =
      setTimeout(
        () => {
          el.style.opacity = '0';

          el.style.transform =
            'translateY(20px)';
        },
        2400
      );
  }

  window.navigate = function (page) {
    document
      .querySelectorAll(
        '.page-content'
      )
      .forEach(
        el =>
          el.classList.remove(
            'active'
          )
      );

    document
      .querySelectorAll(
        '.sidebar__item[data-page]'
      )
      .forEach(
        el => {
          el.classList.toggle(
            'active',
            el.dataset.page === page
          );
        }
      );

    const target =
      $(`page-${page}`);

    if (target) {
      target.classList.add(
        'active'
      );
    }
  };

  function showModal(id) {
    const modal = $(id);

    if (!modal) return;

    modal.style.display = 'flex';

    modal.classList.add(
      'active'
    );

    document.body.style.overflow =
      'hidden';
  }

  function hideModal(id) {
    const modal = $(id);

    if (!modal) return;

    modal.style.display = 'none';

    modal.classList.remove(
      'active'
    );

    document.body.style.overflow =
      '';
  }

  window.openModal = showModal;

  window.closeModal = hideModal;

  window.showToast = toast;

  function emptyRow(
    colspan,
    text
  ) {
    return `
      <tr>
        <td
          colspan="${colspan}"
          style="
            text-align:center;
            padding:38px 16px;
            color:var(--text-light,#888);
          "
        >
          ${text}
        </td>
      </tr>
    `;
  }

  /* =========================================================
     DASHBOARD
     ========================================================= */

  function resetDashboardFakeData() {
    const dashboard =
      $('page-dashboard');

    if (!dashboard) return;

    const values =
      dashboard.querySelectorAll(
        '.stat-card__value'
      );

    if (values[0]) {
      values[0].textContent =
        'R$ 0,00';
    }

    if (values[1]) {
      values[1].textContent =
        '0';
    }

    if (values[2]) {
      values[2].textContent =
        'R$ 0,00';
    }

    if (values[3]) {
      values[3].textContent =
        '0';
    }

    dashboard
      .querySelectorAll(
        '.stat-card__change'
      )
      .forEach(
        el => {
          el.textContent =
            'Sem dados ainda';

          el.classList.remove(
            'stat-card__change--up',
            'stat-card__change--down'
          );
        }
      );

    const topProducts =
      Array.from(
        dashboard.querySelectorAll(
          '.card'
        )
      )
      .find(
        card =>
          card
            .querySelector(
              '.card-title'
            )
            ?.textContent
            .trim()
          ===
          'Top Produtos'
      );

    if (topProducts) {
      const body =
        topProducts.querySelector(
          '.card-body'
        );

      if (body) {
        body.innerHTML = `
          <div
            style="
              padding:28px 8px;
              text-align:center;
              color:var(--text-light,#888);
            "
          >
            Nenhuma venda registrada ainda.
          </div>
        `;
      }
    }

    const recentOrders =
      Array.from(
        dashboard.querySelectorAll(
          '.card'
        )
      )
      .find(
        card =>
          card
            .querySelector(
              '.card-title'
            )
            ?.textContent
            .trim()
          ===
          'Pedidos Recentes'
      );

    if (recentOrders) {
      const tbody =
        recentOrders.querySelector(
          'tbody'
        );

      if (tbody) {
        tbody.id =
          'dashboard-orders-tbody';

        tbody.innerHTML =
          emptyRow(
            7,
            'Nenhum pedido recebido ainda.'
          );
      }
    }

    const chart =
      $('revenue-chart');

    if (chart) {
      chart.innerHTML = `
        <div
          style="
            height:100%;
            min-height:180px;
            display:flex;
            align-items:center;
            justify-content:center;
            color:var(--text-light,#888);
          "
        >
          Sem vendas para exibir
        </div>
      `;
    }
  }

  /* =========================================================
     PRODUTOS
     ========================================================= */

  function rebuildProductsPage() {
    const page =
      $('page-produtos');

    if (!page) return;

    page.innerHTML = `

      <div class="page-header">

        <div>
          <h1 class="page-title">
            Produtos
          </h1>

          <p class="page-subtitle">
            Gerencie seu catálogo de produtos
          </p>
        </div>

        <div class="page-actions">

          <button
            class="btn btn--primary"
            id="btn-novo-produto"
          >
            + Novo Produto
          </button>

        </div>

      </div>

      <div class="section-toolbar">

        <div class="section-search">

          <span>
            🔍
          </span>

          <input
            id="produto-busca"
            type="text"
            placeholder="Buscar produto..."
          >

        </div>

        <select
          class="form-control"
          id="produto-filtro-categoria"
          style="width:auto;"
        ></select>

      </div>

      <div class="card">

        <div class="orders-table-wrap">

          <table class="data-table">

            <thead>
              <tr>
                <th>Produto</th>
                <th>SKU</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody
              id="produtos-tbody"
            ></tbody>

          </table>

        </div>

        <div
          style="
            padding:12px 16px;
            border-top:1px solid var(--border);
          "
        >

          <span
            id="produtos-resumo"
            style="
              font-size:12px;
              color:var(--text-light);
            "
          >
            0 produtos
          </span>

        </div>

      </div>
    `;

    $('btn-novo-produto')
      .addEventListener(
        'click',
        openNewProductModal
      );

    $('produto-busca')
      .addEventListener(
        'input',
        renderProducts
      );

    $('produto-filtro-categoria')
      .addEventListener(
        'change',
        renderProducts
      );
  }

  function createProductModal() {
    $('modal-produto')
      ?.remove();

    const modal =
      document.createElement(
        'div'
      );

    modal.id =
      'modal-produto';

    modal.className =
      'modal-overlay';

    modal.style.display =
      'none';

    modal.innerHTML = `

      <div
        class="modal"
        style="
          max-height:90vh;
          overflow:auto;
        "
      >

        <div class="modal__header">

          <h2
            class="modal__title"
            id="produto-modal-title"
          >
            Novo Produto
          </h2>

          <button
            class="modal__close"
            id="produto-fechar"
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
              id="produto-nome"
              class="form-control"
              type="text"
              placeholder="Nome do produto"
            >

          </div>

          <div class="form-grid-2">

            <div class="form-group">

              <label class="form-label">
                Preço (R$) *
              </label>

              <input
                id="produto-preco"
                class="form-control"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
              >

            </div>

            <div class="form-group">

              <label class="form-label">
                Preço promocional
              </label>

              <input
                id="produto-preco-promocional"
                class="form-control"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
              >

            </div>

          </div>

          <div class="form-grid-2">

            <div class="form-group">

              <label class="form-label">
                Categoria
              </label>

              <select
                id="produto-categoria"
                class="form-control"
              ></select>

            </div>

            <div class="form-group">

              <label class="form-label">
                Estoque
              </label>

              <input
                id="produto-estoque"
                class="form-control"
                type="number"
                min="0"
                step="1"
                value="0"
              >

            </div>

          </div>

          <div class="form-group">

            <label class="form-label">
              Descrição
            </label>

            <textarea
              id="produto-descricao"
              class="form-control"
              rows="3"
              placeholder="Descrição do produto"
            ></textarea>

          </div>

          <div class="form-group">

            <label class="form-label">
              Imagem
            </label>

            <div
              id="produto-upload"
              class="image-upload"
              style="cursor:pointer;"
            >

              <input
                id="produto-imagem"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                style="display:none;"
              >

              <img
                id="produto-preview"
                alt="Prévia"
                style="
                  display:none;
                  width:74px;
                  height:74px;
                  object-fit:cover;
                  border-radius:10px;
                "
              >

              <div
                id="produto-upload-text"
                class="image-upload__text"
              >

                <strong>
                  Clique para enviar
                </strong>

                <br>

                <small>
                  PNG, JPG ou WEBP
                </small>

              </div>

            </div>

          </div>

          <div class="form-group">

            <label class="form-label">
              Tamanhos
            </label>

            <div
              style="
                display:flex;
                gap:10px;
                flex-wrap:wrap;
              "
            >

              <label
                style="
                  display:flex;
                  gap:5px;
                  align-items:center;
                "
              >
                <input
                  class="produto-tamanho"
                  type="checkbox"
                  value="PP"
                >
                PP
              </label>

              <label
                style="
                  display:flex;
                  gap:5px;
                  align-items:center;
                "
              >
                <input
                  class="produto-tamanho"
                  type="checkbox"
                  value="P"
                >
                P
              </label>

              <label
                style="
                  display:flex;
                  gap:5px;
                  align-items:center;
                "
              >
                <input
                  class="produto-tamanho"
                  type="checkbox"
                  value="M"
                >
                M
              </label>

              <label
                style="
                  display:flex;
                  gap:5px;
                  align-items:center;
                "
              >
                <input
                  class="produto-tamanho"
                  type="checkbox"
                  value="G"
                >
                G
              </label>

              <label
                style="
                  display:flex;
                  gap:5px;
                  align-items:center;
                "
              >
                <input
                  class="produto-tamanho"
                  type="checkbox"
                  value="GG"
                >
                GG
              </label>

            </div>

          </div>

          <div class="toggle-wrap">

            <label class="toggle">

              <input
                id="produto-publicado"
                type="checkbox"
                checked
              >

              <span
                class="toggle-slider"
              ></span>

            </label>

            <span
              style="font-size:13px;"
            >
              Produto ativo
            </span>

          </div>

        </div>

        <div class="modal__footer">

          <button
            class="btn btn--outline"
            id="produto-cancelar"
          >
            Cancelar
          </button>

          <button
            class="btn btn--primary"
            id="produto-salvar"
          >
            Criar Produto
          </button>

        </div>

      </div>
    `;

    modal.addEventListener(
      'click',
      e => {
        if (
          e.target === modal
        ) {
          hideModal(
            'modal-produto'
          );
        }
      }
    );

    document.body
      .appendChild(modal);

    $('produto-fechar')
      .addEventListener(
        'click',
        () =>
          hideModal(
            'modal-produto'
          )
      );

    $('produto-cancelar')
      .addEventListener(
        'click',
        () =>
          hideModal(
            'modal-produto'
          )
      );

    $('produto-salvar')
      .addEventListener(
        'click',
        saveProduct
      );

    $('produto-upload')
      .addEventListener(
        'click',
        () =>
          $('produto-imagem')
            .click()
      );

    $('produto-imagem')
      .addEventListener(
        'change',
        async () => {
          const file =
            $('produto-imagem')
              .files?.[0];

          if (!file) return;

          try {
            pendingImage =
              await compressImage(
                file
              );

            updatePreview();

          } catch (e) {
            console.error(e);

            toast(
              'Não consegui processar a imagem. ⚠️'
            );
          }
        }
      );
  }

  function compressImage(file) {
    return new Promise(
      (
        resolve,
        reject
      ) => {
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
                const max =
                  900;

                const scale =
                  Math.min(
                    1,
                    max /
                    Math.max(
                      img.width,
                      img.height
                    )
                  );

                const canvas =
                  document.createElement(
                    'canvas'
                  );

                canvas.width =
                  Math.round(
                    img.width *
                    scale
                  );

                canvas.height =
                  Math.round(
                    img.height *
                    scale
                  );

                canvas
                  .getContext('2d')
                  .drawImage(
                    img,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                  );

                resolve(
                  canvas.toDataURL(
                    'image/jpeg',
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

  function updatePreview() {
    const preview =
      $('produto-preview');

    const text =
      $('produto-upload-text');

    if (
      !preview ||
      !text
    ) {
      return;
    }

    if (pendingImage) {
      preview.src =
        pendingImage;

      preview.style.display =
        'block';

      text.innerHTML = `
        <strong>
          Trocar imagem
        </strong>
        <br>
        <small>
          Clique para escolher outra
        </small>
      `;

    } else {
      preview.removeAttribute(
        'src'
      );

      preview.style.display =
        'none';

      text.innerHTML = `
        <strong>
          Clique para enviar
        </strong>
        <br>
        <small>
          PNG, JPG ou WEBP
        </small>
      `;
    }
  }

  function refreshCategorySelects(
    selected = ''
  ) {
    const productSelect =
      $('produto-categoria');

    const filter =
      $('produto-filtro-categoria');

    const options =
      categories
        .map(
          c => `
            <option
              value="${esc(c.name)}"
            >
              ${esc(c.name)}
            </option>
          `
        )
        .join('');

    if (productSelect) {
      productSelect.innerHTML =
        categories.length
        ?
        options
        :
        `
          <option
            value="Sem categoria"
          >
            Sem categoria
          </option>
        `;

      if (
        [...productSelect.options]
          .some(
            o =>
              o.value === selected
          )
      ) {
        productSelect.value =
          selected;
      }
    }

    if (filter) {
      const old =
        filter.value;

      filter.innerHTML =
        `
          <option value="">
            Todas as categorias
          </option>
        `
        +
        options;

      if (
        [...filter.options]
          .some(
            o =>
              o.value === old
          )
      ) {
        filter.value =
          old;
      }
    }
  }

  function openNewProductModal() {
    editingProductId =
      null;

    pendingImage =
      '';

    $('produto-modal-title')
      .textContent =
      'Novo Produto';

    $('produto-salvar')
      .textContent =
      'Criar Produto';

    $('produto-nome')
      .value =
      '';

    $('produto-preco')
      .value =
      '';

    $('produto-preco-promocional')
      .value =
      '';

    $('produto-estoque')
      .value =
      0;

    $('produto-descricao')
      .value =
      '';

    $('produto-publicado')
      .checked =
      true;

    document
      .querySelectorAll(
        '.produto-tamanho'
      )
      .forEach(
        el =>
          el.checked =
            false
      );

    $('produto-imagem')
      .value =
      '';

    refreshCategorySelects();

    updatePreview();

    showModal(
      'modal-produto'
    );

    setTimeout(
      () =>
        $('produto-nome')
          ?.focus(),
      50
    );
  }

  function editProduct(id) {
    const product =
      products.find(
        p =>
          p.id === id
      );

    if (!product) return;

    editingProductId =
      id;

    pendingImage =
      product.image || '';

    $('produto-modal-title')
      .textContent =
      'Editar Produto';

    $('produto-salvar')
      .textContent =
      'Salvar Alterações';

    $('produto-nome')
      .value =
      product.name || '';

    $('produto-preco')
      .value =
      product.price || '';

    $('produto-preco-promocional')
      .value =
      product.salePrice || '';

    $('produto-estoque')
      .value =
      product.stock ?? 0;

    $('produto-descricao')
      .value =
      product.description || '';

    $('produto-publicado')
      .checked =
      product.active !== false;

    refreshCategorySelects(
      product.category || ''
    );

    document
      .querySelectorAll(
        '.produto-tamanho'
      )
      .forEach(
        el => {
          el.checked =
            Array.isArray(
              product.sizes
            )
            &&
            product.sizes
              .includes(
                el.value
              );
        }
      );

    updatePreview();

    showModal(
      'modal-produto'
    );
  }

  function saveProduct() {
    const name =
      $('produto-nome')
        .value
        .trim();

    const price =
      Number(
        $('produto-preco')
          .value
      );

    const salePrice =
      Number(
        $('produto-preco-promocional')
          .value
        ||
        0
      );

    const stock =
      Math.max(
        0,
        Number.parseInt(
          $('produto-estoque')
            .value
          ||
          '0',
          10
        )
      );

    if (!name) {
      toast(
        'Digite o nome do produto. ⚠️'
      );

      $('produto-nome')
        .focus();

      return;
    }

    if (
      !Number.isFinite(price)
      ||
      price <= 0
    ) {
      toast(
        'Digite um preço válido. ⚠️'
      );

      $('produto-preco')
        .focus();

      return;
    }

    if (
      salePrice > 0
      &&
      salePrice >= price
    ) {
      toast(
        'O preço promocional deve ser menor que o preço normal. ⚠️'
      );

      return;
    }

    const sizes =
      [
        ...document
          .querySelectorAll(
            '.produto-tamanho:checked'
          )
      ]
      .map(
        el =>
          el.value
      );

    const data = {
      name,
      price,
      salePrice,
      stock,

      category:
        $('produto-categoria')
          .value
        ||
        'Sem categoria',

      description:
        $('produto-descricao')
          .value
          .trim(),

      image:
        pendingImage,

      sizes,

      active:
        $('produto-publicado')
          .checked,

      updatedAt:
        new Date()
          .toISOString()
    };

    if (editingProductId) {
      const index =
        products.findIndex(
          p =>
            p.id ===
            editingProductId
        );

      if (index >= 0) {
        products[index] = {
          ...products[index],
          ...data
        };
      }

      toast(
        'Produto atualizado! ✅'
      );

    } else {
      const id =
        uid('prod');

      products.unshift({
        id,

        sku:
          `${
            slugify(name)
              .toUpperCase()
              .slice(0, 12)
            ||
            'PROD'
          }-${
            id
              .slice(-4)
              .toUpperCase()
          }`,

        createdAt:
          new Date()
            .toISOString(),

        ...data
      });

      toast(
        'Produto criado! ✅'
      );
    }

    save(
      KEYS.products,
      products
    );

    hideModal(
      'modal-produto'
    );

    renderProducts();

    renderCategories();
  }

  function deleteProduct(id) {
    const product =
      products.find(
        p =>
          p.id === id
      );

    if (!product) return;

    if (
      !confirm(
        `Excluir "${product.name}"?`
      )
    ) {
      return;
    }

    products =
      products.filter(
        p =>
          p.id !== id
      );

    save(
      KEYS.products,
      products
    );

    renderProducts();

    renderCategories();

    toast(
      'Produto excluído.'
    );
  }

  function renderProducts() {
    const tbody =
      $('produtos-tbody');

    if (!tbody) return;

    const query =
      String(
        $('produto-busca')
          ?.value
        ||
        ''
      )
      .toLowerCase()
      .trim();

    const category =
      $('produto-filtro-categoria')
        ?.value
      ||
      '';

    const visible =
      products.filter(
        p => {
          const text =
            `${p.name} ${p.sku} ${p.category}`
              .toLowerCase();

          return (
            (
              !query
              ||
              text.includes(query)
            )
            &&
            (
              !category
              ||
              p.category === category
            )
          );
        }
      );

    tbody.innerHTML =
      visible.length

      ?

      visible
        .map(
          p => {
            const displayPrice =
              p.salePrice > 0
              ?
              p.salePrice
              :
              p.price;

            const statusText =
              p.active === false
              ?
              'Inativo'
              :
              (
                Number(p.stock) <= 0
                ?
                'Sem estoque'
                :
                'Ativo'
              );

            const statusClass =
              p.active === false
              ?
              'badge--gray'
              :
              (
                Number(p.stock) <= 0
                ?
                'badge--red'
                :
                'badge--green'
              );

            const image =
              p.image

              ?

              `
                <img
                  src="${esc(p.image)}"
                  alt="${esc(p.name)}"
                  style="
                    width:46px;
                    height:58px;
                    object-fit:cover;
                    border-radius:8px;
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
                        ${esc(p.name)}
                      </strong>

                      ${
                        p.description

                        ?

                        `
                          <div
                            style="
                              font-size:11px;
                              color:var(--text-light);
                              max-width:240px;
                              overflow:hidden;
                              text-overflow:ellipsis;
                              white-space:nowrap;
                            "
                          >
                            ${esc(p.description)}
                          </div>
                        `

                        :

                        ''
                      }

                    </div>

                  </div>

                </td>

                <td>
                  <code>
                    ${esc(p.sku)}
                  </code>
                </td>

                <td>
                  ${esc(
                    p.category
                    ||
                    'Sem categoria'
                  )}
                </td>

                <td>

                  <strong>
                    ${money(displayPrice)}
                  </strong>

                  ${
                    p.salePrice > 0

                    ?

                    `
                      <div
                        style="
                          font-size:11px;
                          color:var(--text-light);
                          text-decoration:line-through;
                        "
                      >
                        ${money(p.price)}
                      </div>
                    `

                    :

                    ''
                  }

                </td>

                <td>
                  ${Number(p.stock) || 0}
                </td>

                <td>

                  <span
                    class="badge ${statusClass}"
                  >
                    ${statusText}
                  </span>

                </td>

                <td class="action-btns">

                  <button
                    class="btn btn--ghost btn--icon"
                    data-edit-product="${esc(p.id)}"
                    title="Editar"
                  >
                    ✏️
                  </button>

                  <button
                    class="btn btn--ghost btn--icon"
                    data-delete-product="${esc(p.id)}"
                    title="Excluir"
                  >
                    🗑️
                  </button>

                </td>

              </tr>
            `;
          }
        )
        .join('')

      :

      emptyRow(
        7,
        products.length
        ?
        'Nenhum produto encontrado.'
        :
        'Nenhum produto cadastrado ainda.'
      );

    $('produtos-resumo')
      .textContent =
      `${visible.length} de ${products.length} produto${products.length === 1 ? '' : 's'}`;

    const badge =
      document.querySelector(
        '.sidebar__item[data-page="produtos"] .sidebar__item-badge'
      );

    if (badge) {
      badge.textContent =
        products.length;
    }

    tbody
      .querySelectorAll(
        '[data-edit-product]'
      )
      .forEach(
        btn =>
          btn.addEventListener(
            'click',
            () =>
              editProduct(
                btn.dataset
                  .editProduct
              )
          )
      );

    tbody
      .querySelectorAll(
        '[data-delete-product]'
      )
      .forEach(
        btn =>
          btn.addEventListener(
            'click',
            () =>
              deleteProduct(
                btn.dataset
                  .deleteProduct
              )
          )
      );
  }

  /* =========================================================
     CATEGORIAS
     ========================================================= */

  function rebuildCategoriesPage() {
    const page =
      $('page-categorias');

    if (!page) return;

    page.innerHTML = `

      <div class="page-header">

        <div>

          <h1 class="page-title">
            Categorias
          </h1>

          <p class="page-subtitle">
            Organize os produtos por categoria
          </p>

        </div>

        <div class="page-actions">

          <button
            class="btn btn--primary"
            id="btn-nova-categoria"
          >
            + Nova Categoria
          </button>

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

    $('btn-nova-categoria')
      .addEventListener(
        'click',
        openNewCategoryModal
      );
  }

  function createCategoryModal() {
    $('modal-categoria')
      ?.remove();

    const modal =
      document.createElement(
        'div'
      );

    modal.id =
      'modal-categoria';

    modal.className =
      'modal-overlay';

    modal.style.display =
      'none';

    modal.innerHTML = `

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
            id="categoria-fechar"
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
              id="categoria-nome"
              class="form-control"
              type="text"
            >

          </div>

          <div class="form-group">

            <label class="form-label">
              Slug
            </label>

            <input
              id="categoria-slug"
              class="form-control"
              type="text"
            >

          </div>

        </div>

        <div class="modal__footer">

          <button
            class="btn btn--outline"
            id="categoria-cancelar"
          >
            Cancelar
          </button>

          <button
            class="btn btn--primary"
            id="categoria-salvar"
          >
            Criar Categoria
          </button>

        </div>

      </div>
    `;

    modal.addEventListener(
      'click',
      e => {
        if (
          e.target === modal
        ) {
          hideModal(
            'modal-categoria'
          );
        }
      }
    );

    document.body
      .appendChild(modal);

    $('categoria-fechar')
      .addEventListener(
        'click',
        () =>
          hideModal(
            'modal-categoria'
          )
      );

    $('categoria-cancelar')
      .addEventListener(
        'click',
        () =>
          hideModal(
            'modal-categoria'
          )
      );

    $('categoria-salvar')
      .addEventListener(
        'click',
        saveCategory
      );
  }

  function openNewCategoryModal() {
    editingCategoryId =
      null;

    $('categoria-modal-title')
      .textContent =
      'Nova Categoria';

    $('categoria-salvar')
      .textContent =
      'Criar Categoria';

    $('categoria-nome')
      .value =
      '';

    $('categoria-slug')
      .value =
      '';

    showModal(
      'modal-categoria'
    );
  }

  function editCategory(id) {
    const c =
      categories.find(
        x =>
          x.id === id
      );

    if (!c) return;

    editingCategoryId =
      id;

    $('categoria-modal-title')
      .textContent =
      'Editar Categoria';

    $('categoria-salvar')
      .textContent =
      'Salvar Alterações';

    $('categoria-nome')
      .value =
      c.name;

    $('categoria-slug')
      .value =
      c.slug;

    showModal(
      'modal-categoria'
    );
  }

  function saveCategory() {
    const name =
      $('categoria-nome')
        .value
        .trim();

    const slug =
      slugify(
        $('categoria-slug')
          .value
          .trim()
        ||
        name
      );

    if (!name) {
      return toast(
        'Digite o nome da categoria. ⚠️'
      );
    }

    if (!slug) {
      return toast(
        'Slug inválido. ⚠️'
      );
    }

    const duplicate =
      categories.some(
        c =>
          c.id !==
          editingCategoryId
          &&
          (
            c.name
              .toLowerCase()
            ===
            name
              .toLowerCase()
            ||
            c.slug === slug
          )
      );

    if (duplicate) {
      return toast(
        'Essa categoria já existe. ⚠️'
      );
    }

    if (editingCategoryId) {
      const index =
        categories.findIndex(
          c =>
            c.id ===
            editingCategoryId
        );

      if (index >= 0) {
        const oldName =
          categories[index]
            .name;

        categories[index] = {
          ...categories[index],
          name,
          slug
        };

        if (
          oldName !== name
        ) {
          products =
            products.map(
              p =>
                p.category ===
                oldName
                ?
                {
                  ...p,
                  category: name
                }
                :
                p
            );

          save(
            KEYS.products,
            products
          );
        }
      }

      toast(
        'Categoria atualizada! ✅'
      );

    } else {
      categories.push({
        id:
          uid('cat'),
        name,
        slug
      });

      toast(
        'Categoria criada! ✅'
      );
    }

    save(
      KEYS.categories,
      categories
    );

    hideModal(
      'modal-categoria'
    );

    refreshCategorySelects();

    renderCategories();

    renderProducts();
  }

  function deleteCategory(id) {
    const c =
      categories.find(
        x =>
          x.id === id
      );

    if (!c) return;

    const used =
      products.filter(
        p =>
          p.category ===
          c.name
      )
      .length;

    if (used) {
      return toast(
        `Essa categoria está sendo usada por ${used} produto${used === 1 ? '' : 's'}. ⚠️`
      );
    }

    if (
      !confirm(
        `Excluir a categoria "${c.name}"?`
      )
    ) {
      return;
    }

    categories =
      categories.filter(
        x =>
          x.id !== id
      );

    save(
      KEYS.categories,
      categories
    );

    refreshCategorySelects();

    renderCategories();

    toast(
      'Categoria excluída.'
    );
  }

  function renderCategories() {
    const tbody =
      $('categorias-tbody');

    if (!tbody) return;

    tbody.innerHTML =
      categories.length

      ?

      categories
        .map(
          c => {
            const count =
              products.filter(
                p =>
                  p.category ===
                  c.name
              )
              .length;

            return `

              <tr>

                <td>
                  <strong>
                    ${esc(c.name)}
                  </strong>
                </td>

                <td>
                  <code>
                    /${esc(c.slug)}
                  </code>
                </td>

                <td>
                  ${count}
                </td>

                <td class="action-btns">

                  <button
                    class="btn btn--ghost btn--icon"
                    data-edit-category="${esc(c.id)}"
                  >
                    ✏️
                  </button>

                  <button
                    class="btn btn--ghost btn--icon"
                    data-delete-category="${esc(c.id)}"
                  >
                    🗑️
                  </button>

                </td>

              </tr>
            `;
          }
        )
        .join('')

      :

      emptyRow(
        4,
        'Nenhuma categoria cadastrada ainda.'
      );

    tbody
      .querySelectorAll(
        '[data-edit-category]'
      )
      .forEach(
        btn =>
          btn.addEventListener(
            'click',
            () =>
              editCategory(
                btn.dataset
                  .editCategory
              )
          )
      );

    tbody
      .querySelectorAll(
        '[data-delete-category]'
      )
      .forEach(
        btn =>
          btn.addEventListener(
            'click',
            () =>
              deleteCategory(
                btn.dataset
                  .deleteCategory
              )
          )
      );
  }

  /* =========================================================
     COLEÇÕES
     ========================================================= */

  function rebuildCollectionsPage() {
    const page =
      $('page-colecoes');

    if (!page) return;

    page.innerHTML = `

      <div class="page-header">

        <div>

          <h1 class="page-title">
            Coleções
          </h1>

          <p class="page-subtitle">
            Agrupe produtos em coleções
          </p>

        </div>

        <div class="page-actions">

          <button
            class="btn btn--primary"
            id="btn-nova-colecao"
          >
            + Nova Coleção
          </button>

        </div>

      </div>

      <div class="card">

        <div class="orders-table-wrap">

          <table class="data-table">

            <thead>
              <tr>
                <th>Coleção</th>
                <th>Produtos</th>
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

    $('btn-nova-colecao')
      .addEventListener(
        'click',
        openNewCollectionModal
      );
  }

  function createCollectionModal() {
    $('modal-colecao')
      ?.remove();

    const modal =
      document.createElement(
        'div'
      );

    modal.id =
      'modal-colecao';

    modal.className =
      'modal-overlay';

    modal.style.display =
      'none';

    modal.innerHTML = `

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
            id="colecao-fechar"
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
              id="colecao-nome"
              class="form-control"
              type="text"
            >

          </div>

          <div class="form-group">

            <label class="form-label">
              Status
            </label>

            <select
              id="colecao-status"
              class="form-control"
            >

              <option
                value="publicada"
              >
                Publicada
              </option>

              <option
                value="rascunho"
              >
                Rascunho
              </option>

            </select>

          </div>

        </div>

        <div class="modal__footer">

          <button
            class="btn btn--outline"
            id="colecao-cancelar"
          >
            Cancelar
          </button>

          <button
            class="btn btn--primary"
            id="colecao-salvar"
          >
            Criar Coleção
          </button>

        </div>

      </div>
    `;

    modal.addEventListener(
      'click',
      e => {
        if (
          e.target === modal
        ) {
          hideModal(
            'modal-colecao'
          );
        }
      }
    );

    document.body
      .appendChild(modal);

    $('colecao-fechar')
      .addEventListener(
        'click',
        () =>
          hideModal(
            'modal-colecao'
          )
      );

    $('colecao-cancelar')
      .addEventListener(
        'click',
        () =>
          hideModal(
            'modal-colecao'
          )
      );

    $('colecao-salvar')
      .addEventListener(
        'click',
        saveCollection
      );
  }

  function openNewCollectionModal() {
    editingCollectionId =
      null;

    $('colecao-modal-title')
      .textContent =
      'Nova Coleção';

    $('colecao-salvar')
      .textContent =
      'Criar Coleção';

    $('colecao-nome')
      .value =
      '';

    $('colecao-status')
      .value =
      'publicada';

    showModal(
      'modal-colecao'
    );
  }

  function editCollection(id) {
    const c =
      collections.find(
        x =>
          x.id === id
      );

    if (!c) return;

    editingCollectionId =
      id;

    $('colecao-modal-title')
      .textContent =
      'Editar Coleção';

    $('colecao-salvar')
      .textContent =
      'Salvar Alterações';

    $('colecao-nome')
      .value =
      c.name;

    $('colecao-status')
      .value =
      c.status
      ||
      'publicada';

    showModal(
      'modal-colecao'
    );
  }

  function saveCollection() {
    const name =
      $('colecao-nome')
        .value
        .trim();

    const status =
      $('colecao-status')
        .value;

    if (!name) {
      return toast(
        'Digite o nome da coleção. ⚠️'
      );
    }

    if (editingCollectionId) {
      const index =
        collections.findIndex(
          c =>
            c.id ===
            editingCollectionId
        );

      if (index >= 0) {
        collections[index] = {
          ...collections[index],
          name,
          status
        };
      }

      toast(
        'Coleção atualizada! ✅'
      );

    } else {
      collections.unshift({
        id:
          uid('col'),
        name,
        status,
        productIds: []
      });

      toast(
        'Coleção criada! ✅'
      );
    }

    save(
      KEYS.collections,
      collections
    );

    hideModal(
      'modal-colecao'
    );

    renderCollections();
  }

  function deleteCollection(id) {
    const c =
      collections.find(
        x =>
          x.id === id
      );

    if (!c) return;

    if (
      !confirm(
        `Excluir a coleção "${c.name}"?`
      )
    ) {
      return;
    }

    collections =
      collections.filter(
        x =>
          x.id !== id
      );

    save(
      KEYS.collections,
      collections
    );

    renderCollections();

    toast(
      'Coleção excluída.'
    );
  }

  function renderCollections() {
    const tbody =
      $('colecoes-tbody');

    if (!tbody) return;

    tbody.innerHTML =
      collections.length

      ?

      collections
        .map(
          c => {
            const count =
              Array.isArray(
                c.productIds
              )
              ?
              c.productIds.length
              :
              0;

            const badge =
              c.status ===
              'publicada'
              ?
              'badge--green'
              :
              'badge--yellow';

            const label =
              c.status ===
              'publicada'
              ?
              'Publicada'
              :
              'Rascunho';

            return `

              <tr>

                <td>
                  <strong>
                    ${esc(c.name)}
                  </strong>
                </td>

                <td>
                  ${count}
                </td>

                <td>

                  <span
                    class="badge ${badge}"
                  >
                    ${label}
                  </span>

                </td>

                <td class="action-btns">

                  <button
                    class="btn btn--ghost btn--icon"
                    data-edit-collection="${esc(c.id)}"
                  >
                    ✏️
                  </button>

                  <button
                    class="btn btn--ghost btn--icon"
                    data-delete-collection="${esc(c.id)}"
                  >
                    🗑️
                  </button>

                </td>

              </tr>
            `;
          }
        )
        .join('')

      :

      emptyRow(
        4,
        'Nenhuma coleção cadastrada ainda.'
      );

    tbody
      .querySelectorAll(
        '[data-edit-collection]'
      )
      .forEach(
        btn =>
          btn.addEventListener(
            'click',
            () =>
              editCollection(
                btn.dataset
                  .editCollection
              )
          )
      );

    tbody
      .querySelectorAll(
        '[data-delete-collection]'
      )
      .forEach(
        btn =>
          btn.addEventListener(
            'click',
            () =>
              deleteCollection(
                btn.dataset
                  .deleteCollection
              )
          )
      );
  }

  /* =========================================================
     PEDIDOS
     ========================================================= */

  function rebuildOrdersPage() {
    const page =
      $('page-pedidos');

    if (!page) return;

    page.innerHTML = `

      <div class="page-header">

        <div>

          <h1 class="page-title">
            Pedidos
          </h1>

          <p class="page-subtitle">
            Aqui aparecerão os pedidos reais da loja
          </p>

        </div>

      </div>

      <div class="stats-grid">

        <div
          class="stat-card stat-card--pink"
        >

          <div class="stat-card__top">

            <span
              class="stat-card__label"
            >
              Total de pedidos
            </span>

          </div>

          <div
            class="stat-card__value"
            id="pedidos-total"
          >
            0
          </div>

        </div>

        <div
          class="stat-card stat-card--green"
        >

          <div class="stat-card__top">

            <span
              class="stat-card__label"
            >
              Receita
            </span>

          </div>

          <div
            class="stat-card__value"
            id="pedidos-receita"
          >
            R$ 0,00
          </div>

        </div>

      </div>

      <div
        class="card"
        style="margin-top:20px;"
      >

        <div class="orders-table-wrap">

          <table class="data-table">

            <thead>

              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Status</th>
                <th>Data</th>
              </tr>

            </thead>

            <tbody
              id="pedidos-tbody"
            ></tbody>

          </table>

        </div>

      </div>
    `;

    renderOrders();
  }

  function renderOrders() {
    const tbody =
      $('pedidos-tbody');

    if (!tbody) return;

    tbody.innerHTML =
      orders.length

      ?

      orders
        .map(
          o => `

            <tr>

              <td>
                <strong>
                  ${esc(
                    o.number
                    ||
                    o.id
                  )}
                </strong>
              </td>

              <td>
                ${esc(
                  o.customer
                  ||
                  'Cliente'
                )}
              </td>

              <td>
                ${money(
                  o.total
                )}
              </td>

              <td>
                ${esc(
                  o.status
                  ||
                  'Aguardando'
                )}
              </td>

              <td>
                ${esc(
                  o.date
                  ||
                  ''
                )}
              </td>

            </tr>
          `
        )
        .join('')

      :

      emptyRow(
        5,
        'Nenhum pedido real recebido ainda.'
      );

    if (
      $('pedidos-total')
    ) {
      $('pedidos-total')
        .textContent =
        orders.length;
    }

    const revenue =
      orders.reduce(
        (
          sum,
          o
        ) =>
          sum +
          Number(
            o.total || 0
          ),
        0
      );

    if (
      $('pedidos-receita')
    ) {
      $('pedidos-receita')
        .textContent =
        money(
          revenue
        );
    }

    const badge =
      document.querySelector(
        '.sidebar__item[data-page="pedidos"] .sidebar__item-badge'
      );

    if (badge) {
      badge.textContent =
        orders.length;
    }

    const dashboardValues =
      document.querySelectorAll(
        '#page-dashboard .stat-card__value'
      );

    if (
      dashboardValues[0]
    ) {
      dashboardValues[0]
        .textContent =
        money(revenue);
    }

    if (
      dashboardValues[1]
    ) {
      dashboardValues[1]
        .textContent =
        orders.length;
    }

    if (
      dashboardValues[2]
    ) {
      dashboardValues[2]
        .textContent =
        money(
          orders.length
          ?
          revenue /
          orders.length
          :
          0
        );
    }

    const recent =
      $('dashboard-orders-tbody');

    if (recent) {
      recent.innerHTML =
        orders.length

        ?

        orders
          .slice(
            0,
            5
          )
          .map(
            o => `

              <tr>

                <td>
                  <strong>
                    ${esc(
                      o.number
                      ||
                      o.id
                    )}
                  </strong>
                </td>

                <td>
                  ${esc(
                    o.customer
                    ||
                    'Cliente'
                  )}
                </td>

                <td>
                  —
                </td>

                <td>
                  ${money(
                    o.total
                  )}
                </td>

                <td>
                  ${esc(
                    o.status
                    ||
                    'Aguardando'
                  )}
                </td>

                <td>
                  ${esc(
                    o.date
                    ||
                    ''
                  )}
                </td>

                <td></td>

              </tr>
            `
          )
          .join('')

        :

        emptyRow(
          7,
          'Nenhum pedido recebido ainda.'
        );
    }
  }

  /* =========================================================
     CLIENTES
     ========================================================= */

  function rebuildClientsPage() {
    const page =
      $('page-clientes');

    if (!page) return;

    page.innerHTML = `

      <div class="page-header">

        <div>

          <h1 class="page-title">
            Clientes
          </h1>

          <p class="page-subtitle">
            Clientes reais aparecerão aqui quando houver pedidos
          </p>

        </div>

      </div>

      <div class="stats-grid">

        <div
          class="stat-card stat-card--pink"
        >

          <div class="stat-card__top">

            <span
              class="stat-card__label"
            >
              Total de clientes
            </span>

          </div>

          <div
            class="stat-card__value"
            id="clientes-total"
          >
            0
          </div>

        </div>

      </div>

      <div
        class="card"
        style="margin-top:20px;"
      >

        <div class="orders-table-wrap">

          <table class="data-table">

            <thead>

              <tr>
                <th>Cliente</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Pedidos</th>
                <th>Total gasto</th>
              </tr>

            </thead>

            <tbody
              id="clientes-tbody"
            ></tbody>

          </table>

        </div>

      </div>
    `;

    renderClients();
  }

  function renderClients() {
    const tbody =
      $('clientes-tbody');

    if (!tbody) return;

    tbody.innerHTML =
      clients.length

      ?

      clients
        .map(
          c => `

            <tr>

              <td>
                <strong>
                  ${esc(c.name)}
                </strong>
              </td>

              <td>
                ${esc(
                  c.email
                  ||
                  '—'
                )}
              </td>

              <td>
                ${esc(
                  c.phone
                  ||
                  '—'
                )}
              </td>

              <td>
                ${Number(
                  c.orders || 0
                )}
              </td>

              <td>
                ${money(
                  c.totalSpent || 0
                )}
              </td>

            </tr>
          `
        )
        .join('')

      :

      emptyRow(
        5,
        'Nenhum cliente real cadastrado ainda.'
      );

    if (
      $('clientes-total')
    ) {
      $('clientes-total')
        .textContent =
        clients.length;
    }

    const dashboardValues =
      document.querySelectorAll(
        '#page-dashboard .stat-card__value'
      );

    if (
      dashboardValues[3]
    ) {
      dashboardValues[3]
        .textContent =
        clients.length;
    }
  }

  /* =========================================================
     ANÁLISES
     ========================================================= */

  function clearAnalyticsFakeData() {
    const page =
      $('page-analiticas');

    if (!page) return;

    page.innerHTML = `

      <div class="page-header">

        <div>

          <h1 class="page-title">
            Análises
          </h1>

          <p class="page-subtitle">
            As métricas aparecerão conforme a loja tiver dados reais
          </p>

        </div>

      </div>

      <div class="stats-grid">

        <div
          class="stat-card stat-card--pink"
        >

          <div class="stat-card__top">

            <span
              class="stat-card__label"
            >
              Visitantes
            </span>

          </div>

          <div class="stat-card__value">
            0
          </div>

        </div>

        <div
          class="stat-card stat-card--green"
        >

          <div class="stat-card__top">

            <span
              class="stat-card__label"
            >
              Conversões
            </span>

          </div>

          <div class="stat-card__value">
            0
          </div>

        </div>

        <div
          class="stat-card stat-card--orange"
        >

          <div class="stat-card__top">

            <span
              class="stat-card__label"
            >
              Receita
            </span>

          </div>

          <div class="stat-card__value">
            R$ 0,00
          </div>

        </div>

      </div>

      <div
        class="card"
        style="margin-top:20px;"
      >

        <div
          class="card-body"
          style="
            text-align:center;
            color:var(--text-light);
            padding:50px 20px;
          "
        >
          Sem dados reais suficientes para gerar análises.
        </div>

      </div>
    `;
  }

  /* =========================================================
     AFILIADOS
     ========================================================= */

  function clearAffiliatesFakeData() {
    const page =
      $('page-afiliados');

    if (!page) return;

    page.innerHTML = `

      <div class="page-header">

        <div>

          <h1 class="page-title">
            Afiliados
          </h1>

          <p class="page-subtitle">
            Nenhum afiliado cadastrado
          </p>

        </div>

      </div>

      <div class="card">

        <div
          class="card-body"
          style="
            text-align:center;
            color:var(--text-light);
            padding:50px 20px;
          "
        >
          Nenhum dado de afiliado.
        </div>

      </div>
    `;
  }

  /* =========================================================
     COMUNICAÇÕES
     ========================================================= */

  function clearCommunicationsFakeData() {
    const page =
      $('page-comunicacoes');

    if (!page) return;

    page.innerHTML = `

      <div class="page-header">

        <div>

          <h1 class="page-title">
            Comunicações
          </h1>

          <p class="page-subtitle">
            Campanhas reais aparecerão aqui
          </p>

        </div>

      </div>

      <div class="card">

        <div
          class="card-body"
          style="
            text-align:center;
            color:var(--text-light);
            padding:50px 20px;
          "
        >
          Nenhuma campanha enviada ainda.
        </div>

      </div>
    `;
  }

  /* =========================================================
     INICIALIZAÇÃO
     ========================================================= */

  function init() {
    resetDashboardFakeData();

    rebuildProductsPage();

    createProductModal();

    rebuildCategoriesPage();

    createCategoryModal();

    rebuildCollectionsPage();

    createCollectionModal();

    rebuildOrdersPage();

    rebuildClientsPage();

    clearAnalyticsFakeData();

    clearAffiliatesFakeData();

    clearCommunicationsFakeData();

    refreshCategorySelects();

    renderProducts();

    renderCategories();

    renderCollections();

    renderOrders();

    renderClients();
  }

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      init
    );

  } else {
    init();
  }

})();
