import prisma from '@/lib/prisma';
import RecipeFormClient from '@/components/recipes/RecipeFormClient';

export const dynamic = 'force-dynamic';

export default async function NewRecipePage() {
  const materials = await prisma.rawMaterial.findMany({
    orderBy: [
      { category: 'asc' },
      { name: 'asc' },
    ],
  });

  return <RecipeFormClient materials={materials} />;
}
