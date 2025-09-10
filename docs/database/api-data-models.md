# API 데이터 모델 정의서

## 개요

본 문서는 광남동성당 청소년위원회 예결산 관리 시스템의 REST API에서 사용할 데이터 모델을 정의합니다.

**목적**:
- 일관된 API 응답 구조 정의
- 프론트엔드 개발자를 위한 데이터 구조 가이드
- Swagger/OpenAPI 스펙 작성 기준 제공
- DTO (Data Transfer Object) 설계 가이드라인

**작성 기준일**: 2025년 1월 11일  
**API 버전**: v1  
**Entity 버전 기준**: Task 2.15 완료 시점

---

## 1. API 응답 표준 구조

### 1.1 성공 응답 표준

```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    total?: number;      // 페이징 시 전체 개수
    page?: number;       // 현재 페이지
    limit?: number;      // 페이지당 개수
    hasNext?: boolean;   // 다음 페이지 존재 여부
    hasPrev?: boolean;   // 이전 페이지 존재 여부
  };
}
```

### 1.2 오류 응답 표준

```typescript
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string;     // 입력 검증 오류 시 해당 필드
  };
}
```

### 1.3 페이징 파라미터

```typescript
interface PaginationDto {
  page?: number;        // 기본값: 1
  limit?: number;       // 기본값: 10, 최대: 100
  sortBy?: string;      // 정렬 기준 필드
  sortOrder?: 'ASC' | 'DESC'; // 기본값: 'DESC'
}
```

---

## 2. 사용자 관리 API 모델

### 2.1 User 관련 DTO

#### UserResponseDto
```typescript
export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  baptismalName?: string;
  phone: string;
  birthDate: string;           // ISO 8601 format
  position: string;
  status: UserStatus;
  role: UserRole;
  lastLoginAt?: string;        // ISO 8601 format
  createdAt: string;           // ISO 8601 format
  updatedAt: string;           // ISO 8601 format
  
  // 관계 데이터 (선택적 포함)
  organizations?: UserOrganizationResponseDto[];
}
```

#### CreateUserDto
```typescript
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @Length(2, 100)
  name: string;

  @IsString()
  @IsOptional()
  baptismalName?: string;

  @IsString()
  @Matches(/^[0-9-]{10,15}$/)
  phone: string;

  @IsDateString()
  birthDate: string;

  @IsString()
  @Length(2, 100)
  position: string;
}
```

#### UpdateUserDto
```typescript
export class UpdateUserDto {
  @IsString()
  @Length(2, 100)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  baptismalName?: string;

  @IsString()
  @Matches(/^[0-9-]{10,15}$/)
  @IsOptional()
  phone?: string;

  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @IsString()
  @Length(2, 100)
  @IsOptional()
  position?: string;
}
```

### 2.2 UserOrganization 관련 DTO

#### UserOrganizationResponseDto
```typescript
export class UserOrganizationResponseDto {
  id: string;
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  status: MembershipStatus;
  joinedAt: string;
  roleChangedAt?: string;
  permissions: {
    canViewBudgets: boolean;
    canCreateBudgets: boolean;
    canApproveBudgets: boolean;
    canViewSettlements: boolean;
    canCreateSettlements: boolean;
    canApproveSettlements: boolean;
    canManageEvents: boolean;
    canManageMembers: boolean;
    canViewReports: boolean;
    canExportData: boolean;
  };
  
  // 중첩 관계 (선택적)
  organization?: OrganizationResponseDto;
  user?: UserResponseDto;
}
```

#### AssignUserToOrganizationDto
```typescript
export class AssignUserToOrganizationDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  organizationId: string;

  @IsEnum(OrganizationRole)
  role: OrganizationRole;

  @IsOptional()
  @IsObject()
  permissions?: Partial<UserOrganizationPermissions>;
}
```

---

## 3. 단체 관리 API 모델

### 3.1 Organization 관련 DTO

#### OrganizationResponseDto
```typescript
export class OrganizationResponseDto {
  id: string;
  name: string;
  code: string;
  description?: string;
  settings: {
    budgetApprovalRequired?: boolean;
    settlementApprovalRequired?: boolean;
    ocrProcessingEnabled?: boolean;
    notificationSettings?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
    [key: string]: any;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  
  // 통계 정보 (선택적)
  stats?: {
    memberCount: number;
    activeEventCount: number;
    totalBudgetAmount: number;
    completedSettlementCount: number;
  };
}
```

#### UpdateOrganizationDto
```typescript
export class UpdateOrganizationDto {
  @IsString()
  @Length(2, 100)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
```

---

## 4. 행사 관리 API 모델

### 4.1 Event 관련 DTO

#### EventResponseDto
```typescript
export class EventResponseDto {
  id: string;
  organizationId: string;
  createdBy: string;
  name: string;
  startDate: string;         // ISO 8601 date
  endDate: string;           // ISO 8601 date
  location?: string;
  description?: string;
  status: EventStatus;
  metadata?: {
    capacity?: number;
    registrationRequired?: boolean;
    tags?: string[];
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
  
  // 관계 데이터 (선택적)
  organization?: OrganizationResponseDto;
  creator?: UserResponseDto;
  budget?: BudgetResponseDto;
  settlement?: SettlementResponseDto;
}
```

#### CreateEventDto
```typescript
export class CreateEventDto {
  @IsUUID()
  organizationId: string;

  @IsString()
  @Length(2, 200)
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @Length(2, 200)
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
```

#### UpdateEventDto
```typescript
export class UpdateEventDto {
  @IsString()
  @Length(2, 200)
  @IsOptional()
  name?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @Length(2, 200)
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
```

---

## 5. 예산 관리 API 모델

### 5.1 Budget 관련 DTO

#### BudgetResponseDto
```typescript
export class BudgetResponseDto {
  id: string;
  organizationId: string;
  eventId?: string;
  createdBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  
  title: string;
  description?: string;
  type: BudgetType;
  status: BudgetStatus;
  approvalStatus: ApprovalStatus;
  
  budgetYear: number;
  budgetPeriod?: number;
  periodStartDate: string;    // ISO 8601 date
  periodEndDate: string;      // ISO 8601 date
  
  // 금액 정보
  totalIncomeAmount: number;
  totalExpenseAmount: number;
  totalActualIncome: number;
  totalActualExpense: number;
  remainingAmount: number;
  executionRate?: number;
  currency: string;
  
  // 메타데이터
  metadata?: {
    tags?: string[];
    categories?: string[];
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    requiresApproval?: boolean;
    [key: string]: any;
  };
  
  // 타임스탬프
  submittedAt?: string;
  reviewedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // 관계 데이터 (선택적)
  organization?: OrganizationResponseDto;
  event?: EventResponseDto;
  incomes?: BudgetIncomeResponseDto[];
  expenses?: BudgetExpenseResponseDto[];
  
  // 계산된 필드
  netAmount: number;           // 수입 - 지출
  isOverBudget: boolean;
  canBeModified: boolean;
  canBeSubmitted: boolean;
}
```

#### CreateBudgetDto
```typescript
export class CreateBudgetDto {
  @IsUUID()
  organizationId: string;

  @IsUUID()
  @IsOptional()
  eventId?: string;

  @IsString()
  @Length(2, 200)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(BudgetType)
  type: BudgetType;

  @IsInt()
  @Min(2020)
  budgetYear: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  budgetPeriod?: number;

  @IsDateString()
  periodStartDate: string;

  @IsDateString()
  periodEndDate: string;

  @IsString()
  @Length(3, 3)
  @IsOptional()
  currency?: string = 'KRW';

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
```

### 5.2 BudgetIncome/Expense 관련 DTO

#### BudgetIncomeResponseDto
```typescript
export class BudgetIncomeResponseDto {
  id: string;
  budgetId: string;
  category: string;
  amount: number;
  actualAmount?: number;
  description?: string;
  
  createdAt: string;
  updatedAt: string;
}
```

#### CreateBudgetIncomeDto
```typescript
export class CreateBudgetIncomeDto {
  @IsUUID()
  budgetId: string;

  @IsString()
  @Length(1, 200)
  category: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;
}
```

---

## 6. 결산 관리 API 모델

### 6.1 Settlement 관련 DTO

#### SettlementResponseDto
```typescript
export class SettlementResponseDto {
  id: string;
  organizationId: string;
  eventId?: string;
  createdBy: string;
  
  title: string;
  description?: string;
  status: SettlementStatus;
  
  // 금액 정보
  totalIncomeAmount: number;
  totalExpenseAmount: number;
  netAmount: number;
  
  // 영수증 정보
  totalReceiptCount: number;
  validatedReceiptCount: number;
  pendingReceiptCount: number;
  
  // 타임스탬프
  settlementDate: string;      // ISO 8601 date
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // 관계 데이터 (선택적)
  organization?: OrganizationResponseDto;
  event?: EventResponseDto;
  items?: SettlementItemResponseDto[];
  receipts?: ReceiptValidationResponseDto[];
  
  // 계산된 필드
  completionRate: number;      // 영수증 검증 완료율
  budgetVariance?: number;     // 예산 대비 차이
}
```

### 6.2 SettlementItem 관련 DTO

#### SettlementItemResponseDto
```typescript
export class SettlementItemResponseDto {
  id: string;
  settlementId: string;
  receiptValidationId?: string;
  
  category: string;
  description: string;
  amount: number;
  itemDate: string;           // ISO 8601 date
  
  // 영수증 연동 정보
  merchantName?: string;
  paymentMethod?: string;
  
  createdAt: string;
  updatedAt: string;
  
  // 관계 데이터 (선택적)
  receiptValidation?: ReceiptValidationResponseDto;
}
```

---

## 7. OCR 및 영수증 처리 API 모델

### 7.1 ReceiptScan 관련 DTO

#### ReceiptScanResponseDto
```typescript
export class ReceiptScanResponseDto {
  id: string;
  settlementId: string;
  uploadedBy: string;
  
  fileName: string;
  filePath: string;
  thumbnailPath?: string;
  fileSize: number;
  mimeType: string;
  
  // 이미지 메타데이터
  imageMetadata: {
    width: number;
    height: number;
    format: string;
    colorSpace?: string;
    resolution?: {
      x: number;
      y: number;
      units: string;
    };
  };
  
  // OCR 처리 상태
  ocrStatus: OCRProcessingStatus;
  processingStartedAt?: string;
  processingCompletedAt?: string;
  
  createdAt: string;
  updatedAt: string;
  
  // 관계 데이터 (선택적)
  ocrResults?: OCRResultResponseDto[];
  validation?: ReceiptValidationResponseDto;
}
```

#### UploadReceiptDto
```typescript
export class UploadReceiptDto {
  @IsUUID()
  settlementId: string;

  @IsString()
  @IsOptional()
  description?: string;

  // 파일은 multipart/form-data로 별도 처리
}
```

### 7.2 OCRResult 관련 DTO

#### OCRResultResponseDto
```typescript
export class OCRResultResponseDto {
  id: string;
  receiptScanId: string;
  
  engine: OCREngine;          // 'TESSERACT' | 'EASYOCR' | 'GOOGLE_VISION'
  processingStage: number;
  
  // 추출 결과
  extractedText: string;
  confidenceScore: number;
  
  // 구조화된 데이터
  structuredData: {
    merchantName?: string;
    businessNumber?: string;
    totalAmount?: number;
    transactionDate?: string;
    items?: Array<{
      name: string;
      quantity?: number;
      unitPrice?: number;
      subtotal: number;
    }>;
    paymentMethod?: string;
    [key: string]: any;
  };
  
  // 처리 정보
  processingTime: number;      // milliseconds
  errorMessage?: string;
  
  createdAt: string;
}
```

### 7.3 ReceiptValidation 관련 DTO

#### ReceiptValidationResponseDto
```typescript
export class ReceiptValidationResponseDto {
  id: string;
  receiptScanId: string;
  ocrResultId: string;
  validatedBy: string;
  
  // 검증된 데이터
  merchantName: string;
  businessNumber?: string;
  totalAmount: number;
  transactionDate: string;     // ISO 8601 date
  
  // 상품 목록
  items: Array<{
    name: string;
    quantity: number;
    unitPrice?: number;
    subtotal: number;
    category?: string;
  }>;
  
  paymentMethod?: string;
  
  // 검증 정보
  validationStatus: ValidationStatus;
  userConfidence: number;      // 사용자 신뢰도 (1-5)
  notes?: string;
  
  // 메타데이터
  validationMetadata: {
    correctionsMade: number;
    timeTakenSeconds: number;
    difficultyRating?: number;
    [key: string]: any;
  };
  
  createdAt: string;
  updatedAt: string;
  
  // 관계 데이터 (선택적)
  receiptScan?: ReceiptScanResponseDto;
  ocrResult?: OCRResultResponseDto;
  settlementItem?: SettlementItemResponseDto;
}
```

#### CreateReceiptValidationDto
```typescript
export class CreateReceiptValidationDto {
  @IsUUID()
  receiptScanId: string;

  @IsUUID()
  ocrResultId: string;

  @IsString()
  @Length(1, 200)
  merchantName: string;

  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{3}-[0-9]{2}-[0-9]{5}$/)
  businessNumber?: string;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsDateString()
  transactionDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiptItemDto)
  items: ReceiptItemDto[];

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  userConfidence: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReceiptItemDto {
  @IsString()
  @Length(1, 200)
  name: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsString()
  @IsOptional()
  category?: string;
}
```

---

## 8. 감사 및 로깅 API 모델

### 8.1 AuditTrail 관련 DTO

#### AuditTrailResponseDto
```typescript
export class AuditTrailResponseDto {
  id: string;
  userId?: string;
  
  // 활동 정보
  action: AuditAction;
  resource: string;
  resourceId?: string;
  
  // 변경 내용
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  
  // 컨텍스트 정보
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  
  // 추가 메타데이터
  metadata?: {
    correlationId?: string;
    requestId?: string;
    [key: string]: any;
  };
  
  level: AuditLevel;          // 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  
  createdAt: string;
  
  // 관계 데이터 (선택적)
  user?: UserResponseDto;
}
```

#### AuditTrailQueryDto
```typescript
export class AuditTrailQueryDto extends PaginationDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsEnum(AuditAction)
  @IsOptional()
  action?: AuditAction;

  @IsString()
  @IsOptional()
  resource?: string;

  @IsUUID()
  @IsOptional()
  resourceId?: string;

  @IsEnum(AuditLevel)
  @IsOptional()
  level?: AuditLevel;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
```

---

## 9. 통계 및 리포트 API 모델

### 9.1 대시보드 통계 DTO

#### DashboardStatsResponseDto
```typescript
export class DashboardStatsResponseDto {
  // 전체 통계
  organizationStats: Array<{
    organizationId: string;
    organizationName: string;
    memberCount: number;
    activeEventCount: number;
    totalBudgetAmount: number;
    completedSettlementCount: number;
    pendingApprovalCount: number;
  }>;
  
  // 최근 활동
  recentActivities: Array<{
    type: 'BUDGET_SUBMITTED' | 'SETTLEMENT_COMPLETED' | 'RECEIPT_VALIDATED' | 'EVENT_CREATED';
    title: string;
    description: string;
    timestamp: string;
    userId: string;
    userName: string;
  }>;
  
  // OCR 처리 현황
  ocrStats: {
    totalProcessed: number;
    successRate: number;
    averageProcessingTime: number;
    pendingCount: number;
  };
  
  // 기간별 통계
  periodStats: {
    currentMonth: {
      budgetAmount: number;
      actualAmount: number;
      receiptCount: number;
    };
    lastMonth: {
      budgetAmount: number;
      actualAmount: number;
      receiptCount: number;
    };
  };
}
```

### 9.2 리포트 생성 DTO

#### GenerateReportDto
```typescript
export class GenerateReportDto {
  @IsEnum(['BUDGET', 'SETTLEMENT', 'OCR_SUMMARY', 'ACTIVITY_LOG'])
  reportType: string;

  @IsUUID()
  @IsOptional()
  organizationId?: string;

  @IsUUID()
  @IsOptional()
  eventId?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsEnum(['PDF', 'EXCEL', 'CSV'])
  format: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  includeFields?: string[];
}
```

---

## 10. 검색 및 필터링 공통 모델

### 10.1 검색 쿼리 DTO

#### SearchQueryDto
```typescript
export class SearchQueryDto extends PaginationDto {
  @IsString()
  @Length(2, 100)
  @IsOptional()
  q?: string;                 // 검색어

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fields?: string[];          // 검색 대상 필드

  @IsObject()
  @IsOptional()
  filters?: Record<string, any>; // 필터 조건

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC';
}
```

### 10.2 필터 옵션 DTO

#### FilterOptionsResponseDto
```typescript
export class FilterOptionsResponseDto {
  organizations: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  
  budgetTypes: Array<{
    value: BudgetType;
    label: string;
  }>;
  
  budgetStatuses: Array<{
    value: BudgetStatus;
    label: string;
  }>;
  
  settlementStatuses: Array<{
    value: SettlementStatus;
    label: string;
  }>;
  
  userRoles: Array<{
    value: UserRole;
    label: string;
  }>;
  
  organizationRoles: Array<{
    value: OrganizationRole;
    label: string;
  }>;
}
```

---

## 11. 인증 및 권한 API 모델

### 11.1 인증 관련 DTO

#### LoginDto
```typescript
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;

  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}
```

#### LoginResponseDto
```typescript
export class LoginResponseDto {
  user: UserResponseDto;
  
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;        // seconds
    tokenType: 'Bearer';
  };
  
  permissions: string[];      // 사용자 권한 목록
}
```

#### RefreshTokenDto
```typescript
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
```

---

## 12. 파일 업로드 API 모델

### 12.1 파일 업로드 응답 DTO

#### FileUploadResponseDto
```typescript
export class FileUploadResponseDto {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  thumbnailPath?: string;
  fileSize: number;
  mimeType: string;
  
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;        // 비디오/오디오의 경우
    [key: string]: any;
  };
  
  uploadedAt: string;
}
```

---

## 13. 에러 코드 정의

### 13.1 표준 에러 코드

```typescript
export enum ErrorCode {
  // 일반 오류
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  
  // 인증 오류
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // 권한 오류
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSION = 'INSUFFICIENT_PERMISSION',
  
  // 비즈니스 로직 오류
  BUDGET_ALREADY_APPROVED = 'BUDGET_ALREADY_APPROVED',
  SETTLEMENT_NOT_COMPLETED = 'SETTLEMENT_NOT_COMPLETED',
  OCR_PROCESSING_FAILED = 'OCR_PROCESSING_FAILED',
  RECEIPT_ALREADY_VALIDATED = 'RECEIPT_ALREADY_VALIDATED',
  
  // 외부 서비스 오류
  OCR_SERVICE_UNAVAILABLE = 'OCR_SERVICE_UNAVAILABLE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
}
```

---

## 14. DTO 변환 가이드라인

### 14.1 Entity → ResponseDto 변환

```typescript
// 예시: Budget Entity → BudgetResponseDto
export class BudgetMapper {
  static toResponseDto(budget: Budget): BudgetResponseDto {
    return {
      id: budget.id,
      organizationId: budget.organizationId,
      eventId: budget.eventId,
      title: budget.title,
      // ... 다른 필드들
      
      // 계산된 필드
      netAmount: budget.netAmount,
      isOverBudget: budget.isOverBudget,
      canBeModified: budget.canBeModified,
      
      // 관계 데이터 (선택적 포함)
      organization: budget.organization ? 
        OrganizationMapper.toResponseDto(budget.organization) : undefined,
    };
  }
  
  static toListResponseDto(budgets: Budget[]): BudgetResponseDto[] {
    return budgets.map(budget => this.toResponseDto(budget));
  }
}
```

### 14.2 CreateDto → Entity 변환

```typescript
export class BudgetService {
  async createBudget(createDto: CreateBudgetDto, userId: string): Promise<Budget> {
    const budget = new Budget();
    
    // DTO에서 Entity로 필드 복사
    Object.assign(budget, createDto);
    
    // 추가 설정
    budget.createdBy = userId;
    budget.status = BudgetStatus.DRAFT;
    budget.version = 1;
    
    return await this.budgetRepository.save(budget);
  }
}
```

---

## 15. Swagger/OpenAPI 어노테이션 가이드

### 15.1 Controller 데코레이터 예시

```typescript
@ApiTags('budgets')
@ApiBearerAuth()
@Controller('budgets')
export class BudgetController {
  
  @Get()
  @ApiOperation({ summary: '예산 목록 조회' })
  @ApiResponse({ 
    status: 200, 
    description: '예산 목록 조회 성공',
    type: [BudgetResponseDto]
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query() query: PaginationDto): Promise<ApiResponse<BudgetResponseDto[]>> {
    // 구현
  }
  
  @Post()
  @ApiOperation({ summary: '예산 생성' })
  @ApiResponse({ 
    status: 201, 
    description: '예산 생성 성공',
    type: BudgetResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: '입력값 검증 오류',
    type: ApiErrorResponse
  })
  async create(@Body() createDto: CreateBudgetDto): Promise<ApiResponse<BudgetResponseDto>> {
    // 구현
  }
}
```

### 15.2 DTO 데코레이터 예시

```typescript
export class CreateBudgetDto {
  @ApiProperty({
    description: '예산 제목',
    example: '2025년 청년 피정 예산',
    minLength: 2,
    maxLength: 200
  })
  @IsString()
  @Length(2, 200)
  title: string;

  @ApiProperty({
    description: '예산 유형',
    enum: BudgetType,
    example: BudgetType.EVENT
  })
  @IsEnum(BudgetType)
  type: BudgetType;

  @ApiPropertyOptional({
    description: '예산 설명',
    example: '연례 청년 피정을 위한 예산 계획'
  })
  @IsString()
  @IsOptional()
  description?: string;
}
```

---

## 16. 성능 최적화 가이드

### 16.1 관계 데이터 로딩 전략

```typescript
// 예시: 선택적 관계 포함
@Get(':id')
async findOne(
  @Param('id') id: string,
  @Query('include') include?: string[]
): Promise<BudgetResponseDto> {
  
  const relations = [];
  
  if (include?.includes('organization')) {
    relations.push('organization');
  }
  
  if (include?.includes('incomes')) {
    relations.push('incomes');
  }
  
  if (include?.includes('expenses')) {
    relations.push('expenses');
  }
  
  const budget = await this.budgetRepository.findOne({
    where: { id },
    relations
  });
  
  return BudgetMapper.toResponseDto(budget);
}
```

### 16.2 페이징 최적화

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

async function paginatedQuery<T>(
  repository: Repository<T>,
  query: PaginationDto,
  where?: FindOptionsWhere<T>
): Promise<PaginatedResponse<T>> {
  
  const page = query.page || 1;
  const limit = Math.min(query.limit || 10, 100); // 최대 100개 제한
  const offset = (page - 1) * limit;
  
  const [data, total] = await repository.findAndCount({
    where,
    take: limit,
    skip: offset,
    order: { [query.sortBy || 'createdAt']: query.sortOrder || 'DESC' }
  });
  
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}
```

---

## 참고 자료

### 관련 문서
- [데이터베이스 스키마 종합 문서](./schema-documentation.md)
- [마이그레이션 실행 가이드](./migration-guide.md)
- [트러블슈팅 가이드](./troubleshooting.md)

### 외부 참조
- [NestJS Validation](https://docs.nestjs.com/techniques/validation)
- [Class Validator](https://github.com/typestack/class-validator)
- [Swagger/OpenAPI](https://docs.nestjs.com/openapi/introduction)
- [TypeORM Relations](https://typeorm.io/relations)

---

**문서 정보**
- **버전**: 1.0
- **작성일**: 2025-01-11
- **작성자**: Backend API Team
- **검토자**: Frontend Team, QA Team
- **승인자**: Technical Lead
- **다음 업데이트 예정일**: API 개발 완료 후