# Grou Employee Self Service AI Agent Platform - Project Setup Guide

## 🚀 Quick Start

This guide will help you set up the development environment and start building your Employee Self Service AI Agent Platform based on your PRD and Figma designs.

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Docker and Docker Compose
- Git
- Code editor (VS Code recommended)
- Access to OpenAI API or Azure OpenAI

## 🏗️ Project Structure

```
grou-ess-platform/
├── apps/
│   ├── web/                 # Next.js web application
│   ├── mobile/              # React Native mobile app
│   └── api/                 # Node.js backend API
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── database/            # Database schemas & migrations
│   ├── auth/                # Authentication utilities
│   └── shared/              # Shared utilities
├── docs/                    # Project documentation
├── docker-compose.yml       # Local development environment
└── README.md
```

## 🔧 Initial Setup

### 1. Create Monorepo Structure

```bash
# Create main project directory
mkdir grou-ess-platform
cd grou-ess-platform

# Initialize as a monorepo with Lerna/Nx
npx create-nx-workspace@latest . --preset=empty --packageManager=npm
```

### 2. Set up Backend API

```bash
# Create API application
npx nx g @nx/node:app api

# Install core dependencies
npm install express cors helmet morgan compression
npm install prisma @prisma/client bcryptjs jsonwebtoken
npm install openai pinecone-client redis bull
npm install joi express-rate-limit
npm install -D @types/express @types/cors nodemon ts-node
```

### 3. Set up Frontend Web App

```bash
# Create Next.js web app
npx nx g @nx/next:app web

# Install UI dependencies
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install tailwindcss @headlessui/react heroicons
npm install react-hook-form @hookform/resolvers zod
npm install socket.io-client axios swr
```

### 4. Set up Database

```bash
# Initialize Prisma
npx prisma init

# Create docker-compose for local development
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: grou_user
      POSTGRES_PASSWORD: grou_password
      POSTGRES_DB: grou_ess
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

volumes:
  postgres_data:
  qdrant_data:
```

### 5. Environment Configuration

Create `.env` files for each application:

**API (.env)**:
```env
DATABASE_URL="postgresql://grou_user:grou_password@localhost:5432/grou_ess"
JWT_SECRET="your-super-secret-jwt-key"
OPENAI_API_KEY="your-openai-api-key"
REDIS_URL="redis://localhost:6379"
QDRANT_URL="http://localhost:6333"
HRIS_API_URL="your-hris-system-url"
HRIS_API_KEY="your-hris-api-key"
```

**Web (.env.local)**:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
```

## 🗄️ Database Schema

Create your Prisma schema (`packages/database/prisma/schema.prisma`):

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  employeeId    String   @unique
  email         String   @unique
  firstName     String
  lastName      String
  department    String?
  position      String?
  manager       String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  conversations Conversation[]
  auditLogs     AuditLog[]
  
  @@map("users")
}

model Conversation {
  id        String   @id @default(cuid())
  userId    String
  title     String?
  status    String   @default("active") // active, archived
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user     User      @relation(fields: [userId], references: [id])
  messages Message[]
  
  @@map("conversations")
}

model Message {
  id             String   @id @default(cuid())
  conversationId String
  role           String   // user, assistant, system
  content        String
  metadata       Json?
  createdAt      DateTime @default(now())
  
  conversation Conversation @relation(fields: [conversationId], references: [id])
  
  @@map("messages")
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String
  action    String   // payslip_request, leave_check, etc.
  details   Json
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
  
  @@map("audit_logs")
}
```

## 🤖 AI Agent Implementation

Create your AI agent orchestrator (`apps/api/src/services/aiAgent.ts`):

```typescript
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

export class ESS_AIAgent {
  private openai: OpenAI;
  private prisma: PrismaClient;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.prisma = new PrismaClient();
  }

  async processUserQuery(userId: string, message: string) {
    // Intent recognition
    const intent = await this.classifyIntent(message);
    
    // Execute appropriate action
    switch (intent) {
      case 'payslip_request':
        return await this.handlePayslipRequest(userId, message);
      case 'leave_balance':
        return await this.handleLeaveBalance(userId);
      case 'personal_data_update':
        return await this.handlePersonalDataUpdate(userId, message);
      case 'employment_letter':
        return await this.handleEmploymentLetter(userId, message);
      default:
        return await this.handleGeneralQuery(userId, message);
    }
  }

  private async classifyIntent(message: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an intent classifier for an HR chatbot. Classify the user's message into one of these categories:
          - payslip_request: User wants to request or download payslip
          - leave_balance: User wants to check leave balance
          - personal_data_update: User wants to update personal information
          - employment_letter: User wants employment verification letter
          - general_query: General HR question
          
          Respond with just the category name.`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 50,
      temperature: 0
    });

    return response.choices[0]?.message?.content?.trim() || 'general_query';
  }

  // Implement specific handlers for each intent...
}
```

## 📱 Frontend Implementation

Create your chat interface (`apps/web/src/components/ChatInterface.tsx`):

```tsx
import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL!);
    setSocket(newSocket);

    newSocket.on('message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => newSocket.close();
  }, []);

  const sendMessage = () => {
    if (!inputValue.trim() || !socket) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    socket.emit('user_message', { content: inputValue });
    setInputValue('');
  };

  return (
    <div className="chat-interface">
      <div className="messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="content">{message.content}</div>
            <div className="timestamp">{message.timestamp.toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask me anything about HR..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
```

## 🔗 HRIS Integration

Create HRIS service (`apps/api/src/services/hrisService.ts`):

```typescript
export class HRISService {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = process.env.HRIS_API_URL!;
    this.apiKey = process.env.HRIS_API_KEY!;
  }

  async getEmployeePayslip(employeeId: string, month: string, year: string) {
    try {
      const response = await fetch(`${this.baseURL}/payslips`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ employeeId, month, year })
      });

      if (!response.ok) {
        throw new Error('Payslip not found');
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to retrieve payslip: ${error.message}`);
    }
  }

  async getLeaveBalance(employeeId: string) {
    // Implementation for leave balance retrieval
  }

  async updateEmployeeData(employeeId: string, updateData: any) {
    // Implementation for personal data updates
  }

  async generateEmploymentLetter(employeeId: string, letterType: string) {
    // Implementation for document generation
  }
}
```

## 🧪 Testing Setup

Create test configurations:

**Jest config** (`jest.config.js`):
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps', '<rootDir>/packages'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'apps/**/*.ts',
    '!apps/**/*.d.ts'
  ]
};
```

**Example test** (`apps/api/src/__tests__/aiAgent.test.ts`):
```typescript
import { ESS_AIAgent } from '../services/aiAgent';

describe('ESS_AIAgent', () => {
  let agent: ESS_AIAgent;

  beforeEach(() => {
    agent = new ESS_AIAgent();
  });

  test('should classify payslip request correctly', async () => {
    const message = "I need my payslip for September 2025";
    const intent = await agent.classifyIntent(message);
    expect(intent).toBe('payslip_request');
  });
});
```

## 🚀 Development Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "dev:api": "nx serve api",
    "dev:web": "nx serve web",
    "dev:all": "nx run-many --target=serve --projects=api,web --parallel",
    "build": "nx run-many --target=build --all",
    "test": "nx run-many --target=test --all",
    "db:migrate": "npx prisma migrate dev",
    "db:seed": "npx prisma db seed",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down"
  }
}
```

## 🎯 Next Steps

1. **Start Development**: Run `npm run docker:up` then `npm run dev:all`
2. **Set up CI/CD**: Configure GitHub Actions for automated testing and deployment
3. **Implement Authentication**: Integrate with your company's SSO system
4. **Add Monitoring**: Set up logging and error tracking
5. **Security Review**: Implement rate limiting and input validation
6. **User Testing**: Conduct UAT with actual employees

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Guide](https://platform.openai.com/docs)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)

---

**Pro Tip**: Start with the chat interface and basic intent recognition, then gradually add HRIS integrations and advanced features. This approach allows you to demonstrate progress early and gather feedback from stakeholders.