document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.getElementById('openAddDialog');
  const dialog = document.getElementById('addDialog');
  const cancelBtn = document.getElementById('cancelAdd');
  const form = document.getElementById('addTravelForm');
  const travelList = document.getElementById('travelList');
  const sidebar = document.querySelector('.sidebar--left');
  const openSidebarBtn = document.getElementById('openSidebarBtn');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');

  openBtn?.addEventListener('click', () => {
    dialog.showModal();
  });

  cancelBtn?.addEventListener('click', () => {
    dialog.close();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = form.querySelector('input[name="name"]');
    const name = nameInput.value.trim();
    if (!name) return;
    const description = form.querySelector('textarea[name="description"]').value.trim();
    const destination = form.querySelector('input[name="destination"]').value.trim();
    const dateStart = form.querySelector('input[name="start_date"]').value;
    const dateEnd = form.querySelector('input[name="end_date"]').value;
    const res = await fetch('/travels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name,
        description,
        destination: destination || null,
        start_date: dateStart || null,
        end_date: dateEnd || null
      })
    });
    if (res.ok) {
      const travel = await res.json();
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = `/travels/${travel.id}`;
      link.textContent = travel.name;
      li.appendChild(link);
      travelList.appendChild(li);
      form.reset();
      dialog.close();
    } else {
      alert('Failed to create travel');
    }
  });

  openSidebarBtn?.addEventListener('click', () => {
    sidebar?.classList.add('open');
  });

  closeSidebarBtn?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
  });
});
