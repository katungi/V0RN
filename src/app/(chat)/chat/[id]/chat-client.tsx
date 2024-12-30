'use client';

import { useEffect, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QRCodeSVG } from 'qrcode.react';
import { Snack, SnackState } from 'snack-sdk';

import { Chat } from '@/components/blocks/components/chat';
import { DataStreamHandler } from '@/components/blocks/components/data-stream-handler';
import defaultCode from '@/components/Defaults';
import createWorkerTransport from '@/components/transports/createWorkerTransport';
import { Message } from '@/lib/db/schema/types';

const INITIAL_CODE_CHANGES_DELAY = 500;
const VERBOSE = !!process.browser;
const USE_WORKERS = true;

interface ChatClientProps {
  id: string;
  messages: Message[];
  selectedModelId: string;
  visibility: 'public' | 'private';
  isReadonly: boolean;
}

export function ChatClient({ 
  id, 
  messages, 
  selectedModelId, 
  visibility, 
  isReadonly 
}: ChatClientProps) {
  const webPreviewRef = useRef<Window | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [snack, setSnack] = useState<Snack | null>(null);
  const [snackState, setSnackState] = useState<SnackState | null>(null);

  useEffect(() => {
    const newSnack = new Snack({
      ...defaultCode,
      disabled: false,
      codeChangesDelay: INITIAL_CODE_CHANGES_DELAY,
      verbose: VERBOSE,
      webPreviewRef: webPreviewRef,
      ...(USE_WORKERS ? { createTransport: createWorkerTransport } : {})
    });

    setSnack(newSnack);
    setSnackState(newSnack.getState());

    const listeners = [
      newSnack.addStateListener((state) => {
        setSnackState(state);
      }),
      newSnack.addLogListener(({ message }) => console.log(message)),
    ];

    newSnack.updateDependencies({
      //@ts-ignore
      '@expo/vector-icons': '~14.0.2'
    });

    return () => listeners.forEach((listener) => listener());
  }, []);

  useEffect(() => {
    if (iframeRef.current) {
      webPreviewRef.current = iframeRef.current.contentWindow;
    }
  }, []);

  return (
    <div className="flex h-full">
      <div className="flex-1">
        <Chat
          id={id}
          initialMessages={messages}
          selectedModelId={selectedModelId}
          selectedVisibilityType={visibility}
          isReadonly={isReadonly}
        />
        <DataStreamHandler id={id} />
      </div>
      
      <div className="w-1/3 border-l">
        <Tabs defaultValue="preview" className="h-full">
          <TabsList className="justify-center border-b">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="mydevice">My Device</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="flex-grow flex items-center justify-center p-4">
            <div className="w-[375px] h-[667px] bg-white border-8 border-gray-300 rounded-3xl overflow-hidden shadow-lg">
              <iframe
                ref={iframeRef}
                src={snackState?.webPreviewURL || 'about:blank'}
                className="w-full h-full"
                allow="geolocation; camera; microphone"
              />
            </div>
          </TabsContent>
          <TabsContent value="mydevice" className="flex items-center justify-center p-4">
            {snackState?.online && snackState?.url && (
              <div className="p-4">
                <QRCodeSVG value={snackState.url} size={300} className='ml-13' />
                <p className="mt-4 text-sm text-gray-600">Scan with your device to open the app</p>
                <a href={snackState.url} className="mt-2 text-sm text-blue-500 hover:underline break-all">
                  {snackState.url}
                </a>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
