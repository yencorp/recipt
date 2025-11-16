import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";

describe("AuthService", () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            updateLastLogin: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("register", () => {
    it("should create a new user", async () => {
      const registerDto = {
        email: "test@example.com",
        password: "Password123!",
        passwordConfirm: "Password123!",
        name: "테스트",
      };

      jest.spyOn(usersService, "findByEmail").mockResolvedValue(null);
      jest.spyOn(usersService, "create").mockResolvedValue({
        id: "uuid",
        email: registerDto.email,
        name: registerDto.name,
      } as any);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty("user");
      expect(usersService.create).toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("should return access and refresh tokens", async () => {
      const loginDto = {
        email: "test@example.com",
        password: "Password123!",
      };

      const mockUser = {
        id: "uuid",
        email: loginDto.email,
        passwordHash: "$2b$10$...",
        role: "MEMBER",
        status: "ACTIVE",
      };

      jest.spyOn(usersService, "findByEmail").mockResolvedValue(mockUser as any);
      jest.spyOn(jwtService, "sign").mockReturnValue("mock-token");

      const result = await service.login(loginDto.email, loginDto.password);

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
    });
  });
});
