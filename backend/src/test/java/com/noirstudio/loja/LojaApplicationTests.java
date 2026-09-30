package com.noirstudio.loja;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class LojaApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Test
	void contextLoads() {
	}

	@Test
	void mutationsRequireCsrfToken() throws Exception {
		mockMvc.perform(post("/api/orders")
					.with(remoteAddress("192.0.2.10"))
					.contentType(MediaType.APPLICATION_JSON)
					.content("{}"))
				.andExpect(status().isForbidden());
	}

	@Test
	void loginIssuesHttpOnlyCookieAndCookieAuthenticatesAdmin() throws Exception {
		MvcResult csrfResult = mockMvc.perform(get("/api/auth/csrf")
					.with(remoteAddress("192.0.2.11")))
				.andExpect(status().isOk())
				.andReturn();
		Cookie csrfCookie = csrfResult.getResponse().getCookie("XSRF-TOKEN");
		assertNotNull(csrfCookie);
		assertEquals("/api", csrfCookie.getPath());
		assertEquals("Strict", csrfCookie.getAttribute("SameSite"));
		String csrfToken = objectMapper.readTree(csrfResult.getResponse().getContentAsString())
				.path("token").asText();

		MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
					.with(remoteAddress("192.0.2.12"))
					.cookie(csrfCookie)
					.header("X-XSRF-TOKEN", csrfToken)
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"username\":\"admin\",\"password\":\"review-only-test-password\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.token").doesNotExist())
				.andReturn();
		Cookie authCookie = loginResult.getResponse().getCookie("noir_auth");
		assertNotNull(authCookie);
		assertTrue(authCookie.isHttpOnly());
		assertTrue(authCookie.getSecure());
		assertEquals("/api", authCookie.getPath());
		assertTrue(loginResult.getResponse().getHeader("Set-Cookie").contains("SameSite=Strict"));

		mockMvc.perform(get("/api/orders")
					.with(remoteAddress("192.0.2.13"))
					.cookie(authCookie))
				.andExpect(status().isOk());
	}

	@Test
	void loginRateLimitReturnsTooManyRequests() throws Exception {
		String remoteAddress = "192.0.2.14";
		MvcResult csrfResult = mockMvc.perform(get("/api/auth/csrf")
					.with(remoteAddress(remoteAddress)))
				.andExpect(status().isOk())
				.andReturn();
		Cookie csrfCookie = csrfResult.getResponse().getCookie("XSRF-TOKEN");
		String csrfToken = objectMapper.readTree(csrfResult.getResponse().getContentAsString())
				.path("token").asText();

		for (int attempt = 0; attempt < 8; attempt++) {
			mockMvc.perform(post("/api/auth/login")
						.with(remoteAddress(remoteAddress))
						.cookie(csrfCookie)
						.header("X-XSRF-TOKEN", csrfToken)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"username\":\"admin\",\"password\":\"wrong-password\"}"))
					.andExpect(status().isUnauthorized());
		}

		mockMvc.perform(post("/api/auth/login")
					.with(remoteAddress(remoteAddress))
					.cookie(csrfCookie)
					.header("X-XSRF-TOKEN", csrfToken)
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"username\":\"admin\",\"password\":\"wrong-password\"}"))
				.andExpect(status().is(429));
	}

	private RequestPostProcessor remoteAddress(String address) {
		return request -> {
			request.setRemoteAddr(address);
			return request;
		};
	}

}
