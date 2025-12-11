"use client"
import Image from "next/image"
import type React from "react"

import { useState, useEffect, useRef } from "react"
import { PromptSuggestionRow } from "./components/PromptSuggestionRow"
import { LoadingBubble } from "./components/LoadingBubble"
import { Bubble } from "./components/Bubble"
import ReactMarkdown from "react-markdown"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

const Home = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handlePromptClick = (prompt: string) => {
    sendMessage(prompt)
  }

  const sendMessage = async (text: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    }

    // Update messages state immediately with the new user message
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Use the updated messages array that includes the new user message
        body: JSON.stringify({ messages: updatedMessages }),
      })

      const reply = await res.text()
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply,
      }

      // Add assistant message to the current messages (which already includes the user message)
      setMessages((prevMessages) => [...prevMessages, assistantMessage])
    } catch (err) {
      console.error("Error sending message:", err)
      // On error, you might want to remove the user message or show an error state
    } finally {
      setIsLoading(false)
      setInput("")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage(input)
  }

  const noMessages = messages.length === 0

  return (
    <main>
      <div className="header">
        <Image src="/assets/logochess1.png" width={250} height={250} alt="ChessGPT Logo" priority />
      </div>

      <section className={noMessages ? "" : "populated"}>
        {noMessages ? (
          <>
            <p className="starter-text">
              ♔ Welcome to ChessGPT ♔<br />
              Ask any chess-related question and get expert answers powered by AI
            </p>
            <PromptSuggestionRow onPromptClick={handlePromptClick} />
          </>
        ) : (
          <>
            {messages.map((message) => (
              <Bubble key={message.id} message={message}>
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </Bubble>
            ))}
            {isLoading && <LoadingBubble />}
            <div ref={messagesEndRef} />
          </>
        )}
      </section>

      <form onSubmit={handleSubmit}>
        <input
          className="question-box"
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder="Ask about chess strategies, openings, tactics..."
        />
        <input type="submit" value="Send" />
      </form>
    </main>
  )
}

export default Home