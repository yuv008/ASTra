#!/bin/bash

# ASTra End-to-End Test Script
# Tests the full stack integration

set -e

API_URL="http://localhost:5000"
TEST_DIR="/tmp/astra-test"
PASS_COUNT=0
FAIL_COUNT=0

echo "🚀 ASTra End-to-End Test Suite"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS_COUNT++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL_COUNT++))
}

info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Setup test files
setup_test_files() {
    info "Setting up test files..."
    mkdir -p "$TEST_DIR"

    # Security test file
    TEST_SECRET="sk""_live_1234567890abcdefghijklmnop"
    cat > "$TEST_DIR/security-test.js" <<EOF
// SQL Injection vulnerability
const userId = getUserInput();
const query = "SELECT * FROM users WHERE id = " + userId;
db.query(query);

// Hardcoded secret
const API_KEY = "$TEST_SECRET";

// Dangerous eval
eval("some code");
EOF

    # Complexity test file
    cat > "$TEST_DIR/complexity-test.js" << 'EOF'
function complexFunction(x, y, z, a, b, c, d) {
  if (x > 0) {
    if (y > 10) {
      if (z > 20) {
        for (let i = 0; i < x; i++) {
          while (i < 5) {
            if (i === 2) {
              return true;
            }
            i++;
          }
        }
      }
    }
  }
  return false;
}
EOF

    # Clean test file
    cat > "$TEST_DIR/clean-test.js" << 'EOF'
function add(a, b) {
  return a + b;
}

module.exports = { add };
EOF

    pass "Test files created"
}

# Test 1: Backend Health Check
test_health() {
    info "Test 1: Backend health check"
    response=$(curl -s "$API_URL/api/health")

    if echo "$response" | grep -q '"status":"healthy"'; then
        pass "Backend is healthy"
    else
        fail "Backend health check failed"
    fi
}

# Test 2: Ollama Status
test_ollama_status() {
    info "Test 2: Ollama status check"
    response=$(curl -s "$API_URL/api/ollama/status")

    if echo "$response" | grep -q '"available"'; then
        pass "Ollama status endpoint working"
    else
        fail "Ollama status check failed"
    fi
}

# Test 3: File Analysis - Security Issues
test_file_analysis_security() {
    info "Test 3: File analysis - security issues"
    response=$(curl -s -X POST "$API_URL/api/analyze/file" \
        -H "Content-Type: application/json" \
        -d "{\"filePath\": \"$TEST_DIR/security-test.js\", \"enableAI\": false}")

    if echo "$response" | grep -q '"ruleId":"sql-injection"'; then
        pass "Detected SQL injection"
    else
        fail "Failed to detect SQL injection"
    fi

    if echo "$response" | grep -q '"ruleId":"hardcoded-secret"'; then
        pass "Detected hardcoded secret"
    else
        fail "Failed to detect hardcoded secret"
    fi

    if echo "$response" | grep -q '"ruleId":"dangerous-function"'; then
        pass "Detected dangerous function (eval)"
    else
        fail "Failed to detect dangerous function"
    fi
}

# Test 4: File Analysis - Complexity
test_file_analysis_complexity() {
    info "Test 4: File analysis - complexity"
    response=$(curl -s -X POST "$API_URL/api/analyze/file" \
        -H "Content-Type: application/json" \
        -d "{\"filePath\": \"$TEST_DIR/complexity-test.js\", \"enableAI\": false}")

    if echo "$response" | grep -q '"ruleId":"long-parameter-list"'; then
        pass "Detected long parameter list"
    else
        fail "Failed to detect long parameter list"
    fi
}

# Test 5: File Analysis - Clean Code
test_file_analysis_clean() {
    info "Test 5: File analysis - clean code"
    response=$(curl -s -X POST "$API_URL/api/analyze/file" \
        -H "Content-Type: application/json" \
        -d "{\"filePath\": \"$TEST_DIR/clean-test.js\", \"enableAI\": false}")

    # Check for metrics
    if echo "$response" | grep -q '"metrics"'; then
        pass "Metrics included in response"
    else
        fail "Metrics missing from response"
    fi

    # Should have minimal critical issues
    error_count=$(echo "$response" | grep -o '"severity":"error"' | wc -l)
    if [ "$error_count" -eq 0 ]; then
        pass "No critical issues in clean code"
    else
        fail "Found critical issues in clean code"
    fi
}

# Test 6: Project Analysis
test_project_analysis() {
    info "Test 6: Project analysis"
    response=$(curl -s -X POST "$API_URL/api/analyze/project" \
        -H "Content-Type: application/json" \
        -d "{\"projectPath\": \"$TEST_DIR\", \"enableAI\": false}")

    if echo "$response" | grep -q '"status":"completed"'; then
        pass "Project analysis completed"
    else
        fail "Project analysis failed"
    fi

    # Check file count
    if echo "$response" | grep -q '"totalFiles":3'; then
        pass "Analyzed all 3 files"
    else
        fail "Failed to analyze all files"
    fi

    # Check for metrics
    if echo "$response" | grep -q '"maintainabilityIndex"'; then
        pass "Project metrics calculated"
    else
        fail "Project metrics missing"
    fi

    # Check for grade
    if echo "$response" | grep -q '"grade"'; then
        pass "Grade assigned to project"
    else
        fail "Grade missing from results"
    fi
}

# Test 7: Error Handling
test_error_handling() {
    info "Test 7: Error handling"

    # Test missing filePath
    response=$(curl -s -X POST "$API_URL/api/analyze/file" \
        -H "Content-Type: application/json" \
        -d '{}')

    if echo "$response" | grep -q '"error"'; then
        pass "Handles missing filePath error"
    else
        fail "Failed to handle missing filePath"
    fi

    # Test non-existent file
    response=$(curl -s -X POST "$API_URL/api/analyze/file" \
        -H "Content-Type: application/json" \
        -d '{"filePath": "/non/existent/file.js"}')

    if echo "$response" | grep -q '"error"'; then
        pass "Handles non-existent file error"
    else
        fail "Failed to handle non-existent file"
    fi
}

# Test 8: Issue Structure
test_issue_structure() {
    info "Test 8: Issue structure validation"
    response=$(curl -s -X POST "$API_URL/api/analyze/file" \
        -H "Content-Type: application/json" \
        -d "{\"filePath\": \"$TEST_DIR/security-test.js\", \"enableAI\": false}")

    if echo "$response" | grep -q '"id"' && \
       echo "$response" | grep -q '"ruleId"' && \
       echo "$response" | grep -q '"message"' && \
       echo "$response" | grep -q '"severity"' && \
       echo "$response" | grep -q '"category"' && \
       echo "$response" | grep -q '"location"'; then
        pass "Issue structure is complete"
    else
        fail "Issue structure incomplete"
    fi

    # Check for CWE/OWASP in security issues
    if echo "$response" | grep -q '"cwe"' && echo "$response" | grep -q '"owasp"'; then
        pass "Security issues include CWE/OWASP"
    else
        fail "Security issues missing CWE/OWASP"
    fi
}

# Run all tests
echo "Starting tests..."
echo ""

setup_test_files
echo ""

test_health
test_ollama_status
test_file_analysis_security
test_file_analysis_complexity
test_file_analysis_clean
test_project_analysis
test_error_handling
test_issue_structure

# Summary
echo ""
echo "================================"
echo "Test Summary"
echo "================================"
echo -e "${GREEN}Passed:${NC} $PASS_COUNT"
echo -e "${RED}Failed:${NC} $FAIL_COUNT"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
