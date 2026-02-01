#!/bin/bash

# Chat Feature Installation Script
# This script installs the required dependencies for the chat feature

echo "📦 Installing Chat Feature Dependencies..."
echo ""

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    echo "Please install Node.js and npm first"
    exit 1
fi

# Install required dependency
echo "Installing @radix-ui/react-popover..."
npm install @radix-ui/react-popover

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Chat dependencies installed successfully!"
    echo ""
    echo "📚 Next steps:"
    echo "1. Read CHAT_SETUP.md for integration guide"
    echo "2. Review CHAT_EXAMPLE.tsx for usage examples"
    echo "3. Run tests: npm run test:unit -- chat-manager.test.ts"
    echo "4. Start development: npm run dev"
    echo ""
    echo "📁 Files created:"
    echo "  - lib/chat/chat-manager.ts"
    echo "  - lib/chat/message-encryption.ts"
    echo "  - lib/chat/chat-storage.ts"
    echo "  - lib/hooks/use-chat.ts"
    echo "  - lib/context/chat-context.tsx"
    echo "  - components/app/ChatPanel.tsx"
    echo "  - components/app/MessageBubble.tsx"
    echo "  - components/app/ChatInput.tsx"
    echo "  - components/ui/popover.tsx"
    echo ""
    echo "📖 Documentation:"
    echo "  - CHAT_INTEGRATION.md"
    echo "  - CHAT_SETUP.md"
    echo "  - CHAT_EXAMPLE.tsx"
    echo "  - CHAT_IMPLEMENTATION_SUMMARY.md"
    echo ""
    echo "🧪 Tests:"
    echo "  - tests/unit/chat/chat-manager.test.ts"
    echo "  - tests/unit/chat/chat-storage.test.ts"
    echo ""
else
    echo ""
    echo "❌ Installation failed"
    echo "Please install dependencies manually:"
    echo "  npm install @radix-ui/react-popover"
    exit 1
fi
