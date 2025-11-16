# Recipt API 개발자 가이드

## 목차

1. [시작하기](#시작하기)
2. [인증](#인증)
3. [API 사용법](#api-사용법)
4. [에러 처리](#에러-처리)
5. [페이징](#페이징)
6. [파일 업로드](#파일-업로드)
7. [WebSocket 알림](#websocket-알림)
8. [보안 고려사항](#보안-고려사항)
9. [성능 최적화](#성능-최적화)
10. [FAQ](#faq)

---

## 시작하기

### Base URL

```
Development: http://localhost:3000/api
Production: https://api.recipt.app/api
```

### API 문서

- **Swagger UI**: `/api/docs`
- **OpenAPI JSON**: `/api/docs-json`

### 필수 헤더

```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

---

## 인증

### 회원가입

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "홍길동",
  "phone": "010-1234-5678"
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "홍길동",
      "role": "USER"
    }
  },
  "timestamp": "2025-11-17T12:00:00.000Z",
  "path": "/api/auth/register"
}
```

### 로그인

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

### 인증 토큰 사용

모든 보호된 엔드포인트 호출 시:

```http
GET /api/events
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 토큰 갱신

```http
POST /api/auth/refresh
Authorization: Bearer <CURRENT_TOKEN>
```

---

## API 사용법

### 기본 CRUD 패턴

#### 목록 조회 (List)

```http
GET /api/events?page=1&limit=20&search=keyword
```

**쿼리 파라미터**:
- `page`: 페이지 번호 (기본: 1)
- `limit`: 페이지당 항목 수 (기본: 20, 최대: 100)
- `search`: 검색 키워드
- `organizationId`: 조직 ID 필터
- `status`: 상태 필터

#### 상세 조회 (Read)

```http
GET /api/events/{id}
```

#### 생성 (Create)

```http
POST /api/events
Content-Type: application/json

{
  "title": "2025 신년 행사",
  "description": "신년을 맞이하는 행사입니다",
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-01-03T23:59:59Z",
  "organizationId": "org-uuid",
  "type": "FESTIVAL",
  "maxParticipants": 100
}
```

#### 수정 (Update)

```http
PATCH /api/events/{id}
Content-Type: application/json

{
  "title": "2025 신년 축제 (수정)",
  "maxParticipants": 150
}
```

#### 삭제 (Delete)

```http
DELETE /api/events/{id}
```

---

## 에러 처리

### 에러 응답 형식

모든 에러는 다음 형식을 따릅니다:

```json
{
  "success": false,
  "statusCode": 400,
  "message": ["이메일 형식이 올바르지 않습니다."],
  "error": "Bad Request",
  "timestamp": "2025-11-17T12:00:00.000Z",
  "path": "/api/auth/register",
  "method": "POST"
}
```

### 주요 HTTP 상태 코드

| 코드 | 설명 | 예시 |
|------|------|------|
| 200 | 성공 | GET 요청 성공 |
| 201 | 생성 성공 | POST 요청으로 리소스 생성 |
| 400 | 잘못된 요청 | 유효성 검증 실패 |
| 401 | 인증 실패 | 토큰 없음 또는 만료 |
| 403 | 권한 없음 | 접근 권한 부족 |
| 404 | 찾을 수 없음 | 리소스가 존재하지 않음 |
| 409 | 충돌 | 중복된 데이터 |
| 429 | 요청 한도 초과 | Rate Limiting |
| 500 | 서버 오류 | 내부 서버 에러 |

### 에러 처리 예시

```javascript
try {
  const response = await fetch('https://api.recipt.app/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(eventData)
  });

  const result = await response.json();

  if (!result.success) {
    console.error('에러:', result.message);
    // 에러 처리 로직
  }

  return result.data;
} catch (error) {
  console.error('네트워크 에러:', error);
}
```

---

## 페이징

### 페이지네이션 응답

```json
{
  "success": true,
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5,
  "timestamp": "2025-11-17T12:00:00.000Z",
  "path": "/api/events"
}
```

### 사용 예시

```javascript
// 첫 페이지
GET /api/events?page=1&limit=20

// 두 번째 페이지
GET /api/events?page=2&limit=20

// 모든 항목 (권장하지 않음)
GET /api/events?limit=1000
```

---

## 파일 업로드

### 단일 파일 업로드

```http
POST /api/files/upload
Content-Type: multipart/form-data
Authorization: Bearer <TOKEN>

[Binary File Data]
```

**cURL 예시**:
```bash
curl -X POST \
  -H "Authorization: Bearer <TOKEN>" \
  -F "file=@/path/to/image.jpg" \
  http://localhost:3000/api/files/upload
```

### 다중 파일 업로드

```http
POST /api/files/upload-multiple
Content-Type: multipart/form-data
Authorization: Bearer <TOKEN>

[Multiple Binary Files]
```

### JavaScript 예시

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3000/api/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### 파일 제한사항

- **최대 파일 크기**: 10MB
- **허용 형식**: JPEG, PNG, PDF
- **최대 동시 업로드**: 10개

---

## WebSocket 알림

### 연결

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/notifications', {
  auth: {
    token: 'Bearer <JWT_TOKEN>'
  }
});

// 연결 성공
socket.on('connect', () => {
  console.log('알림 서버 연결됨:', socket.id);
});

// 알림 수신
socket.on('notification', (data) => {
  console.log('새 알림:', data);
  // {
  //   type: 'EVENT',
  //   title: '행사 승인',
  //   message: '행사가 승인되었습니다',
  //   ...
  // }
});

// 연결 해제
socket.on('disconnect', () => {
  console.log('연결 해제됨');
});
```

### 알림 타입

- `SYSTEM`: 시스템 알림
- `EVENT`: 행사 관련
- `BUDGET`: 예산 관련
- `SETTLEMENT`: 정산 관련
- `COMMENT`: 댓글 알림
- `APPROVAL`: 승인 요청
- `REMINDER`: 리마인더

---

## 보안 고려사항

### 1. 토큰 보안

```javascript
// ❌ 잘못된 방법 (localStorage에 저장)
localStorage.setItem('token', token);

// ✅ 권장 방법 (httpOnly 쿠키 사용)
// 백엔드에서 Set-Cookie 헤더로 설정
```

### 2. XSS 방지

- 모든 사용자 입력은 서버에서 자동으로 검증 및 이스케이프됩니다
- 클라이언트에서도 추가 검증 권장

### 3. CSRF 방지

- 모든 상태 변경 요청은 JWT 토큰 필요
- CORS 정책으로 허용된 도메인만 접근 가능

### 4. Rate Limiting

- **제한**: 15분당 100 요청
- **초과 시**: 429 Too Many Requests
- **헤더**:
  - `X-RateLimit-Limit`: 제한 횟수
  - `X-RateLimit-Remaining`: 남은 횟수
  - `X-RateLimit-Reset`: 초기화 시각

---

## 성능 최적화

### 1. 캐싱

API 응답은 자동으로 캐싱됩니다:
- 목록 조회: 5분
- 상세 조회: 10분

클라이언트에서 추가 캐싱 권장:

```javascript
const cache = new Map();

async function getEvent(id) {
  if (cache.has(id)) {
    return cache.get(id);
  }

  const event = await api.get(`/events/${id}`);
  cache.set(id, event);

  // 10분 후 캐시 삭제
  setTimeout(() => cache.delete(id), 10 * 60 * 1000);

  return event;
}
```

### 2. 페이징 최적화

```javascript
// ❌ 비효율적
const allEvents = await api.get('/events?limit=1000');

// ✅ 효율적
const events = await api.get('/events?page=1&limit=20');
```

### 3. 필드 선택 (향후 지원 예정)

```javascript
// 필요한 필드만 요청
GET /api/events?fields=id,title,startDate
```

---

## FAQ

### Q1: 토큰이 만료되면 어떻게 하나요?

**A**: `/auth/refresh` 엔드포인트를 호출하여 새 토큰을 발급받으세요. 또는 재로그인하세요.

### Q2: 파일 업로드가 실패합니다.

**A**: 다음을 확인하세요:
- 파일 크기가 10MB 이하인지
- 파일 형식이 JPEG, PNG, PDF 중 하나인지
- `Content-Type: multipart/form-data` 헤더가 설정되었는지

### Q3: Rate Limiting을 우회할 수 있나요?

**A**: 아니요. 모든 클라이언트는 동일한 제한을 받습니다. API 키를 발급받으면 더 높은 한도를 받을 수 있습니다.

### Q4: CORS 에러가 발생합니다.

**A**: 백엔드 관리자에게 문의하여 프론트엔드 도메인을 허용 목록에 추가하세요.

### Q5: WebSocket 연결이 자주 끊깁니다.

**A**: 다음을 시도하세요:
- 재연결 로직 구현
- Keep-alive 설정
- 네트워크 상태 확인

---

## 지원

- **이메일**: support@recipt.app
- **문서**: https://docs.recipt.app
- **이슈 트래커**: https://github.com/recipt/recipt/issues

---

**마지막 업데이트**: 2025-11-17
**API 버전**: 1.0.0
