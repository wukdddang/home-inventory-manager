#!/bin/bash
# ============================================================
# GFS (Grandfather-Father-Son) 데이터베이스 백업 스크립트
# 사용법:
#   ./backup.sh init          # 백업 디렉토리 초기화
#   ./backup.sh <타입>        # 백업 실행 (four_hourly|daily|weekly|monthly|quarterly|yearly)
#   ./backup.sh cleanup       # 만료된 백업 정리
#   ./backup.sh status        # 백업 현황 확인
# ============================================================

set -euo pipefail

# ── 설정 ──
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_ROOT="${PROJECT_ROOT}/backups/database"
CONTAINER_NAME="him-postgres"
DB_USER="${DB_USERNAME:-him_user}"
DB_NAME="${DB_DATABASE:-home_inventory}"
COMPRESS="${BACKUP_COMPRESS:-true}"
LOG_FILE="${PROJECT_ROOT}/backups/backup.log"

# ── 보관 기간 (일) ──
declare -A RETENTION=(
  [four_hourly]=7
  [daily]=30
  [weekly]=90
  [monthly]=365
  [quarterly]=730
  [yearly]=1825
)

BACKUP_TYPES=("four_hourly" "daily" "weekly" "monthly" "quarterly" "yearly")

# ── 함수 ──

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

init() {
  log "백업 디렉토리 초기화..."
  mkdir -p "$PROJECT_ROOT/backups"
  for type in "${BACKUP_TYPES[@]}"; do
    mkdir -p "${BACKUP_ROOT}/${type}"
  done
  touch "$LOG_FILE"
  log "초기화 완료: ${BACKUP_ROOT}"
}

backup() {
  local type="$1"

  if [[ ! " ${BACKUP_TYPES[*]} " =~ " ${type} " ]]; then
    log "ERROR: 알 수 없는 백업 타입: ${type}"
    log "사용 가능: ${BACKUP_TYPES[*]}"
    exit 1
  fi

  local dir="${BACKUP_ROOT}/${type}"
  mkdir -p "$dir"

  local timestamp
  timestamp="$(date '+%Y%m%d_%H%M%S')"
  local filename="backup_${type}_${timestamp}"

  log "백업 시작: ${type} → ${filename}"

  if [[ "$COMPRESS" == "true" ]]; then
    docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" \
      | gzip > "${dir}/${filename}.sql.gz"
    local filepath="${dir}/${filename}.sql.gz"
  else
    docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" \
      > "${dir}/${filename}.sql"
    local filepath="${dir}/${filename}.sql"
  fi

  local size
  size="$(du -h "$filepath" | cut -f1)"
  log "백업 완료: ${filepath} (${size})"
}

cleanup() {
  log "만료된 백업 정리 시작..."
  local total_deleted=0

  for type in "${BACKUP_TYPES[@]}"; do
    local dir="${BACKUP_ROOT}/${type}"
    local days="${RETENTION[$type]}"

    if [[ ! -d "$dir" ]]; then
      continue
    fi

    local count
    count=$(find "$dir" -name "backup_${type}_*" -mtime +"$days" | wc -l)

    if [[ "$count" -gt 0 ]]; then
      find "$dir" -name "backup_${type}_*" -mtime +"$days" -delete
      log "정리: ${type} — ${count}개 삭제 (보관 ${days}일 초과)"
      total_deleted=$((total_deleted + count))
    fi
  done

  log "정리 완료: 총 ${total_deleted}개 삭제"
}

status() {
  echo "============================================"
  echo "  DB 백업 현황 — $(date '+%Y-%m-%d %H:%M:%S')"
  echo "============================================"
  echo ""

  for type in "${BACKUP_TYPES[@]}"; do
    local dir="${BACKUP_ROOT}/${type}"
    local days="${RETENTION[$type]}"

    if [[ ! -d "$dir" ]]; then
      printf "  %-14s │ 디렉토리 없음\n" "$type"
      continue
    fi

    local count
    count=$(find "$dir" -name "backup_${type}_*" 2>/dev/null | wc -l)
    local size
    size=$(du -sh "$dir" 2>/dev/null | cut -f1)
    local latest
    latest=$(ls -t "$dir"/backup_${type}_* 2>/dev/null | head -1 | xargs -r basename)

    printf "  %-14s │ %3d개  %6s  보관 %4d일  최신: %s\n" \
      "$type" "$count" "$size" "$days" "${latest:-없음}"
  done

  echo ""
  echo "  총 용량: $(du -sh "$BACKUP_ROOT" 2>/dev/null | cut -f1)"
  echo "============================================"
}

# ── 메인 ──

if [[ $# -lt 1 ]]; then
  echo "사용법: $0 {init|four_hourly|daily|weekly|monthly|quarterly|yearly|cleanup|status}"
  exit 1
fi

case "$1" in
  init)    init ;;
  cleanup) cleanup ;;
  status)  status ;;
  *)       backup "$1" ;;
esac
