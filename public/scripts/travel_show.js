document.addEventListener('DOMContentLoaded', () => {
  const openAddBtn = document.getElementById('openAddItineraryDialog');
  const addDialog = document.getElementById('addItineraryDialog');
  const cancelAddBtn = document.getElementById('cancelAddItinerary');
  const addForm = document.getElementById('addItineraryForm');
  const itineraryList = document.getElementById('itineraryList');

  const editDialog = document.getElementById('editItineraryDialog');
  const editForm = document.getElementById('editItineraryForm');
  const cancelEditBtn = document.getElementById('cancelEditItinerary');
  let currentEditId = null;

  const travelId = addForm?.dataset.travelId;

  openAddBtn?.addEventListener('click', () => {
    addDialog.showModal();
  });

  cancelAddBtn?.addEventListener('click', () => {
    addDialog.close();
  });

  addForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = addForm.querySelector('input[name="name"]').value.trim();
    const destination = addForm.querySelector('textarea[name="destination"]').value.trim();
    if (!name || !destination) return;
    const res = await fetch(`/travels/${travelId}/itineraries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ name, destination })
    });
    if (res.ok) {
      const itinerary = await res.json();
      const li = document.createElement('li');
      li.dataset.id = itinerary.id;
      li.innerHTML = `<a href="/travels/${travelId}/itineraries/${itinerary.id}">${itinerary.title}</a> ` +
                     `<button class="editItineraryBtn">Edit</button> ` +
                     `<button class="deleteItineraryBtn">Delete</button>`;
      itineraryList.appendChild(li);
      addForm.reset();
      addDialog.close();
    } else {
      alert('Failed to create itinerary');
    }
  });

  itineraryList?.addEventListener('click', async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const li = target.closest('li');
    if (!li) return;
    const itineraryId = li.dataset.id;

    if (target.classList.contains('deleteItineraryBtn')) {
      const res = await fetch(`/travels/${travelId}/itineraries/${itineraryId}/delete`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        li.remove();
      } else {
        alert('Failed to delete itinerary');
      }
    }

    if (target.classList.contains('editItineraryBtn')) {
      const res = await fetch(`/travels/${travelId}/itineraries/${itineraryId}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const itinerary = await res.json();
        editForm.querySelector('input[name="title"]').value = itinerary.title;
        editForm.querySelector('textarea[name="content"]').value = itinerary.content;
        currentEditId = itineraryId;
        editDialog.showModal();
      } else {
        alert('Failed to load itinerary');
      }
    }
  });

  cancelEditBtn?.addEventListener('click', () => {
    editDialog.close();
  });

  editForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentEditId) return;
    const name = editForm.querySelector('input[name="name"]').value.trim();
    const destination = editForm.querySelector('textarea[name="destination"]').value.trim();
    const res = await fetch(`/travels/${travelId}/itineraries/${currentEditId}/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ name, destination })
    });
    if (res.ok) {
      const itinerary = await res.json();
      const li = itineraryList.querySelector(`li[data-id="${currentEditId}"]`);
      if (li) {
        const link = li.querySelector('a');
        if (link) link.textContent = itinerary.title;
      }
      editDialog.close();
    } else {
      alert('Failed to update itinerary');
    }
  });
});
