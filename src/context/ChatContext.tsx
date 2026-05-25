import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  getDoc,
  where,
  deleteDoc,
  getDocs
} from 'firebase/firestore';

export interface Chat {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  updatedAt: string;
  unreadByAdmin: boolean;
  unreadByUser: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'admin';
  text: string;
  imageUrl?: string;
  createdAt: string;
}

interface ChatContextType {
  activeChats: Chat[];
  activeChatMessages: ChatMessage[];
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
  sendMessage: (text: string, alternateChatId?: string, imageUrl?: string) => Promise<void>;
  markAsRead: (chatId: string, byWho: 'user' | 'admin') => Promise<void>;
  deleteChatSession: (chatId: string) => Promise<void>;
  loadingChats: boolean;
  subscribeToChatMessages: (chatId: string) => () => void;
  chatError: string | null;
  clearChatError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [activeChats, setActiveChats] = useState<Chat[]>([]);
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [loadingChats, setLoadingChats] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const clearChatError = () => setChatError(null);

  // Subscribe to all chats if admin
  useEffect(() => {
    if (!user || !isAdmin) {
      setActiveChats([]);
      return;
    }

    setLoadingChats(true);
    const chatsQuery = query(
      collection(db, 'chats'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const chatsList: Chat[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        chatsList.push({
          id: doc.id,
          userId: data.userId || doc.id,
          userName: data.userName || 'Cliente',
          userEmail: data.userEmail || '',
          lastMessage: data.lastMessage || '',
          updatedAt: data.updatedAt || new Date().toISOString(),
          unreadByAdmin: !!data.unreadByAdmin,
          unreadByUser: !!data.unreadByUser
        });
      });
      setActiveChats(chatsList);
      setLoadingChats(false);
      setChatError(null);
    }, (error) => {
      console.error("List chats onSnapshot error:", error);
      setChatError(`Erro ao carregar lista de chats: ${error.message}`);
      setLoadingChats(false);
    });

    return unsubscribe;
  }, [user, isAdmin]);

  // Subscribe to user own chat if not admin
  useEffect(() => {
    if (!user || isAdmin) return;

    const chatRef = doc(db, 'chats', user.id);
    const unsubscribe = onSnapshot(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const userChat: Chat = {
          id: snapshot.id,
          userId: data.userId || snapshot.id,
          userName: data.userName || user.name,
          userEmail: data.userEmail || user.email,
          lastMessage: data.lastMessage || '',
          updatedAt: data.updatedAt || new Date().toISOString(),
          unreadByAdmin: !!data.unreadByAdmin,
          unreadByUser: !!data.unreadByUser
        };
        setActiveChats([userChat]);
      } else {
        setActiveChats([]);
      }
      setChatError(null);
    }, (error) => {
      console.error("User chat onSnapshot error:", error);
      setChatError(`Erro ao sincronizar seu chat: ${error.message}`);
    });

    return unsubscribe;
  }, [user, isAdmin]);

  // Subscribe to messages of activeChatId
  useEffect(() => {
    if (!currentChatId) {
      setActiveChatMessages([]);
      return;
    }

    const unsub = subscribeToChatMessages(currentChatId);
    return unsub;
  }, [currentChatId]);

  const subscribeToChatMessages = (chatId: string) => {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));

    return onSnapshot(messagesQuery, (snapshot) => {
      const messagesList: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messagesList.push({
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          senderRole: data.senderRole as 'user' | 'admin',
          text: data.text,
          imageUrl: data.imageUrl,
          createdAt: data.createdAt
        });
      });
      setActiveChatMessages(messagesList);
      setChatError(null);
    }, (error) => {
      console.error("Messages list onSnapshot error:", error);
      setChatError(`Erro ao carregar mensagens do chat ${chatId}: ${error.message}`);
    });
  };

  const sendMessage = async (text: string, alternateChatId?: string, imageUrl?: string) => {
    if (!user) return;

    // Determine target chatId (admin can specify user chatId, standard user uses their own id)
    const targetChatId = isAdmin ? (alternateChatId || currentChatId) : user.id;
    if (!targetChatId) return;

    const senderRole = isAdmin ? 'admin' : 'user';
    const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const messageRef = doc(db, 'chats', targetChatId, 'messages', messageId);
    const chatRef = doc(db, 'chats', targetChatId);

    const timestamp = new Date().toISOString();

    const newMessage: ChatMessage = {
      id: messageId,
      senderId: user.id,
      senderName: user.name,
      senderRole,
      text: text.trim(),
      ...(imageUrl ? { imageUrl } : {}),
      createdAt: timestamp
    };

    const finalLastMessage = text.trim() ? text.trim() : (imageUrl ? "📷 Foto" : "");

    try {
      // 1. Create message document
      await setDoc(messageRef, newMessage);

      // 2. Set/Update Chat Parent Document
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        const newChat: Chat = {
          id: targetChatId,
          userId: targetChatId,
          userName: isAdmin ? 'Cliente' : user.name,
          userEmail: isAdmin ? '' : user.email,
          lastMessage: finalLastMessage,
          updatedAt: timestamp,
          unreadByAdmin: !isAdmin,
          unreadByUser: isAdmin
        };
        await setDoc(chatRef, newChat);
      } else {
        await updateDoc(chatRef, {
          lastMessage: finalLastMessage,
          updatedAt: timestamp,
          unreadByAdmin: !isAdmin,
          unreadByUser: isAdmin
        });
      }
      setChatError(null);
    } catch (error: any) {
      console.error("sendMessage error:", error);
      setChatError(`Erro ao enviar mensagem: ${error.message}`);
      handleFirestoreError(error, OperationType.WRITE, `chats/${targetChatId}/messages/${messageId}`);
    }
  };

  const markAsRead = async (chatId: string, byWho: 'user' | 'admin') => {
    const chatRef = doc(db, 'chats', chatId);
    try {
      const snap = await getDoc(chatRef);
      if (snap.exists()) {
        if (byWho === 'admin') {
          await updateDoc(chatRef, { unreadByAdmin: false });
        } else {
          await updateDoc(chatRef, { unreadByUser: false });
        }
      }
      setChatError(null);
    } catch (error: any) {
      console.error("markAsRead error:", error);
      setChatError(`Erro ao marcar como lida: ${error.message}`);
      handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}`);
    }
  };

  const deleteChatSession = async (chatId: string) => {
    const chatRef = doc(db, 'chats', chatId);
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    
    try {
      // List and delete subcollection messages
      const msgsSnap = await getDocs(messagesQuery(chatId));
      for (const msgDoc of msgsSnap.docs) {
        await deleteDoc(doc(db, 'chats', chatId, 'messages', msgDoc.id));
      }
      
      // Delete parent chat
      await deleteDoc(chatRef);
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }
      setChatError(null);
    } catch (error: any) {
      console.error("deleteChatSession error:", error);
      setChatError(`Erro ao deletar sessão de chat: ${error.message}`);
      handleFirestoreError(error, OperationType.DELETE, `chats/${chatId}`);
    }
  };

  // Helper query for listing messages inside chat
  const messagesQuery = (chatId: string) => query(collection(db, 'chats', chatId, 'messages'));

  return (
    <ChatContext.Provider value={{
      activeChats,
      activeChatMessages,
      currentChatId,
      setCurrentChatId,
      sendMessage,
      markAsRead,
      deleteChatSession,
      loadingChats,
      subscribeToChatMessages,
      chatError,
      clearChatError
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
