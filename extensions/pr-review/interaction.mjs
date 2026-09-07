export async function waitForInteraction(signal, request) {
  if (!signal) return request();
  signal.throwIfAborted();
  const cancellation = Promise.withResolvers();
  const cancel = () => cancellation.reject(signal.reason);
  signal.addEventListener("abort", cancel, { once: true });
  try {
    const answer = await Promise.race([request(), cancellation.promise]);
    signal.throwIfAborted();
    return answer;
  } finally {
    signal.removeEventListener("abort", cancel);
  }
}
