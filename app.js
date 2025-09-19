// static/app.js
(() => {
  const API = '/api/restaurants.json';
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

  let dataStore = { restaurants: [] };
  let current = { deal: null, restaurant: null };
  let activeCategory = 'All';

  // Load data
  async function load() {
    try {
      const res = await fetch(API);
      dataStore = await res.json();
      renderGrid(dataStore.restaurants);
    } catch (e) {
      frame2.innerHTML = '<div class="p-4">Failed to load data</div>';
      console.error(e);
    }
  }

  // Render frame2: image + promo status + restaurant name
  function renderGrid(restaurants) {
    const searchTerm = searchEl.value.toLowerCase();
    frame2.innerHTML = '';

    restaurants.forEach(r => {
      r.deals.forEach(deal => {
        if (activeCategory !== 'All' && deal.category !== activeCategory) return;

        if (searchTerm && !deal.title.toLowerCase().includes(searchTerm) && !r.name.toLowerCase().includes(searchTerm)) return;

        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow cursor-pointer flex flex-col';
        card.innerHTML = `
          <div class="h-40 w-full bg-cover bg-center" style="background-image:url('${deal.image}')"></div>
          ${deal.promo_status ? `<div class="text-xs text-red-600 text-center mt-1">${deal.promo_status}</div>` : ''}
          <div class="p-2 text-[10pt] text-gray-700 text-center">${r.name}</div>
        `;
        card.addEventListener('click', () => openDetail(deal, r));
        frame2.appendChild(card);
      });
    });
  }

  // Frame1 modal (detail view)
  function openDetail(deal, r) {
    current.deal = deal;
    current.restaurant = r;

    const price = deal.discount_price && deal.discount_price > 0 ? deal.discount_price : deal.original_price;
    let priceHtml = `<div class="mt-2 text-xl font-bold text-green-600">R${price}</div>`;
    if (deal.discount_price && deal.discount_price > 0) {
      priceHtml += `<div class="line-through text-gray-400">R${deal.original_price}</div>`;
    }

    modalContent.innerHTML = `
      <div class="flex flex-col gap-4 p-4">
        <h2 class="font-bold text-xl text-center">${deal.title}</h2>
        <div class="md:flex gap-4">
          <div class="md:w-1/2 h-40 bg-cover bg-center rounded" style="background-image:url('${deal.image}')"></div>
          <div class="md:w-1/2 flex flex-col gap-2">
            <p class="text-gray-600">${deal.description || ''}</p>
            <div class="flex items-center gap-2 text-gray-800 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a8 8 0 11-11.314-11.314l4.243-4.243a8 8 0 0111.314 11.314z" />
              </svg>
              <span>${r.name} - ${r.address}</span>
            </div>
            <div class="text-gray-500 text-sm">Open: ${r.opening_time} - ${r.closing_time}</div>
            ${r.has_delivery ? `<div class="text-gray-500 text-sm">Delivery available (Fee: R${r.delivery_fee})</div>` : ''}
            ${priceHtml}
            <div class="mt-4 flex flex-col items-center gap-2">
              ${renderActionButtons(deal, r)}
            </div>
          </div>
        </div>
      </div>
    `;

    frame1.classList.remove('hidden');

    // Attach click handlers to buttons inside modal
    modalContent.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', handleAction);
    });

    modalClose.onclick = closeModal;
  }

  // Render action buttons
  function renderActionButtons(deal, r) {
    const buttons = [];
    const actionType = deal.action_type;
    const hasMenu = r.menu_url;

    switch (actionType) {
      case 'claim':
        buttons.push(`<button data-action="claim_whatsapp" class="px-4 py-2 rounded bg-green-500 text-white font-bold">Claim via WhatsApp</button>`);
        break;
      case 'order':
        buttons.push(`<button data-action="order_whatsapp" class="px-4 py-2 rounded bg-green-500 text-white font-bold">Order via WhatsApp</button>`);
        break;
      case 'view_menu':
        if (hasMenu) buttons.push(`<button data-action="view_menu" class="px-4 py-2 rounded bg-orange-500 text-white font-bold">View Menu</button>`);
        break;
      case 'view_order':
        if (hasMenu) {
          buttons.push(`<button data-action="view_menu_order" class="px-4 py-2 rounded bg-orange-500 text-white font-bold">View Menu</button>`);
          buttons.push(`<button data-action="order_whatsapp" class="px-4 py-2 rounded bg-green-500 text-white font-bold">Order via WhatsApp</button>`);
        }
        break;
      case 'claim_view':
        if (hasMenu) {
          buttons.push(`<button data-action="view_menu_claim" class="px-4 py-2 rounded bg-orange-500 text-white font-bold">View Menu</button>`);
          buttons.push(`<button data-action="claim_whatsapp" class="px-4 py-2 rounded bg-green-500 text-white font-bold">Claim via WhatsApp</button>`);
        }
        break;
    }

    return buttons.join('<br/>'); // vertical spacing
  }

  // Handle action buttons
  function handleAction(e) {
    const mode = e.currentTarget.getAttribute('data-action');
    if (!mode) return;
    const deal = current.deal;
    const rest = current.restaurant;
    if (!deal || !rest) return;

    // === View Menu Buttons ===
    if (mode === 'view_menu' || mode === 'view_menu_order' || mode === 'view_menu_claim') {
      if (rest.menu_url) window.open(rest.menu_url, '_blank');
      else alert('Menu not available');
      return;
    }

    // === Order/Claim Buttons ===
    if (mode.includes('order') || mode.includes('claim')) {
      orderForm.classList.remove('hidden');

      // Set default toggle to pickup
      pickupToggle.checked = true;
      deliveryAddress.classList.add('hidden');

      // Cancel/back button
      cancelForm.onclick = () => {
        orderForm.classList.add('hidden');
      };

      // Send button
      sendForm.onclick = () => {
        const name = userNameEl.value.trim();
        const contact = userContactEl.value.trim();
        const address = deliveryAddress.value.trim();

        if (!name || !contact) {
          alert('Please enter your name and contact number');
          return;
        }

        if (!pickupToggle.checked && !address) {
          alert('Please enter delivery address');
          return;
        }

        let msg = `Hi ${rest.name}, I want to ${mode.includes('claim') ? 'claim' : 'order'}: ${deal.title} R${deal.discount_price || deal.original_price}`;
        if (rest.has_delivery && !pickupToggle.checked) {
          msg += ` plus Delivery R${rest.delivery_fee}. Address: ${address}`;
        }
        msg += `. Name: ${name}, Contact: ${contact}`;

        const num = rest.whatsapp_number.replace(/[^0-9]/g, '');
        const url = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');

        orderForm.classList.add('hidden');
        closeModal();
      };
    }
  }

  // Close modal
  function closeModal() {
    frame1.classList.add('hidden');
    modalContent.innerHTML = '';
    current = { deal: null, restaurant: null };
  }

  // Search
  searchEl.addEventListener('input', () => renderGrid(dataStore.restaurants));

  // Category buttons
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('bg-orange-500'));
      btn.classList.add('bg-orange-500');
      activeCategory = btn.getAttribute('data-cat');
      renderGrid(dataStore.restaurants);
    });
  });

  // Delivery toggle logic
  pickupToggle.addEventListener('change', () => {
    if (pickupToggle.checked) deliveryAddress.classList.add('hidden');
    else deliveryAddress.classList.remove('hidden');
  });

  load();
})();
