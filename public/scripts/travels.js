document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.getElementById('openAddDialog');
  const dialog = document.getElementById('addDialog');
  const cancelBtn = document.getElementById('cancelAdd');
  const form = document.getElementById('addTravelForm');
  const travelList = document.getElementById('travelList');

  openBtn?.addEventListener('click', () => {
    dialog.showModal();
  });

  cancelBtn?.addEventListener('click', () => {
    dialog.close();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titleInput = form.querySelector('input[name="title"]');
    const title = titleInput.value.trim();
    if (!title) return;
    const res = await fetch('/travels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ title })
    });
    if (res.ok) {
      const travel = await res.json();
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = `/travels/${travel.id}`;
      link.textContent = travel.title;
      li.appendChild(link);
      travelList.appendChild(li);
      form.reset();
      dialog.close();
    } else {
      alert('Failed to create travel');
    }
  });
});
