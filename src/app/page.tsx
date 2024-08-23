"use client";
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquare, FileText, Smartphone, ChevronRight, Send } from 'lucide-react'

export default function Component() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! How can I help you today?' },
    { role: 'user', content: 'Can you explain React hooks?' },
    { role: 'assistant', content: 'React hooks are functions that allow you to use state and other React features in functional components...' },
  ])
  const [inputMessage, setInputMessage] = useState('')

  const sendMessage = () => {
    if (inputMessage.trim()) {
      setMessages([...messages, { role: 'user', content: inputMessage }])
      setInputMessage('')
      // Here you would typically send the message to your AI service and handle the response
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Left Panel - Chat Interface */}
      <div className="w-1/4 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Chat</h2>
        </div>
        <ScrollArea className="flex-grow">
          {messages.map((message, index) => (
            <div key={index} className={`p-4 ${message.role === 'user' ? 'bg-muted' : ''}`}>
              <p className="font-semibold">{message.role === 'user' ? 'You' : 'AI'}</p>
              <p>{message.content}</p>
            </div>
          ))}
        </ScrollArea>
        <div className="p-4 border-t border-border">
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button onClick={sendMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Middle Panel - File List and Code Editor */}
      <div className="flex-grow flex">
        <div className="w-1/4 border-r border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold">Files</h2>
          </div>
          <ScrollArea className="h-[calc(100vh-60px)]">
            <div className="p-2">
              <Button variant="ghost" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                App.js
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                index.js
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                styles.css
              </Button>
            </div>
          </ScrollArea>
        </div>
        <div className="flex-grow">
          <Tabs defaultValue="editor" className="h-full flex flex-col">
            <div className="border-b border-border">
              <TabsList>
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="editor" className="flex-grow">
              <ScrollArea className="h-full">
                <pre className="p-4">
                  <code>{`import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>Hello, World!</h1>
    </div>
  );
}

export default App;`}</code>
                </pre>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="preview" className="flex-grow">
              <div className="p-4">
                <h1 className="text-2xl font-bold">Hello, World!</h1>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Panel - Device/QR Code */}
      <div className="w-1/5 border-l border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Preview</h2>
        </div>
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <Smartphone className="h-32 w-32 text-primary" />
          </div>
          <Button variant="outline" className="mt-4">
            <Smartphone className="mr-2 h-4 w-4" /> My Device
          </Button>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">Scan QR Code</p>
            <img src="/placeholder.svg?height=200&width=200" alt="QR Code" className="mt-2" />
          </div>
        </div>
      </div>
    </div>
  )
}