import photo from "../assets/images/product-1.jpg";

const PRICE = 80.55;

export const product = {
  id: `prod_15262`,
  title: "Test Product",
  price: PRICE,
  photo,
  variants: Array.from({ length: 5 }, (_, i) => {
    const discount_percentage = i > 0 ? i * 5 + 50 : 50;

    const pack_price = PRICE - (PRICE * discount_percentage) / 100;

    return {
      discount_percentage,
      price: pack_price.toFixed(2),
      items: i + 1,
      isRecommended: i === 2,
      variant_id: `pack_${i + 1}`,
    };
  }).sort((a, b) => {
    // sort recommended products (true) first
    return a.isRecommended === b.isRecommended ? 0 : a.isRecommended ? -1 : 1;
  }),
};
