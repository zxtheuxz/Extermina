# Docker Production Commands

## ✅ Problema Resolvido!

O erro "Faltam as credenciais do Supabase" foi corrigido. As variáveis de ambiente agora são corretamente embarcadas no build da aplicação.

## Comandos para Produção

### 1. Build e Deploy (Já funcionando)
```bash
./docker-deploy.sh
```

### 2. Executar em Produção
Para executar o container em produção, use um dos comandos abaixo:

#### Opção 1: Porta 80 (Produção)
```bash
docker run -d -p 80:80 --name extermina-frango-app zxtheuxz/extermina-frango-app:latest
```

#### Opção 2: Porta 3000 (Teste)
```bash
docker run -d -p 3000:80 --name extermina-frango-app zxtheuxz/extermina-frango-app:latest
```

#### Opção 3: Com restart policy (Recomendado para produção)
```bash
docker run -d \
  -p 80:80 \
  --name extermina-frango-app \
  --restart unless-stopped \
  zxtheuxz/extermina-frango-app:latest
```

### 3. Verificar Status
```bash
# Ver logs do container
docker logs extermina-frango-app

# Verificar se está rodando
docker ps

# Parar o container
docker stop extermina-frango-app

# Remover o container
docker rm extermina-frango-app
```

### 4. Atualizar Aplicação
```bash
# 1. Parar e remover container atual
docker stop extermina-frango-app
docker rm extermina-frango-app

# 2. Fazer pull da imagem mais recente
docker pull zxtheuxz/extermina-frango-app:latest

# 3. Executar nova versão
docker run -d \
  -p 80:80 \
  --name extermina-frango-app \
  --restart unless-stopped \
  zxtheuxz/extermina-frango-app:latest
```

## 🎉 Status: FUNCIONANDO!

- ✅ Variáveis de ambiente embarcadas no build
- ✅ Container executando corretamente
- ✅ Supabase conectando (Auth state: INITIAL_SESSION)
- ✅ Aplicação carregando sem erros

A aplicação agora deve funcionar corretamente em produção!