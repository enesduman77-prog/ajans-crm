import { useEffect, useState, useRef, useCallback } from 'react';
import { clientApi } from '../../api/clientPanel';
import { useAuth } from '../../store/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import type { ConversationResponse, MessageResponse as MsgResponse, ContactResponse, GroupConversationResponse, GroupMessageResponse } from '../../api/messaging';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, Send, Plus, X,
    Check, CheckCheck, ChevronLeft, UserCircle, Users
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

export default function ClientMessagingPage() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<ConversationResponse[]>([]);
    const [activeConv, setActiveConv] = useState<ConversationResponse | null>(null);
    const [messages, setMessages] = useState<MsgResponse[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [msgLoading, setMsgLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showNewConv, setShowNewConv] = useState(false);
    const [contacts, setContacts] = useState<ContactResponse[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Group chat state
    const [tab, setTab] = useState<'dm' | 'group'>('dm');
    const [groups, setGroups] = useState<GroupConversationResponse[]>([]);
    const [activeGroup, setActiveGroup] = useState<GroupConversationResponse | null>(null);
    const [groupMessages, setGroupMessages] = useState<GroupMessageResponse[]>([]);

    const handleWsMessage = useCallback((msg: MsgResponse) => {
        setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
        });
        setConversations(prev => prev.map(c =>
            c.id === msg.conversationId
                ? { ...c, lastMessage: msg, updatedAt: msg.createdAt }
                : c
        ));
    }, []);

    const handleGlobalMessage = useCallback((msg: MsgResponse) => {
        if (msg.conversationId === activeConv?.id) return;
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
                clientApi.getMyConversations(),
                clientApi.getMyGroups(),
            ]);
            setConversations(convData);
            setGroups(groupData);
        } catch {
            setError('Konuşmalar yüklenemedi');
        }
        setLoading(false);
    };

    const selectConversation = async (conv: ConversationResponse) => {
        setActiveConv(conv);
        setActiveGroup(null);
        setMsgLoading(true);
        try {
            const data = await clientApi.getMessages(conv.id);
            setMessages(data.content);
            setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
        } catch {
            setError('Mesajlar yüklenemedi');
        }
        setMsgLoading(false);
    };

    const openNewConversation = async () => {
        setShowNewConv(true);
        try {
            const data = await clientApi.getContacts();
            setContacts(data);
        } catch {
            setError('Kişiler yüklenemedi');
        }
    };

    const startConversationWith = async (targetUserId: string) => {
        try {
            const created = await clientApi.startConversation(targetUserId);
            const existing = conversations.find(c => c.id === created.id);
            if (!existing) {
                setConversations(prev => [created, ...prev]);
            }
            setActiveConv(created);
            setActiveGroup(null);
            setShowNewConv(false);
            selectConversation(created);
        } catch {
            setError('Konuşma başlatılamadı');
        }
    };

    const selectGroup = async (group: GroupConversationResponse) => {
        setActiveGroup(group);
        setActiveConv(null);
        setMsgLoading(true);
        try {
            const data = await clientApi.getGroupMessages(group.id);
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
            const sent = await clientApi.sendGroupMessage(activeGroup.id, { content: newMessage });
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

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConv) return;

        if (connected && wsSend(activeConv.id, newMessage)) {
            setNewMessage('');
        } else {
            try {
                const sent = await clientApi.sendMessage(activeConv.id, { content: newMessage });
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

    return (
        <div className="flex h-[calc(100dvh-3.5rem)] bg-[#09090b] -m-4 md:-m-8 rounded-none md:rounded-2xl overflow-hidden border-0 md:border md:border-white/[0.06] relative">
            {/* Error Toast */}
            {error && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg">
                    {error}
                    <button onClick={() => setError(null)} className="ml-3 text-white/70 hover:text-white">✕</button>
                </div>
            )}
            {/* Conversations Sidebar */}
            <div className={`w-full md:w-80 bg-[#0C0C0E] border-r border-white/[0.06] flex flex-col ${activeConv || activeGroup ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-[#F5BEC8]" />
                        Mesajlar
                    </h2>
                    <button
                        onClick={openNewConversation}
                        className="h-8 w-8 rounded-lg bg-[#C8697A]/10 hover:bg-[#C8697A]/20 text-[#F5BEC8] flex items-center justify-center transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/[0.06]">
                    <button
                        onClick={() => setTab('dm')}
                        className={`flex-1 py-2.5 text-xs font-semibold tracking-wide transition-colors ${tab === 'dm' ? 'text-[#F5BEC8] border-b-2 border-[#C8697A]' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        Direkt Mesajlar
                    </button>
                    <button
                        onClick={() => setTab('group')}
                        className={`flex-1 py-2.5 text-xs font-semibold tracking-wide transition-colors relative ${tab === 'group' ? 'text-[#F5BEC8] border-b-2 border-[#C8697A]' : 'text-zinc-500 hover:text-zinc-300'}`}
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
                                <p className="text-zinc-600 text-sm">Henüz konuşma yok</p>
                                <p className="text-zinc-700 text-xs mt-1">Yeni sohbet başlatmak için + butonuna tıklayın</p>
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
                                                <p className="text-xs text-zinc-500 truncate mt-0.5 flex-1 pr-2">
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
                                        <div className="h-10 w-10 rounded-full bg-[#C8697A]/10 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-[#F5BEC8]" />
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
                        <div className="h-16 border-b border-white/[0.06] flex items-center justify-between px-6 bg-[#0C0C0E]/80">
                            <div className="flex items-center gap-3">
                                <button className="md:hidden text-zinc-400 hover:text-white mr-2" onClick={() => setActiveGroup(null)}>
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="h-8 w-8 rounded-full bg-[#C8697A]/10 flex items-center justify-center border border-white/[0.06]">
                                    <Users className="w-4 h-4 text-[#F5BEC8]" />
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
                                groupMessages.map((msg, i) => {
                                    const isMine = msg.senderId === user?.id;
                                    return (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-3 ${isMine
                                                ? 'bg-[#C8697A] text-white rounded-br-sm'
                                                : 'bg-[#18181b] text-zinc-100 rounded-bl-sm border border-white/[0.06]'
                                                }`}>
                                                {!isMine && (
                                                    <p className={`text-[11px] font-semibold mb-1 ${msg.senderGlobalRole === 'ADMIN' || msg.senderGlobalRole === 'AGENCY_STAFF' ? 'text-orange-400' : 'text-[#F5BEC8]'}`}>
                                                        {msg.senderName}
                                                        {(msg.senderGlobalRole === 'ADMIN' || msg.senderGlobalRole === 'AGENCY_STAFF') && (
                                                            <span className="ml-1.5 text-[9px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded-full">Ajans</span>
                                                        )}
                                                    </p>
                                                )}
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMine ? 'text-pink-100' : 'text-zinc-500'}`}>
                                                    <span>
                                                        {new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-[#0C0C0E] border-t border-white/[0.06]">
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
                                        className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C8697A]/50 resize-none transition-colors"
                                        rows={1}
                                        style={{ minHeight: '44px', maxHeight: '120px' }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="h-11 w-11 shrink-0 rounded-xl bg-[#C8697A] hover:bg-[#B5556A] text-white flex items-center justify-center disabled:opacity-50 transition-all font-bold group"
                                >
                                    <Send className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : !activeConv ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="w-8 h-8 text-zinc-700" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Acente İletişimi</h3>
                            <p className="text-zinc-600 text-sm mt-1 max-w-sm">
                                Soldaki listeden bir konuşma seçin
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 border-b border-white/[0.06] flex items-center justify-between px-6 bg-[#0C0C0E]/80">
                            <div className="flex items-center gap-3">
                                <button className="md:hidden text-zinc-400 hover:text-white mr-2" onClick={() => setActiveConv(null)}>
                                    <ChevronLeft className="w-5 h-5" />
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
                                    <p className="text-[10px] text-[#F5BEC8] font-medium tracking-wide">
                                        {activeConv.otherUserCompanyName
                                            ? `${activeConv.otherUserCompanyName} · ${activeConv.otherUserMembershipRole === 'OWNER' ? 'Şirket Sahibi' : activeConv.otherUserMembershipRole === 'EMPLOYEE' ? 'Şirket Çalışanı' : 'Ajans Çalışanı'}${activeConv.otherUserPositionTitle ? ' · ' + activeConv.otherUserPositionTitle : ''}`
                                            : activeConv.otherUserRole === 'ADMIN' ? 'Yönetici' : activeConv.otherUserRole === 'AGENCY_STAFF' ? 'Ajans Çalışanı' : 'Kullanıcı'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                            {msgLoading ? (
                                <div className="text-center py-12 text-zinc-600 text-sm">Mesajlar yükleniyor...</div>
                            ) : messages.length === 0 ? (
                                <div className="text-center py-12 text-zinc-600 text-sm">İlk mesajınızı gönderin</div>
                            ) : (
                                messages.map((msg, i) => {
                                    const isMine = msg.senderId === user?.id;
                                    return (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.02 }}
                                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-3 ${isMine
                                                ? 'bg-[#C8697A] text-white rounded-br-sm'
                                                : 'bg-[#18181b] text-zinc-100 rounded-bl-sm border border-white/[0.06]'
                                                }`}>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMine ? 'text-pink-100' : 'text-zinc-500'}`}>
                                                    <span>
                                                        {new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                    {isMine && (
                                                        msg.isRead ? <CheckCheck className="w-3 h-3 text-pink-100" /> : <Check className="w-3 h-3 text-pink-100/50" />
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-4 bg-[#0C0C0E] border-t border-white/[0.06]">
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
                                        placeholder="Mesajınızı yazın..."
                                        className="w-full bg-[#09090b] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C8697A]/50 resize-none transition-colors"
                                        rows={1}
                                        style={{ minHeight: '44px', maxHeight: '120px' }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="h-11 w-11 shrink-0 rounded-xl bg-[#C8697A] hover:bg-[#B5556A] text-white flex items-center justify-center disabled:opacity-50 transition-all font-bold group"
                                >
                                    <Send className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </button>
                            </form>
                        </div>
                    </>
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
                            className="bg-[#0C0C0E] border border-white/[0.08] rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col"
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
                                    <div className="p-8 text-center text-zinc-500 text-sm">Kişi bulunamadı.</div>
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
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{contact.fullName}</p>
                                                <p className="text-xs text-zinc-500 truncate">
                                                    {contact.companyName
                                                        ? `${contact.companyName} · ${contact.membershipRole === 'OWNER' ? 'Şirket Sahibi' : contact.membershipRole === 'EMPLOYEE' ? 'Şirket Çalışanı' : 'Ajans Çalışanı'}`
                                                        : contact.globalRole === 'ADMIN' ? 'Yönetici' : contact.globalRole === 'AGENCY_STAFF' ? 'Ajans Çalışanı' : contact.email}
                                                </p>
                                                {contact.positionTitle && (
                                                    <p className="text-[11px] text-zinc-600 truncate">{contact.positionTitle}</p>
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
