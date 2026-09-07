// Applies a percentage discount to an order total in cents.
export function applyDiscount(cents, percent) {
  if (!Number.isInteger(cents) || cents < 0) throw new RangeError("cents must be a non-negative integer");
  if (percent < 0 || percent > 100) throw new RangeError("percent must be between 0 and 100");
  return Math.round((cents * (100 - percent)) / 100);
}

// Checkout charges the discounted order total.
export function checkout(order) {
  return applyDiscount(order.cents, order.discountPercent);
}
