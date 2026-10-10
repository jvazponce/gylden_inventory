const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // 1. Usuarios con diferentes roles
  const passwordHash = await bcrypt.hash('admin123', 10);
  const prodHash = await bcrypt.hash('prod123', 10);
  const salesHash = await bcrypt.hash('ventas123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gylden.com' },
    update: {},
    create: {
      name: 'Administrador Gylden',
      email: 'admin@gylden.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'produccion@gylden.com' },
    update: {},
    create: {
      name: 'Maestro Cervecero',
      email: 'produccion@gylden.com',
      passwordHash: prodHash,
      role: 'PRODUCTION',
    },
  });

  await prisma.user.upsert({
    where: { email: 'ventas@gylden.com' },
    update: {},
    create: {
      name: 'Encargado de Ventas',
      email: 'ventas@gylden.com',
      passwordHash: salesHash,
      role: 'SALES',
    },
  });

  console.log('Users created.');

  // 2. Materia Prima e Insumos
  const materials = [
    { name: 'Miel Multiflora de Bosque', category: 'HONEY', unit: 'kg', stock: 50, minStock: 15, costPerUnit: 5.5 },
    { name: 'Miel de Azahar', category: 'HONEY', unit: 'kg', stock: 40, minStock: 12, costPerUnit: 6.2 },
    { name: 'Levadura Lalvin D-47', category: 'YEAST', unit: 'g', stock: 250, minStock: 50, costPerUnit: 0.15 },
    { name: 'Nutriente Fermaid-O', category: 'NUTRIENT', unit: 'g', stock: 500, minStock: 100, costPerUnit: 0.08 },
    { name: 'Agua Purificada / Osmotizada', category: 'WATER', unit: 'L', stock: 500, minStock: 100, costPerUnit: 0.05 },
    { name: 'Frutos Rojos (Moras y Frambuesas)', category: 'FRUIT', unit: 'kg', stock: 20, minStock: 5, costPerUnit: 4.8 },
    { name: 'Botellas de Vidrio 330ml Ámbar', category: 'PACKAGING', unit: 'units', stock: 600, minStock: 150, costPerUnit: 0.45 },
    { name: 'Chapas Corona Doradas', category: 'PACKAGING', unit: 'units', stock: 1000, minStock: 250, costPerUnit: 0.05 },
    { name: 'Etiquetas Gylden Tradicional 330ml', category: 'PACKAGING', unit: 'units', stock: 500, minStock: 100, costPerUnit: 0.20 },
    { name: 'Etiquetas Gylden Frutos Rojos 330ml', category: 'PACKAGING', unit: 'units', stock: 400, minStock: 100, costPerUnit: 0.20 },
  ];

  const createdMaterials = {};
  for (const m of materials) {
    const existing = await prisma.rawMaterial.findFirst({ where: { name: m.name } });
    if (!existing) {
      const created = await prisma.rawMaterial.create({ data: m });
      createdMaterials[m.name] = created;
    } else {
      createdMaterials[m.name] = existing;
    }
  }

  console.log('Raw materials created.');

  // 3. Productos Terminados
  const prodTradicional = await prisma.finishedGood.upsert({
    where: { id: 'fg-tradicional' },
    update: {},
    create: {
      id: 'fg-tradicional',
      name: 'Hidromiel Tradicional',
      style: 'Tradicional Semidulce',
      format: 'Botella 330ml',
      stock: 72,
      unitPrice: 4.50,
    },
  });

  const prodFrutosRojos = await prisma.finishedGood.upsert({
    where: { id: 'fg-frutos-rojos' },
    update: {},
    create: {
      id: 'fg-frutos-rojos',
      name: 'Hidromiel Frutos Rojos',
      style: 'Melomel',
      format: 'Botella 330ml',
      stock: 48,
      unitPrice: 5.00,
    },
  });

  console.log('Finished goods created.');

  // 4. Recetas Base (20 Litros)
  const existingRecipe1 = await prisma.recipe.findFirst({ where: { name: 'Gylden Tradicional 20L' } });
  if (!existingRecipe1) {
    const r1 = await prisma.recipe.create({
      data: {
        name: 'Gylden Tradicional 20L',
        description: 'Receta clásica de hidromiel pura fermentada con levadura D-47 y miel multiflora.',
        baseVolumeLiters: 20,
        estimatedDays: 19,
        items: {
          create: [
            { rawMaterialId: createdMaterials['Miel Multiflora de Bosque'].id, quantity: 6.0, stage: 1, notes: 'Disolver en agua tibia' },
            { rawMaterialId: createdMaterials['Agua Purificada / Osmotizada'].id, quantity: 15.0, stage: 1, notes: 'Completar hasta volumen' },
            { rawMaterialId: createdMaterials['Levadura Lalvin D-47'].id, quantity: 5.0, stage: 1, notes: 'Hidratar antes de inocular' },
            { rawMaterialId: createdMaterials['Nutriente Fermaid-O'].id, quantity: 10.0, stage: 1, notes: 'Agregar en TOSNA escalonado' },
          ],
        },
      },
    });

    await prisma.finishedGood.update({
      where: { id: prodTradicional.id },
      data: { recipeId: r1.id },
    });
  }

  const existingRecipe2 = await prisma.recipe.findFirst({ where: { name: 'Gylden Frutos Rojos (Melomel) 20L' } });
  if (!existingRecipe2) {
    const r2 = await prisma.recipe.create({
      data: {
        name: 'Gylden Frutos Rojos (Melomel) 20L',
        description: 'Melomel vibrante con miel de azahar y segunda fermentación con frambuesas y moras.',
        baseVolumeLiters: 20,
        estimatedDays: 19,
        items: {
          create: [
            { rawMaterialId: createdMaterials['Miel de Azahar'].id, quantity: 6.0, stage: 1, notes: 'Base de mosto inicial' },
            { rawMaterialId: createdMaterials['Agua Purificada / Osmotizada'].id, quantity: 14.5, stage: 1, notes: 'Completar volumen base' },
            { rawMaterialId: createdMaterials['Levadura Lalvin D-47'].id, quantity: 5.0, stage: 1, notes: 'Inocular a 18°C' },
            { rawMaterialId: createdMaterials['Nutriente Fermaid-O'].id, quantity: 10.0, stage: 1, notes: 'Nutrición orgánica' },
            { rawMaterialId: createdMaterials['Frutos Rojos (Moras y Frambuesas)'].id, quantity: 2.5, stage: 2, notes: 'Agregar en etapa 2 para segunda fermentación' },
          ],
        },
      },
    });

    await prisma.finishedGood.update({
      where: { id: prodFrutosRojos.id },
      data: { recipeId: r2.id },
    });
  }

  console.log('Recipes created.');

  // 5. Clientes de Ejemplo
  const existingCustomer = await prisma.customer.findFirst({ where: { name: 'Taberna Odín & Viking' } });
  if (!existingCustomer) {
    await prisma.customer.create({
      data: {
        name: 'Taberna Odín & Viking',
        contactName: 'Carlos Gómez',
        phone: '+52 55 1234 5678',
        email: 'compras@tabernaodin.com',
        address: 'Calle Mayor #45, Col. Centro Histórico',
        notes: 'Punto de entrega en horario matutino de 10:00 a 14:00.',
      },
    });

    await prisma.customer.create({
      data: {
        name: 'Cervecería Artesanal Valhalla',
        contactName: 'Lucía Mendoza',
        phone: '+52 55 9876 5432',
        email: 'valhallabeer@gmail.com',
        address: 'Av. Revolución 120, Local 4',
        notes: 'Cliente regular con pedidos quincenales.',
      },
    });
  }

  console.log('Customers created.');
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
