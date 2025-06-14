// Autocomplete functionality for venue input

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('mainVenueInput');
  const hidden = document.querySelector('input[name="main_venue"]');
  const datalist = document.getElementById('venueSuggestions');

  if (!input || !hidden || !datalist) return;

  input.addEventListener('input', async () => {
    const term = input.value.trim();
    if (!term) {
      datalist.innerHTML = '';
      hidden.value = '';
      return;
    }
    try {
      const res = await fetch(`/places/autocomplete?input=${encodeURIComponent(term)}`);
      if (!res.ok) return;
      const predictions = await res.json();
      datalist.innerHTML = '';
      predictions.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.description;
        opt.setAttribute('data-place-id', p.place_id);
        datalist.appendChild(opt);
      });
    } catch (err) {
      console.error('autocomplete error', err);
    }
  });

  input.addEventListener('change', () => {
    const option = datalist.querySelector(`option[value="${input.value}"]`);
    hidden.value = option ? option.getAttribute('data-place-id') || '' : '';
  });
});
