package com.noirstudio.loja.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

@Component
public class ApiRateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_NANOS = Duration.ofMinutes(1).toNanos();
    private final Cache<String, RequestWindow> windows = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterAccess(Duration.ofMinutes(15))
            .build();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        RateLimit rateLimit = rateLimitFor(request.getMethod(), path);
        if (rateLimit != null) {
            long now = System.nanoTime();
            String key = request.getRemoteAddr() + ":" + path;
            RequestWindow window = windows.get(key, ignored -> new RequestWindow(now));
            long retryAfter = window.tryAcquire(now, rateLimit.maxRequests());
            if (retryAfter > 0) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setHeader("Retry-After", Long.toString(retryAfter));
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"message\":\"Limite de requisições excedido.\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private RateLimit rateLimitFor(String method, String path) {
        if (!"POST".equalsIgnoreCase(method)) return null;
        return switch (path) {
            case "/api/auth/login" -> new RateLimit(8);
            case "/api/orders" -> new RateLimit(20);
            default -> null;
        };
    }

    private record RateLimit(int maxRequests) {}

    private static final class RequestWindow {
        private long startedAtNanos;
        private int requestCount;

        private RequestWindow(long startedAtNanos) {
            this.startedAtNanos = startedAtNanos;
        }

        private synchronized long tryAcquire(long now, int maxRequests) {
            if (now - startedAtNanos >= WINDOW_NANOS) {
                startedAtNanos = now;
                requestCount = 0;
            }
            if (requestCount >= maxRequests) {
                long remainingNanos = WINDOW_NANOS - (now - startedAtNanos);
                return Math.max(1, (remainingNanos + 999_999_999L) / 1_000_000_000L);
            }
            requestCount++;
            return 0;
        }
    }
}