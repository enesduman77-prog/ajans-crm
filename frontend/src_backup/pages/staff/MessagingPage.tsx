import { useEffect, useState, useRef, useCallback } from 'react';
import { messagingApi } from '../../api/messaging';
import { useAuth } from '../../store/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { ConversationResponse, MessageResponse as MsgResponse, ContactResponse, GroupConversationResponse, GroupMessageResponse } from '../../api/messaging';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Send, Plus, X,
    Check, CheckCheck, UserCircle, Users
} from 'lucide-react';

function timeAgo(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'şimdi';
    if (mins < 60) return `${mins}dk`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}sa`;
    const days = Math.floor(hours / 24);
    return `${days}g`;
}

export default function MessagingPage() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<ConversationResponse[]>([]);
    const [activeConv, setActiveConv] = useState<ConversationResponse | null>(null);
    const [messages, setMessages] = useState<MsgResponse[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [msgLoading, setMsgLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // New conversation modal
    const [showNewConv, setShowNewConv] = useState(false);
    const [contacts, setContacts] = useState<ContactResponse[]>([]);

    // Group chat state
    const [tab, setTab] = useState<'dm' | 'group'>('dm');
    const [groups, setGroups] = useState<GroupConversationResponse[]>([]);
    const [activeGroup, setActiveGroup] = useState<GroupConversationResponse | null>(null);
    const [groupMessages, setGroupMessages] = useState<GroupMessageResponse[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleWsMessage = useCallback((msg: MsgResponse) => {
        setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
        });
        // Update conversation list locally with new message info
        setConversations(prev => prev.map(c =>
            c.id === msg.conversationId
                ? { ...c, lastMessage: msg, updatedAt: msg.createdAt }
                : c
        ));
    }, []);

    // Handle messages arriving on user-specific topic (from other conversations)
    const handleGlobalMessage = useCallback((msg: MsgResponse) => {
        // If message is for the active conversation, it's already handled by handleWsMessage
        if (msg.conversationId === activeConv?.id) return;
        // Update conversation list with new message and increment unread count
        setConversations(prev => {
            const existing = prev.find(c => c.id === msg.conversationId);
            if (existing) {
                return prev.map(c =>
                    c.id === msg.conversationId
                        ? { ...c, lastMessage: msg, updatedAt: msg.createdAt, unreadCount: c.unreadCount + 1 }
                        : c
                );
            }
            return prev;
        });
    }, [activeConv?.id]);

    const handleReadReceipt = useCallback((data: { conversationId: string }) => {
        // Mark all my messages in this conversation as read
        setMessages(prev => prev.map(m =>
            m.senderId === user?.id && m.conversationId === data.conversationId ? { ...m, isRead: true } : m
        ));
    }, [user?.id]);

    const { connected, sendMessage: wsSend } = useWebSocket({
        conversationId: activeConv?.id || null,
        userId: user?.id || null,
        onMessage: handleWsMessage,
        onGlobalMessage: handleGlobalMessage,
        onReadReceipt: handleReadReceipt,
    });

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadConversations = async () => {
        try {
            const [convData, groupData] = await Promise.all([
                messagingApi.getMyConversations(),
                messagingApi.getMyGroups(),
            ]);
            setConversations(convData);
            setGroups(groupData);
        } catch {
            setError('Konuşmalar yüklenemedi');
        }
        setLoading(false);
    };

    const loadContacts = async () => {
        try {
            const data = await messagingApi.getContacts();
            setContacts(data);
        } catch {
            setError('Kişiler yüklenemedi');
        }
    };

    const selectConversation = async (conv: ConversationResponse) => {
        setActiveConv(conv);
        setActiveGroup(null);
        setMsgLoading(true);
        try {
            const data = await messagingApi.getMessages(conv.id);
            setMessages(data.content);
            // reduce unread count to 0 in UI
            setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
        } catch {
            setError('Mesajlar yüklenemedi');
        }
        setMsgLoading(false);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConv) return;

        // Try WebSocket first, fallback to REST
        if (connected && wsSend(activeConv.id, newMessage)) {
            setNewMessage('');
        } else {
            try {
                const sent = await messagingApi.sendMessage(activeConv.id, { content: newMessage });
                setMessages(prev => [...prev, sent]);
                setNewMessage('');
                setConversations(prev => prev.map(c =>
                    c.id === activeConv.id
                        ? { ...c, lastMessage: sent, updatedAt: sent.createdAt }
                        : c
                ));
            } catch {
                setError('Mesaj gönderilemedi');
            }
        }
    };

    const openNewConversation = async () => {
        setShowNewConv(true);
        await loadContacts();
    };

    const startConversationWith = async (targetUserId: string) => {
        try {
            const created = await messagingApi.startConversation(targetUserId);

            // Check if it already exists in our list
            const existing = conversations.find(c => c.id === created.id);
            if (!existing) {
                setConversations(prev => [created, ...prev]);
            }

            setActiveConv(created);
            setActiveGroup(null);
            setShowNewConv(false);

            // load msgs and reset unread
            selectConversation(created);

        } catch (e) {
            console.error('Failed to start conversation', e);
        }
    };

    const selectGroup = async (group: GroupConversationResponse) => {
        setActiveGroup(group);
        setActiveConv(null);
        setMsgLoading(true);
        try {
            const data = await messagingApi.getGroupMessages(group.id);
            setGroupMessages(data.content);
            setGroups(prev => prev.map(g => g.id === group.id ? { ...g, unreadCount: 0 } : g));
        } catch {
            setError('Mesajlar yüklenemedi');
        }
        setMsgLoading(false);
    };

    const handleGroupSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeGroup) return;
        try {
            const sent = await messagingApi.sendGroupMessage(activeGroup.id, { content: newMessage });
            setGroupMessages(prev => [...prev, sent]);
            setNewMessage('');
            setGroups(prev => prev.map(g =>
                g.id === activeGroup.id
                    ? { ...g, lastMessage: sent, updatedAt: sent.createdAt }
                    : g
            ));
        } catch {
            setError('Mesaj gönderilemedi');
        }
    };

    return (
        <div className="flex h-[calc(100dvh-3.5rem)] bg-[#09090b] -m-4 md:-m-8 rounded-none md:rounded-2xl overflow-hidden border-0 md:border md:border-white/[0.06] relative">
            {/* Error Toast */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg"
                    >
                        {error}
                        <button onClick={() => setError(null)} className="ml-3 text-white/70 hover:text-white">
                            <X className="w-3 h-3 inline" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Conversations Sidebar */}
            <div className={`w-full md:w-80 bg-[#111113] border-r border-white/[0.06] flex flex-col ${activeConv || activeGroup ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-cyan-400" />
                        Mesajlar
                    </h2>
                    <button
                        onClick={openNewConversation}
                        className="h-8 w-8 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 flex items-center justify-center transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/[0.06]">
                    <button
                        onClick={() => setTab('dm')}
                        className={`flex-1 py-2.5 text-xs font-semibold tracking-wide transition-colors ${tab === 'dm' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Direkt Mesajlar
                    </button>
                    <button
                        onClick={() => setTab('group')}
                        className={`flex-1 py-2.5 text-xs font-semibold tracking-wide transition-colors relative ${tab === 'group' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Gruplar
                        {groups.reduce((sum, g) => sum + g.unreadCount, 0) > 0 && (
                            <span className="ml-1.5 bg-red-500 text-white text-[9px] font-bold h-4 min-w-4 px-1 rounded-full inline-flex items-center justify-center">
                                {groups.reduce((sum, g) => sum + g.unreadCount, 0)}
                            </span>
                        )}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-12 text-zinc-600 text-sm">Yükleniyor...</div>
                    ) : tab === 'dm' ? (
                        conversations.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <MessageSquare className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                                <p className="text-zinc-600 text-sm">Henüz mesajınız yok</p>
                                <button
                                    onClick={openNewConversation}
                                    className="mt-3 text-cyan-400 text-xs hover:text-cyan-300 transition-colors"
                                >
                                    Kişi seçin ve mesajlaşmaya başlayın →
                                </button>
                            </div>
                        ) : (
                            conversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => selectConversation(conv)}
                                    className={`w-full p-4 text-left border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${activeConv?.id === conv.id ? 'bg-white/[0.04]' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-[#18181b] flex items-center justify-center overflow-hidden">
                                            {conv.otherUserAvatarUrl ? (
                                                <img src={conv.otherUserAvatarUrl} alt={conv.otherUserName} className="w-full h-full object-cover" />
                                            ) : (
                                                <UserCircle className="w-6 h-6 text-zinc-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-white truncate">{conv.otherUserName}</p>
                                                <span className="text-[10px] text-zinc-600 shrink-0 ml-2">
                                                    {conv.updatedAt ? timeAgo(conv.updatedAt) : ''}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-xs text-zinc-500 truncate flex-1 pr-2">
                                                    {conv.lastMessage?.content || 'Sohbet başladı'}
                                                </p>
                                                {conv.unreadCount > 0 && (
                                                    <span className="bg-red-500 text-white text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )
                    ) : (
                        groups.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <Users className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                                <p className="text-zinc-600 text-sm">Henüz grup yok</p>
                            </div>
                        ) : (
                            groups.map(group => (
                                <button
                                    key={group.id}
                                    onClick={() => selectGroup(group)}
                                    className={`w-full p-4 text-left border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${activeGroup?.id === group.id ? 'bg-white/[0.04]' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-cyan-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-white truncate">{group.name}</p>
                                                <span className="text-[10px] text-zinc-600 shrink-0 ml-2">
                                                    {group.updatedAt ? timeAgo(group.updatedAt) : ''}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-xs text-zinc-500 truncate flex-1 pr-2">
                                                    {group.lastMessage
                                                        ? `${group.lastMessage.senderName.split(' ')[0]}: ${group.lastMessage.content}`
                                                        : `${group.memberCount} üye`}
                                                </p>
                                                {group.unreadCount > 0 && (
                                                    <span className="bg-red-500 text-white text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                                                        {group.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-[#09090b] ${!activeConv && !activeGroup ? 'hidden md:flex' : 'flex'}`}>
                {activeGroup ? (
                    <>
                        <div className="h-16 border-b border-white/[0.06] flex items-center justify-between px-6 bg-[#111113]/80">
                            <div className="flex items-center gap-3">
                                <button className="md:hidden text-zinc-400 hover:text-white mr-2" onClick={() => setActiveGroup(null)}>
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="h-8 w-8 rounded-full bg-cyan-500/10 flex items-center justify-center border border-white/[0.06]">
                                    <Users className="w-4 h-4 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">{activeGroup.name}</h3>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                        {activeGroup.memberCount} üye · {activeGroup.companyName}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                            {msgLoading ? (
                                <div className="text-center py-12 text-zinc-600 text-sm">Mesajlar yükleniyor...</div>
                            ) : groupMessages.length === 0 ? (
                                <div className="text-center py-12 text-zinc-600 text-sm">Gruba ilk mesajı gönderin</div>
                            ) : (
                                groupMessages.map(msg => {
                                    const isMine = msg.senderId === user?.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-3 ${isMine
                                                ? 'bg-cyan-500 text-white rounded-br-sm'
                                                : 'bg-[#18181b] text-zinc-100 rounded-bl-sm border border-white/[0.06]'
                                                }`}>
                                                {!isMine && (
                                                    <p className="text-[11px] font-semibold text-cyan-400 mb-1">{msg.senderName}</p>
                                                )}
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMine ? 'text-cyan-200' : 'text-zinc-500'}`}>
                                                    <span>
                                                        {new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-[#111113] border-t border-white/[0.06]">
                            <form onSubmit={handleGroupSend} className="max-w-4xl mx-auto flex items-end gap-3">
                                <div className="flex-1 relative">
                                    <textarea
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleGroupSend(e);
                                            }
                                        }}
                                        placeholder="Gruba mesaj yazın..."
                                        className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                                        rows={1}
                                        style={{ minHeight: '44px', maxHeight: '120px' }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="h-11 w-11 shrink-0 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white flex items-center justify-center disabled:opacity-50 transition-all font-bold group"
                                >
                                    <Send className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : activeConv ? (
                    <>
                        <div className="h-16 border-b border-white/[0.06] flex items-center justify-between px-6 bg-[#111113]/80">
                            <div className="flex items-center gap-3">
                                <button className="md:hidden text-zinc-400 hover:text-white mr-2" onClick={() => setActiveConv(null)}>
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="h-8 w-8 rounded-full bg-[#18181b] flex items-center justify-center overflow-hidden border border-white/[0.06]">
                                    {activeConv.otherUserAvatarUrl ? (
                                        <img src={activeConv.otherUserAvatarUrl} alt={activeConv.otherUserName} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserCircle className="w-5 h-5 text-zinc-500" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">{activeConv.otherUserName}</h3>
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                                        {activeConv.otherUserCompanyName
                                            ? `${activeConv.otherUserCompanyName} · ${activeConv.otherUserMembershipRole === 'OWNER' ? 'Şirket Sahibi' : activeConv.otherUserMembershipRole === 'EMPLOYEE' ? 'Şirket Çalışanı' : 'Ajans Çalışanı'}${activeConv.otherUserPositionTitle ? ' · ' + activeConv.otherUserPositionTitle : ''}`
                                            : activeConv.otherUserRole === 'ADMIN' ? 'Yönetici' : activeConv.otherUserRole === 'AGENCY_STAFF' ? 'Ajans Çalışanı' : 'Kullanıcı'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                            {msgLoading ? (
                                <div className="text-center py-12 text-zinc-600 text-sm">Mesajlar yükleniyor...</div>
                            ) : messages.length === 0 ? (
                                <div className="text-center py-12 text-zinc-600 text-sm">İlk mesajı gönderin</div>
                            ) : (
                                messages.map(msg => {
                                    const isMine = msg.senderId === user?.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-3 ${isMine
                                                ? 'bg-cyan-500 text-white rounded-br-sm'
                                                : 'bg-[#18181b] text-zinc-100 rounded-bl-sm border border-white/[0.06]'
                                                }`}>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMine ? 'text-cyan-200' : 'text-zinc-500'}`}>
                                                    <span>
                                                        {new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                    {isMine && (
                                                        msg.isRead ? <CheckCheck className="w-3 h-3 text-cyan-200" /> : <Check className="w-3 h-3 text-cyan-200/50" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-[#111113] border-t border-white/[0.06]">
                            <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-3">
                                <div className="flex-1 relative">
                                    <textarea
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend(e);
                                            }
                                        }}
                                        placeholder="Bir mesaj yazın..."
                                        className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 resize-none"
                                        rows={1}
                                        style={{ minHeight: '44px', maxHeight: '120px' }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="h-11 w-11 shrink-0 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white flex items-center justify-center disabled:opacity-50 transition-all font-bold group"
                                >
                                    <Send className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 text-zinc-700" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">Acente CRM Mesajlaşma</h3>
                        <p className="max-w-sm text-sm">
                            Sol taraftan bir görüşme seçin veya yeni bir sohbet başlatmak için <b>+</b> butonuna tıklayın.
                        </p>
                    </div>
                )}
            </div>

            {/* Contacts Modal */}
            <AnimatePresence>
                {showNewConv && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowNewConv(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-[#111113] border border-white/[0.08] rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                                <h3 className="text-lg font-bold text-white">Yeni Sohbet Başlat</h3>
                                <button onClick={() => setShowNewConv(false)} className="text-zinc-500 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-2 flex-1 overflow-y-auto">
                                {contacts.length === 0 ? (
                                    <div className="p-8 text-center text-zinc-500 text-sm">
                                        Rehberde kişi bulunamadı.
                                    </div>
                                ) : (
                                    contacts.map(contact => (
                                        <button
                                            key={contact.id}
                                            onClick={() => startConversationWith(contact.id)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-white/[0.03] transition-colors rounded-xl text-left"
                                        >
                                            <div className="h-10 w-10 rounded-full bg-[#18181b] flex items-center justify-center overflow-hidden">
                                                {contact.avatarUrl ? (
                                                    <img src={contact.avatarUrl} alt={contact.fullName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserCircle className="w-6 h-6 text-zinc-500" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-white">{contact.fullName}</p>
                                                <p className="text-xs text-zinc-500">
                                                    {contact.companyName
                                                        ? `${contact.companyName} · ${contact.membershipRole === 'OWNER' ? 'Şirket Sahibi' : contact.membershipRole === 'EMPLOYEE' ? 'Şirket Çalışanı' : 'Ajans Çalışanı'}`
                                                        : contact.globalRole === 'ADMIN' ? 'Yönetici' : contact.globalRole === 'AGENCY_STAFF' ? 'Ajans Çalışanı' : contact.email}
                                                </p>
                                                {contact.positionTitle && (
                                                    <p className="text-[11px] text-zinc-600">{contact.positionTitle}</p>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

