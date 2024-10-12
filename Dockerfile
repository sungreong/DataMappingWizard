# 빌드 단계
FROM node:20-alpine AS build

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 파일 복사
COPY package*.json ./

# 의존성 설치 (clean install)
RUN npm ci

# 소스 코드 복사 (.dockerignore 파일이 자동으로 적용됨)
COPY . .

# node_modules 제거 (npm ci 이후 불필요)
RUN rm -rf node_modules

# 애플리케이션 빌드
RUN npm run build || (echo "Build failed" && npm run build --verbose && exit 1)

# 실행 단계
FROM node:20-alpine

WORKDIR /app

# 빌드 결과물만 복사
COPY --from=build /app/build ./build

# 프로덕션을 위한 경량 서버 설치
RUN npm install -g serve

# 포트를 3000으로 변경
EXPOSE 3000

# serve 명령어의 포트를 3000으로 변경
CMD ["serve", "-s", "build", "-l", "3000"]
