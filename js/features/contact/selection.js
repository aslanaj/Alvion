(() => {
  const query = new URLSearchParams(location.search);
  const vehicle = query.get('vehicle');
  const service = query.get('service');
  const look = query.get('look');
  const select = document.getElementById('service');
  if (service && select) {
    const value = service.slice(0, 150);
    const existing = Array.from(select.options).find(option =>
      option.value === value || option.textContent.trim() === value);
    if (existing) select.value = existing.value;
    else select.add(new Option(value, value, true, true));
  }
  const notes = [];
  if (vehicle) {
    const field = document.getElementById('vehicle');
    if (field) field.value = vehicle.slice(0, 150);
    else notes.push('Selected vehicle: ' + vehicle.slice(0, 150));
  }
  if (look) notes.push('Selected preview: ' + look.slice(0, 200) + ' (please confirm availability).');
  if(query.get('estimate'))notes.push('Starting estimate: '+query.get('estimate').slice(0,100));
  const message = document.getElementById('message');
  if (message && notes.length) message.value = notes.join('\n');
})();
