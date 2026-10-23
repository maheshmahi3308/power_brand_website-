// Contact details for Y. Ramesh — single source of truth
export const CONTACT = {
  name: 'Y. Ramesh',
  phone: '6302016103',
  phoneHref: 'tel:6302016103',
  whatsappNumber: '916302016103',
  whatsappBase: 'https://wa.me/916302016103',
};

/**
 * Build a WhatsApp URL with an optional pre-filled message.
 * @param {string} [message] - Plain-text message to pre-fill
 */
export const whatsappUrl = (message) => {
  const text = message ||
    'Hello Y. Ramesh, I would like to enquire about a product from your fashion website. Please share the availability and pricing details.';
  return `${CONTACT.whatsappBase}?text=${encodeURIComponent(text)}`;
};

/**
 * Build a product-specific WhatsApp enquiry URL.
 * @param {string} productName
 */
export const productWhatsappUrl = (productName) =>
  whatsappUrl(
    `Hello Y. Ramesh, I would like to enquire about "${productName}" from your fashion website. Please share the availability, sizes, colors, and pricing details.`
  );
