#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Selo Deployment Script${NC}"
echo "=================================================="

# Definir diretório
SELO_DIR="~/Documents/Selo"
# TOKEN should be set as environment variable: export GITHUB_TOKEN="your_token_here"
TOKEN="${GITHUB_TOKEN}"

# 1. Ir para diretório
echo -e "${BLUE}1. Preparando diretório...${NC}"
cd ~/Documents
if [ -d "Selo" ]; then
  echo "Pasta Selo já existe"
else
  mkdir -p Selo
  echo "Pasta Selo criada"
fi

# 2. Extrair arquivos
echo -e "${BLUE}2. Extraindo arquivos...${NC}"
if [ -f "selo-project.tar.gz" ]; then
  cd Selo
  tar -xzf ../selo-project.tar.gz
  echo "✅ Arquivos extraídos"
else
  echo "❌ Erro: selo-project.tar.gz não encontrado em ~/Documents"
  echo "Coloque o arquivo e tente novamente"
  exit 1
fi

# 3. Configurar git
echo -e "${BLUE}3. Configurando Git...${NC}"
git config user.name "TRIA Group" 2>/dev/null
git config user.email "dev@triagest.com" 2>/dev/null
git remote add origin "https://${TOKEN}@github.com/Triagest/Selo.git" 2>/dev/null || \
git remote set-url origin "https://${TOKEN}@github.com/Triagest/Selo.git"

# 4. Commit e Push
echo -e "${BLUE}4. Fazendo push para GitHub...${NC}"
git add .
git commit -m "Initial commit: Selo multi-tenant electronic signature platform

- Multi-tenant SaaS architecture
- Dual authentication (super-admin + tenant users)
- Granular permission system
- Document signature workflow
- Append-only audit logging
- AWS S3 integration
- Twilio WhatsApp notifications
- Render deployment ready

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"

if git push -u origin main; then
  echo -e "${GREEN}✅ Push realizado com sucesso!${NC}"
  echo "🎉 Repositório disponível em: https://github.com/Triagest/Selo"
else
  echo "❌ Erro ao fazer push"
  exit 1
fi

echo "=================================================="
echo -e "${GREEN}✅ Deployment concluído!${NC}"
