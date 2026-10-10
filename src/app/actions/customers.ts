'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createCustomer(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const contactName = (formData.get('contactName') as string) || '';
    const phone = (formData.get('phone') as string) || '';
    const email = (formData.get('email') as string) || '';
    const address = (formData.get('address') as string) || '';
    const notes = (formData.get('notes') as string) || '';

    if (!name?.trim()) {
      return { success: false, error: 'El nombre o razón social del cliente es obligatorio.' };
    }

    await prisma.customer.create({
      data: {
        name,
        contactName,
        phone,
        email,
        address,
        notes,
      },
    });

    revalidatePath('/customers');
    revalidatePath('/shipments/new');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error creating customer:', error);
    return { success: false, error: 'Error al registrar el cliente.' };
  }
}

export async function updateCustomer(formData: FormData) {
  try {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const contactName = (formData.get('contactName') as string) || '';
    const phone = (formData.get('phone') as string) || '';
    const email = (formData.get('email') as string) || '';
    const address = (formData.get('address') as string) || '';
    const notes = (formData.get('notes') as string) || '';

    if (!id || !name?.trim()) {
      return { success: false, error: 'Datos incompletos.' };
    }

    await prisma.customer.update({
      where: { id },
      data: {
        name,
        contactName,
        phone,
        email,
        address,
        notes,
      },
    });

    revalidatePath('/customers');
    revalidatePath(`/customers/${id}`);
    revalidatePath('/shipments/new');
    return { success: true };
  } catch (error) {
    console.error('Error updating customer:', error);
    return { success: false, error: 'Error al actualizar el cliente.' };
  }
}
