document.addEventListener('DOMContentLoaded', () => {
  const openAddBtn = document.getElementById('openAddPageDialog');
  const addDialog = document.getElementById('addPageDialog');
  const cancelAddBtn = document.getElementById('cancelAddPage');
  const addForm = document.getElementById('addPageForm');
  const pageList = document.getElementById('pageList');

  const editDialog = document.getElementById('editPageDialog');
  const editForm = document.getElementById('editPageForm');
  const cancelEditBtn = document.getElementById('cancelEditPage');
  let currentEditId = null;

  const albumId = addForm?.dataset.albumId;

  openAddBtn?.addEventListener('click', () => {
    addDialog.showModal();
  });

  cancelAddBtn?.addEventListener('click', () => {
    addDialog.close();
  });

  addForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = addForm.querySelector('input[name="title"]').value.trim();
    const content = addForm.querySelector('textarea[name="content"]').value.trim();
    if (!title || !content) return;
    const res = await fetch(`/albums/${albumId}/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ title, content })
    });
    if (res.ok) {
      const page = await res.json();
      const li = document.createElement('li');
      li.dataset.id = page.id;
      li.innerHTML = `<a href="/albums/${albumId}/pages/${page.id}">${page.title}</a> ` +
                     `<button class="editPageBtn">Edit</button> ` +
                     `<button class="deletePageBtn">Delete</button>`;
      pageList.appendChild(li);
      addForm.reset();
      addDialog.close();
    } else {
      alert('Failed to create page');
    }
  });

  pageList?.addEventListener('click', async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const li = target.closest('li');
    if (!li) return;
    const pageId = li.dataset.id;

    if (target.classList.contains('deletePageBtn')) {
      const res = await fetch(`/albums/${albumId}/pages/${pageId}/delete`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        li.remove();
      } else {
        alert('Failed to delete page');
      }
    }

    if (target.classList.contains('editPageBtn')) {
      const res = await fetch(`/albums/${albumId}/pages/${pageId}`, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const page = await res.json();
        editForm.querySelector('input[name="title"]').value = page.title;
        editForm.querySelector('textarea[name="content"]').value = page.content;
        currentEditId = pageId;
        editDialog.showModal();
      } else {
        alert('Failed to load page');
      }
    }
  });

  cancelEditBtn?.addEventListener('click', () => {
    editDialog.close();
  });

  editForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentEditId) return;
    const title = editForm.querySelector('input[name="title"]').value.trim();
    const content = editForm.querySelector('textarea[name="content"]').value.trim();
    const res = await fetch(`/albums/${albumId}/pages/${currentEditId}/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ title, content })
    });
    if (res.ok) {
      const page = await res.json();
      const li = pageList.querySelector(`li[data-id="${currentEditId}"]`);
      if (li) {
        const link = li.querySelector('a');
        if (link) link.textContent = page.title;
      }
      editDialog.close();
    } else {
      alert('Failed to update page');
    }
  });
});
