const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function createCheckoutSessionRequest(token: string, planId: string): Promise<{ url: string }> {
  const res = await fetch(`${API_URL}/payments/create-checkout-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ planId }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Error al procesar el pago");
  }

  return res.json();
}

export async function verifyCheckoutSessionRequest(token: string, sessionId: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/payments/verify-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ sessionId }),
  });

  if (!res.ok) {
    return { success: false };
  }

  return res.json();
}
