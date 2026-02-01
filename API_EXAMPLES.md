# Tallow API Examples

Comprehensive examples for using the Tallow API v1 across multiple programming languages.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Quick Start](#quick-start)
3. [TypeScript/JavaScript SDK](#typescriptjavascript-sdk)
4. [Python Client](#python-client)
5. [Go Client](#go-client)
6. [Rust Client](#rust-client)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Pagination](#pagination)
10. [Webhooks](#webhooks)
11. [Testing](#testing)

---

## Authentication

All email endpoints require API key authentication via the `X-API-Key` header.

### Generating an API Key

```bash
# Generate a secure random API key
openssl rand -hex 32

# Example output: a7f8e9c2d3b4a5f6e7d8c9b0a1f2e3d4b5c6a7f8e9d0c1b2a3f4e5d6c7b8a9f0
```

### Environment Setup

```bash
# .env.local
API_SECRET_KEY=your-api-secret-key-here
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
```

---

## Quick Start

### cURL Examples

```bash
# 1. Create checkout session (no auth required)
curl -X POST https://tallow.manisahome.com/api/v1/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"amount": 500}'

# 2. Send welcome email (requires auth)
curl -X POST https://tallow.manisahome.com/api/v1/send-welcome \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SECRET_KEY" \
  -d '{"email": "user@example.com", "name": "John Doe"}'

# 3. Send share notification (requires auth)
curl -X POST https://tallow.manisahome.com/api/v1/send-share-email \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_SECRET_KEY" \
  -d '{
    "email": "recipient@example.com",
    "shareId": "abc123",
    "senderName": "Jane Smith",
    "fileCount": 3,
    "totalSize": 1048576
  }'
```

---

## TypeScript/JavaScript SDK

### Installation

```bash
npm install axios zod
```

### SDK Implementation

```typescript
// tallow-sdk.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { z } from 'zod';

// Configuration
export interface TallowConfig {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
}

// Request/Response Schemas
const CheckoutSessionRequestSchema = z.object({
  amount: z.number().min(100).max(99999900),
});

const CheckoutSessionResponseSchema = z.object({
  url: z.string().url(),
});

const WelcomeEmailRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

const ShareEmailRequestSchema = z.object({
  email: z.string().email(),
  shareId: z.string().min(1),
  senderName: z.string().optional(),
  fileCount: z.number().min(1),
  totalSize: z.number().min(0),
});

const ShareEmailResponseSchema = z.object({
  success: z.boolean(),
  shareUrl: z.string().url(),
  emailSkipped: z.boolean().optional(),
});

// Types
export type CheckoutSessionRequest = z.infer<typeof CheckoutSessionRequestSchema>;
export type CheckoutSessionResponse = z.infer<typeof CheckoutSessionResponseSchema>;
export type WelcomeEmailRequest = z.infer<typeof WelcomeEmailRequestSchema>;
export type ShareEmailRequest = z.infer<typeof ShareEmailRequestSchema>;
export type ShareEmailResponse = z.infer<typeof ShareEmailResponseSchema>;

// Error Types
export class TallowAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'TallowAPIError';
  }
}

export class TallowRateLimitError extends TallowAPIError {
  constructor(
    message: string,
    public retryAfter: number,
    public limit: number,
    public remaining: number,
    public reset: number
  ) {
    super(message, 429);
    this.name = 'TallowRateLimitError';
  }
}

// SDK Class
export class TallowSDK {
  private client: AxiosInstance;
  private apiKey?: string;

  constructor(config: TallowConfig = {}) {
    this.apiKey = config.apiKey || process.env.API_SECRET_KEY;
    this.client = axios.create({
      baseURL: config.baseURL || 'https://tallow.manisahome.com/api/v1',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth
    this.client.interceptors.request.use((config) => {
      if (this.apiKey && config.headers) {
        config.headers['X-API-Key'] = this.apiKey;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
          const limit = parseInt(error.response.headers['x-ratelimit-limit'] || '0');
          const remaining = parseInt(error.response.headers['x-ratelimit-remaining'] || '0');
          const reset = parseInt(error.response.headers['x-ratelimit-reset'] || '0');

          throw new TallowRateLimitError(
            'Rate limit exceeded',
            retryAfter,
            limit,
            remaining,
            reset
          );
        }

        const message = (error.response?.data as any)?.error || error.message;
        throw new TallowAPIError(message, error.response?.status, error.response?.data);
      }
    );
  }

  /**
   * Create a Stripe checkout session for donations
   */
  async createCheckoutSession(
    request: CheckoutSessionRequest
  ): Promise<CheckoutSessionResponse> {
    const validated = CheckoutSessionRequestSchema.parse(request);
    const response = await this.client.post('/stripe/create-checkout-session', validated);
    return CheckoutSessionResponseSchema.parse(response.data);
  }

  /**
   * Send a welcome email to a new user
   */
  async sendWelcomeEmail(request: WelcomeEmailRequest): Promise<{ message: string }> {
    const validated = WelcomeEmailRequestSchema.parse(request);
    const response = await this.client.post('/send-welcome', validated);
    return response.data;
  }

  /**
   * Send a file sharing notification email
   */
  async sendShareEmail(request: ShareEmailRequest): Promise<ShareEmailResponse> {
    const validated = ShareEmailRequestSchema.parse(request);
    const response = await this.client.post('/send-share-email', validated);
    return ShareEmailResponseSchema.parse(response.data);
  }

  /**
   * Set API key (for updating at runtime)
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
}

// Default export
export default TallowSDK;
```

### SDK Usage Examples

```typescript
// Example 1: Create checkout session
import TallowSDK from './tallow-sdk';

const tallow = new TallowSDK();

async function donateExample() {
  try {
    const { url } = await tallow.createCheckoutSession({ amount: 1000 }); // $10
    console.log('Redirect to:', url);
    window.location.href = url;
  } catch (error) {
    if (error instanceof TallowAPIError) {
      console.error('API Error:', error.message, error.statusCode);
    }
  }
}

// Example 2: Send welcome email
async function welcomeExample() {
  try {
    const result = await tallow.sendWelcomeEmail({
      email: 'newuser@example.com',
      name: 'Alice Johnson',
    });
    console.log(result.message);
  } catch (error) {
    if (error instanceof TallowRateLimitError) {
      console.error(`Rate limited. Retry after ${error.retryAfter}s`);
    }
  }
}

// Example 3: Send share notification
async function shareExample() {
  try {
    const result = await tallow.sendShareEmail({
      email: 'recipient@example.com',
      shareId: 'xyz789',
      senderName: 'Bob',
      fileCount: 5,
      totalSize: 5242880, // 5 MB
    });
    console.log('Share URL:', result.shareUrl);
  } catch (error) {
    console.error('Failed to send share email:', error);
  }
}

// Example 4: Retry with exponential backoff
async function retryExample() {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await tallow.sendWelcomeEmail({
        email: 'user@example.com',
        name: 'Charlie',
      });
      break;
    } catch (error) {
      if (error instanceof TallowRateLimitError) {
        attempt++;
        if (attempt >= maxRetries) throw error;

        const delay = error.retryAfter * 1000;
        console.log(`Retrying in ${error.retryAfter}s (attempt ${attempt}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

---

## Python Client

### Installation

```bash
pip install requests pydantic python-dotenv
```

### Client Implementation

```python
# tallow_sdk.py
import os
import time
from typing import Optional, Dict, Any
from dataclasses import dataclass
import requests
from pydantic import BaseModel, EmailStr, Field, validator


# Request Models
class CheckoutSessionRequest(BaseModel):
    amount: int = Field(ge=100, le=99999900)

    @validator('amount')
    def validate_amount(cls, v):
        if v < 100:
            raise ValueError('Minimum amount is $1.00 (100 cents)')
        if v > 99999900:
            raise ValueError('Maximum amount is $999,999.00')
        return v


class WelcomeEmailRequest(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=100)


class ShareEmailRequest(BaseModel):
    email: EmailStr
    share_id: str = Field(min_length=1, alias='shareId')
    sender_name: Optional[str] = Field(None, alias='senderName')
    file_count: int = Field(ge=1, alias='fileCount')
    total_size: int = Field(ge=0, alias='totalSize')

    class Config:
        populate_by_name = True


# Response Models
class CheckoutSessionResponse(BaseModel):
    url: str


class ShareEmailResponse(BaseModel):
    success: bool
    share_url: str = Field(alias='shareUrl')
    email_skipped: Optional[bool] = Field(None, alias='emailSkipped')

    class Config:
        populate_by_name = True


# Error Classes
class TallowAPIError(Exception):
    """Base exception for Tallow API errors"""
    def __init__(self, message: str, status_code: Optional[int] = None, details: Any = None):
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)


class TallowRateLimitError(TallowAPIError):
    """Raised when rate limit is exceeded"""
    def __init__(self, message: str, retry_after: int, limit: int, remaining: int, reset: int):
        super().__init__(message, 429)
        self.retry_after = retry_after
        self.limit = limit
        self.remaining = remaining
        self.reset = reset


# SDK Class
class TallowSDK:
    """Tallow API SDK for Python"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://tallow.manisahome.com/api/v1",
        timeout: int = 30
    ):
        self.api_key = api_key or os.getenv('API_SECRET_KEY')
        self.base_url = base_url
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
        })

    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        require_auth: bool = True
    ) -> Dict[str, Any]:
        """Make an HTTP request to the API"""
        url = f"{self.base_url}{endpoint}"
        headers = {}

        if require_auth:
            if not self.api_key:
                raise TallowAPIError('API key required but not provided')
            headers['X-API-Key'] = self.api_key

        try:
            response = self.session.request(
                method=method,
                url=url,
                json=data,
                headers=headers,
                timeout=self.timeout
            )

            # Handle rate limiting
            if response.status_code == 429:
                retry_after = int(response.headers.get('Retry-After', 60))
                limit = int(response.headers.get('X-RateLimit-Limit', 0))
                remaining = int(response.headers.get('X-RateLimit-Remaining', 0))
                reset = int(response.headers.get('X-RateLimit-Reset', 0))

                raise TallowRateLimitError(
                    'Rate limit exceeded',
                    retry_after,
                    limit,
                    remaining,
                    reset
                )

            # Handle other errors
            if not response.ok:
                error_data = response.json() if response.content else {}
                message = error_data.get('error', f'HTTP {response.status_code}')
                raise TallowAPIError(message, response.status_code, error_data)

            return response.json()

        except requests.RequestException as e:
            raise TallowAPIError(f'Request failed: {str(e)}')

    def create_checkout_session(self, request: CheckoutSessionRequest) -> CheckoutSessionResponse:
        """Create a Stripe checkout session"""
        data = request.dict()
        response_data = self._make_request(
            'POST',
            '/stripe/create-checkout-session',
            data,
            require_auth=False
        )
        return CheckoutSessionResponse(**response_data)

    def send_welcome_email(self, request: WelcomeEmailRequest) -> Dict[str, Any]:
        """Send a welcome email"""
        data = request.dict()
        return self._make_request('POST', '/send-welcome', data)

    def send_share_email(self, request: ShareEmailRequest) -> ShareEmailResponse:
        """Send a file sharing notification"""
        data = request.dict(by_alias=True)
        response_data = self._make_request('POST', '/send-share-email', data)
        return ShareEmailResponse(**response_data)

    def set_api_key(self, api_key: str):
        """Update the API key"""
        self.api_key = api_key


# Convenience functions
def create_sdk(api_key: Optional[str] = None) -> TallowSDK:
    """Factory function to create SDK instance"""
    return TallowSDK(api_key=api_key)
```

### Python Usage Examples

```python
# example_usage.py
from tallow_sdk import (
    TallowSDK,
    CheckoutSessionRequest,
    WelcomeEmailRequest,
    ShareEmailRequest,
    TallowAPIError,
    TallowRateLimitError
)
import time

# Initialize SDK
sdk = TallowSDK()

# Example 1: Create checkout session
def donate_example():
    try:
        request = CheckoutSessionRequest(amount=1000)  # $10
        response = sdk.create_checkout_session(request)
        print(f"Redirect to: {response.url}")
    except TallowAPIError as e:
        print(f"Error: {e.message} (Status: {e.status_code})")

# Example 2: Send welcome email
def welcome_example():
    try:
        request = WelcomeEmailRequest(
            email="newuser@example.com",
            name="Alice Johnson"
        )
        result = sdk.send_welcome_email(request)
        print(result['message'])
    except TallowRateLimitError as e:
        print(f"Rate limited. Retry after {e.retry_after}s")
    except TallowAPIError as e:
        print(f"Error: {e.message}")

# Example 3: Send share notification
def share_example():
    try:
        request = ShareEmailRequest(
            email="recipient@example.com",
            share_id="xyz789",
            sender_name="Bob",
            file_count=5,
            total_size=5242880  # 5 MB
        )
        result = sdk.send_share_email(request)
        print(f"Share URL: {result.share_url}")
    except TallowAPIError as e:
        print(f"Error: {e.message}")

# Example 4: Retry with exponential backoff
def retry_example():
    max_retries = 3
    attempt = 0

    while attempt < max_retries:
        try:
            request = WelcomeEmailRequest(
                email="user@example.com",
                name="Charlie"
            )
            sdk.send_welcome_email(request)
            break
        except TallowRateLimitError as e:
            attempt += 1
            if attempt >= max_retries:
                raise

            print(f"Retrying in {e.retry_after}s (attempt {attempt}/{max_retries})")
            time.sleep(e.retry_after)
        except TallowAPIError as e:
            print(f"Fatal error: {e.message}")
            raise

# Example 5: Batch operations with rate limit handling
def batch_example():
    emails = [
        ("user1@example.com", "User One"),
        ("user2@example.com", "User Two"),
        ("user3@example.com", "User Three"),
    ]

    for email, name in emails:
        try:
            request = WelcomeEmailRequest(email=email, name=name)
            sdk.send_welcome_email(request)
            print(f"Sent email to {email}")
            time.sleep(1)  # Respect rate limits
        except TallowRateLimitError as e:
            print(f"Rate limited. Waiting {e.retry_after}s...")
            time.sleep(e.retry_after)
        except TallowAPIError as e:
            print(f"Failed to send to {email}: {e.message}")

if __name__ == "__main__":
    donate_example()
    welcome_example()
    share_example()
```

---

## Go Client

### Client Implementation

```go
// tallow/client.go
package tallow

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
    "strconv"
    "time"
)

const (
    DefaultBaseURL = "https://tallow.manisahome.com/api/v1"
    DefaultTimeout = 30 * time.Second
)

// Request types
type CheckoutSessionRequest struct {
    Amount int `json:"amount" validate:"min=100,max=99999900"`
}

type WelcomeEmailRequest struct {
    Email string `json:"email" validate:"required,email"`
    Name  string `json:"name" validate:"required,min=1,max=100"`
}

type ShareEmailRequest struct {
    Email      string `json:"email" validate:"required,email"`
    ShareID    string `json:"shareId" validate:"required"`
    SenderName string `json:"senderName,omitempty"`
    FileCount  int    `json:"fileCount" validate:"required,min=1"`
    TotalSize  int64  `json:"totalSize" validate:"required,min=0"`
}

// Response types
type CheckoutSessionResponse struct {
    URL string `json:"url"`
}

type WelcomeEmailResponse struct {
    Message string `json:"message"`
    Skipped bool   `json:"skipped,omitempty"`
}

type ShareEmailResponse struct {
    Success      bool   `json:"success"`
    ShareURL     string `json:"shareUrl"`
    EmailSkipped bool   `json:"emailSkipped,omitempty"`
}

// Error types
type APIError struct {
    Message    string
    StatusCode int
    Details    map[string]interface{}
}

func (e *APIError) Error() string {
    return fmt.Sprintf("API error (%d): %s", e.StatusCode, e.Message)
}

type RateLimitError struct {
    *APIError
    RetryAfter int
    Limit      int
    Remaining  int
    Reset      int64
}

func (e *RateLimitError) Error() string {
    return fmt.Sprintf("Rate limit exceeded. Retry after %ds", e.RetryAfter)
}

// Client
type Client struct {
    BaseURL    string
    APIKey     string
    HTTPClient *http.Client
}

// NewClient creates a new Tallow API client
func NewClient(apiKey string) *Client {
    if apiKey == "" {
        apiKey = os.Getenv("API_SECRET_KEY")
    }

    return &Client{
        BaseURL: DefaultBaseURL,
        APIKey:  apiKey,
        HTTPClient: &http.Client{
            Timeout: DefaultTimeout,
        },
    }
}

// SetBaseURL updates the base URL
func (c *Client) SetBaseURL(baseURL string) {
    c.BaseURL = baseURL
}

// makeRequest performs an HTTP request
func (c *Client) makeRequest(method, endpoint string, body interface{}, requireAuth bool) ([]byte, *http.Response, error) {
    var reqBody io.Reader
    if body != nil {
        jsonData, err := json.Marshal(body)
        if err != nil {
            return nil, nil, fmt.Errorf("failed to marshal request: %w", err)
        }
        reqBody = bytes.NewBuffer(jsonData)
    }

    url := c.BaseURL + endpoint
    req, err := http.NewRequest(method, url, reqBody)
    if err != nil {
        return nil, nil, fmt.Errorf("failed to create request: %w", err)
    }

    req.Header.Set("Content-Type", "application/json")
    if requireAuth {
        if c.APIKey == "" {
            return nil, nil, fmt.Errorf("API key required but not provided")
        }
        req.Header.Set("X-API-Key", c.APIKey)
    }

    resp, err := c.HTTPClient.Do(req)
    if err != nil {
        return nil, nil, fmt.Errorf("request failed: %w", err)
    }
    defer resp.Body.Close()

    respBody, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, resp, fmt.Errorf("failed to read response: %w", err)
    }

    // Handle rate limiting
    if resp.StatusCode == http.StatusTooManyRequests {
        retryAfter, _ := strconv.Atoi(resp.Header.Get("Retry-After"))
        limit, _ := strconv.Atoi(resp.Header.Get("X-RateLimit-Limit"))
        remaining, _ := strconv.Atoi(resp.Header.Get("X-RateLimit-Remaining"))
        reset, _ := strconv.ParseInt(resp.Header.Get("X-RateLimit-Reset"), 10, 64)

        return nil, resp, &RateLimitError{
            APIError: &APIError{
                Message:    "Rate limit exceeded",
                StatusCode: resp.StatusCode,
            },
            RetryAfter: retryAfter,
            Limit:      limit,
            Remaining:  remaining,
            Reset:      reset,
        }
    }

    // Handle other errors
    if resp.StatusCode >= 400 {
        var errorResp map[string]interface{}
        json.Unmarshal(respBody, &errorResp)

        message := "Unknown error"
        if msg, ok := errorResp["error"].(string); ok {
            message = msg
        }

        return nil, resp, &APIError{
            Message:    message,
            StatusCode: resp.StatusCode,
            Details:    errorResp,
        }
    }

    return respBody, resp, nil
}

// CreateCheckoutSession creates a Stripe checkout session
func (c *Client) CreateCheckoutSession(req CheckoutSessionRequest) (*CheckoutSessionResponse, error) {
    respBody, _, err := c.makeRequest("POST", "/stripe/create-checkout-session", req, false)
    if err != nil {
        return nil, err
    }

    var resp CheckoutSessionResponse
    if err := json.Unmarshal(respBody, &resp); err != nil {
        return nil, fmt.Errorf("failed to parse response: %w", err)
    }

    return &resp, nil
}

// SendWelcomeEmail sends a welcome email
func (c *Client) SendWelcomeEmail(req WelcomeEmailRequest) (*WelcomeEmailResponse, error) {
    respBody, _, err := c.makeRequest("POST", "/send-welcome", req, true)
    if err != nil {
        return nil, err
    }

    var resp WelcomeEmailResponse
    if err := json.Unmarshal(respBody, &resp); err != nil {
        return nil, fmt.Errorf("failed to parse response: %w", err)
    }

    return &resp, nil
}

// SendShareEmail sends a file sharing notification
func (c *Client) SendShareEmail(req ShareEmailRequest) (*ShareEmailResponse, error) {
    respBody, _, err := c.makeRequest("POST", "/send-share-email", req, true)
    if err != nil {
        return nil, err
    }

    var resp ShareEmailResponse
    if err := json.Unmarshal(respBody, &resp); err != nil {
        return nil, fmt.Errorf("failed to parse response: %w", err)
    }

    return &resp, nil
}
```

### Go Usage Examples

```go
// example/main.go
package main

import (
    "fmt"
    "log"
    "time"

    "github.com/yourorg/tallow"
)

func main() {
    // Initialize client
    client := tallow.NewClient("")

    // Example 1: Create checkout session
    donateExample(client)

    // Example 2: Send welcome email
    welcomeExample(client)

    // Example 3: Send share notification
    shareExample(client)

    // Example 4: Retry with backoff
    retryExample(client)
}

func donateExample(client *tallow.Client) {
    resp, err := client.CreateCheckoutSession(tallow.CheckoutSessionRequest{
        Amount: 1000, // $10
    })
    if err != nil {
        log.Printf("Error: %v", err)
        return
    }

    fmt.Printf("Redirect to: %s\n", resp.URL)
}

func welcomeExample(client *tallow.Client) {
    resp, err := client.SendWelcomeEmail(tallow.WelcomeEmailRequest{
        Email: "newuser@example.com",
        Name:  "Alice Johnson",
    })
    if err != nil {
        if rateLimitErr, ok := err.(*tallow.RateLimitError); ok {
            log.Printf("Rate limited. Retry after %ds", rateLimitErr.RetryAfter)
        } else {
            log.Printf("Error: %v", err)
        }
        return
    }

    fmt.Println(resp.Message)
}

func shareExample(client *tallow.Client) {
    resp, err := client.SendShareEmail(tallow.ShareEmailRequest{
        Email:      "recipient@example.com",
        ShareID:    "xyz789",
        SenderName: "Bob",
        FileCount:  5,
        TotalSize:  5242880, // 5 MB
    })
    if err != nil {
        log.Printf("Error: %v", err)
        return
    }

    fmt.Printf("Share URL: %s\n", resp.ShareURL)
}

func retryExample(client *tallow.Client) {
    maxRetries := 3
    attempt := 0

    for attempt < maxRetries {
        _, err := client.SendWelcomeEmail(tallow.WelcomeEmailRequest{
            Email: "user@example.com",
            Name:  "Charlie",
        })

        if err == nil {
            break
        }

        if rateLimitErr, ok := err.(*tallow.RateLimitError); ok {
            attempt++
            if attempt >= maxRetries {
                log.Printf("Max retries reached")
                return
            }

            log.Printf("Retrying in %ds (attempt %d/%d)", rateLimitErr.RetryAfter, attempt, maxRetries)
            time.Sleep(time.Duration(rateLimitErr.RetryAfter) * time.Second)
        } else {
            log.Printf("Fatal error: %v", err)
            return
        }
    }
}
```

---

## Rust Client

### Client Implementation

```rust
// src/lib.rs
use reqwest::{Client as HttpClient, Error as ReqwestError};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use std::time::Duration;
use thiserror::Error;

const DEFAULT_BASE_URL: &str = "https://tallow.manisahome.com/api/v1";
const DEFAULT_TIMEOUT: u64 = 30;

// Request types
#[derive(Debug, Serialize)]
pub struct CheckoutSessionRequest {
    pub amount: i32,
}

#[derive(Debug, Serialize)]
pub struct WelcomeEmailRequest {
    pub email: String,
    pub name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShareEmailRequest {
    pub email: String,
    pub share_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sender_name: Option<String>,
    pub file_count: i32,
    pub total_size: i64,
}

// Response types
#[derive(Debug, Deserialize)]
pub struct CheckoutSessionResponse {
    pub url: String,
}

#[derive(Debug, Deserialize)]
pub struct WelcomeEmailResponse {
    pub message: String,
    #[serde(default)]
    pub skipped: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShareEmailResponse {
    pub success: bool,
    pub share_url: String,
    #[serde(default)]
    pub email_skipped: bool,
}

// Error types
#[derive(Debug, Error)]
pub enum TallowError {
    #[error("API error ({status_code}): {message}")]
    ApiError {
        message: String,
        status_code: u16,
        details: HashMap<String, serde_json::Value>,
    },

    #[error("Rate limit exceeded. Retry after {retry_after}s")]
    RateLimitError {
        retry_after: u64,
        limit: u64,
        remaining: u64,
        reset: u64,
    },

    #[error("Request failed: {0}")]
    RequestError(#[from] ReqwestError),

    #[error("Missing API key")]
    MissingApiKey,
}

// Client
pub struct TallowClient {
    base_url: String,
    api_key: Option<String>,
    http_client: HttpClient,
}

impl TallowClient {
    pub fn new(api_key: Option<String>) -> Self {
        let api_key = api_key.or_else(|| env::var("API_SECRET_KEY").ok());

        let http_client = HttpClient::builder()
            .timeout(Duration::from_secs(DEFAULT_TIMEOUT))
            .build()
            .expect("Failed to build HTTP client");

        Self {
            base_url: DEFAULT_BASE_URL.to_string(),
            api_key,
            http_client,
        }
    }

    pub fn set_base_url(&mut self, base_url: String) {
        self.base_url = base_url;
    }

    async fn make_request<T, R>(
        &self,
        method: reqwest::Method,
        endpoint: &str,
        body: Option<&T>,
        require_auth: bool,
    ) -> Result<R, TallowError>
    where
        T: Serialize,
        R: for<'de> Deserialize<'de>,
    {
        let url = format!("{}{}", self.base_url, endpoint);
        let mut request = self.http_client.request(method, &url);

        request = request.header("Content-Type", "application/json");

        if require_auth {
            let api_key = self.api_key.as_ref().ok_or(TallowError::MissingApiKey)?;
            request = request.header("X-API-Key", api_key);
        }

        if let Some(body) = body {
            request = request.json(body);
        }

        let response = request.send().await?;

        // Handle rate limiting
        if response.status() == reqwest::StatusCode::TOO_MANY_REQUESTS {
            let headers = response.headers();
            let retry_after = headers
                .get("Retry-After")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.parse().ok())
                .unwrap_or(60);

            let limit = headers
                .get("X-RateLimit-Limit")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.parse().ok())
                .unwrap_or(0);

            let remaining = headers
                .get("X-RateLimit-Remaining")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.parse().ok())
                .unwrap_or(0);

            let reset = headers
                .get("X-RateLimit-Reset")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.parse().ok())
                .unwrap_or(0);

            return Err(TallowError::RateLimitError {
                retry_after,
                limit,
                remaining,
                reset,
            });
        }

        // Handle other errors
        if !response.status().is_success() {
            let status_code = response.status().as_u16();
            let error_data: HashMap<String, serde_json::Value> =
                response.json().await.unwrap_or_default();

            let message = error_data
                .get("error")
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown error")
                .to_string();

            return Err(TallowError::ApiError {
                message,
                status_code,
                details: error_data,
            });
        }

        Ok(response.json().await?)
    }

    pub async fn create_checkout_session(
        &self,
        request: CheckoutSessionRequest,
    ) -> Result<CheckoutSessionResponse, TallowError> {
        self.make_request(
            reqwest::Method::POST,
            "/stripe/create-checkout-session",
            Some(&request),
            false,
        )
        .await
    }

    pub async fn send_welcome_email(
        &self,
        request: WelcomeEmailRequest,
    ) -> Result<WelcomeEmailResponse, TallowError> {
        self.make_request(
            reqwest::Method::POST,
            "/send-welcome",
            Some(&request),
            true,
        )
        .await
    }

    pub async fn send_share_email(
        &self,
        request: ShareEmailRequest,
    ) -> Result<ShareEmailResponse, TallowError> {
        self.make_request(
            reqwest::Method::POST,
            "/send-share-email",
            Some(&request),
            true,
        )
        .await
    }
}
```

### Rust Usage Examples

```rust
// examples/main.rs
use tallow_sdk::{
    CheckoutSessionRequest, ShareEmailRequest, TallowClient, TallowError,
    WelcomeEmailRequest,
};
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    let client = TallowClient::new(None);

    donate_example(&client).await;
    welcome_example(&client).await;
    share_example(&client).await;
    retry_example(&client).await;
}

async fn donate_example(client: &TallowClient) {
    match client
        .create_checkout_session(CheckoutSessionRequest { amount: 1000 })
        .await
    {
        Ok(response) => println!("Redirect to: {}", response.url),
        Err(e) => eprintln!("Error: {}", e),
    }
}

async fn welcome_example(client: &TallowClient) {
    let request = WelcomeEmailRequest {
        email: "newuser@example.com".to_string(),
        name: "Alice Johnson".to_string(),
    };

    match client.send_welcome_email(request).await {
        Ok(response) => println!("{}", response.message),
        Err(TallowError::RateLimitError { retry_after, .. }) => {
            eprintln!("Rate limited. Retry after {}s", retry_after)
        }
        Err(e) => eprintln!("Error: {}", e),
    }
}

async fn share_example(client: &TallowClient) {
    let request = ShareEmailRequest {
        email: "recipient@example.com".to_string(),
        share_id: "xyz789".to_string(),
        sender_name: Some("Bob".to_string()),
        file_count: 5,
        total_size: 5242880,
    };

    match client.send_share_email(request).await {
        Ok(response) => println!("Share URL: {}", response.share_url),
        Err(e) => eprintln!("Error: {}", e),
    }
}

async fn retry_example(client: &TallowClient) {
    let max_retries = 3;
    let mut attempt = 0;

    while attempt < max_retries {
        let request = WelcomeEmailRequest {
            email: "user@example.com".to_string(),
            name: "Charlie".to_string(),
        };

        match client.send_welcome_email(request).await {
            Ok(_) => break,
            Err(TallowError::RateLimitError { retry_after, .. }) => {
                attempt += 1;
                if attempt >= max_retries {
                    eprintln!("Max retries reached");
                    return;
                }

                eprintln!(
                    "Retrying in {}s (attempt {}/{})",
                    retry_after, attempt, max_retries
                );
                sleep(Duration::from_secs(retry_after)).await;
            }
            Err(e) => {
                eprintln!("Fatal error: {}", e);
                return;
            }
        }
    }
}
```

---

## Error Handling

### Common Error Scenarios

#### 1. Invalid Input

```typescript
// TypeScript
try {
  await tallow.createCheckoutSession({ amount: 50 }); // Too low
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Validation error:', error.errors);
  }
}
```

```python
# Python
try:
    sdk.create_checkout_session(CheckoutSessionRequest(amount=50))
except ValidationError as e:
    print(f"Validation error: {e}")
```

#### 2. Unauthorized

```typescript
// TypeScript
try {
  await tallow.sendWelcomeEmail({ email: "test@example.com", name: "Test" });
} catch (error) {
  if (error instanceof TallowAPIError && error.statusCode === 401) {
    console.error('Invalid API key');
  }
}
```

#### 3. Rate Limit Exceeded

```python
# Python
try:
    sdk.send_welcome_email(request)
except TallowRateLimitError as e:
    print(f"Rate limited:")
    print(f"  Limit: {e.limit} requests")
    print(f"  Remaining: {e.remaining}")
    print(f"  Resets at: {e.reset}")
    print(f"  Retry after: {e.retry_after}s")
```

#### 4. Service Unavailable

```go
// Go
resp, err := client.CreateCheckoutSession(req)
if err != nil {
    if apiErr, ok := err.(*tallow.APIError); ok {
        if apiErr.StatusCode == 503 {
            log.Println("Stripe not configured")
        }
    }
}
```

---

## Rate Limiting

### Understanding Rate Limits

All endpoints have rate limits to prevent abuse:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/send-welcome` | 3 req | 1 min |
| `/send-share-email` | 5 req | 1 min |
| `/stripe/create-checkout-session` | 3 req | 1 min |

### Rate Limit Headers

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706198400
Retry-After: 60
```

### Handling Rate Limits

#### Strategy 1: Exponential Backoff

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof TallowRateLimitError) {
        attempt++;
        if (attempt >= maxRetries) throw error;

        const delay = Math.min(baseDelay * 2 ** attempt, error.retryAfter * 1000);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

// Usage
await withRetry(() => tallow.sendWelcomeEmail({ email: "test@example.com", name: "Test" }));
```

#### Strategy 2: Token Bucket

```python
import time
from collections import deque

class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = deque()

    def acquire(self):
        now = time.time()

        # Remove old requests outside the window
        while self.requests and self.requests[0] < now - self.window_seconds:
            self.requests.popleft()

        # Check if we can make a request
        if len(self.requests) >= self.max_requests:
            sleep_time = self.window_seconds - (now - self.requests[0])
            time.sleep(sleep_time)
            self.acquire()  # Retry
        else:
            self.requests.append(now)

# Usage
limiter = RateLimiter(max_requests=3, window_seconds=60)

for email in emails:
    limiter.acquire()
    sdk.send_welcome_email(WelcomeEmailRequest(email=email, name="User"))
```

---

## Pagination

Currently, the Tallow API does not have paginated endpoints. All responses return complete results.

For future pagination support, the API would use cursor-based pagination:

```typescript
// Future API design (not yet implemented)
interface PaginatedRequest {
  limit?: number; // Max 100
  cursor?: string; // Opaque cursor for next page
}

interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

// Usage example
async function* fetchAllItems<T>(
  fetchPage: (cursor?: string) => Promise<PaginatedResponse<T>>
) {
  let cursor: string | undefined;

  do {
    const page = await fetchPage(cursor);
    yield* page.data;
    cursor = page.nextCursor;
  } while (cursor);
}
```

---

## Webhooks

### Stripe Webhook Handler

The `/stripe/webhook` endpoint receives Stripe events.

#### Verifying Webhook Signatures

```typescript
// Server-side webhook handler
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Handle event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Payment successful:', session.id);
        // Send thank-you email, log donation, etc.
        break;

      case 'checkout.session.expired':
        console.log('Session expired');
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return Response.json({ error: 'Webhook verification failed' }, { status: 400 });
  }
}
```

#### Testing Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local endpoint
stripe listen --forward-to localhost:3000/api/v1/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger checkout.session.expired
```

---

## Testing

### Unit Tests (TypeScript)

```typescript
// tallow-sdk.test.ts
import { describe, it, expect, vi } from 'vitest';
import TallowSDK, { TallowAPIError, TallowRateLimitError } from './tallow-sdk';
import axios from 'axios';

vi.mock('axios');

describe('TallowSDK', () => {
  const sdk = new TallowSDK({ apiKey: 'test-key' });

  it('should create checkout session', async () => {
    (axios.create as any).mockReturnValue({
      post: vi.fn().mockResolvedValue({
        data: { url: 'https://checkout.stripe.com/test' },
      }),
    });

    const result = await sdk.createCheckoutSession({ amount: 500 });
    expect(result.url).toContain('checkout.stripe.com');
  });

  it('should handle rate limiting', async () => {
    (axios.create as any).mockReturnValue({
      post: vi.fn().mockRejectedValue({
        response: {
          status: 429,
          headers: {
            'retry-after': '60',
            'x-ratelimit-limit': '3',
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': '1706198400',
          },
        },
      }),
    });

    await expect(
      sdk.sendWelcomeEmail({ email: 'test@example.com', name: 'Test' })
    ).rejects.toThrow(TallowRateLimitError);
  });

  it('should validate input', async () => {
    await expect(
      sdk.createCheckoutSession({ amount: 50 }) // Too low
    ).rejects.toThrow();
  });
});
```

### Integration Tests (Python)

```python
# test_tallow_sdk.py
import pytest
from tallow_sdk import TallowSDK, TallowAPIError, TallowRateLimitError

@pytest.fixture
def sdk():
    return TallowSDK(api_key="test-key", base_url="http://localhost:3000/api/v1")

def test_create_checkout_session(sdk, requests_mock):
    requests_mock.post(
        "http://localhost:3000/api/v1/stripe/create-checkout-session",
        json={"url": "https://checkout.stripe.com/test"}
    )

    result = sdk.create_checkout_session(CheckoutSessionRequest(amount=500))
    assert "checkout.stripe.com" in result.url

def test_rate_limiting(sdk, requests_mock):
    requests_mock.post(
        "http://localhost:3000/api/v1/send-welcome",
        status_code=429,
        headers={
            "Retry-After": "60",
            "X-RateLimit-Limit": "3",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": "1706198400",
        }
    )

    with pytest.raises(TallowRateLimitError) as exc_info:
        sdk.send_welcome_email(WelcomeEmailRequest(
            email="test@example.com",
            name="Test"
        ))

    assert exc_info.value.retry_after == 60
```

---

## Best Practices

1. **Always use environment variables** for API keys (never hardcode)
2. **Implement retry logic** with exponential backoff for rate limits
3. **Validate inputs** before making API calls (use schemas)
4. **Log errors** but never log sensitive data (API keys, user emails)
5. **Handle timeouts** gracefully (default 30s timeout)
6. **Use HTTPS** in production (API rejects HTTP)
7. **Monitor rate limits** via headers to avoid hitting limits
8. **Test webhooks** locally with Stripe CLI before deploying

---

## Additional Resources

- [API Versioning Guide](./API_VERSIONING.md)
- [OpenAPI Specification](./openapi.yml)
- [Architecture Documentation](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)

---

**Questions?** See [README.md](./README.md) for support channels.
