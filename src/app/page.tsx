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
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const INITIAL_CODE_CHANGES_DELAY = 500;
const VERBOSE = !!process.browser;
const USE_WORKERS = true;

console.log("KEY", process.env.GROQ_API_KEY);
const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY
});
const model = groq('llama3-8b-8192');

export default function Component() {
  const webPreviewRef = useRef<Window | null>(null);
  const [messages, setMessages] = useState([]);
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


  useEffect(() => {
    const listeners = [
      snack.addStateListener((state, prevState) => {
        setSnackState(state);
        setWebPreviewURL(state.webPreviewURL || '');
      }),

      snack.addLogListener(({ message }) => console.log(message)),
    ];
    snack.updateDependencies(
      {
        '@expo/vector-icons': '~14.0.2'
      }
    )
    if (process.browser) {
      setClientReady(true);
    }
    return () => listeners.forEach((listener) => listener());
  }, [snack]);
  function extractCode(response) {
    const codeRegex = /```(?:jsx?|javascript)?\s*([\s\S]*?)\s*```/;
    const match = response.match(codeRegex);

    if (match && match[1]) {
      return match[1].trim();
    }

    return response;
  }

  const sendMessage = async () => {
    if (inputMessage.trim()) {
      setMessages(prevMessages => [...prevMessages, { role: 'user', content: inputMessage }]);
      const defaultPrompt = `
      Please generate a React Native UI component based on this request: ${inputMessage}.

      Create a single, self-contained component file with minimal necessary imports.
      Focus solely on UI elements and styling, without any data fetching or complex logic.
      Use JavaScript instead of TypeScript.
      Implement a visually appealing interface adhering to current design trends:

      Use a cohesive color scheme.
      Incorporate ample white space for a clean, uncluttered look.
      Implement consistent spacing and alignment.
      Use basic React Native components (View, Text, TouchableOpacity, etc.).
      Implement a responsive layout using flexbox.
      Use React Native's StyleSheet API for style definitions.
      Include placeholder text or mock data directly in the component where needed.
      Omit any data fetching, state management, or complex hooks (except useState if absolutely necessary for UI interactions).
      Keep the component structure simple and focused on visual representation.
      Always add icons from Expo vector Icons where necessary, and give them nice colors as well. Focus on correctness of the code as well. 
      The output should be a self-contained, ready-to-run UI component with no external dependencies beyond basic React Native. Include only the code, without any explanations or comments.
`
      try {
        const { text } = await generateText({
          model,
          prompt: defaultPrompt,
        });

        setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: text }]);
        // Update the Snack with the new code
        snack.updateFiles({
          'App.js': {
            type: 'CODE',
            contents: extractCode(text),
          },
        });

        // Update the code state
        setCode(text);

        // Set the current file to App.js
        setCurrentFile('App.js');
      } catch (error) {
        console.error("Error generating text:", error);
        setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
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
          {messages?.map((message, index) => (
            <div key={index} className={`p-4 ${message.role === 'user' ? 'bg-gray-800' : ''}`}>
              <p className="font-semibold">{message.role === 'user' ? 'You' : 'AI'}</p>
              <p>{message.content}</p>
            </div>
          ))}
        </ScrollArea>
        <div className="p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={(e) => {
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
              theme: "vs-dark",
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
