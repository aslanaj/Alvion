/* URL boundary shared by every configurator. No DOM or network side effects. */
window.Alvion = window.Alvion || {};

Alvion.buildQuoteUrl = function buildQuoteUrl(selection, baseUrl = window.location.href) {
  const url = new URL('contact.html', baseUrl);
  const allowedFields = ['vehicle', 'service', 'look', 'configurator'];

  for (const field of allowedFields) {
    const value = selection[field];
    if (value !== undefined && value !== null) {
      url.searchParams.set(field, String(value));
    }
  }

  url.hash = 'projectForm';
  return url.href;
};
