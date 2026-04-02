#!/usr/bin/env bash
set -euo pipefail

# ─── xu-novel one-click setup ───────────────────────────────────────
# curl -fsSL https://raw.githubusercontent.com/xuyuanzhang1122/novel--myself/main/setup.sh | bash
# curl -fsSL https://raw.githubusercontent.com/xuyuanzhang1122/novel--myself/main/setup.sh -o setup.sh && bash setup.sh
# ────────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

DEFAULT_REPO_URL="${XU_NOVEL_REPO_URL:-https://github.com/xuyuanzhang1122/novel--myself.git}"
DEFAULT_INSTALL_DIR="${XU_NOVEL_INSTALL_DIR:-$HOME/xu-novel}"

info()  { printf "${GREEN}[INFO]${NC}  %s\n" "$1"; }
warn()  { printf "${YELLOW}[WARN]${NC}  %s\n" "$1"; }
error() { printf "${RED}[ERROR]${NC} %s\n" "$1"; exit 1; }
step()  { printf "\n${CYAN}── %s ──${NC}\n" "$1"; }

OS_FAMILY=""
INSTALL_DIR=""
REPO_URL=""

# Open fd 3 from /dev/tty for interactive input.
# This keeps stdin (fd 0) intact for bash to continue reading the script
# when piped via curl | bash.
if [ ! -t 0 ]; then
  exec 3</dev/tty || error "Cannot open /dev/tty. Run: curl -fsSL <url> -o setup.sh && bash setup.sh"
else
  exec 3<&0
fi

# ─── helpers ────────────────────────────────────────────────────────

require_command() {
  command -v "$1" >/dev/null 2>&1 || error "Missing required command: $1"
}

detect_os() {
  step "Detecting operating system"
  local kernel
  kernel="$(uname -s)"

  case "$kernel" in
    Darwin) OS_FAMILY="macos" ;;
    Linux)
      if grep -qi microsoft /proc/version 2>/dev/null; then
        OS_FAMILY="wsl"
      else
        OS_FAMILY="linux"
      fi
      ;;
    *) error "Unsupported OS: $kernel (macOS / Linux / WSL only)" ;;
  esac

  info "OS detected: $OS_FAMILY"
}

load_nvm() {
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck disable=SC1090
    . "$NVM_DIR/nvm.sh"
  fi
}

ensure_node() {
  step "Checking Node.js"
  load_nvm

  local current_major=""
  if command -v node >/dev/null 2>&1; then
    current_major="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
  fi

  if [ -n "$current_major" ] && [ "$current_major" -ge 20 ]; then
    info "Node.js $(node -v) OK"
    return
  fi

  warn "Node.js >= 20 required, installing..."

  case "$OS_FAMILY" in
    macos)
      if command -v brew >/dev/null 2>&1; then
        brew install node@20
        export PATH="/opt/homebrew/opt/node@20/bin:/usr/local/opt/node@20/bin:$PATH"
      else
        error "Homebrew not found. Install it first: https://brew.sh"
      fi
      ;;
    linux|wsl)
      require_command curl
      export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
      if [ ! -s "$NVM_DIR/nvm.sh" ]; then
        curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
      fi
      load_nvm
      command -v nvm >/dev/null 2>&1 || error "nvm installation failed"
      nvm install 20
      nvm use 20
      ;;
  esac

  require_command node
  info "Node.js $(node -v) installed"
}

ensure_pnpm() {
  step "Checking pnpm"
  if command -v pnpm >/dev/null 2>&1; then
    info "pnpm $(pnpm -v) OK"
    return
  fi

  info "Installing pnpm..."
  if command -v corepack >/dev/null 2>&1; then
    corepack enable
    corepack prepare pnpm@latest --activate
  else
    npm install -g pnpm
  fi
  require_command pnpm
  info "pnpm $(pnpm -v) installed"
}

# ─── interactive setup ──────────────────────────────────────────────

choose_dir() {
  step "Choose installation directory"
  printf "Install to [default: %s]: " "$DEFAULT_INSTALL_DIR" > /dev/tty
  read -r INSTALL_DIR <&3
  INSTALL_DIR="${INSTALL_DIR:-$DEFAULT_INSTALL_DIR}"
}

clone_and_install() {
  step "Cloning and installing"
  require_command git
  REPO_URL="$DEFAULT_REPO_URL"

  if [ -d "$INSTALL_DIR/.git" ]; then
    info "Directory already exists, pulling latest..."
    cd "$INSTALL_DIR"
    git pull --rebase
  elif [ -e "$INSTALL_DIR" ] && [ -n "$(ls -A "$INSTALL_DIR" 2>/dev/null)" ]; then
    error "Target directory is not empty: $INSTALL_DIR"
  else
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
  fi

  info "Installing dependencies..."
  pnpm install

  # pnpm 10+ blocks postinstall scripts by default; approve prisma so it can generate the client
  if pnpm approve-builds --help >/dev/null 2>&1; then
    info "Approving build scripts for prisma..."
    pnpm approve-builds prisma @prisma/client @prisma/engines sharp 2>/dev/null || true
    pnpm install
  fi
}

prompt_value() {
  local prompt="$1"
  local default_value="${2:-}"
  local result=""
  if [ -n "$default_value" ]; then
    printf "%s [%s]: " "$prompt" "$default_value" > /dev/tty
    read -r result <&3
    printf '%s' "${result:-$default_value}"
  else
    printf "%s: " "$prompt" > /dev/tty
    read -r result <&3
    printf '%s' "$result"
  fi
}

configure_env() {
  step "Configuring environment"
  cd "$INSTALL_DIR"

  if [ -f .env.local ]; then
    warn ".env.local already exists, skipping. Delete it and re-run to reconfigure."
    return
  fi

  local admin_email admin_password site_revalidate_secret auth_session_secret
  local smtp_qq_email smtp_qq_auth_code smtp_from_name
  local image_api_base_url image_api_key image_api_bearer_token

  printf "\n"
  info "xu-novel uses a built-in bootstrap admin account plus email registration."
  info "Set your bootstrap admin credentials below."

  admin_email="$(prompt_value "Admin email (ADMIN_EMAIL)" "admin@local")"
  admin_password="$(prompt_value "Admin password (ADMIN_PASSWORD)" "novel123456")"

  if command -v openssl >/dev/null 2>&1; then
    site_revalidate_secret="$(openssl rand -base64 32 | tr -d '\n')"
    auth_session_secret="$(openssl rand -base64 32 | tr -d '\n')"
  else
    site_revalidate_secret="$(node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))")"
    auth_session_secret="$(node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))")"
  fi

  printf "\n"
  info "QQ SMTP is used for registration verification emails."
  smtp_qq_email="$(prompt_value "QQ sender email (SMTP_QQ_EMAIL, leave empty to skip)" "")"
  smtp_qq_auth_code="$(prompt_value "QQ mail auth code (SMTP_QQ_AUTH_CODE)" "")"
  smtp_from_name="$(prompt_value "Sender name (SMTP_FROM_NAME)" "xu-novel")"

  printf "\n"
  info "Object storage is proxied through an upload service."
  image_api_base_url="$(prompt_value "Upload service base URL (IMAGE_API_BASE_URL)" "http://127.0.0.1:4000")"
  image_api_key="$(prompt_value "Upload service API key (IMAGE_API_KEY, optional)" "")"
  image_api_bearer_token="$(prompt_value "Upload service bearer token (IMAGE_API_BEARER_TOKEN, optional)" "")"

  cat > .env.local <<EOF
# xu-novel environment configuration
# Generated by setup.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Admin credentials
ADMIN_EMAIL=${admin_email}
ADMIN_PASSWORD=${admin_password}

# Site URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001

# Cross-site cache revalidation
SITE_REVALIDATE_URL=http://localhost:3000/api/revalidate
SITE_REVALIDATE_SECRET=${site_revalidate_secret}
AUTH_SESSION_SECRET=${auth_session_secret}

# QQ SMTP (registration emails)
SMTP_QQ_EMAIL=${smtp_qq_email}
SMTP_QQ_AUTH_CODE=${smtp_qq_auth_code}
SMTP_FROM_NAME=${smtp_from_name}

# Object storage
IMAGE_API_BASE_URL=${image_api_base_url}
IMAGE_API_KEY=${image_api_key}
IMAGE_API_BEARER_TOKEN=${image_api_bearer_token}

# Cookie domain (leave empty for localhost, set to .yourdomain.com in production)
NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=
EOF

  info ".env.local created"
}

init_database() {
  step "Initializing database"
  cd "$INSTALL_DIR"

  info "Running Prisma db push to create SQLite database..."
  pnpm --filter @xu-novel/lib exec prisma db push --skip-generate 2>/dev/null || \
    npx --prefix packages/lib prisma db push --skip-generate

  info "Generating Prisma client..."
  pnpm --filter @xu-novel/lib exec prisma generate 2>/dev/null || \
    npx --prefix packages/lib prisma generate

  info "Database initialized at packages/lib/prisma/dev.db"
}

verify_build() {
  step "Verifying build"
  cd "$INSTALL_DIR"
  pnpm build
  info "Build successful"
}

print_summary() {
  printf "\n"
  printf "${GREEN}════════════════════════════════════════════════════${NC}\n"
  printf "${GREEN}  xu-novel installed successfully!${NC}\n"
  printf "${GREEN}════════════════════════════════════════════════════${NC}\n"
  printf "\n"
  printf "  Directory:  %s\n" "$INSTALL_DIR"
  printf "  Database:   SQLite (packages/lib/prisma/dev.db)\n"
  printf "\n"
  printf "  ${CYAN}Start dev server:${NC}\n"
  printf "    cd %s && pnpm dev\n" "$INSTALL_DIR"
  printf "\n"
  printf "  ${CYAN}Start production servers:${NC}\n"
  printf "    Terminal 1: cd %s && pnpm --filter @xu-novel/site start\n" "$INSTALL_DIR"
  printf "    Terminal 2: cd %s && pnpm --filter @xu-novel/admin start\n" "$INSTALL_DIR"
  printf "\n"
  printf "  ${CYAN}Access:${NC}\n"
  printf "    Site (reader):  http://localhost:3000\n"
  printf "    Admin (editor): http://localhost:3001\n"
  printf "\n"
  printf "  ${CYAN}Bootstrap admin login:${NC}\n"
  printf "    Email:    value from ADMIN_EMAIL in .env.local\n"
  printf "    Password: value from ADMIN_PASSWORD in .env.local\n"
  printf "    New users can also register on the site with email verification.\n"
  printf "\n"
}

# ─── main ───────────────────────────────────────────────────────────

main() {
  printf "${CYAN}xu-novel setup${NC}\n"
  printf "Private novel reading & publishing platform\n\n"

  detect_os
  ensure_node
  ensure_pnpm
  choose_dir
  clone_and_install
  configure_env
  init_database
  verify_build
  print_summary
}

main "$@"
