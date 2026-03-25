package com.fogistanbul.crm.config;

import com.fogistanbul.crm.repository.ConversationRepository;
import com.fogistanbul.crm.security.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtTokenProvider jwtTokenProvider;
    private final ConversationRepository conversationRepository;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(allowedOrigins.split(","))
                .addInterceptors(cookieAuthHandshakeInterceptor())
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Try cookie-based auth from handshake attributes first
                    Map<String, Object> sessionAttrs = accessor.getSessionAttributes();
                    if (sessionAttrs != null && sessionAttrs.containsKey("WEBSOCKET_USER")) {
                        accessor.setUser((UsernamePasswordAuthenticationToken) sessionAttrs.get("WEBSOCKET_USER"));
                    } else {
                        // Fallback to STOMP header (for non-browser clients)
                        String token = accessor.getFirstNativeHeader("Authorization");
                        if (StringUtils.hasText(token)) {
                            if (token.startsWith("Bearer ")) {
                                token = token.substring(7);
                            }
                            if (jwtTokenProvider.validateToken(token)) {
                                UUID userId = jwtTokenProvider.getUserIdFromToken(token);
                                String role = jwtTokenProvider.getGlobalRoleFromToken(token);
                                var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
                                var auth = new UsernamePasswordAuthenticationToken(userId, null, authorities);
                                accessor.setUser(auth);
                            } else {
                                throw new RuntimeException("Invalid WebSocket token");
                            }
                        } else {
                            throw new RuntimeException("Missing WebSocket auth token");
                        }
                    }
                }
                if (accessor != null && (StompCommand.SUBSCRIBE.equals(accessor.getCommand()) || StompCommand.SEND.equals(accessor.getCommand()))) {
                    if (accessor.getUser() == null) {
                        throw new RuntimeException("Unauthenticated WebSocket command");
                    }
                    enforceDestinationAuthorization(accessor);
                }
                return message;
            }
        });
    }

    private void enforceDestinationAuthorization(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (!StringUtils.hasText(destination)) {
            return;
        }

        if (!(accessor.getUser() instanceof UsernamePasswordAuthenticationToken auth)
                || !(auth.getPrincipal() instanceof UUID userId)) {
            throw new RuntimeException("Invalid WebSocket principal");
        }

        if (destination.startsWith("/topic/thread/") || destination.startsWith("/topic/read/")
                || destination.startsWith("/app/chat/")) {
            UUID conversationId = extractUuidFromDestination(destination);
            if (!conversationRepository.isUserParticipant(conversationId, userId)) {
                throw new RuntimeException("Unauthorized conversation access");
            }
            return;
        }

        if (destination.startsWith("/topic/user/")) {
            UUID targetUserId = extractUuidFromDestination(destination);
            if (!targetUserId.equals(userId)) {
                throw new RuntimeException("Unauthorized user topic access");
            }
        }
    }

    private UUID extractUuidFromDestination(String destination) {
        int idx = destination.lastIndexOf('/');
        if (idx < 0 || idx + 1 >= destination.length()) {
            throw new RuntimeException("Invalid destination");
        }
        try {
            return UUID.fromString(destination.substring(idx + 1));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid destination id");
        }
    }

    private HandshakeInterceptor cookieAuthHandshakeInterceptor() {
        return new HandshakeInterceptor() {
            @Override
            public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                    WebSocketHandler wsHandler, Map<String, Object> attributes) {
                if (request instanceof ServletServerHttpRequest servletRequest) {
                    Cookie[] cookies = servletRequest.getServletRequest().getCookies();
                    if (cookies != null) {
                        for (Cookie cookie : cookies) {
                            if ("access_token".equals(cookie.getName())) {
                                String token = cookie.getValue();
                                if (jwtTokenProvider.validateToken(token)) {
                                    UUID userId = jwtTokenProvider.getUserIdFromToken(token);
                                    String role = jwtTokenProvider.getGlobalRoleFromToken(token);
                                    var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
                                    var auth = new UsernamePasswordAuthenticationToken(userId, null, authorities);
                                    attributes.put("WEBSOCKET_USER", auth);
                                }
                                break;
                            }
                        }
                    }
                }
                return true;
            }

            @Override
            public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                    WebSocketHandler wsHandler, Exception exception) {
            }
        };
    }
}
