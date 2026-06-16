export type SubscriptionPlan = {
  id: string;
  name: string;
  type: 'PERSONAL' | 'GROUP' | 'API_USAGE';
  price: number;
  maxWorkspaces: number | null;
  maxUsersPerWorkspace: number | null;
  maxGenerationsPerMonth: number | null;
  apiCostPer1kRows: number | null;
  isActive: boolean;
};

export async function listActivePlansRequest(): Promise<SubscriptionPlan[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const response = await fetch(`${API_URL}/plans`, {
    headers: {
      'Content-Type': 'application/json',
    },
    // revalidate every 60 seconds para la landing
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error('Error al cargar los planes');
  }

  return response.json();
}
