// Inputs: nonnegative integer prices in cents; discountPercent is 0 through 100.
// Round the discounted subtotal to the nearest whole cent.
// Shipping is free when the ORIGINAL subtotal is at least 5000 cents;
// otherwise shipping costs 500 cents. Return the total in whole cents.
export function checkoutTotal(prices, discountPercent) {
  const subtotal = prices.reduce((sum, price) => sum + price, 0);
  const discounted = subtotal * (1 - discountPercent / 100);
  const shipping = discounted >= 5000 ? 0 : 500;
  return discounted + shipping;
}
