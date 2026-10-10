import prisma from '@/lib/prisma';
import RawMaterialList from '@/components/raw-materials/RawMaterialList';

export const dynamic = 'force-dynamic';

export default async function RawMaterialsPage() {
  const [materials, purchaseOrders] = await Promise.all([
    prisma.rawMaterial.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    }),
    prisma.purchaseOrder.findMany({
      include: {
        items: {
          include: {
            rawMaterial: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <RawMaterialList
      materials={materials}
      purchaseOrders={purchaseOrders}
    />
  );
}
