.PHONY: push build test clean

# Excluded paths from git tracking
EXCLUDE = docs/ TODO.md *.zip test-results/ .DS_Store

# Git add, commit, push with excluded paths
# Usage: make push m="commit message"
push:
	@if [ -z "$(m)" ]; then echo "❌ Usage: make push m=\"commit message\""; exit 1; fi
	git add -A -- . $(addprefix ':!',$(EXCLUDE))
	git status
	git commit -m "$(m)"
	git push

# Build ZIP for Chrome Web Store
build:
	./build-extension.sh

# Run E2E tests
test:
	npm test

# Clean build artifacts
clean:
	rm -f *.zip
	rm -rf test-results/
