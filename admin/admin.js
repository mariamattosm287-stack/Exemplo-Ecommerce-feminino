/* ========================================
   ESSENCE ADMIN PANEL — JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  renderRevenueChart();
  renderProductsTable();
  checkMobile();
  window.addEventListener('resize', checkMobile);
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
    { month: 'Jan', value: 28000 },
    { month: 'Fev', value: 32000 },
    { month: 'Mar', value: 27000 },
    { month: 'Abr', value: 35000 },
    { month: 'Mai', value: 41000 },
    { month: 'Jun', value: 38000 },
    { month: 'Jul', value: 44000 },
    { month: 'Ago', value: 39000 },
    { month: 'Set', value: 48000 },
    { month: 'Out', value: 0 },
    { month: 'Nov', value: 0 },
    { month: 'Dez', value: 0 }
  ];

  const maxVal = Math.max(...data.map(d => d.value));
  const chartHeight = 200;

  container.innerHTML = '';

  container.style.display = 'flex';
  container.style.alignItems = 'flex-end';
  container.style.gap = '8px';
  container.style.padding = '20px 20px 0';
  container.style.height = '260px';

  data.forEach((d, i) => {
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

    const isPast = d.value > 0;

    const bar = document.createElement('div');

    bar.className = 'chart-bar';
    bar.style.width = '100%';
    bar.style.height = heightPct + 'px';

    /*
      ESSENCE:
      barras históricas em nude claro,
      mês atual em marrom sofisticado.
    */
    bar.style.background = isPast
      ? (
          i === 8
            ? 'linear-gradient(to top, #5a463a, #8b7160)'
            : '#e3d9d0'
        )
      : '#f4f0ec';

    bar.style.borderRadius = '6px 6px 0 0';
    bar.style.cursor = isPast ? 'pointer' : 'default';
    bar.style.transition = 'all 0.2s';

    bar.title = isPast
      ? `${d.month}: R$ ${d.value.toLocaleString('pt-BR')}`
      : '';

    if (isPast) {
      bar.addEventListener('mouseenter', () => {
        bar.style.opacity = '0.8';
      });

      bar.addEventListener('mouseleave', () => {
        bar.style.opacity = '1';
      });
    }

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
   PRODUCTS TABLE
   ======================================== */

const productsData = [
  {
    img: '../assets/images/product-1.jpg',
    name: 'High-Waist Training Leggings',
    sku: 'ESS-BTM-001',
    cat: 'Bottoms',
    price: 'R$ 49,00',
    stock: 124,
    status: 'active'
  },
  {
    img: '../assets/images/product-2.jpg',
    name: 'Ribbed Performance Leggings',
    sku: 'ESS-BTM-002',
    cat: 'Bottoms',
    price: 'R$ 58,00',
    stock: 87,
    status: 'active'
  },
  {
    img: '../assets/images/product-3.jpg',
    name: 'High-Rise Athletic Tights',
    sku: 'ESS-BTM-003',
    cat: 'Bottoms',
    price: 'R$ 61,00',
    stock: 43,
    status: 'active'
  },
  {
    img: '../assets/images/product-4.jpg',
    name: 'Full-Support Sports Bra',
    sku: 'ESS-TOP-001',
    cat: 'Tops',
    price: 'R$ 42,00',
    stock: 200,
    status: 'active'
  },
  {
    img: '../assets/images/product-5.jpg',
    name: 'Breathable Tank Top',
    sku: 'ESS-TOP-002',
    cat: 'Tops',
    price: 'R$ 35,00',
    stock: 0,
    status: 'out'
  },
  {
    img: '../assets/images/product-6.jpg',
    name: 'Seamless Yoga Set',
    sku: 'ESS-SET-001',
    cat: 'Bottoms',
    price: 'R$ 79,00',
    stock: 56,
    status: 'active'
  },
  {
    img: '../assets/images/product-1.jpg',
    name: 'Compression Training Shorts',
    sku: 'ESS-BTM-004',
    cat: 'Bottoms',
    price: 'R$ 38,00',
    stock: 32,
    status: 'draft'
  },
  {
    img: '../assets/images/product-3.jpg',
    name: 'Flex-Fit Crop Top',
    sku: 'ESS-TOP-003',
    cat: 'Tops',
    price: 'R$ 44,00',
    stock: 78,
    status: 'active'
  }
];

function renderProductsTable() {
  const tbody = document.getElementById('produtos-tbody');

  if (!tbody) return;

  tbody.innerHTML = productsData.map((p, i) => `
    <tr>
      <td>
        <input type="checkbox">
      </td>

      <td>
        <div class="product-info-cell">
          <img
            class="product-thumb"
            src="${p.img}"
            alt="${p.name}"
          >

          <div>
            <div class="product-cell-name">
              ${p.name}
            </div>

            <div class="product-cell-sku">
              ${p.sku}
            </div>
          </div>
        </div>
      </td>

      <td>${p.sku}</td>

      <td>${p.cat}</td>

      <td>
        <strong>${p.price}</strong>
      </td>

      <td>
        <span
          style="
            color:${
              p.stock === 0
                ? '#a45d52'
                : p.stock < 20
                  ? '#a27d4f'
                  : '#5f7968'
            };
            font-weight:600;
          "
        >
          ${
            p.stock === 0
              ? 'Esgotado'
              : p.stock + ' un.'
          }
        </span>
      </td>

      <td>
        ${
          p.status === 'active'
            ? '<span class="badge badge--green">Ativo</span>'
            : p.status === 'draft'
              ? '<span class="badge badge--gray">Rascunho</span>'
              : '<span class="badge badge--red">Sem estoque</span>'
        }
      </td>

      <td class="action-btns">

        <button
          class="btn btn--ghost btn--icon"
          title="Editar"
          onclick="openModal('modal-produto')"
        >
          ✏️
        </button>

        <button
          class="btn btn--ghost btn--icon"
          title="Ver na loja"
          onclick="window.open('../product.html','_blank')"
        >
          🔗
        </button>

        <button
          class="btn btn--ghost btn--icon"
          title="Excluir"
          style="color:var(--danger);"
          onclick="showToast('Produto excluído ❌')"
        >
          🗑️
        </button>

      </td>
    </tr>
  `).join('');
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
  }
});
