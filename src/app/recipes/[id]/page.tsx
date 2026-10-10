import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import RecipeDetailClient from '@/components/recipes/RecipeDetailClient';

export const dynamic = 'force-dynamic';

export default async function RecipeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          rawMaterial: true,
        },
      },
    },
  });

  if (!recipe) {
    notFound();
  }

  return <RecipeDetailClient recipe={recipe} />;
}
