# 백엔드 아키텍처 - NestJS

## 기술 스택

- **Framework**: NestJS 10.x + TypeScript
- **ORM**: TypeORM 0.3.x
- **Authentication**: JWT + Passport
- **Validation**: Class Validator + Class Transformer
- **Documentation**: Swagger/OpenAPI
- **File Upload**: Multer
- **Caching**: Redis (optional)

## 프로젝트 구조

```
src/
├── main.ts                 # 애플리케이션 엔트리포인트
├── app.module.ts           # 루트 모듈
├── config/                 # 설정 파일
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── app.config.ts
├── database/               # 데이터베이스 관련
│   ├── data-source.ts
│   ├── migrations/
│   └── seeds/
├── common/                 # 공통 모듈
│   ├── decorators/
│   ├── dto/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── filters/
├── modules/                # 비즈니스 모듈
│   ├── auth/
│   ├── users/
│   ├── organizations/
│   ├── events/
│   ├── budgets/
│   ├── settlements/
│   ├── ocr/
│   ├── posts/
│   └── admin/
└── shared/                 # 공유 서비스
    ├── email/
    ├── storage/
    └── utils/
```

## 모듈 구조 패턴

### 표준 모듈 구조
```
modules/events/
├── events.module.ts        # 모듈 정의
├── events.controller.ts    # 컨트롤러
├── events.service.ts       # 비즈니스 로직
├── events.repository.ts    # 데이터 액세스
├── dto/                    # 데이터 전송 객체
│   ├── create-event.dto.ts
│   ├── update-event.dto.ts
│   └── event-list.dto.ts
├── entities/               # 엔티티
│   └── event.entity.ts
└── __tests__/             # 테스트
    ├── events.controller.spec.ts
    └── events.service.spec.ts
```

## 핵심 모듈 구현

### 1. App Module
```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { EventsModule } from './modules/events/events.module';
import { OCRModule } from './modules/ocr/ocr.module';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => databaseConfig(),
    }),
    AuthModule,
    UsersModule,
    EventsModule,
    OCRModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### 2. Events Module 예시
```typescript
// src/modules/events/events.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventsRepository } from './events.repository';
import { Event } from './entities/event.entity';
import { Budget } from '../budgets/entities/budget.entity';
import { Settlement } from '../settlements/entities/settlement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Budget, Settlement])],
  controllers: [EventsController],
  providers: [EventsService, EventsRepository],
  exports: [EventsService],
})
export class EventsModule {}
```

### 3. Controller 구현
```typescript
// src/modules/events/events.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventListQueryDto } from './dto/event-list.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Event } from './entities/event.entity';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: '행사 생성' })
  @ApiResponse({ status: 201, description: '행사가 성공적으로 생성됨', type: Event })
  async create(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() user: User,
  ): Promise<Event> {
    return this.eventsService.create(createEventDto, user);
  }

  @Get()
  @ApiOperation({ summary: '행사 목록 조회' })
  @ApiResponse({ status: 200, description: '행사 목록 조회 성공' })
  async findAll(
    @Query() query: EventListQueryDto,
    @CurrentUser() user: User,
  ): Promise<{ events: Event[] }> {
    const events = await this.eventsService.findAll(query, user);
    return { events };
  }

  @Get(':id')
  @ApiOperation({ summary: '행사 상세 조회' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<Event> {
    return this.eventsService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: '행사 수정' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: User,
  ): Promise<Event> {
    return this.eventsService.update(id, updateEventDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: '행사 삭제' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.eventsService.remove(id, user);
  }
}
```

### 4. Service 구현
```typescript
// src/modules/events/events.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { EventsRepository } from './events.repository';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventListQueryDto } from './dto/event-list.dto';
import { User } from '../users/entities/user.entity';
import { Event } from './entities/event.entity';

@Injectable()
export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async create(createEventDto: CreateEventDto, user: User): Promise<Event> {
    // 사용자가 해당 단체에 속해있는지 확인
    const hasPermission = user.userOrganizations.some(
      uo => uo.organizationId === createEventDto.organizationId && uo.isActive
    );

    if (!hasPermission && !user.isAdmin) {
      throw new ForbiddenException('해당 단체에 행사를 생성할 권한이 없습니다.');
    }

    const event = this.eventsRepository.create({
      ...createEventDto,
      createdById: user.id,
    });

    return this.eventsRepository.save(event);
  }

  async findAll(query: EventListQueryDto, user: User): Promise<Event[]> {
    const qb = this.eventsRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organization', 'organization')
      .leftJoinAndSelect('event.createdBy', 'createdBy')
      .leftJoinAndSelect('event.budget', 'budget')
      .leftJoinAndSelect('event.settlement', 'settlement');

    // 관리자가 아닌 경우 자신이 속한 단체의 행사만 조회
    if (!user.isAdmin) {
      const organizationIds = user.userOrganizations
        .filter(uo => uo.isActive)
        .map(uo => uo.organizationId);

      qb.andWhere('event.organizationId IN (:...orgIds)', { orgIds: organizationIds });
    }

    // 필터링 조건 적용
    if (query.organizationId) {
      qb.andWhere('event.organizationId = :orgId', { orgId: query.organizationId });
    }

    if (query.year) {
      qb.andWhere('EXTRACT(YEAR FROM event.startDate) = :year', { year: query.year });
    }

    if (query.status) {
      qb.andWhere('event.status = :status', { status: query.status });
    }

    qb.orderBy('event.startDate', 'DESC');

    return qb.getMany();
  }

  async findOne(id: string, user: User): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: ['organization', 'createdBy', 'budget', 'settlement'],
    });

    if (!event) {
      throw new NotFoundException('행사를 찾을 수 없습니다.');
    }

    // 권한 확인
    this.checkEventPermission(event, user);

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto, user: User): Promise<Event> {
    const event = await this.findOne(id, user);

    // 수정 권한 확인 (작성자 또는 관리자만)
    if (event.createdById !== user.id && !user.isAdmin) {
      throw new ForbiddenException('행사를 수정할 권한이 없습니다.');
    }

    Object.assign(event, updateEventDto);
    return this.eventsRepository.save(event);
  }

  async remove(id: string, user: User): Promise<void> {
    const event = await this.findOne(id, user);

    // 삭제 권한 확인 (작성자 또는 관리자만)
    if (event.createdById !== user.id && !user.isAdmin) {
      throw new ForbiddenException('행사를 삭제할 권한이 없습니다.');
    }

    await this.eventsRepository.remove(event);
  }

  private checkEventPermission(event: Event, user: User): void {
    if (user.isAdmin) return;

    const hasPermission = user.userOrganizations.some(
      uo => uo.organizationId === event.organizationId && uo.isActive
    );

    if (!hasPermission) {
      throw new ForbiddenException('행사에 접근할 권한이 없습니다.');
    }
  }
}
```

### 5. Repository 구현
```typescript
// src/modules/events/events.repository.ts
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Event } from './entities/event.entity';

@Injectable()
export class EventsRepository extends Repository<Event> {
  constructor(private dataSource: DataSource) {
    super(Event, dataSource.createEntityManager());
  }

  async findByOrganizationId(organizationId: string): Promise<Event[]> {
    return this.find({
      where: { organizationId },
      relations: ['organization', 'createdBy'],
      order: { startDate: 'DESC' },
    });
  }

  async findActiveEvents(): Promise<Event[]> {
    return this.createQueryBuilder('event')
      .where('event.status IN (:...statuses)', { 
        statuses: ['PLANNING', 'IN_PROGRESS'] 
      })
      .andWhere('event.endDate >= :today', { today: new Date() })
      .getMany();
  }
}
```

## DTO 및 Validation

### 1. Create Event DTO
```typescript
// src/modules/events/dto/create-event.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, IsDateString, MinLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateEventDto {
  @ApiProperty({ description: '행사명', minLength: 2 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({ description: '시작일', format: 'date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: '종료일', format: 'date' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: '행사 장소' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: '배정 예산', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => Number(value))
  allocatedBudget?: number;

  @ApiProperty({ description: '단체 ID', format: 'uuid' })
  @IsUUID()
  organizationId: string;

  @ApiPropertyOptional({ description: '행사 설명' })
  @IsOptional()
  @IsString()
  description?: string;
}
```

### 2. Query DTO
```typescript
// src/modules/events/dto/event-list.dto.ts
import { IsOptional, IsUUID, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { EventStatus } from '../entities/event.entity';

export class EventListQueryDto {
  @ApiPropertyOptional({ description: '단체 ID 필터', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ description: '연도 필터', minimum: 2020, maximum: 2030 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(2020)
  @Max(2030)
  year?: number;

  @ApiPropertyOptional({ description: '상태 필터', enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({ description: '페이지 번호', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지 크기', minimum: 10, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(100)
  limit?: number = 20;
}
```

## 인증 및 권한 관리

### 1. JWT Strategy
```typescript
// src/modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

### 2. Guards
```typescript
// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

## 전역 Exception Filter

```typescript
// src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string' ? exceptionResponse : exceptionResponse['message'];
    }

    const errorResponse = {
      success: false,
      error: {
        code: `HTTP_${status}`,
        message: Array.isArray(message) ? message[0] : message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    response.status(status).json(errorResponse);
  }
}
```

## 설정 파일

### Database Configuration
```typescript
// src/config/database.config.ts
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs('database', (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'church_budget_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
}));
```

### Main Application
```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // CORS 설정
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // 글로벌 파이프 설정
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // 글로벌 필터 설정
  app.useGlobalFilters(new AllExceptionsFilter());

  // API 접두사 설정
  app.setGlobalPrefix('api/v1');

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('광남동성당 청소년위원회 예결산 관리 API')
    .setDescription('예결산 관리 시스템 API 문서')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`API Documentation: http://localhost:${port}/api-docs`);
}

bootstrap();
```

---

*이 백엔드 아키텍처는 확장 가능하고 유지보수하기 쉬운 NestJS 모범 사례를 따릅니다.*