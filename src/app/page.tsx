//@ts-nocheck
"use client";
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, ChevronRight, ChevronDown, File, Save } from 'lucide-react';
import Editor from "@monaco-editor/react";
import { QRCodeSVG } from 'qrcode.react';
import { Snack, SnackState } from 'snack-sdk';
import createWorkerTransport from '../components/transports/createWorkerTransport';
import defaultCode from '../components/Defaults';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const INITIAL_CODE_CHANGES_DELAY = 500;
const VERBOSE = !!process.browser;
const USE_WORKERS = true;
const TYPING_SPEED = 1; // milliseconds per character

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY
});
const model = groq('llama3-8b-8192');

export default function Component() {
  const webPreviewRef = useRef(null);
  const editorRef = useRef(null);
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [code, setCode] = useState(defaultCode.files?.["App.js"]?.contents || '');
  const [currentFile, setCurrentFile] = useState("App.js");
  const [snack, setSnack] = useState<Snack | null>(null);
  const [snackState, setSnackState] = useState<SnackState | null>(null);
  const [isClientReady, setClientReady] = useState(false);
  const [webPreviewURL, setWebPreviewURL] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (process.browser) {
      const newSnack = new Snack({
        ...defaultCode,
        disabled: false,
        codeChangesDelay: INITIAL_CODE_CHANGES_DELAY,
        verbose: VERBOSE,
        webPreviewRef: webPreviewRef,
        ...(USE_WORKERS ? { createTransport: createWorkerTransport } : {}),
      });

      setSnack(newSnack);
      setSnackState(newSnack.getState());
      setClientReady(true);

      const listeners = [
        newSnack.addStateListener((state, prevState) => {
          setSnackState(state);
          setWebPreviewURL(state.webPreviewURL || '');
        }),
        newSnack.addLogListener(({ message }) => console.log(message)),
      ];

      newSnack.updateDependencies({
        //@ts-ignore
        '@expo/vector-icons': '~14.0.2'
      });

      return () => listeners.forEach((listener) => listener());
    }
  }, []);

  function extractCode(response: string): string {
    const codeRegex = /```(?:jsx?|javascript|react-native)?\s*([\s\S]*?)\s*```/;
    const match = response.match(codeRegex);

    if (match && match[1]) {
      return match[1].trim();
    }

    return response;
  }

  const simulateStreaming = async (newCode: string) => {
    setIsStreaming(true);
    let currentCode = '';
    for (let i = 0; i < newCode.length; i++) {
      currentCode += newCode[i];
      setCode(currentCode);
      if (snack) {
        snack.updateFiles({
          'App.js': {
            type: 'CODE',
            contents: currentCode,
          },
        });
      }
      if (editorRef.current) {
        //@ts-ignore
        editorRef.current.setValue(currentCode);
      }
      await new Promise(resolve => setTimeout(resolve, TYPING_SPEED));
    }
    setIsStreaming(false);
  };

  const sendMessage = async () => {
    if (inputMessage.trim() && snack) {
      setMessages(prevMessages => [...prevMessages, { role: 'user', content: inputMessage }]);
      setIsLoading(true);
      const conversationHistory = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const defaultPrompt = `
      Current code:
      ${code}

      Conversation history:
      ${conversationHistory}

      User request: ${inputMessage}

      Please generate an updated React Native UI component based on this request and the current code.
      Focus on UI elements and styling, without complex logic.
      Use JavaScript, not TypeScript.
      Implement a visually appealing interface adhering to current design trends:
      - Use a cohesive color scheme.
      - Incorporate ample white space for a clean, uncluttered look.
      - Implement consistent spacing and alignment.
      - Use basic React Native components (View, Text, TouchableOpacity, etc.).
      - Implement a responsive layout using flexbox.
      - Use React Native's StyleSheet API for style definitions.
      - Include placeholder text or mock data directly in the component where needed.
      - Add icons from Expo vector Icons where necessary, with nice colors.
      - Focus on code correctness.

      The output should be a self-contained, ready-to-run UI component with no external dependencies beyond basic React Native. Include only the code, without explanations or comments.
      `
      try {
        const { text } = await generateText({
          model,
          prompt: defaultPrompt,
        });

        const extractedCode = extractCode(text);
        setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: extractedCode.slice(0, 100) + '...' }]);

        await simulateStreaming(extractedCode);

        setCurrentFile('App.js');
      } catch (error) {
        console.error("Error generating text:", error);
        setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
      }

      setInputMessage('');
      setIsLoading(false);
    }
  };

  const handleEditorChange = (value: string | Blob | FormData) => {
    if (value !== undefined && !isStreaming) {
      setCode(value);
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
  };

  const saveCode = () => {
    if (snack) {
      snack.updateFiles({
        [currentFile]: {
          type: 'CODE',
          contents: code,
        },
      });
    }
  };

  const goOnline = () => {
    if (snack) {
      snack.setOnline(true);
    }
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
    if (snackState && snackState.files[filePath]) {
      setCode(snackState.files[filePath].contents);
    }
  };

  const renderFileTree = (files: any, path: string = '') => {
    const tree: any = {};

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
      <div className="w-1/5 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Chat</h2>
        </div>
        <ScrollArea className="flex-grow">
          {messages?.map((message, index) => (
            <div key={index} className={`p-2 m-2 ${message.role === 'user' ? 'bg-blue-600 rounded-br-3xl rounded-tr-3xl rounded-tl-xl' : 'bg-gray-600 rounded-bl-3xl rounded-tl-3xl rounded-tr-xl'}`}>
              <p className="font-semibold">{message.role === 'user' ? 'You' : 'AI'}</p>
              <p>{message.content}</p>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center items-center p-4">
              <div className="animate-bounce mx-1 h-3 w-3 rounded-full bg-gray-400"></div>
              <div className="animate-bounce mx-1 h-3 w-3 rounded-full bg-gray-400" style={{ animationDelay: '0.2s' }}></div>
              <div className="animate-bounce mx-1 h-3 w-3 rounded-full bg-gray-400" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
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
              className="bg-gray-800 text-gray-100 w-full rounded-md p-2"
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
              {snackState && renderFileTree(snackState.files)}
            </div>
          </ScrollArea>
        </div>
        <div className="flex-grow flex flex-col">
          <div className="flex justify-end p-2 bg-gray-800">
            <Button onClick={saveCode} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
          <Editor
            height="calc(100% - 48px)"
            defaultLanguage="javascript"
            value={code as string}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              theme: "vs-dark",
              readOnly: isStreaming,
            }}
          />
        </div>
      </div>
      {/* Right Panel - Device/QR Code/Simulator/Preview */}
      <div className="w-1/4 border-l border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Preview</h2>
        </div>
        <Tabs defaultValue="preview" className="flex-grow flex flex-col" onValueChange={(value) => {
          if (value === 'mydevice') {
            goOnline();
          }
        }}>
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
                  ref={(c) => (webPreviewRef.current = c?.contentWindow ?? null)}
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
            {snackState?.online && snackState?.url && (
              <div className="flex flex-col items-center">
                <QRCodeSVG value={snackState.url} size={300} className="mb-4" />
                <a href={snackState?.url} className="text-blue-400 hover:underline">{snackState?.url}</a>
              </div>
            )}
          </TabsContent>
          <TabsContent value="simulator" className="flex-grow flex flex-col items-center justify-center p-4">
            <Input
              placeholder="Enter Device ID"
              value={snackState?.deviceId || ''}
              onChange={(e) => snack?.setDeviceId(e.target.value)}
              className="mb-4 bg-gray-800 text-gray-100"
            />
            <Input
              placeholder="Enter SDK Version"
              value={snackState?.sdkVersion}
              onChange={(e) => snack?.setSDKVersion(e.target.value)}
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