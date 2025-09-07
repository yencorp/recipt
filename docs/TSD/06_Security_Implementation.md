# 보안 구현 명세서

## 보안 아키텍처 개요

광남동성당 청소년위원회 예결산 관리 시스템의 보안 구현 방안을 정의합니다. 다층 보안 모델을 적용하여 데이터 보호와 접근 제어를 구현합니다.

## 인증 시스템

### 1. JWT 기반 인증

```typescript
// backend/src/modules/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: any) {
    // 토큰 만료 시간 추가 검증
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      throw new UnauthorizedException('토큰이 만료되었습니다.');
    }

    // 사용자 상태 검증
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('비활성 계정입니다.');
    }

    return { userId: payload.sub, email: payload.email, roles: payload.roles };
  }
}
```

### 2. 토큰 관리

```typescript
// backend/src/modules/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private refreshTokensRepository: Repository<RefreshToken>,
  ) {}

  async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.userOrganizations.map(uo => uo.role),
      iat: Math.floor(Date.now() / 1000),
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m', // 15분
      algorithm: 'HS256',
    });

    const refreshToken = await this.generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      { expiresIn: '7d', algorithm: 'HS256' }
    );

    // 해시된 토큰을 DB에 저장
    const hashedToken = await bcrypt.hash(token, 12);
    const refreshTokenEntity = this.refreshTokensRepository.create({
      userId,
      tokenHash: hashedToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일
    });

    await this.refreshTokensRepository.save(refreshTokenEntity);
    return token;
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      
      // DB에서 토큰 검증
      const tokenRecord = await this.refreshTokensRepository.findOne({
        where: { userId: payload.sub, isRevoked: false },
      });

      if (!tokenRecord || !(await bcrypt.compare(refreshToken, tokenRecord.tokenHash))) {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
      }

      // 새 액세스 토큰 생성
      const user = await this.usersService.findById(payload.sub);
      const newPayload = {
        sub: user.id,
        email: user.email,
        roles: user.userOrganizations.map(uo => uo.role),
      };

      const accessToken = this.jwtService.sign(newPayload, { expiresIn: '15m' });
      
      // 마지막 사용 시간 업데이트
      tokenRecord.lastUsedAt = new Date();
      await this.refreshTokensRepository.save(tokenRecord);

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('토큰 갱신에 실패했습니다.');
    }
  }
}
```

## 권한 관리 시스템

### 1. 역할 기반 접근 제어 (RBAC)

```typescript
// backend/src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export enum Role {
  ADMIN = 'ADMIN',
  ORG_ADMIN = 'ORG_ADMIN',
  MEMBER = 'MEMBER',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// backend/src/common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // 관리자는 모든 권한 보유
    if (user.roles?.includes(Role.ADMIN)) {
      return true;
    }

    // 필요한 역할 중 하나라도 보유하면 접근 허용
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

### 2. 조직별 데이터 접근 제어

```typescript
// backend/src/common/guards/organization.guard.ts
@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(
    private userOrganizationService: UserOrganizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const organizationId = request.params.organizationId || request.body.organizationId;

    if (!organizationId) {
      return true; // 조직 ID가 없으면 다른 가드에서 처리
    }

    // 관리자는 모든 조직에 접근 가능
    if (user.roles?.includes(Role.ADMIN)) {
      return true;
    }

    // 사용자가 해당 조직에 속하는지 확인
    const membership = await this.userOrganizationService.findMembership(
      user.userId,
      organizationId
    );

    return membership && membership.isActive;
  }
}
```

## 데이터 암호화

### 1. 비밀번호 해싱

```typescript
// backend/src/common/utils/crypto.util.ts
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export class CryptoUtil {
  private static readonly SALT_ROUNDS = 12;
  private static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

  static async hashPassword(password: string): Promise<string> {
    // 복잡도 검증
    if (!this.validatePasswordStrength(password)) {
      throw new Error('비밀번호가 보안 요구사항을 만족하지 않습니다.');
    }

    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static validatePasswordStrength(password: string): boolean {
    // 최소 8자, 영문 대소문자, 숫자, 특수문자 포함
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/;
    return password.length >= 8 && strongRegex.test(password);
  }

  // 민감한 데이터 암호화 (개인정보 등)
  static encrypt(text: string): string {
    if (!this.ENCRYPTION_KEY) {
      throw new Error('암호화 키가 설정되지 않았습니다.');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.ENCRYPTION_KEY);
    cipher.update(text, 'utf8', 'hex');
    const encrypted = cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedText: string): string {
    if (!this.ENCRYPTION_KEY) {
      throw new Error('암호화 키가 설정되지 않았습니다.');
    }

    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher('aes-256-cbc', this.ENCRYPTION_KEY);
    decipher.update(encrypted, 'hex', 'utf8');
    
    return decipher.final('utf8');
  }
}
```

### 2. 데이터베이스 컬럼 암호화

```typescript
// backend/src/common/transformers/encryption.transformer.ts
import { ValueTransformer } from 'typeorm';
import { CryptoUtil } from '../utils/crypto.util';

export class EncryptionTransformer implements ValueTransformer {
  to(value: string): string {
    return value ? CryptoUtil.encrypt(value) : value;
  }

  from(value: string): string {
    return value ? CryptoUtil.decrypt(value) : value;
  }
}

// 엔티티에서 사용
@Entity('users')
export class User {
  @Column({
    type: 'text',
    transformer: new EncryptionTransformer(),
  })
  address?: string; // 주소는 암호화하여 저장

  @Column({
    type: 'varchar',
    length: 20,
    transformer: new EncryptionTransformer(),
  })
  phone: string; // 전화번호 암호화
}
```

## 입력 검증 및 보안

### 1. 입력 검증

```typescript
// backend/src/common/pipes/validation.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import * as DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

@Injectable()
export class CustomValidationPipe implements PipeTransform {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // HTML 태그 제거 및 XSS 방지
    const sanitizedValue = this.sanitizeInput(value);
    
    const object = plainToClass(metatype, sanitizedValue);
    const errors = await validate(object, {
      whitelist: true, // DTO에 정의되지 않은 속성 제거
      forbidNonWhitelisted: true, // 정의되지 않은 속성 있으면 에러
      transform: true, // 자동 타입 변환
    });

    if (errors.length > 0) {
      const errorMessages = errors.map(error => 
        Object.values(error.constraints || {}).join(', ')
      );
      throw new BadRequestException(errorMessages);
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private sanitizeInput(value: any): any {
    if (typeof value === 'string') {
      const window = new JSDOM('').window;
      const purify = DOMPurify(window);
      return purify.sanitize(value, { ALLOWED_TAGS: [] }); // 모든 HTML 태그 제거
    }
    
    if (typeof value === 'object' && value !== null) {
      const sanitized = {};
      for (const key in value) {
        sanitized[key] = this.sanitizeInput(value[key]);
      }
      return sanitized;
    }
    
    return value;
  }
}
```

### 2. SQL Injection 방지

```typescript
// TypeORM을 사용하여 자동으로 방지되지만, 직접 쿼리 시 주의
@Injectable()
export class EventsRepository {
  // ✅ 안전한 방법 - 파라미터 바인딩 사용
  async findEventsByName(name: string): Promise<Event[]> {
    return this.createQueryBuilder('event')
      .where('event.name ILIKE :name', { name: `%${name}%` })
      .getMany();
  }

  // ❌ 위험한 방법 - 절대 사용하지 말 것
  // .where(`event.name LIKE '%${name}%'`)
}
```

## 세션 보안

### 1. CSRF 보호

```typescript
// backend/src/main.ts
import * as csurf from 'csurf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CSRF 보호 미들웨어
  app.use(csurf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    },
  }));

  await app.listen(3001);
}
```

### 2. 세션 고정 공격 방지

```typescript
// backend/src/modules/auth/auth.controller.ts
@Post('login')
async login(@Body() loginDto: LoginDto, @Res() response: Response) {
  const result = await this.authService.login(loginDto);
  
  // 로그인 성공 시 세션 재생성
  if (result.success) {
    response.cookie('session_id', result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24시간
    });
  }
  
  return result;
}
```

## 파일 업로드 보안

### 1. 파일 검증

```typescript
// backend/src/common/interceptors/file-validation.interceptor.ts
@Injectable()
export class FileValidationInterceptor implements NestInterceptor {
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
  ];
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const files: Express.Multer.File[] = request.files || [request.file];

    for (const file of files) {
      if (!file) continue;

      // MIME 타입 검증
      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(`허용되지 않는 파일 형식: ${file.mimetype}`);
      }

      // 파일 크기 검증
      if (file.size > this.maxFileSize) {
        throw new BadRequestException('파일 크기가 너무 큽니다. (최대 10MB)');
      }

      // 파일 시그니처 검증 (Magic Number)
      if (!this.validateFileSignature(file)) {
        throw new BadRequestException('파일 시그니처가 유효하지 않습니다.');
      }
    }

    return next.handle();
  }

  private validateFileSignature(file: Express.Multer.File): boolean {
    const buffer = file.buffer;
    const signature = buffer.slice(0, 4).toString('hex');
    
    const validSignatures = {
      'image/jpeg': ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2'],
      'image/png': ['89504e47'],
      'application/pdf': ['25504446'],
    };

    const expectedSignatures = validSignatures[file.mimetype];
    return expectedSignatures?.some(sig => signature.startsWith(sig)) ?? false;
  }
}
```

## API 보안

### 1. Rate Limiting

```typescript
// backend/src/common/guards/rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

@Injectable()
export class CustomRateLimitGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorageService,
    private reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected getTracker(req: Record<string, any>): string {
    // IP 주소 기반 제한
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // 로그인된 사용자의 경우 사용자 ID 기반 제한
    if (req.user) {
      return `user:${req.user.userId}`;
    }
    
    return `ip:${ip}`;
  }
}

// 사용 예시
@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle(5, 60) // 1분에 5회 시도
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @Throttle(3, 3600) // 1시간에 3회 가입
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
```

### 2. API 요청 검증

```typescript
// backend/src/common/middlewares/request-validation.middleware.ts
@Injectable()
export class RequestValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Content-Length 검증
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > 100 * 1024 * 1024) { // 100MB 제한
      return res.status(413).json({ error: '요청 크기가 너무 큽니다.' });
    }

    // User-Agent 검증
    const userAgent = req.headers['user-agent'];
    if (!userAgent || this.isSuspiciousUserAgent(userAgent)) {
      return res.status(400).json({ error: '유효하지 않은 클라이언트입니다.' });
    }

    // 의심스러운 헤더 검증
    const suspiciousHeaders = ['x-forwarded-host', 'x-original-url'];
    for (const header of suspiciousHeaders) {
      if (req.headers[header]) {
        return res.status(400).json({ error: '유효하지 않은 요청입니다.' });
      }
    }

    next();
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /sqlmap/i,
      /nikto/i,
      /scanner/i,
      /bot/i,
      /crawler/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }
}
```

## 로깅 및 모니터링

### 1. 보안 이벤트 로깅

```typescript
// backend/src/common/services/security-logger.service.ts
@Injectable()
export class SecurityLoggerService {
  private readonly logger = new Logger('SecurityLogger');

  logAuthEvent(event: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT', userId?: string, ip?: string) {
    this.logger.log({
      event,
      userId,
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  logSuspiciousActivity(activity: string, details: any, ip?: string) {
    this.logger.warn({
      activity,
      details,
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  logDataAccess(resource: string, action: string, userId: string) {
    this.logger.log({
      event: 'DATA_ACCESS',
      resource,
      action,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
}
```

## 환경 변수 보안

```bash
# .env.example
# 데이터베이스
DB_HOST=localhost
DB_PORT=5432
DB_NAME=church_budget_db
DB_USERNAME=app_user
DB_PASSWORD=secure_password_here

# JWT 설정
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret

# 암호화
ENCRYPTION_KEY=your-32-character-encryption-key

# 외부 서비스
REDIS_URL=redis://localhost:6379
EMAIL_SERVICE_KEY=your-email-service-key

# 보안 설정
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# 파일 저장
UPLOAD_PATH=/secure/uploads
MAX_FILE_SIZE=10485760

# 로깅
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/church-budget.log
```

## 보안 체크리스트

### 개발 단계
- [ ] 모든 사용자 입력 검증
- [ ] SQL Injection 방지 확인
- [ ] XSS 공격 방지 구현
- [ ] CSRF 토큰 적용
- [ ] 파일 업로드 검증 구현
- [ ] 에러 메시지에 민감 정보 노출 방지

### 배포 단계
- [ ] HTTPS 강제 적용
- [ ] 보안 헤더 설정 (HSTS, CSP 등)
- [ ] 불필요한 서비스 포트 차단
- [ ] 데이터베이스 접근 제한
- [ ] 로그 모니터링 시스템 구축
- [ ] 정기적인 보안 업데이트 계획

---

*이 보안 명세서는 다층 보안 모델을 통해 시스템을 안전하게 보호합니다.*