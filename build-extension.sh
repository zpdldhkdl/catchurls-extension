#!/bin/bash
# =============================================================================
# Chrome Extension 배포용 압축 스크립트
# =============================================================================
# 이 스크립트는 Chrome 웹 스토어 심사에 필요한 파일만 추려서 ZIP 파일로 압축합니다.
# 
# 사용법:
#   ./build-extension.sh [output-filename]
#
# 예시:
#   ./build-extension.sh                    # catch-urls-v1.0.0.zip 생성
#   ./build-extension.sh my-extension.zip   # my-extension.zip 생성
#
# 주의사항:
#   - 파일이 추가되거나 변경될 경우 이 스크립트도 함께 업데이트해야 합니다.
#   - AGENTS.md에 해당 내용이 명시되어 있습니다.
# =============================================================================

set -e

# 스크립트 디렉토리 기준으로 작업
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# manifest.json에서 버전 정보 추출
VERSION=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)

# 출력 파일명 설정
OUTPUT_FILE="${1:-catch-urls-v${VERSION}.zip}"

# 기존 파일 삭제
if [ -f "$OUTPUT_FILE" ]; then
    rm "$OUTPUT_FILE"
    echo "기존 파일 삭제: $OUTPUT_FILE"
fi

echo "Chrome Extension 배포용 ZIP 생성 중..."
echo "버전: $VERSION"
echo "출력 파일: $OUTPUT_FILE"
echo ""

# Chrome 웹 스토어 심사에 필요한 파일/디렉토리 목록
# manifest.json에 명시된 모든 리소스 포함
FILES_TO_INCLUDE=(
    # 필수 매니페스트
    "manifest.json"
    
    # 국제화 (i18n)
    "_locales"
    
    # 백그라운드 스크립트
    "background"
    
    # 컨텐츠 스크립트
    "content"
    
    # 팝업 UI
    "popup"
    
    # 옵션 페이지
    "options"
    
    # 아이콘 (icon16.png, icon48.png, icon128.png만 포함)
    "icons/icon16.png"
    "icons/icon48.png"
    "icons/icon128.png"
)

# 포함될 파일 목록 출력
echo "포함될 파일/디렉토리:"
for item in "${FILES_TO_INCLUDE[@]}"; do
    if [ -e "$item" ]; then
        echo "  ✓ $item"
    else
        echo "  ✗ $item (존재하지 않음!)"
        exit 1
    fi
done
echo ""

# ZIP 파일 생성
zip -r "$OUTPUT_FILE" "${FILES_TO_INCLUDE[@]}" -x "*.DS_Store" -x "*/.DS_Store"

# 결과 출력
echo ""
echo "================================"
echo "✅ 빌드 완료!"
echo "파일: $OUTPUT_FILE"
echo "크기: $(du -h "$OUTPUT_FILE" | cut -f1)"
echo "================================"

# ZIP 내용 확인
echo ""
echo "ZIP 파일 내용:"
unzip -l "$OUTPUT_FILE"
