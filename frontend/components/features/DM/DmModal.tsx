'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/shadcn/ui/dialog';
import { Button } from '@/components/shadcn/ui/button';
import { Input } from '@/components/shadcn/ui/input';
import { ScrollArea } from '@/components/shadcn/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { getDMHistory } from '@/services/api';
import { WS_URL } from '@/lib/api_url_config';
import { Loader2, SendHorizonal } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Message {
    id?: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    created_at?: string;
}

// Type for messages sent via WebSocket
interface WebSocketSendMessage {
    from: number;
    to: number;
    content: string;
}

interface WebSocketReceiveMessage {
    from: number;
    to: number;
    content: string;
    
}

interface DmModalProps {
    recipientUserId: number;
    recipientUsername: string;
    children: React.ReactNode; // To wrap the trigger button
}

export function DmModal({ recipientUserId, recipientUsername, children }: DmModalProps) {
    const { userId: senderId } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const ws = useRef<WebSocket | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            const scrollViewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollViewport) {
                scrollViewport.scrollTop = scrollViewport.scrollHeight;
            }
        }
    };

    const fetchHistory = useCallback(async () => {
        if (!senderId) return;
        setIsLoadingHistory(true);
        setError(null);
        try {
            const response = await getDMHistory(senderId, recipientUserId);
            setMessages(response.data || []);
            setTimeout(scrollToBottom, 0); // Scroll after messages are rendered
        } catch (err) {
            console.error('Failed to fetch DM history:', err);
            setError('Could not load message history.');
        } finally {
            setIsLoadingHistory(false);
        }
    }, [senderId, recipientUserId]);

    const connectWebSocket = useCallback(() => {
        if (!senderId || !isOpen) return;

        const wsUrlWithUser = `${WS_URL}?user_id=${senderId}`;
        console.log(`Connecting to WebSocket: ${wsUrlWithUser}`);
        ws.current = new WebSocket(wsUrlWithUser);

        ws.current.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.current.onmessage = (event) => {
            try {
                const receivedMessage: WebSocketReceiveMessage = JSON.parse(event.data);
                console.log('WebSocket message received:', receivedMessage);

                // Check if the received message pertains to the currently open chat
                if ((receivedMessage.from === senderId && receivedMessage.to === recipientUserId) ||
                    (receivedMessage.from === recipientUserId && receivedMessage.to === senderId)) {
                    
                    // Convert to the frontend Message format
                    const newMessageForState: Message = {
                        sender_id: receivedMessage.from,
                        receiver_id: receivedMessage.to,
                        content: receivedMessage.content,
                        created_at: new Date().toISOString() // Add a client-side timestamp for immediate display
                    };

                    setMessages((prev) => [...prev, newMessageForState]);
                    setTimeout(scrollToBottom, 0); // Scroll after new message
                }
            } catch (e) {
                console.error('Failed to parse WebSocket message:', e);
            }
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            setError('WebSocket connection error.');
        };

        ws.current.onclose = () => {
            console.log('WebSocket disconnected');
        };

    }, [senderId, recipientUserId, isOpen]);

    const disconnectWebSocket = useCallback(() => {
        if (ws.current) {
            console.log('Closing WebSocket connection');
            ws.current.close();
            ws.current = null;
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
            connectWebSocket();
        } else {
            disconnectWebSocket();
            // Reset state when modal closes
            setMessages([]);
            setNewMessage('');
            setError(null);
        }
        // Cleanup function
        return () => {
            disconnectWebSocket();
        };
    }, [isOpen, fetchHistory, connectWebSocket, disconnectWebSocket]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN || !senderId) {
            console.error('Cannot send message. WebSocket not open or senderId missing.');
            return;
        }

        const messageToSend: WebSocketSendMessage = {
            from: senderId,
            to: recipientUserId,
            content: newMessage.trim(),
        };

        try {
            ws.current.send(JSON.stringify(messageToSend));
            console.log('Message sent via WebSocket:', messageToSend);
            // setMessages((prev) => [...prev, { ...message, sender_id: senderId, receiver_id: recipientUserId, created_at: new Date().toISOString() }]);
            setNewMessage('');
            setTimeout(scrollToBottom, 0); // Scroll after sending
        } catch (error) {
            console.error('Failed to send message via WebSocket:', error);
            setError('Failed to send message.');
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(event.target.value);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent default Enter behavior (like form submission)
            handleSendMessage();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px] md:max-w-[600px] bg-[#030711] border-[#343536] text-white flex flex-col h-[70vh]">
                <DialogHeader>
                    <DialogTitle>Chat with {recipientUsername}</DialogTitle>
                </DialogHeader>
                <div className="flex-grow overflow-hidden">
                    <ScrollArea className="h-full pr-4" ref={scrollAreaRef}>
                        <div className="space-y-4 py-4">
                            {isLoadingHistory ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                            ) : error ? (
                                <div className="text-center text-red-400">{error}</div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-[#818384]">No messages yet. Start the conversation!</div>
                            ) : (
                                messages.map((msg, index) => (
                                    <div
                                        key={msg.id || `msg-${index}`}
                                        className={`flex flex-col ${msg.sender_id === senderId ? 'items-end' : 'items-start'}`}>
                                        <div
                                            className={`max-w-[75%] rounded-lg px-3 py-2 ${msg.sender_id === senderId
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-[#262729] text-[#D7DADC]' 
                                                }`}>
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                        {msg.created_at && (
                                             <p className="text-xs text-[#818384] mt-1">
                                                 {format(parseISO(msg.created_at.replace('Z', '')), 'MMM d, HH:mm')}
                                             </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
                <DialogFooter className="mt-auto pt-4 border-t border-[#343536]">
                    <div className="flex w-full items-center space-x-2">
                        <Input
                            id="message"
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-[#1A1A1B] border-[#343536] text-white placeholder:text-[#818384] focus:border-blue-500 focus-visible:ring-0"
                            autoComplete="off"
                        />
                        <Button 
                            type="button" 
                            size="icon" 
                            onClick={handleSendMessage} 
                            disabled={!newMessage.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN}
                            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <SendHorizonal className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 