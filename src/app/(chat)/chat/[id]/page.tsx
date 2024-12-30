import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { getChatById, getMessagesByChatId } from '@/lib/db/schema/queries';
import { convertToUIMessages } from '@/lib/utils';
import { ChatClient } from './chat-client';

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const session = await auth();

  if (chat.visibility === 'private') {
    if (!session || !session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const cookieStore = cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;
  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <ChatClient
      id={chat.id}
      messages={convertToUIMessages(messagesFromDb)} 
      selectedModelId={selectedModelId}
      visibility={chat.visibility}
      isReadonly={session?.user?.id !== chat.userId}
    />
  );
}
