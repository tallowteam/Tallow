@echo off
REM Chat Feature Installation Script
REM This script installs the required dependencies for the chat feature

echo.
echo Installing Chat Feature Dependencies...
echo.

REM Check if npm is available
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: npm is not installed
    echo Please install Node.js and npm first
    exit /b 1
)

REM Install required dependency
echo Installing @radix-ui/react-popover...
call npm install @radix-ui/react-popover

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Chat dependencies installed successfully!
    echo.
    echo Next steps:
    echo 1. Read CHAT_SETUP.md for integration guide
    echo 2. Review CHAT_EXAMPLE.tsx for usage examples
    echo 3. Run tests: npm run test:unit -- chat-manager.test.ts
    echo 4. Start development: npm run dev
    echo.
    echo Files created:
    echo   - lib/chat/chat-manager.ts
    echo   - lib/chat/message-encryption.ts
    echo   - lib/chat/chat-storage.ts
    echo   - lib/hooks/use-chat.ts
    echo   - lib/context/chat-context.tsx
    echo   - components/app/ChatPanel.tsx
    echo   - components/app/MessageBubble.tsx
    echo   - components/app/ChatInput.tsx
    echo   - components/ui/popover.tsx
    echo.
    echo Documentation:
    echo   - CHAT_INTEGRATION.md
    echo   - CHAT_SETUP.md
    echo   - CHAT_EXAMPLE.tsx
    echo   - CHAT_IMPLEMENTATION_SUMMARY.md
    echo.
    echo Tests:
    echo   - tests/unit/chat/chat-manager.test.ts
    echo   - tests/unit/chat/chat-storage.test.ts
    echo.
) else (
    echo.
    echo Installation failed
    echo Please install dependencies manually:
    echo   npm install @radix-ui/react-popover
    exit /b 1
)
