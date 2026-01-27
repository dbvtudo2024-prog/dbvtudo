# Clube de Desbravadores - Sistema Web

Este é um sistema simples para gerenciamento de um Clube de Desbravadores, desenvolvido em PHP puro e MySQL.

## Requisitos
- Servidor Web (Apache/Nginx)
- PHP 7.4 ou superior
- MySQL ou MariaDB

## Instalação

1. **Banco de Dados**
   - Crie um banco de dados chamado `dbvtudo` no seu MySQL.
   - Importe o arquivo `database.sql` para criar as tabelas e o usuário administrador padrão.
   
   Se estiver usando terminal:
   ```bash
   mysql -u root -p dbvtudo < database.sql
   ```

2. **Configuração**
   - Abra o arquivo `includes/config.php`.
   - Verifique as configurações de banco de dados (`DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`).
   - Se necessário, ajuste a `BASE_URL` para corresponder ao endereço do seu projeto (ex: `http://localhost/dbvtudo`).

3. **Permissões**
   - Certifique-se de que a pasta `uploads/` tenha permissão de escrita para que o upload de imagens funcione.

## Acesso

- **Área Pública**: Acesse `index.php` (ex: `https://github.com/dbvtudo2024-prog/dbvtudo.git`).
- **Painel Administrativo**:
  - URL: `login.php` ou clique em "Login" no menu.
  - **E-mail**: `ronaldosonic@gmail.com`
  - **Senha**: `admin123`

## Funcionalidades

- **Admin**:
  - Dashboard com estatísticas.
  - CRUD (Criar, Ler, Atualizar, Deletar) de Especialidades, Classes, História, Emblemas e Uniformes.
  - Configuração do link externo para o SGC.
- **Público**:
  - Visualização de todas as seções cadastradas.
  - Design responsivo simples.

## Estrutura de Pastas

- `/admin`: Arquivos do painel administrativo.
- `/includes`: Arquivos de configuração, conexão e templates (header/footer).
- `/pages`: Páginas de conteúdo da área pública.
- `/assets`: CSS e Imagens estáticas.
- `/uploads`: Imagens enviadas pelo sistema.

git config --global user.email "ronaldosonic@gmail.com"
git config --global user.name "Ronaldo Lyma"