import prisma from '@/lib/prisma';
import NewBatchClient from './NewBatchClient';

export const dynamic = 'force-dynamic';

export default async function NewBatchPage() {
  const recipes = await prisma.recipe.findMany({
    include: {
      items: {
        include: { rawMaterial: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const year = new Date().getFullYear();
  const count = await prisma.batch.count();
  const suggestedBatchNumber = `LOTE-${year}-${String(count + 1).padStart(3, '0')}`;

  return (
    <NewBatchClient
      recipes={recipes}
      suggestedBatchNumber={suggestedBatchNumber}
    />
  );
}
