'use server';

import * as queries from './queries';
import type { User } from './types';

export async function getUserByEmail(email: string): Promise<Array<User>> {
  return queries.getUser(email);
}

export async function createWelcomeChat(userId: string) {
  return queries.createWelcomeChat(userId);
}

// Add other server-only actions as needed
