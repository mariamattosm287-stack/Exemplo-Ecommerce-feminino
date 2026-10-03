/* ========================================
   ESSENCE ADMIN PANEL — JavaScript
   ======================================== */

const SUPABASE_URL = 'https://gtmjxwcvqvtkuqzkvfsh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_zBG1ioEJeME73TQtHhQnlw_eGhOasAc';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let productsData = [];
let currentProductId = null;

document.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  renderRevenueChart();
  checkMobile();

  window.addEventListener('resize', checkMobile);

  await loadProducts();
});


/* ========================================
   NAVIGATION
   ======================================== */

function initNavigation() {
  const hash = window.location.hash.replace('#', '');

  if (hash) {
    navigate(hash, false);
  }

  window.addEventListener('hashchange', () => {
    const newHash = window.location.hash.replace('#', '');

    if (newHash) {
      navigate(newHash, false);
    }
  });
}


function navigate(page, updateHash = true) {
  document
    .querySelectorAll('.page-content')
    .forEach(p => p.classList.remove('active'));

  const target = document.getElementById('page-' + page);

  if (target) {
    target.classList.add('active');
  }

  document
    .querySelectorAll('.sidebar__item')
    .forEach(item => {
      item.classList.toggle(
        'active',
        item.dataset.page === page
      );
    });

  const names = {
    dashboard: 'Dashboard',
    produtos: 'Produtos',
    categorias: 'Categorias',
    colecoes: 'Coleções',
    pedidos: 'Pedidos',
    clientes: 'Clientes',
    cupons: 'Cupons',
    analiticas: 'Análises',
    afiliados: 'Afiliados',
    comunicacoes: 'Comunicações',
    configuracoes: 'Configurações'
  };

  const bc = document.querySelector('.topbar__breadcrumb');

  if (bc) {
    bc.innerHTML = `Admin / <span>${names[page] || page}</span>`;
  }

  if (updateHash) {
    history.replaceState(null, '', '#' + page);
  }

  document
    .getElementById('sidebar')
    ?.classList.remove('open');

  document
    .querySelector('.admin-main')
    ?.scrollTo(0, 0);

  window.scrollTo(0, 0);
}


/* ========================================
   REVENUE CHART
   ======================================== */

function renderRevenueChart() {
  const container = document.getElementById('revenue-chart');

  if (!container) return;

  const data = [
    { month: 'Jan', value: 0 },
    { month: 'Fev', value: 0 },
    { month: 'Mar', value: 0 },
    { month: 'Abr', value: 0 },
    { month: 'Mai', value: 0 },
    { month: 'Jun', value: 0 },
    { month: 'Jul', value: 0 },
    { month: 'Ago', value: 0 },
    { month: 'Set', value: 0 },
    { month: 'Out', value: 0 },
    { month: 'Nov', value: 0 },
    { month: 'Dez', value: 0 }
  ];

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const chartHeight = 200;

  container.innerHTML = '';

  container.style.display = 'flex';
  container.style.alignItems = 'flex-end';
  container.style.gap = '8px';
  container.style.padding = '20px 20px 0';
  container.style.height = '260px';

  data.forEach(d => {
    const group = document.createElement('div');

    group.className = 'chart-bar-group';

    group.style.flex = '1';
    group.style.display = 'flex';
    group.style.flexDirection = 'column';
    group.style.alignItems = 'center';
    group.style.gap = '6px';
    group.style.height = '100%';
    group.style.justifyContent = 'flex-end';

    const heightPct =
      d.value > 0
        ? (d.value / maxVal) * chartHeight
        : 4;

    const bar = document.createElement('div');

    bar.className = 'chart-bar';
    bar.style.width = '100%';
    bar.style.height = heightPct + 'px';
    bar.style.background = '#f4f0ec';
    bar.style.borderRadius = '6px 6px 0 0';

    const label = document.createElement('div');

    label.className = 'chart-label';
    label.textContent = d.month;
    label.style.fontSize = '11px';
    label.style.color = '#8a7a6f';
    label.style.fontWeight = '500';

    group.appendChild(bar);
    group.appendChild(label);

    container.appendChild(group);
  });
}


/* ========================================
   PRODUCTS — SUPABASE
   ======================================== */

async function loadProducts() {
  const tbody = document.getElementById('produtos-tbody');

  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="8" style="text-align:center;padding:40px;">
        Carregando produtos...
      </td>
    </tr>
  `;

  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('created_at', {
      ascending: false
    });

  if (error) {
    console.error('Erro ao carregar produtos:', error);

    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;padding:40px;">
          Não foi possível carregar os produtos.
        </td>
      </tr>
    `;

    showToast('Erro ao carregar produtos ❌');

    return;
  }

  productsData = data || [];

  renderProductsTable();
}


/* ========================================
   PRODUCTS TABLE
   ======================================== */

function renderProductsTable() {
  const tbody = document.getElementById('produtos-tbody');

  if (!tbody) return;

  if (!productsData.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;padding:50px;">
          <strong>Nenhum produto cadastrado.</strong>
          <br>
          <span style="color:#8a7a6f;">
            Cadastre seu primeiro produto pelo botão de adicionar.
          </span>
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = productsData.map(product => {

    const stock = Number(product.stock || 0);

    const price = Number(product.price || 0)
      .toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });

    const image = product.image_url ||
      '../assets/images/product-1.jpg';

    let status = product.status;

    if (stock === 0 && status === 'active') {
      status = 'out';
    }

    let statusBadge = '';

    if (status === 'active') {
      statusBadge =
        '<span class="badge badge--green">Ativo</span>';

    } else if (status === 'draft') {
      statusBadge =
        '<span class="badge badge--gray">Rascunho</span>';

    } else {
      statusBadge =
        '<span class="badge badge--red">Sem estoque</span>';
    }

    return `
      <tr>

        <td>
          <input
            type="checkbox"
            value="${product.id}"
          >
        </td>

        <td>
          <div class="product-info-cell">

            <img
              class="product-thumb"
              src="${escapeHtml(image)}"
              alt="${escapeHtml(product.name || 'Produto')}"
              onerror="this.src='../assets/images/product-1.jpg'"
            >

            <div>
              <div class="product-cell-name">
                ${escapeHtml(product.name || 'Sem nome')}
              </div>

              <div class="product-cell-sku">
                ${escapeHtml(product.sku || 'Sem SKU')}
              </div>
            </div>

          </div>
        </td>

        <td>
          ${escapeHtml(product.sku || '-')}
        </td>

        <td>
          ${escapeHtml(product.category || '-')}
        </td>

        <td>
          <strong>${price}</strong>
        </td>

        <td>
          <span
            style="
              color:${
                stock === 0
                  ? '#a45d52'
                  : stock < 20
                    ? '#a27d4f'
                    : '#5f7968'
              };
              font-weight:600;
            "
          >
            ${
              stock === 0
                ? 'Esgotado'
                : stock + ' un.'
            }
          </span>
        </td>

        <td>
          ${statusBadge}
        </td>

        <td class="action-btns">

          <button
            class="btn btn--ghost btn--icon"
            title="Editar"
            onclick="editProduct('${product.id}')"
          >
            ✏️
          </button>

          <button
            class="btn btn--ghost btn--icon"
            title="Ver na loja"
            onclick="viewProduct('${product.id}')"
          >
            🔗
          </button>

          <button
            class="btn btn--ghost btn--icon"
            title="Excluir"
            style="color:var(--danger);"
            onclick="deleteProduct('${product.id}')"
          >
            🗑️
          </button>

        </td>

      </tr>
    `;
  }).join('');
}


/* ========================================
   EDIT PRODUCT
   ======================================== */

function editProduct(id) {
  const product = productsData.find(
    item => item.id === id
  );

  if (!product) {
    showToast('Produto não encontrado ❌');
    return;
  }

  currentProductId = id;

  /*
    Abre o modal existente.
    Quando tivermos os IDs dos campos do formulário,
    podemos preencher automaticamente cada campo.
  */

  openModal('modal-produto');

  showToast(
    `Editando: ${product.name}`
  );
}


/* ========================================
   DELETE PRODUCT
   ======================================== */

async function deleteProduct(id) {
  const product = productsData.find(
    item => item.id === id
  );

  if (!product) {
    showToast('Produto não encontrado ❌');
    return;
  }

  const confirmed = confirm(
    `Tem certeza que deseja excluir "${product.name}"?`
  );

  if (!confirmed) return;

  const { error } = await supabaseClient
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir produto:', error);

    showToast(
      'Não foi possível excluir o produto ❌'
    );

    return;
  }

  productsData = productsData.filter(
    item => item.id !== id
  );

  renderProductsTable();

  showToast(
    'Produto excluído com sucesso ✓'
  );
}


/* ========================================
   VIEW PRODUCT
   ======================================== */

function viewProduct(id) {
  const product = productsData.find(
    item => item.id === id
  );

  if (!product) {
    showToast('Produto não encontrado ❌');
    return;
  }

  /*
    Por enquanto abrimos o product.html.
    Depois podemos criar a URL individual
    baseada no slug/id do produto.
  */

  window.open(
    `../product.html?id=${encodeURIComponent(product.id)}`,
    '_blank'
  );
}


/* ========================================
   MODAL
   ======================================== */

function openModal(id) {
  document
    .getElementById(id)
    ?.classList.add('open');

  document.body.style.overflow = 'hidden';
}


function closeModal(id) {
  document
    .getElementById(id)
    ?.classList.remove('open');

  document.body.style.overflow = '';

  currentProductId = null;
}


/* ========================================
   TOAST
   ======================================== */

function showToast(msg) {
  const toast = document.getElementById('toast');

  if (!toast) return;

  toast.textContent = msg;

  toast.style.transform = 'translateY(0)';
  toast.style.opacity = '1';

  setTimeout(() => {
    toast.style.transform = 'translateY(80px)';
    toast.style.opacity = '0';
  }, 3000);
}


/* ========================================
   ORDER FILTER
   ======================================== */

function filterOrders(status) {
  const table =
    document.querySelector(
      '#page-pedidos .data-table tbody'
    );

  if (!table) return;

  const rows = table.querySelectorAll('tr');

  let count = 0;

  rows.forEach(row => {
    const text =
      row.textContent.toLowerCase();

    let match = false;

    if (status === 'all') {
      match = true;

    } else if (status === 'preparando') {
      match =
        text.includes('preparo') ||
        text.includes('pendente');

    } else if (status === 'enviado') {
      match = text.includes('enviado');

    } else if (status === 'entregue') {
      match = text.includes('entregue');
    }

    if (match) {
      row.style.display = '';
      count++;
    } else {
      row.style.display = 'none';
    }
  });

  const labels = {
    all: 'Todos os pedidos',
    preparando: 'Pedidos em preparo',
    enviado: 'Pedidos enviados',
    entregue: 'Pedidos entregues'
  };

  showToast(
    `${labels[status] || status} (${count} encontrados) 📋`
  );
}


/* ========================================
   MOBILE
   ======================================== */

function checkMobile() {
  const toggle =
    document.getElementById('sidebar-toggle');

  if (!toggle) return;

  if (window.innerWidth <= 768) {
    toggle.style.display = 'flex';
  } else {
    toggle.style.display = 'none';

    document
      .getElementById('sidebar')
      ?.classList.remove('open');
  }
}


/* ========================================
   HTML ESCAPE
   ======================================== */

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


/* ========================================
   KEYBOARD
   ======================================== */

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document
      .querySelectorAll('.modal-overlay.open')
      .forEach(m => {
        m.classList.remove('open');
        document.body.style.overflow = '';
      });

    currentProductId = null;
  }
});
