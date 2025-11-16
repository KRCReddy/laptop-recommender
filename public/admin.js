const adminApi = (path, opts) => {
  const pass = document.getElementById('pass').value || '';
  const sep = path.includes('?') ? '&' : '?';
  return fetch(path + sep + 'pass=' + encodeURIComponent(pass), opts).then(async r => {
    if (r.ok) return r.json();
    const txt = await r.text().catch(()=>null);
    throw new Error(txt || 'Request failed');
  });
};

document.getElementById('load').addEventListener('click', async () => {
  try {
    await loadProducts();
    await loadInquiries();
    document.getElementById('adminArea').style.display = 'block';
  } catch (e) {
    alert('Failed: ' + e.message);
  }
});

async function loadProducts() {
  const r = await fetch('/api/products').then(r => r.json());
  const list = document.getElementById('prodList'); list.innerHTML = '';
  (r.results || []).forEach(p => {
    const card = document.createElement('div'); card.className = 'card';
    card.style.alignItems = 'center';
    card.style.marginBottom = '8px';
    card.innerHTML = `
      <img src="${p.image}" style="width:120px;height:80px;object-fit:cover;border-radius:6px;margin-right:12px" />
      <div style="flex:1">
        <strong>${p.brand} ${p.model}</strong><br />
        <div class="small">₹${p.price} • ${p.ram_gb}GB • ${p.storage_gb} ${p.storage_type}</div>
        <div style="margin-top:8px">
          <button class="edit" data-id="${p.id}">Edit</button>
          <button class="del" data-id="${p.id}">Delete</button>
        </div>
      </div>
    `;
    card.style.display = 'flex';
    list.appendChild(card);
  });
  attachAdminButtons();
}

function attachAdminButtons() {
  document.querySelectorAll('.edit').forEach(b => b.addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    const p = await fetch('/api/products/' + id).then(r => r.json());
    const updated = promptJSON(p);
    if (!updated) return;
    try {
      await adminApi('/api/admin/products/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
      alert('Updated');
      loadProducts();
    } catch (err) { alert('Failed: ' + err.message); }
  }));

  document.querySelectorAll('.del').forEach(b => b.addEventListener('click', async (e) => {
    if (!confirm('Delete this product?')) return;
    const id = e.target.dataset.id;
    try {
      await adminApi('/api/admin/products/' + id, { method: 'DELETE' });
      alert('Deleted'); loadProducts();
    } catch (err) { alert('Failed: ' + err.message); }
  }));
}

function promptJSON(p) {
  const upd = Object.assign({}, p);
  upd.brand = prompt('Brand', upd.brand) || upd.brand;
  upd.model = prompt('Model', upd.model) || upd.model;
  upd.price = parseInt(prompt('Price (₹)', upd.price) || upd.price, 10);
  upd.ram_gb = parseInt(prompt('RAM GB', upd.ram_gb) || upd.ram_gb, 10);
  upd.storage_type = prompt('Storage type (SSD/HDD)', upd.storage_type) || upd.storage_type;
  upd.storage_gb = parseInt(prompt('Storage GB', upd.storage_gb) || upd.storage_gb, 10);
  upd.image = prompt('Image URL', upd.image) || upd.image;
  upd.description = prompt('Description', upd.description) || upd.description;
  // Keep purpose as array; allow comma-separated input
  const purposeInput = prompt('Purpose (comma-separated)', (upd.purpose || []).join(','));
  if (purposeInput !== null) upd.purpose = purposeInput.split(',').map(s => s.trim()).filter(Boolean);
  return upd;
}

async function loadInquiries() {
  try {
    const data = await adminApi('/api/admin/inquiries');
    document.getElementById('inquiries').innerText = JSON.stringify(data, null, 2);
  } catch (e) {
    document.getElementById('inquiries').innerText = 'Failed to load (check pass)';
  }
}

document.getElementById('newProduct').addEventListener('click', async () => {
  const p = { brand: 'Brand', model: 'Model', price: 0, ram_gb: 4, storage_type: 'SSD', storage_gb: 256, purpose: ['Office'], image: 'https://placehold.co/400x250?text=New', description: '' };
  const filled = promptJSON(p);
  if (!filled) return;
  try {
    await adminApi('/api/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(filled) });
    alert('Added'); loadProducts();
  } catch (e) { alert('Failed: ' + e.message); }
});
