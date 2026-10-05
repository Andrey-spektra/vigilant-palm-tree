#!/usr/bin/env bash
# ============================================================
#  Исполняющий файл для запуска игры «СИЛА СЛОВА»
#  Использование:  ./запуск_игры.sh
#  Опции:          --port 8080   — задать номер порта
#                  --offline     — запуск офлайн-сборки из папки
#                                  game-build/сила_слова_оффлайн
# ============================================================
set -e

cd "$(dirname "$0")"

PORT=8000
GAME_ROOT="."
GAME_FILE="СИЛА_СЛОВА_игра.html"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --port)
            PORT="$2"; shift 2 ;;
        --offline)
            GAME_ROOT="game-build/сила_слова_оффлайн"
            GAME_FILE="index.html"; shift ;;
        *)
            echo "Неизвестный параметр: $1"; exit 1 ;;
    esac
done

if [[ ! -f "$GAME_ROOT/$GAME_FILE" ]]; then
    echo "ОШИБКА: не найден файл игры: $(pwd)/$GAME_ROOT/$GAME_FILE"
    exit 1
fi

URL="http://localhost:$PORT/$GAME_FILE"

echo "==============================================="
echo "  Запуск игры «СИЛА СЛОВА»"
echo "  Каталог: $(pwd)/$GAME_ROOT"
echo "  Адрес:   $URL"
echo "  Нажмите Ctrl+C, чтобы остановить сервер."
echo "==============================================="

# Пытаемся открыть браузер автоматически (Linux / macOS / WSL)
open_browser() {
    sleep 1
    if command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$URL" >/dev/null 2>&1 || true
    elif command -v open >/dev/null 2>&1; then
        open "$URL" >/dev/null 2>&1 || true
    elif command -v cmd.exe >/dev/null 2>&1; then
        cmd.exe /c start "$URL" >/dev/null 2>&1 || true
    fi
}
open_browser &

# Запускаем локальный HTTP-сервер на Python
cd "$GAME_ROOT"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
