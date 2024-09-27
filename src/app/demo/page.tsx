'use client'
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, ChevronRight, ChevronDown, File, Save, Lock } from 'lucide-react';
import dynamic from 'next/dynamic';
import defaultCode from '../../components/Defaults';
import { Textarea } from '@/components/ui/textarea';

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const INITIAL_CODE_CHANGES_DELAY = 500;

interface Message {
  role: string;
  content: string;
}

export default function Dashboard() {
  const editorRef = useRef<any>(null);
  const [messages, setMessages] = useState<Message[]>([{
    role: 'v0rn',
    content: 'Hello! What are we building today?'
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [code, setCode] = useState(defaultCode.files?.["App.js"]?.contents || '');
  const [currentFile, setCurrentFile] = useState("App.js");
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
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
    console.log("Code saved:", code);
  };

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900">
      <nav className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
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
                <p className="font-bold text-xs">{message.role === 'user' ? 'You' : 'v0rn'}</p>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                className="text-sm"
              />
              <Button onClick={() => { }}>
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
              {renderFileTree(defaultCode.files)}
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
              value={code as string}
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
        <div className="w-1/4 border-l flex flex-col h-full">
          <Tabs defaultValue="preview" className="h-full">
            <TabsList className="justify-center border-b">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="mydevice">My Device</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="flex-grow flex items-center justify-center p-4">
              <div className="w-[375px] h-[667px] bg-white border-8 border-gray-300 rounded-3xl overflow-hidden shadow-lg">
                <iframe
                  className="w-full h-full"
                  allow="geolocation; camera; microphone"
                />
              </div>
            </TabsContent>
            <TabsContent value="mydevice" className="flex items-center justify-center p-4">
              {/* My Device QR Code content will go here */}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
