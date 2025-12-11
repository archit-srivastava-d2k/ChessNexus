import React, { ReactNode } from 'react';
import { Message } from 'ai'; 
import ReactMarkdown from 'react-markdown';

interface BubbleProps {
  message: Message;
  children?: ReactNode;
}

export const Bubble: React.FC<BubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`bubble ${isUser ? 'user' : 'assistant'}`}>
      <ReactMarkdown>{message.content}</ReactMarkdown>
    </div>
  );
};