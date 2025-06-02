# Home GCP - Plataforma de Automação Doméstica e Gerenciamento de Infraestrutura

Uma plataforma completa de automação doméstica que integra múltiplos serviços e dispositivos, com foco em controle de infraestrutura Google Cloud Platform (GCP), monitoramento de dispositivos IoT, e automação residencial através do Home Assistant.

## 🚀 Funcionalidades Principais

### 🖥️ Gerenciamento de Infraestrutura GCP
- **Controle de Instâncias Compute Engine**: Liga/desliga servidores de codespaces remotamente
- **Monitoramento de Status**: Sensor do Home Assistant que exibe o estado atual das instâncias
- **Integração com Home Assistant**: Automações baseadas no status dos serviços

### 🏠 Automação Doméstica
- **MySensors Integration**: Sensores personalizados para Home Assistant
- **Controle de Dispositivos**: Luzes Tuya, câmeras, impressoras, ventiladores
- **Monitoramento de Rede**: Sensores de DNS, router, Pi-hole
- **Wake-on-LAN**: Controle remoto de dispositivos na rede

### 📱 Integrações de Comunicação
- **Discord Bot**: Automação e controle via Discord
- **WhatsApp Bot**: Interface de controle via WhatsApp Web
- **Email**: Notificações e alertas por email

### 🎵 Entretenimento
- **Spotify Integration**: Controle de reprodução e monitoramento
- **Twitch Monitoring**: Acompanhamento de streams e notificações

### 📹 Sistema de Câmeras
- **HLS Streaming**: Transmissão ao vivo das câmeras
- **Gravação e Processamento**: Suporte a FFmpeg para processamento de vídeo
- **Interface Web**: Visualização das câmeras através da interface web

### 🤖 IA e Automação Inteligente
- **Chatbot com MCP**: Sistema de chatbot usando Model Context Protocol
- **Anthropic AI**: Integração com Claude para tarefas inteligentes
- **Agendador de Tarefas**: Sistema de cron jobs para automações programadas
- **Google Cloud AI**: Speech-to-text e text-to-speech

## 🛠️ Stack Tecnológica

### Runtime e Linguagem
- **Bun**: Runtime JavaScript/TypeScript de alta performance
- **TypeScript**: Linguagem principal com tipagem estática
- **Node.js**: Compatibilidade com ecossistema Node.js

### Frontend
- **React 19**: Interface de usuário moderna
- **Tailwind CSS**: Framework CSS utilitário
- **Material Design**: Componentes de interface

### Backend
- **Express.js**: Framework web
- **PostgreSQL**: Banco de dados principal com Drizzle ORM
- **Winston**: Sistema de logging estruturado

### Integrações
- **Google Cloud APIs**: Compute Engine, Speech, Text-to-Speech, Storage
- **WhatsApp Web.js**: Automação do WhatsApp
- **Discord.js**: Bot para Discord
- **Baileys**: WhatsApp API alternativa
- **ONVIF**: Protocolo para câmeras IP

### DevOps
- **Docker**: Containerização da aplicação
- **Google Chrome**: Para automação web (headless)
- **FFmpeg**: Processamento de mídia
- **Xvfb**: Display virtual para ambiente headless

## 📋 Pré-requisitos

- **Bun** ≥ 1.0.0
- **PostgreSQL** (para armazenamento de dados)
- **Google Cloud Account** (para APIs do GCP)
- **Home Assistant** (para integração MySensors)
- **Docker** (para deploy em container)

## ⚙️ Instalação e Configuração

### 1. Clone o repositório
```bash
git clone <repository-url>
cd home-gcp
```

### 2. Instale as dependências
```bash
bun install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` com as seguintes variáveis:

```env
# Home Assistant Config
HA_TOKEN=your_home_assistant_long_lived_access_token
HA_URL=http://your_home_assistant_ip:8123
AUTH_TOKEN=your_custom_auth_token_here

# GCP Service Account Config
GCP_SERVICE_ACCOUNT_PROJECT_ID=your-gcp-project-id
GCP_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----
GCP_SERVICE_ACCOUNT_CLIENT_ID=your_service_account_client_id
GCP_SERVICE_ACCOUNT_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GCP_SERVICE_ACCOUNT_TOKEN_URL=https://oauth2.googleapis.com/token
GCP_SERVICE_ACCOUNT_PRIVATE_KEY_ID=your_private_key_id
GCP_SERVICE_ACCOUNT_UNIVERSE_DOMAIN=googleapis.com

# GCP Client Configuration
GCP_OAUTH_CLIENT_ID=your-oauth-client-id.apps.googleusercontent.com
GCP_OAUTH_PROJECT_ID=your-gcp-project-id
GCP_OAUTH_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GCP_OAUTH_TOKEN_URI=https://oauth2.googleapis.com/token
GCP_OAUTH_AUTH_PROVIDER=https://www.googleapis.com/oauth2/v1/certs
GCP_OAUTH_CLIENT_SECRET=your-oauth-client-secret
GCP_OAUTH_REDIRECT_URI_HOST=http://localhost:3000

# Codespaces Config
CODESPACES_INSTANCE_NAME=your-instance-name
CODESPACES_INSTANCE_ZONE=your-preferred-zone
CODESPACES_INSTANCE_PROJECT_ID=your-gcp-project-id

# Server Config
PORT=3000

# Database Config
DB_HOST=your_database_host
DB_PORT=5432
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name

# Anthropic Config
ANTHROPIC_API_KEY=sk-ant-api03-your-anthropic-api-key

# Discord Config
ENABLE_DISCORD=true
DISCORD_TOKEN=your_discord_bot_token
DISCORD_ALLOWED_USER_ID=your_discord_user_id
DISCORD_BOT_ID=your_discord_bot_id

# OpenObserve Config
OPEN_OBSERVE_ENDPOINT=http://your_openobserve_host:5080/
OPEN_OBSERVE_ORGANIZATION=default
OPEN_OBSERVE_STREAM=your_log_stream_name
OPEN_OBSERVE_USERNAME=your_openobserve_username
OPEN_OBSERVE_PASSWORD=your_openobserve_password
DISABLE_OPEN_OBSERVE=false
ENABLE_LOG_IO_TRANSPORT=true

# Spotify Config
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Email SMTP
EMAIL_HOST=your_smtp_host
EMAIL_USER=your_email_username
EMAIL_PASSWORD=your_email_password
EMAIL_PORT=587

# Login
LOGIN_USERNAME=your_login_username
LOGIN_PASSWORD=your_login_password

# Puppeteer
CHROME_PATH=/usr/bin/google-chrome
HEADLESS=true
FFMPEG_PATH=/usr/bin/ffmpeg
FLUENTFFMPEG_COV=1
```

### 4. Build da aplicação
```bash
bun run build
```

### 5. Execute a aplicação
```bash
# Desenvolvimento
bun run dev

# Produção
bun run start
```

## 🐳 Deploy com Docker

### Build da imagem
```bash
docker build -t home-gcp .
```

### Execute o container
```bash
docker run -d \
  --name home-gcp \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e PORT=3000 \
  home-gcp
```

## 📚 Estrutura do Projeto

```
src/
├── clients/           # Integrações com serviços externos
│   ├── google/       # Google Cloud APIs
│   ├── homeAssistant/ # Home Assistant MySensors
│   ├── Camera/       # Sistema de câmeras
│   ├── Anthropic/    # IA da Anthropic
│   ├── spotify/      # Spotify API
│   └── database/     # Banco de dados
├── discord/          # Bot do Discord
├── frontend/         # Interface React
├── logger/           # Sistema de logging
├── mcp/              # Model Context Protocol
├── routers/          # Rotas da API Express
├── scheduller/       # Agendador de tarefas
├── queue/            # Sistema de filas
├── types/            # Definições de tipos TypeScript
└── utils/            # Utilitários gerais
```

## 🔌 APIs e Endpoints

### Autenticação
- `POST /auth/login` - Login de usuário
- `GET /auth/status` - Status da autenticação

### Câmeras
- `GET /cameras` - Lista de câmeras disponíveis
- `GET /video/:camera` - Stream HLS da câmera

### Filas e Agendamento
- `GET /queue` - Status das filas
- `POST /schedule` - Criar nova tarefa agendada
- `DELETE /schedule/:id` - Remover tarefa

### MCP (Model Context Protocol)
- `POST /mcp/chat` - Interface de chat com IA
- `GET /mcp/status` - Status da conexão MCP

## 🤝 Integração com Home Assistant

O projeto oferece sensores MySensors personalizados para Home Assistant:

- **CodespacesSensor**: Status das instâncias GCP
- **StatusSensors**: Monitoramento geral do sistema
- **FanSensors**: Controle de ventiladores
- **Camera**: Estado das câmeras
- **DNSSensor**: Monitoramento DNS
- **Pihole**: Status do Pi-hole
- **Router**: Informações do roteador
- **TuyaLight**: Controle de luzes Tuya

## 📊 Monitoramento e Logging

O sistema utiliza Winston para logging estruturado com diferentes níveis:
- **Error**: Erros críticos
- **Warn**: Avisos importantes
- **Info**: Informações gerais
- **Debug**: Detalhes para desenvolvimento

## 🔒 Segurança

- Autenticação por cookies
- Validação de esquemas com Zod
- Middleware de autenticação Express
- Credenciais seguras para Google Cloud

## 🚀 Scripts Disponíveis

```bash
# Desenvolvimento
bun run dev          # Executar em modo desenvolvimento com watch
bun run dev-inspect  # Desenvolvimento com inspector para debug

# Produção
bun run build        # Build da aplicação
bun run start        # Executar versão de produção

# Qualidade de código
bun run lint         # Verificar código com ESLint
bun run lint:fix     # Corrigir problemas automaticamente
bun run format      # Formatar código com Prettier
```

## 📝 Licença

Este projeto é proprietário e destinado ao uso doméstico pessoal.

## 🤖 Contribuição

Este é um projeto pessoal de automação doméstica. Contribuições são bem-vindas através de pull requests.

## 📞 Suporte

Para questões ou problemas, crie uma issue no repositório do projeto.

---

**Desenvolvido com ❤️ para automação doméstica inteligente**