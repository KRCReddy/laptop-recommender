const api = (path, opts) => fetch(path, opts).then(r=>r.json());

async function load(filters={}) {
  const qs = new URLSearchParams(filters);
  const res = await api('/api/products?' + qs.toString());
  document.getElementById('meta').innerText = (res.count || 0) + ' results';
  const out = document.getElementById('results');
  out.innerHTML = '';
  (res.results || []).forEach(p => {
    const d = document.createElement('div'); d.className = 'card';
    d.innerHTML = `
      <img src="${p.image}" alt="${p.model}" />
      <div class="info">
        <h3>${p.brand} ${p.model} — ₹${p.price}</h3>
        <div class="small">${p.ram_gb}GB • ${p.storage_gb} ${p.storage_type || ''} • ${p.cpu}</div>
        <p>${p.description || ''}</p>
        <div style="margin-top:8px">
          <button class="inquire" data-id="${p.id}">Add to Inquiry</button>
          <button class="details" data-id="${p.id}">Details</button>
        </div>
      </div>
    `;
    out.appendChild(d);
  });
  attach();
}

function attach() {
  document.querySelectorAll('.inquire').forEach(b => b.addEventListener('click', (e) => {
    const id = e.target.dataset.id;
    const items = JSON.parse(sessionStorage.getItem('inquiryItems') || '[]');
    if (!items.includes(id)) items.push(id);
    sessionStorage.setItem('inquiryItems', JSON.stringify(items));

    const name = prompt('Enter your name for the inquiry');
    const phone = prompt('Phone');
    const email = prompt('Email');
    const message = prompt('Message (optional)');
    fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, message, items })
    })
      .then(r => r.json())
      .then(j => alert(j.ok ? ('Inquiry sent. ID:' + j.id) : 'Error sending inquiry'));
  }));

  document.querySelectorAll('.details').forEach(b => b.addEventListener('click', async (e) => {
    const p = await fetch('/api/products/' + e.target.dataset.id).then(r => r.json());
    alert(p.brand + ' ' + p.model + '\n₹' + p.price + '\n' + (p.description || ''));
  }));
}

document.getElementById('apply').addEventListener('click', () => {
  const filters = {};
  const purpose = document.getElementById('purpose').value; if (purpose) filters.purpose = purpose;
  const ram = document.getElementById('ram').value; if (ram) filters.ram = ram;
  const storageType = document.getElementById('storageType').value; if (storageType) filters.storageType = storageType;
  const maxPrice = document.getElementById('maxPrice').value; if (maxPrice) filters.maxPrice = maxPrice;
  const q = document.getElementById('q').value; if (q) filters.q = q;
  load(filters);
});

document.getElementById('clear').addEventListener('click', () => {
  document.getElementById('purpose').value = ''; document.getElementById('ram').value = ''; document.getElementById('storageType').value = '';
  document.getElementById('maxPrice').value = ''; document.getElementById('q').value = '';
  load();
});

load();
