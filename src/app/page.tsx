"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, ChevronRight, ChevronDown, File, Save, Lock } from 'lucide-react';
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
const TYPING_SPEED = 0.1;

export default function Dashboard() {
  const webPreviewRef = useRef<HTMLIFrameElement | null>(null);
  const editorRef = useRef<any>(null);
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([
    { role: 'assistant', content: 'Hello! How can I help you today?' },
    { role: 'user', content: 'Can you help me with React hooks?' },
    { role: 'assistant', content: 'React hooks are functions that allow you to use state and other React features in functional components. What specific aspect of hooks would you like to know about?' }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [code, setCode] = useState<string>(defaultCode.files?.["App.js"]?.contents as string || '');
  const [currentFile, setCurrentFile] = useState<string>("App.js");
  const [snack, setSnack] = useState<Snack | null>(null);
  const [snackState, setSnackState] = useState<SnackState | null>(null);
  const [isClientReady, setClientReady] = useState<boolean>(false);
  const [webPreviewURL, setWebPreviewURL] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY
  });

  const model = groq('llama3-8b-8192');

  useEffect(() => {
    if (process.browser) {
      const newSnack = new Snack({
        ...defaultCode,
        disabled: false,
        codeChangesDelay: INITIAL_CODE_CHANGES_DELAY,
        verbose: VERBOSE,
        webPreviewRef: webPreviewRef as any,
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
        '@expo/vector-icons': '~14.0.2',
        //@ts-ignore
        'react-native-chart-kit': '~1.2.1'
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
        editorRef.current.setValue(currentCode);
      }
      await new Promise(resolve => setTimeout(resolve, TYPING_SPEED));
    }
    setIsStreaming(false);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (typeof value === 'string' && !isStreaming) {
      setCode(value);
    }
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
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
      setCode(snackState?.files[filePath].contents as string);
    }
  };

  const renderFileTree = (files: { [key: string]: any }, path = '') => {
    const tree: { [key: string]: any } = {};

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
              className="w-full justify-start text-gray-700 hover:bg-gray-100"
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
            className="w-full justify-start text-gray-700 hover:bg-gray-100"
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

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900">
      <nav className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          {/* <Menu className="h-6 w-6 mr-2" /> */}
          <h1 className="text-xl font-bold flex flex-row">
            VxRN
            <Lock className="h-4 w-4 ml-2 mt-1" />
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline">Preview</Button>
          <Button variant="outline">Fork</Button>
          <Button>Publish</Button>
        </div>
      </nav>
      <div className="flex flex-grow">
        {/* Left Panel - Chat Interface */}
        <div className="w-1/4 border-r flex flex-col">
          <ScrollArea className="flex-grow">
            {messages.map((message, index) => (
              <div key={index} className={`p-2 m-2 text-sm ${message.role === 'user' ? 'ml-4' : 'mr-4'}`}>
                <p className="font-semibold text-xs">{message.role === 'user' ? 'You' : 'AI'}</p>
                <p className="whitespace-pre-wrap">{message.content}</p>
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
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                className="text-sm"
              />
              <Button onClick={sendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Middle Panel - File Tree and Code Editor */}
        <div className="flex-grow flex">
          <div className="w-1/4 border-r">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Files</h2>
            </div>
            <ScrollArea className="h-[calc(100vh-8rem)]">
              {snackState && renderFileTree(snackState.files)}
            </ScrollArea>
          </div>
          <div className="flex-grow flex flex-col">
            <div className="p-2 border-b flex justify-between items-center">
              <span>{currentFile}</span>
              <Button variant="outline" size="sm" onClick={saveCode}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
            <Editor
              height="calc(100% - 40px)"
              defaultLanguage="javascript"
              value={code}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              theme="vs-light"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
              }}
            />
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-1/4 border-l flex flex-col">
          <Tabs defaultValue="preview" className="flex-grow flex flex-col" onValueChange={(value) => {
            if (value === 'mydevice') {
              goOnline();
            }
          }}>
            <TabsList className="justify-center border-b">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="mydevice">My Device</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="flex-grow flex flex-col items-center justify-center p-4">
              <div className="w-[375px] h-[667px] bg-white border-8 border-gray-300 rounded-3xl overflow-hidden shadow-lg">
                {isClientReady && webPreviewURL ? (
                  <iframe
                    // @ts-ignore
                    ref={(c) => (webPreviewRef.current = c?.contentWindow ?? null)}
                    src={webPreviewURL}
                    className="w-full h-full"
                    allow="geolocation; camera; microphone"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Preview not available
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="mydevice" className="flex-grow flex flex-col items-center justify-center p-4">
              {snackState?.online && snackState?.url && (
                <>
                  <QRCodeSVG value={snackState.url} size={200} />
                  <p className="mt-4 text-sm text-gray-600">Scan with your device to open the app</p>
                  <a href={snackState.url} className="mt-2 text-sm text-blue-500 hover:underline">{snackState.url}</a>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}