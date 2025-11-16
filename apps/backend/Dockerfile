# Stage 1: 빌드 스테이지
FROM node:20-alpine AS builder

WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# Stage 2: 프로덕션 스테이지
FROM node:20-alpine

WORKDIR /app

# 보안: 비 root 사용자 생성
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# 빌드된 파일 및 의존성 복사
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# 업로드 디렉토리 생성
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app/uploads

# 사용자 전환
USER nestjs

# 포트 노출
EXPOSE 3000

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# 애플리케이션 시작
CMD ["node", "dist/main"]
