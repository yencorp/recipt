# API 명세서 - 광남동성당 청소년위원회 예결산 관리 시스템

## 개요

RESTful API 설계를 기반으로 한 백엔드 API 명세서입니다. NestJS 프레임워크를 사용하여 구현하며, JWT 기반 인증을 통한 보안을 제공합니다.

## 기본 정보

- **Base URL**: `http://localhost:3000/api/v1`
- **Content-Type**: `application/json`
- **Authentication**: JWT Bearer Token
- **API Version**: v1

## 인증 방식

```typescript
// Request Header
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "application/json"
}
```

## 공통 응답 형식

### 성공 응답
```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}
```

### 에러 응답
```typescript
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

## 1. 인증 API

### 1.1 사용자 등록
```typescript
POST /auth/register

// Request Body
interface RegisterDto {
  email: string;
  password: string;
  name: string;
  baptismalName?: string;
  phone: string;
  birthDate: string; // YYYY-MM-DD
  position: string;
  address?: string;
  organizationIds: string[]; // UUID 배열
}

// Response
interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
    baptismalName?: string;
    phone: string;
    position: string;
    organizations: Organization[];
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// Status Codes
// 201: Created
// 400: Bad Request (유효성 검증 실패)
// 409: Conflict (이미 존재하는 이메일)
```

### 1.2 로그인
```typescript
POST /auth/login

// Request Body
interface LoginDto {
  email: string;
  password: string;
}

// Response
interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
    organizations: Organization[];
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// Status Codes
// 200: OK
// 401: Unauthorized (잘못된 인증 정보)
// 423: Locked (계정 정지)
```

### 1.3 토큰 갱신
```typescript
POST /auth/refresh

// Request Body
interface RefreshDto {
  refreshToken: string;
}

// Response
interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}
```

### 1.4 로그아웃
```typescript
POST /auth/logout
Authorization: Bearer <token>

// Request Body: 없음
// Response: 204 No Content
```

## 2. 사용자 관리 API

### 2.1 프로필 조회
```typescript
GET /users/profile
Authorization: Bearer <token>

// Response
interface UserProfile {
  id: string;
  email: string;
  name: string;
  baptismalName?: string;
  phone: string;
  birthDate: string;
  position: string;
  address?: string;
  isAdmin: boolean;
  organizations: Organization[];
  createdAt: string;
}
```

### 2.2 프로필 수정
```typescript
PUT /users/profile
Authorization: Bearer <token>

// Request Body
interface UpdateProfileDto {
  name?: string;
  baptismalName?: string;
  phone?: string;
  position?: string;
  address?: string;
}

// Response: UserProfile
```

### 2.3 소속 단체 목록
```typescript
GET /users/organizations
Authorization: Bearer <token>

// Response
interface UserOrganizationsResponse {
  organizations: Organization[];
}

interface Organization {
  id: string;
  name: string;
  description?: string;
  role: 'ADMIN' | 'MEMBER'; // 해당 단체에서의 역할
  joinedAt: string;
}
```

## 3. 관리자 API

### 3.1 사용자 목록 조회
```typescript
GET /admin/users?page=1&limit=20&search=검색어&organizationId=uuid
Authorization: Bearer <token> (Admin required)

// Query Parameters
interface UserListQuery {
  page?: number; // default: 1
  limit?: number; // default: 20, max: 100
  search?: string; // name, email 검색
  organizationId?: string; // 특정 단체 필터
  isActive?: boolean; // 활성 상태 필터
}

// Response
interface UserListResponse {
  users: AdminUserInfo[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface AdminUserInfo {
  id: string;
  email: string;
  name: string;
  baptismalName?: string;
  phone: string;
  position: string;
  isAdmin: boolean;
  isActive: boolean;
  organizations: Organization[];
  createdAt: string;
  lastLoginAt?: string;
}
```

### 3.2 사용자 정보 수정
```typescript
PUT /admin/users/:userId
Authorization: Bearer <token> (Admin required)

// Request Body
interface UpdateUserDto {
  name?: string;
  baptismalName?: string;
  phone?: string;
  position?: string;
  address?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  organizationIds?: string[]; // 소속 단체 변경
}

// Response: AdminUserInfo
```

### 3.3 비밀번호 초기화
```typescript
POST /admin/users/:userId/reset-password
Authorization: Bearer <token> (Admin required)

// Request Body: 없음
// Response
interface PasswordResetResponse {
  temporaryPassword: string;
}
```

## 4. 단체 관리 API

### 4.1 단체 목록 조회
```typescript
GET /organizations
Authorization: Bearer <token>

// Response
interface OrganizationListResponse {
  organizations: Organization[];
}
```

### 4.2 단체 생성 (관리자)
```typescript
POST /admin/organizations
Authorization: Bearer <token> (Admin required)

// Request Body
interface CreateOrganizationDto {
  name: string;
  description?: string;
}

// Response: Organization
```

### 4.3 단체 삭제 (관리자)
```typescript
DELETE /admin/organizations/:organizationId
Authorization: Bearer <token> (Admin required)

// Response: 204 No Content
```

## 5. 행사 관리 API

### 5.1 행사 목록 조회
```typescript
GET /events?organizationId=uuid&year=2024
Authorization: Bearer <token>

// Query Parameters
interface EventListQuery {
  organizationId?: string; // 특정 단체 필터
  year?: number; // 연도 필터
  status?: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED';
}

// Response
interface EventListResponse {
  events: Event[];
}

interface Event {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  location?: string;
  allocatedBudget?: number;
  organization: Organization;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED';
  hasBudget: boolean; // 예산서 작성 여부
  hasSettlement: boolean; // 결산서 작성 여부
  createdBy: User;
  createdAt: string;
}
```

### 5.2 행사 생성
```typescript
POST /events
Authorization: Bearer <token>

// Request Body
interface CreateEventDto {
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  location?: string;
  allocatedBudget?: number;
  organizationId: string; // UUID
}

// Response: Event
```

### 5.3 행사 상세 조회
```typescript
GET /events/:eventId
Authorization: Bearer <token>

// Response
interface EventDetailResponse {
  event: Event;
  budget?: Budget;
  settlement?: Settlement;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canManageBudget: boolean;
    canManageSettlement: boolean;
  };
}
```

### 5.4 행사 수정
```typescript
PUT /events/:eventId
Authorization: Bearer <token> (Event creator or Admin)

// Request Body: CreateEventDto와 동일 (모든 필드 선택적)
// Response: Event
```

### 5.5 행사 삭제
```typescript
DELETE /events/:eventId
Authorization: Bearer <token> (Event creator or Admin)

// Response: 204 No Content
```

## 6. 예산 관리 API

### 6.1 예산서 조회
```typescript
GET /events/:eventId/budget
Authorization: Bearer <token>

// Response
interface BudgetResponse {
  budget: Budget;
  incomes: BudgetIncome[];
  expenses: BudgetExpense[];
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
}

interface Budget {
  id: string;
  eventId: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
  createdAt: string;
  updatedAt: string;
}

interface BudgetIncome {
  id: string;
  source: string; // 수입원
  amount: number;
  description?: string;
  order: number;
}

interface BudgetExpense {
  id: string;
  category: string; // 지출 항목
  amount: number;
  description?: string;
  order: number;
}
```

### 6.2 예산서 생성/수정
```typescript
POST /events/:eventId/budget
PUT /events/:eventId/budget
Authorization: Bearer <token>

// Request Body
interface SaveBudgetDto {
  incomes: CreateBudgetIncomeDto[];
  expenses: CreateBudgetExpenseDto[];
  status?: 'DRAFT' | 'SUBMITTED';
}

interface CreateBudgetIncomeDto {
  source: string;
  amount: number;
  description?: string;
  order: number;
}

interface CreateBudgetExpenseDto {
  category: string;
  amount: number;
  description?: string;
  order: number;
}

// Response: BudgetResponse
```

## 7. 결산 관리 API

### 7.1 결산서 조회
```typescript
GET /events/:eventId/settlement
Authorization: Bearer <token>

// Response
interface SettlementResponse {
  settlement: Settlement;
  incomes: SettlementIncome[];
  expenses: SettlementExpense[];
  receipts: Receipt[];
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    receiptCount: number;
  };
}

interface Settlement {
  id: string;
  eventId: string;
  status: 'DRAFT' | 'SUBMITTED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

interface Receipt {
  id: string;
  receiptDate: string; // YYYY-MM-DD
  merchantName: string;
  totalAmount: number;
  businessNumber?: string;
  paymentMethod?: string;
  imagePath?: string;
  ocrProcessed: boolean;
  items: ReceiptItem[];
  createdAt: string;
}

interface ReceiptItem {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
```

### 7.2 결산서 생성/수정
```typescript
POST /events/:eventId/settlement
PUT /events/:eventId/settlement
Authorization: Bearer <token>

// Request Body
interface SaveSettlementDto {
  incomes: CreateSettlementIncomeDto[];
  expenses: CreateSettlementExpenseDto[];
  status?: 'DRAFT' | 'SUBMITTED';
}

// Response: SettlementResponse
```

## 8. OCR API

### 8.1 영수증 업로드 및 OCR 처리
```typescript
POST /ocr/process
Authorization: Bearer <token>
Content-Type: multipart/form-data

// Request Body (FormData)
- files: File[] (최대 100개)
- settlementId: string

// Response
interface OCRProcessResponse {
  jobId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  processedCount: number;
  totalCount: number;
  results?: OCRResult[];
}

interface OCRResult {
  filename: string;
  success: boolean;
  confidence: number; // 0.0 ~ 1.0
  extractedData: {
    receiptDate?: string;
    merchantName?: string;
    totalAmount?: number;
    businessNumber?: string;
    paymentMethod?: string;
    items?: {
      itemName: string;
      quantity?: number;
      unitPrice?: number;
      subtotal?: number;
    }[];
  };
  error?: string;
}
```

### 8.2 OCR 작업 상태 조회
```typescript
GET /ocr/jobs/:jobId
Authorization: Bearer <token>

// Response: OCRProcessResponse
```

### 8.3 OCR 결과 수정
```typescript
PUT /ocr/results/:receiptId
Authorization: Bearer <token>

// Request Body
interface UpdateOCRResultDto {
  receiptDate?: string;
  merchantName?: string;
  totalAmount?: number;
  businessNumber?: string;
  paymentMethod?: string;
  items?: UpdateReceiptItemDto[];
}

interface UpdateReceiptItemDto {
  id?: string; // 기존 아이템 수정 시
  itemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// Response: Receipt
```

## 9. 블로그 API

### 9.1 게시물 목록 조회
```typescript
GET /posts?page=1&limit=10
Authorization: Bearer <token>

// Response
interface PostListResponse {
  posts: Post[];
  pagination: PaginationInfo;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}
```

### 9.2 게시물 상세 조회
```typescript
GET /posts/:postId
Authorization: Bearer <token>

// Response
interface PostDetailResponse {
  post: Post;
}
```

### 9.3 게시물 작성 (관리자)
```typescript
POST /admin/posts
Authorization: Bearer <token> (Admin required)

// Request Body
interface CreatePostDto {
  title: string;
  content: string;
}

// Response: Post
```

## 10. 인쇄 API

### 10.1 예산서 인쇄 데이터
```typescript
GET /print/budget/:eventId
Authorization: Bearer <token>

// Response
interface PrintBudgetResponse {
  event: Event;
  organization: Organization;
  budget: Budget;
  incomes: BudgetIncome[];
  expenses: BudgetExpense[];
  summary: BudgetSummary;
  printMetadata: {
    generatedAt: string;
    generatedBy: User;
    format: 'A4';
  };
}
```

### 10.2 결산서 인쇄 데이터
```typescript
GET /print/settlement/:eventId
Authorization: Bearer <token>

// Response: PrintSettlementResponse (구조 유사)
```

### 10.3 PDF 생성
```typescript
POST /print/pdf
Authorization: Bearer <token>

// Request Body
interface GeneratePDFDto {
  type: 'BUDGET' | 'SETTLEMENT' | 'BUDGET_DETAIL' | 'SETTLEMENT_DETAIL';
  eventId: string;
}

// Response
interface PDFResponse {
  downloadUrl: string;
  filename: string;
  size: number; // bytes
  expiresAt: string; // URL 만료 시간
}
```

## 에러 코드

### 인증 관련 (AUTH)
- `AUTH_001`: 유효하지 않은 토큰
- `AUTH_002`: 토큰 만료
- `AUTH_003`: 권한 부족
- `AUTH_004`: 계정 정지

### 사용자 관련 (USER)
- `USER_001`: 사용자를 찾을 수 없음
- `USER_002`: 이미 존재하는 이메일
- `USER_003`: 잘못된 비밀번호
- `USER_004`: 필수 정보 누락

### 데이터 관련 (DATA)
- `DATA_001`: 유효성 검증 실패
- `DATA_002`: 데이터를 찾을 수 없음
- `DATA_003`: 중복 데이터
- `DATA_004`: 참조 무결성 위반

### 시스템 관련 (SYS)
- `SYS_001`: 서버 내부 오류
- `SYS_002`: 데이터베이스 연결 실패
- `SYS_003`: 파일 업로드 실패
- `SYS_004`: OCR 처리 실패

## 개발 가이드라인

### Controller 구현 예시
```typescript
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  @ApiOperation({ summary: '행사 목록 조회' })
  @ApiResponse({ status: 200, type: EventListResponse })
  async getEvents(
    @Query() query: EventListQuery,
    @CurrentUser() user: User,
  ): Promise<EventListResponse> {
    return this.eventService.findAll(query, user);
  }

  @Post()
  @ApiOperation({ summary: '행사 생성' })
  @ApiResponse({ status: 201, type: Event })
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() user: User,
  ): Promise<Event> {
    return this.eventService.create(createEventDto, user);
  }
}
```

### Service 구현 예시
```typescript
@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

  async findAll(query: EventListQuery, user: User): Promise<EventListResponse> {
    const qb = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organization', 'organization')
      .leftJoinAndSelect('event.createdBy', 'createdBy');

    // 사용자 권한에 따른 필터링 로직
    if (!user.isAdmin) {
      qb.innerJoin('organization.userOrganizations', 'uo')
        .where('uo.userId = :userId', { userId: user.id });
    }

    if (query.organizationId) {
      qb.andWhere('organization.id = :orgId', { orgId: query.organizationId });
    }

    const events = await qb.getMany();
    return { events };
  }
}
```

---

*이 API 명세서는 실제 구현 과정에서 지속적으로 업데이트됩니다.*