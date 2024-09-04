"use client";
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, ChevronRight, ChevronDown, File } from 'lucide-react';
import Editor from "@monaco-editor/react";
import { QRCodeSVG } from 'qrcode.react';
import { Snack, SDKVersion } from 'snack-sdk';
import createWorkerTransport from '../components/transports/createWorkerTransport';
import defaultCode from '../components/Defaults';
import { CopilotTextarea } from "@copilotkit/react-textarea";
import { useCopilotChat } from "@copilotkit/react-core";
import { Role, TextMessage } from "@copilotkit/runtime-client-gql";
import "@copilotkit/react-ui/styles.css";


const INITIAL_CODE_CHANGES_DELAY = 500;
const VERBOSE = !!process.browser;
const USE_WORKERS = true;


export default function Component() {
  const webPreviewRef = useRef<Window | null>(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! How can I help you today?' },
    { role: 'user', content: 'Can you explain React hooks?' },
    { role: 'assistant', content: 'React hooks are functions that allow you to use state and other React features in functional components...' },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [code, setCode] = useState(defaultCode.files?.["App.js"]?.contents || '');
  const [currentFile, setCurrentFile] = useState("App.js");
  const [snack] = useState(
    () =>
      new Snack({
        ...defaultCode,
        disabled: !process.browser,
        codeChangesDelay: INITIAL_CODE_CHANGES_DELAY,
        verbose: VERBOSE,
        webPreviewRef: process.browser ? webPreviewRef : undefined,
        ...(USE_WORKERS ? { createTransport: createWorkerTransport } : {}),
      })
  );
  const [snackState, setSnackState] = useState(snack.getState());
  const [isSaving, setIsSaving] = useState(false);
  const [codeChangesDelay, setCodeChangesDelay] = useState(INITIAL_CODE_CHANGES_DELAY);
  const [isClientReady, setClientReady] = useState(false);
  const [webPreviewURL, setWebPreviewURL] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  const { appendMessage: copilotSendMessage, isLoading,visibleMessages  } = useCopilotChat();

  console.log("visible",visibleMessages)

  useEffect(() => {
    const listeners = [
      snack.addStateListener((state, prevState) => {
        console.log('State changed: ', state);
        setSnackState(state);
        setWebPreviewURL(state.webPreviewURL || '');
      }),
      snack.addLogListener(({ message }) => console.log(message)),
    ];
    if (process.browser) {
      setClientReady(true);
    }
    return () => listeners.forEach((listener) => listener());
  }, [snack]);

  const sendMessage = async () => {
    if (inputMessage.trim()) {
      setMessages(prevMessages => [...prevMessages, { role: 'user', content: inputMessage }]);
      const response = await copilotSendMessage(new TextMessage({
        content: inputMessage,
        role: Role.User,
      }));
      if (response && typeof response.content === 'string') {
        setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: response.content }]);
      }
      setInputMessage('');
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      snack.updateFiles({
        [currentFile]: {
          type: 'CODE',
          contents: value,
        },
      });
    }
  };

  const goOnline = () => {
    snack.setOnline(true);
  };

  const goOffline = () => {
    snack.setOnline(false);
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev =>
      prev.includes(folderPath)
        ? prev.filter(p => p !== folderPath)
        : [...prev, folderPath]
    );
  };

  const handleFileClick = (filePath: string) => {
    setCurrentFile(filePath);
    setCode(snackState.files[filePath].contents);
  };

  const renderFileTree = (files: Record<string, any>, path = '') => {
    const tree: Record<string, any> = {};

    Object.keys(files).forEach(fileName => {
      const parts = fileName.split('/');
      let currentLevel = tree;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          currentLevel[part] = files[fileName];
        } else {
          if (!currentLevel[part]) {
            currentLevel[part] = {};
          }
          currentLevel = currentLevel[part];
        }
      });
    });

    const renderNode = (node: any, nodePath: string) => {
      if (typeof node === 'object' && node.type !== 'CODE' && node.type !== 'ASSET') {
        const isExpanded = expandedFolders.includes(nodePath);
        return (
          <div key={nodePath}>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:text-gray-100 hover:bg-gray-800"
              onClick={() => toggleFolder(nodePath)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
              {nodePath.split('/').pop()}
            </Button>
            {isExpanded && (
              <div className="ml-4">
                {Object.entries(node).map(([key, value]) => renderNode(value, `${nodePath}/${key}`))}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <Button
            key={nodePath}
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-gray-100 hover:bg-gray-800"
            onClick={() => handleFileClick(nodePath)}
          >
            <File className="h-4 w-4 mr-2" />
            {nodePath.split('/').pop()}
          </Button>
        );
      }
    };

    return Object.entries(tree).map(([key, value]) => renderNode(value, key));
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Left Panel - Chat Interface */}
      <div className="w-1/4 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Chat</h2>
        </div>
        <ScrollArea className="flex-grow">
          {messages.map((message, index) => (
            <div key={index} className={`p-4 ${message.role === 'user' ? 'bg-gray-800' : ''}`}>
              <p className="font-semibold">{message.role === 'user' ? 'You' : 'AI'}</p>
              <p>{message.content}</p>
            </div>
          ))}
          {isLoading && (
            <div className="p-4">
              <p className="font-semibold">AI</p>
              <p>Thinking...</p>
            </div>
          )}
        </ScrollArea>
        <div className="p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <CopilotTextarea
              value={inputMessage}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="bg-gray-800 text-gray-100 w-full"
            />
            <Button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-grow flex">
        <div className="w-1/4 border-r border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold">Files</h2>
          </div>
          <ScrollArea className="h-[calc(100vh-60px)]">
            <div className="p-2">
              {renderFileTree(snackState.files)}
            </div>
          </ScrollArea>
        </div>
        <div className="flex-grow">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code as string}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              theme: 'vs-dark',
            }}
          />
        </div>
      </div>

      {/* Right Panel - Device/QR Code/Simulator/Preview */}
      <div className="w-1/4 border-l border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Preview</h2>
        </div>
        <Tabs defaultValue="preview" className="flex-grow flex flex-col">
          <TabsList className="bg-gray-800 justify-center">
            <TabsTrigger value="preview" className="data-[state=active]:bg-gray-700">Preview</TabsTrigger>
            <TabsTrigger value="mydevice" className="data-[state=active]:bg-gray-700">My Device</TabsTrigger>
            <TabsTrigger value="simulator" className="data-[state=active]:bg-gray-700">Simulator</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="flex-grow flex flex-col">
            <div className="flex-grow flex flex-col items-center justify-center p-4">
              <div className="w-[375px] h-[667px] bg-white rounded-3xl overflow-hidden shadow-lg">
                <iframe
                  className="w-full h-full"
                  ref={(c) => {
                    if (c) {
                      webPreviewRef.current = c.contentWindow;
                    }
                  }}
                  src={isClientReady ? webPreviewURL : undefined}
                  allow="geolocation; camera; microphone"
                />
              </div>
              {isClientReady && !webPreviewURL && (
                <div className="text-center p-4 text-gray-500">
                  <label>Set the SDK Version to 40.0.0 or higher to use Web preview</label>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="mydevice" className="flex-grow flex flex-col items-center justify-center p-4">
            <Button onClick={snackState.online ? goOffline : goOnline} className="bg-blue-600 hover:bg-blue-700 mb-4">
              {snackState.online ? 'Go Offline' : 'Go Online'}
            </Button>
            {snackState.online && snackState.url && (
              <div className="flex flex-col items-center">
                <QRCodeSVG value={snackState.url} size={300} className="mb-4" />
                <a href={snackState.url} className="text-blue-400 hover:underline">{snackState.url}</a>
              </div>
            )}
          </TabsContent>
          <TabsContent value="simulator" className="flex-grow flex flex-col items-center justify-center p-4">
            <Input
              placeholder="Enter Device ID"
              value={snackState.deviceId || ''}
              onChange={(e) => snack.setDeviceId(e.target.value)}
              className="mb-4 bg-gray-800 text-gray-100"
            />
            <Input
              placeholder="Enter SDK Version"
              value={snackState.sdkVersion}
              onChange={(e) => snack.setSDKVersion(e.target.value as SDKVersion)}
              className="mb-4 bg-gray-800 text-gray-100"
            />
            <Button onClick={() => snack.sendCodeChanges()} className="bg-blue-600 hover:bg-blue-700">
              Send Code Changes
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
