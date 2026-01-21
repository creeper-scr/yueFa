#!/bin/bash

# YueFa 部署验证脚本
# 用法: ./scripts/verify-deployment.sh [staging|prod]

set -e

ENV=${1:-staging}

echo "=========================================="
echo "  YueFa 部署验证 - ${ENV} 环境"
echo "=========================================="

# 根据环境设置 URL
if [ "$ENV" == "prod" ]; then
  API_URL="${PROD_API_URL:-https://api.yuefa.com}"
  WEB_URL="${PROD_WEB_URL:-https://www.yuefa.com}"
else
  API_URL="${STAGING_API_URL:-https://api-staging.yuefa.com}"
  WEB_URL="${STAGING_WEB_URL:-https://staging.yuefa.com}"
fi

echo ""
echo "API URL: $API_URL"
echo "Web URL: $WEB_URL"
echo ""

# 检查 API 健康状态
echo "1. 检查 API 健康状态..."
API_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/health" 2>/dev/null)
API_BODY=$(echo "$API_RESPONSE" | head -n -1)
API_STATUS=$(echo "$API_RESPONSE" | tail -n 1)

if [ "$API_STATUS" == "200" ]; then
  echo "   ✅ API 健康检查通过"
  echo "   响应: $API_BODY"
else
  echo "   ❌ API 健康检查失败 (状态码: $API_STATUS)"
  exit 1
fi

echo ""

# 检查前端可访问性
echo "2. 检查前端可访问性..."
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL" 2>/dev/null)

if [ "$WEB_STATUS" == "200" ]; then
  echo "   ✅ 前端可访问"
else
  echo "   ❌ 前端检查失败 (状态码: $WEB_STATUS)"
  exit 1
fi

echo ""

# 检查 API 版本端点
echo "3. 检查 API 认证端点..."
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/v1/auth/check" 2>/dev/null)

if [ "$AUTH_STATUS" == "401" ] || [ "$AUTH_STATUS" == "200" ]; then
  echo "   ✅ 认证端点响应正常"
else
  echo "   ⚠️  认证端点状态: $AUTH_STATUS (可能需要检查)"
fi

echo ""
echo "=========================================="
echo "  🎉 部署验证完成!"
echo "=========================================="
