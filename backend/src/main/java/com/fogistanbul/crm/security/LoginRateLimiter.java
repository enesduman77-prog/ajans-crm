package com.fogistanbul.crm.security;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MS = 15 * 60 * 1000; // 15 minutes

    private final ConcurrentHashMap<String, List<Instant>> attempts = new ConcurrentHashMap<>();

    public boolean isRateLimited(String key) {
        List<Instant> timestamps = attempts.get(key);
        if (timestamps == null) return false;

        Instant cutoff = Instant.now().minusMillis(WINDOW_MS);
        long recentAttempts = timestamps.stream()
                .filter(t -> t.isAfter(cutoff))
                .count();

        return recentAttempts >= MAX_ATTEMPTS;
    }

    public void recordAttempt(String key) {
        attempts.computeIfAbsent(key, k -> new CopyOnWriteArrayList<>())
                .add(Instant.now());
    }

    @Scheduled(fixedRate = 900_000) // every 15 minutes
    public void cleanup() {
        Instant cutoff = Instant.now().minusMillis(WINDOW_MS);
        Iterator<Map.Entry<String, List<Instant>>> it = attempts.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, List<Instant>> entry = it.next();
            entry.getValue().removeIf(t -> t.isBefore(cutoff));
            if (entry.getValue().isEmpty()) {
                it.remove();
            }
        }
    }
}
