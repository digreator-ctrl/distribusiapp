#!/usr/bin/env bash
# ==============================================================================
# Script Shortcut Deploy DistribusiApp (Cloudflare Workers & Pages)
# ==============================================================================
# Penggunaan:
#   ./deploy.sh            -> Menu interaktif
#   ./deploy.sh frontend   -> Deploy Frontend saja ke Cloudflare Pages (shortcut: fe)
#   ./deploy.sh backend    -> Deploy Backend saja ke Cloudflare Workers (shortcut: be)
#   ./deploy.sh all        -> Deploy Backend & Frontend
#   ./deploy.sh git "pesan commit" -> Commit, Push ke GitHub, lalu Deploy Frontend
# ==============================================================================

set -e

# Warna terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Direktori proyek root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_header() {
  echo -e "${CYAN}${BOLD}"
  echo "=========================================================="
  echo "    🚀 DISTRIBUSIAPP DEPLOYMENT SHORTCUT (CLOUDFLARE)     "
  echo "=========================================================="
  echo -e "${NC}"
}

deploy_frontend() {
  echo -e "\n${BLUE}▶ [1/2] Membangun Frontend (Vite + TypeScript)...${NC}"
  npm run build:frontend

  echo -e "\n${BLUE}▶ [2/2] Mengunggah ke Cloudflare Pages...${NC}"
  npx wrangler pages deploy frontend/dist --project-name=distribusiapp

  echo -e "\n${GREEN}${BOLD}✔ Frontend berhasil dideploy ke Cloudflare Pages!${NC}"
  echo -e "${CYAN}🌐 Live URL: https://distribusiapp.pages.dev${NC}\n"
}

deploy_backend() {
  echo -e "\n${BLUE}▶ Mengunggah Backend API ke Cloudflare Workers...${NC}"
  npm run deploy:backend

  echo -e "\n${GREEN}${BOLD}✔ Backend berhasil dideploy ke Cloudflare Workers!${NC}\n"
}

deploy_all() {
  echo -e "\n${YELLOW}=== MEMULAI FULL DEPLOY (BACKEND + FRONTEND) ===${NC}\n"
  deploy_backend
  deploy_frontend
  echo -e "${GREEN}${BOLD}✔ SELURUH SISTEM (BACKEND & FRONTEND) BERHASIL DIDELOY!${NC}\n"
}

git_and_deploy() {
  local msg="$1"
  if [ -z "$msg" ]; then
    msg="chore(deploy): update and deploy application"
  fi

  echo -e "\n${BLUE}▶ [1/3] Menambahkan file ke Git dan membuat commit...${NC}"
  git add .
  if git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}Tidak ada perubahan baru untuk di-commit.${NC}"
  else
    git commit -m "$msg"
    echo -e "${GREEN}✔ Berhasil membuat commit: \"$msg\"${NC}"
  fi

  echo -e "\n${BLUE}▶ [2/3] Mendorong (Push) ke remote GitHub...${NC}"
  git push origin main
  echo -e "${GREEN}✔ Berhasil push ke GitHub!${NC}"

  echo -e "\n${BLUE}▶ [3/3] Menjalankan Deploy Frontend ke Cloudflare Pages...${NC}"
  deploy_frontend
}

show_help() {
  print_header
  echo -e "${BOLD}Cara Penggunaan:${NC}"
  echo -e "  ${CYAN}./deploy.sh${NC}                     Buka menu interaktif"
  echo -e "  ${CYAN}./deploy.sh frontend${NC} (atau fe)    Deploy Frontend saja ke Cloudflare Pages"
  echo -e "  ${CYAN}./deploy.sh backend${NC}  (atau be)    Deploy Backend saja ke Cloudflare Workers"
  echo -e "  ${CYAN}./deploy.sh all${NC}                 Deploy Backend sekaligus Frontend"
  echo -e "  ${CYAN}./deploy.sh git \"pesan\"${NC}          Commit, Push ke GitHub, lalu Deploy Frontend"
  echo -e "  ${CYAN}./deploy.sh help${NC}                Tampilkan bantuan ini\n"
}

# Cek argumen CLI jika diberikan langsung
ACTION="${1:-}"

case "$ACTION" in
  fe|frontend)
    print_header
    deploy_frontend
    ;;
  be|backend)
    print_header
    deploy_backend
    ;;
  all)
    print_header
    deploy_all
    ;;
  git)
    print_header
    git_and_deploy "${2:-}"
    ;;
  help|-h|--help)
    show_help
    ;;
  "")
    # Mode Menu Interaktif jika dijalankan tanpa argumen
    print_header
    echo -e "${BOLD}Silakan pilih opsi deploy:${NC}"
    echo -e "  ${CYAN}1)${NC} Frontend saja (Cloudflare Pages)"
    echo -e "  ${CYAN}2)${NC} Backend saja (Cloudflare Workers)"
    echo -e "  ${CYAN}3)${NC} Full Deploy (Backend + Frontend)"
    echo -e "  ${CYAN}4)${NC} Git Push + Deploy Frontend"
    echo -e "  ${CYAN}5)${NC} Git Push + Full Deploy"
    echo -e "  ${CYAN}6)${NC} Bantuan / Panduan"
    echo -e "  ${CYAN}7)${NC} Keluar"
    echo ""
    read -p "Masukkan pilihan [1-7]: " choice

    case "$choice" in
      1)
        deploy_frontend
        ;;
      2)
        deploy_backend
        ;;
      3)
        deploy_all
        ;;
      4)
        read -p "Masukkan pesan commit (kosongkan untuk default): " cmsg
        git_and_deploy "$cmsg"
        ;;
      5)
        read -p "Masukkan pesan commit (kosongkan untuk default): " cmsg
        git add .
        if ! git diff-index --quiet HEAD --; then
          git commit -m "${cmsg:-chore: update and full deploy}"
        fi
        git push origin main
        deploy_all
        ;;
      6)
        show_help
        ;;
      7|q|Q)
        echo -e "\n${YELLOW}Deploy dibatalkan.${NC}\n"
        exit 0
        ;;
      *)
        echo -e "\n${RED}Pilihan tidak valid!${NC}\n"
        exit 1
        ;;
    esac
    ;;
  *)
    echo -e "\n${RED}Perintah '$ACTION' tidak dikenali!${NC}"
    show_help
    exit 1
    ;;
esac
