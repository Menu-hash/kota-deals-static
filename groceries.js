// static/groceries.js
(() => {
  const API = '/api/groceries.json';
  const frame2 = document.getElementById('frame2');
  const frame1 = document.getElementById('frame1');
  const modalContent = document.getElementById('modalContent');
  const modalClose = document.getElementById('modalClose');
  const searchEl = document.getElementById('search');

  // Order form elements
  const orderForm = document.getElementById('orderForm');
  const userNameEl = document.getElementById('userName');
  const userContactEl = document.getElementById('userContact');
  const pickupToggle = document.getElementById('pickupToggle');
  const deliveryAddress = document.getElementById('deliveryAddress');
  const cancelForm = document.getElementById('cancelForm');
  const sendForm = document.getElementById('sendForm');

  let dataStore = { groceries: [] };
  let current = { item: null, store: null };
  let activeCategory = 'All';

  async function load() {
    try {
      const res = await fetch(API);
      dataStore = await res.json();
      console.log("Groceries data:", dataStore.groceries);
      renderGrid(dataStore.groceries);
    } catch (e) {
      frame2.innerHTML = '<div class="p-4">Failed to load data</div>';
      console.error("Error loading groceries:", e);
    }
  }

  function renderGrid(items) {
    const searchTerm = searchEl.value.toLowerCase();
    frame2.innerHTML = '';
    items.forEach(store => {
      store.deals.forEach(item => { // <-- fixed from items -> deals
        if (activeCategory !== 'All' && item.category !== activeCategory) return;
        if (searchTerm && !item.title.toLowerCase().includes(searchTerm) && !store.name.toLowerCase().includes(searchTerm)) return;

        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow cursor-pointer flex flex-col';
        card.innerHTML = `
          <div class="h-40 w-full bg-cover bg-center" style="background-image:url('${item.image}')"></div>
          ${item.promo_status ? `<div class="text-xs text-red-600 text-center mt-1">${item.promo_status}</div>` : ''}
          <div class="p-2 text-[10pt] text-gray-700 text-center">${store.name}</div>
        `;
        card.addEventListener('click', () => openDetail(item, store));
        frame2.appendChild(card);
      });
    });
  }

  function openDetail(item, store) {
    current.item = item;
    current.store = store;

    const price = item.discount_price && item.discount_price > 0 ? item.discount_price : item.original_price;
    let priceHtml = `<div class="mt-2 text-xl font-bold text-green-600">R${price}</div>`;
    if (item.discount_price && item.discount_price > 0) {
      priceHtml += `<div class="line-through text-gray-400">R${item.original_price}</div>`;
    }

    modalContent.innerHTML = `
      <div class="flex flex-col gap-4 p-4">
        <h2 class="font-bold text-xl text-center">${item.title}</h2>
        <div class="md:flex gap-4">
          <div class="md:w-1/2 h-40 bg-cover bg-center rounded" style="background-image:url('${item.image}')"></div>
          <div class="md:w-1/2 flex flex-col gap-2">
            <p class="text-gray-600">${item.description || ''}</p>
            <div class="text-gray-500 text-sm">Price: ${priceHtml}</div>
            <div class="mt-4 flex flex-col items-center gap-2">
              ${renderActionButtons(item, store)}
            </div>
          </div>
        </div>
      </div>
    `;

    frame1.classList.remove('hidden');
    modalContent.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', handleAction));
    modalClose.onclick = closeModal;
  }

  function renderActionButtons(item, store) {
    const buttons = [];
    const actionType = item.action_type;
    switch (actionType) {
      case 'claim':
        buttons.push(`<button data-action="claim_whatsapp" class="px-4 py-2 rounded bg-green-500 text-white font-bold">Claim via WhatsApp</button>`);
        break;
      case 'order':
        buttons.push(`<button data-action="order_whatsapp" class="px-4 py-2 rounded bg-green-500 text-white font-bold">Order via WhatsApp</button>`);
        break;
      case 'view_order':
        buttons.push(`<button data-action="view_order" class="px-4 py-2 rounded bg-gray-500 text-white font-bold">View Order</button>`);
        break;
      case 'claim_view':
        buttons.push(`<button data-action="claim_whatsapp" class="px-4 py-2 rounded bg-green-500 text-white font-bold">Claim</button>`);
        buttons.push(`<button data-action="view_order" class="px-4 py-2 rounded bg-gray-500 text-white font-bold">View</button>`);
        break;
    }
    return buttons.join('<br/>');
  }

  function handleAction(e) {
    const mode = e.currentTarget.getAttribute('data-action');
    if (!mode) return;
    const item = current.item;
    const store = current.store;
    if (!item || !store) return;

    if (mode.includes('order') || mode.includes('claim')) {
      orderForm.classList.remove('hidden');
      pickupToggle.checked = true;
      deliveryAddress.classList.add('hidden');

      cancelForm.onclick = () => orderForm.classList.add('hidden');

      sendForm.onclick = () => {
        const name = userNameEl.value.trim();
        const contact = userContactEl.value.trim();
        const address = deliveryAddress.value.trim();

        if (!name || !contact) { alert('Please enter your name and contact number'); return; }
        if (!pickupToggle.checked && !address) { alert('Please enter delivery address'); return; }

        let msg = `Hi ${store.name}, I want to ${mode.includes('claim') ? 'claim' : 'order'}: ${item.title} R${item.discount_price || item.original_price}`;
        msg += `. Name: ${name}, Contact: ${contact}`;
        if (!pickupToggle.checked) msg += `. Address: ${address}`;

        const num = store.whatsapp_number.replace(/[^0-9]/g, '');
        const url = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');

        orderForm.classList.add('hidden');
        closeModal();
      };
    }
  }

  function closeModal() {
    frame1.classList.add('hidden');
    modalContent.innerHTML = '';
    current = { item: null, store: null };
  }

  searchEl.addEventListener('input', () => renderGrid(dataStore.groceries));

  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('bg-orange-500'));
      btn.classList.add('bg-orange-500');
      activeCategory = btn.getAttribute('data-cat');
      renderGrid(dataStore.groceries);
    });
  });

  pickupToggle.addEventListener('change', () => {
    if (pickupToggle.checked) deliveryAddress.classList.add('hidden');
    else deliveryAddress.classList.remove('hidden');
  });

  load();
})();
