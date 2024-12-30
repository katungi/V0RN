'use server';

import { z } from 'zod';
import { compare } from 'bcrypt-ts';
import { signIn } from './auth';
import { createUser, getUser } from '@/lib/db/schema/queries';
import { isRedirectError } from 'next/dist/client/components/redirect';
import type { User } from '@/lib/db/schema/schema';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type AuthActionState = {
  status: 'success' | 'failed';
  message?: string;
};

export async function getUserByEmail(email: string): Promise<User | undefined> {
  'use server';
  const users = await getUser(email);
  return users[0];
}

export async function githubSignIn(): Promise<AuthActionState> {
  'use server';
  
  try {
    await signIn('github', { redirect: true, redirectTo: '/' });
    return { status: 'success' };
  } catch (error) {
    // This is expected - GitHub sign in needs to redirect
    if (isRedirectError(error)) {
      throw error;
    }
    
    console.error('Unexpected error during GitHub sign in:', error);
    return { status: 'failed', message: 'Failed to sign in with GitHub' };
  }
}

export async function login(formData: FormData): Promise<AuthActionState> {
  'use server';
  
  const email = formData.get('email');
  const password = formData.get('password');

  const result = authFormSchema.safeParse({ email, password });

  if (!result.success) {
    return {
      status: 'failed',
      message: 'Invalid email or password format',
    };
  }

  try {
    const users = await getUser(result.data.email);
    if (users.length === 0) {
      return {
        status: 'failed',
        message: 'Invalid email or password',
      };
    }

    const user = users[0];
    if (!user?.password) {
      return {
        status: 'failed',
        message: 'Invalid email or password',
      };
    }

    const passwordsMatch = await compare(result.data.password, user.password);
    if (!passwordsMatch) {
      return {
        status: 'failed',
        message: 'Invalid email or password',
      };
    }

    await signIn('credentials', {
      email: result.data.email,
      password: result.data.password,
      redirect: true,
      redirectTo: '/',
    });

    return { status: 'success' };
  } catch (error) {
    console.error(error);
    return { status: 'failed' };
  }
}

export async function register(formData: FormData): Promise<AuthActionState> {
  'use server';
  
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const users = await getUser(validatedData.email);
    if (users.length > 0) {
      return { status: 'failed', message: 'User already exists' };
    }

    await createUser(validatedData.email, validatedData.password);

    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: true,
      redirectTo: '/',
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'failed', message: 'Invalid email or password format' };
    }
    return { status: 'failed' };
  }
}
