'use client';

import React, { useEffect, useState } from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Badge, Button, Drawer, Spin, Empty, Tooltip } from 'antd';
import { SendOutlined } from '@ant-design/icons';

interface HelpNestMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
}

interface HelpNestChatProps {
  user?: User | null;
}

export const HelpNestChat: React.FC<HelpNestChatProps> = ({ user }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<HelpNestMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Load conversation from localStorage
  useEffect(() => {
    if (!user?.id) return;
    const saved = localStorage.getItem(`helpnest-chat-${user.id}`);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load chat history:', e);
      }
    }
  }, [user?.id]);

  // Save conversation to localStorage
  useEffect(() => {
    if (messages.length > 0 && user?.id) {
      localStorage.setItem(`helpnest-chat-${user.id}`, JSON.stringify(messages));
    }
  }, [messages, user?.id]);

  // Simulate AI response for now (in Phase 2, this will call actual HelpNest API)
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: HelpNestMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // TODO: In Phase 2, replace with actual HelpNest API call
      // const response = await fetch('https://helpnest.yourdomain.com/api/chat', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     message: input,
      //     workspaceId: 'buildtrack-default',
      //     userId: user?.id,
      //     userEmail: user?.email,
      //     userName: user?.name,
      //   }),
      // });

      // For now, return a helpful placeholder message
      await new Promise(resolve => setTimeout(resolve, 1000));

      const assistantMessage: HelpNestMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Thank you for your question! HelpNest is being set up. Please visit the /support page for the full knowledge base and AI chat interface.`,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: HelpNestMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or visit the /support page.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Tooltip title="Help & Support (AI Chat)">
        <Badge count={unreadCount} offset={[-10, 10]}>
          <Button
            type="text"
            icon={<QuestionCircleOutlined style={{ fontSize: 18 }} />}
            onClick={() => setOpen(true)}
          />
        </Badge>
      </Tooltip>

      <Drawer
        title="BuildTrack Support"
        placement="right"
        onClose={() => setOpen(false)}
        open={open}
        width={400}
        styles={{
          body: {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: '16px',
          },
        }}
      >
        {/* Chat Messages */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            marginBottom: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {messages.length === 0 ? (
            <Empty
              description="No messages yet"
              style={{ marginTop: 32 }}
            />
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: msg.type === 'user' ? '#e6f7ff' : '#f5f5f5',
                  marginLeft: msg.type === 'user' ? 24 : 0,
                  marginRight: msg.type === 'assistant' ? 24 : 0,
                }}
              >
                <p style={{ margin: 0, fontSize: 14 }}>{msg.content}</p>
                <span style={{ fontSize: 12, color: '#999' }}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
          {loading && <Spin size="small" />}
        </div>

        {/* Input Area */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Ask a question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
            disabled={loading}
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 4,
              border: '1px solid #d9d9d9',
              fontFamily: 'inherit',
              fontSize: 14,
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            loading={loading}
            disabled={!input.trim()}
            size="small"
          />
        </div>
      </Drawer>
    </>
  );
};
