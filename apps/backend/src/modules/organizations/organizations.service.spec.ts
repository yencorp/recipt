import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OrganizationsService } from "./organizations.service";
import { Organization } from "../../entities/organization.entity";
import { UserOrganization } from "../../entities/user-organization.entity";
import { User } from "../../entities/user.entity";

describe("OrganizationsService", () => {
  let service: OrganizationsService;
  let organizationRepository: Repository<Organization>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserOrganization),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    organizationRepository = module.get<Repository<Organization>>(
      getRepositoryToken(Organization),
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new organization", async () => {
      const createDto = {
        name: "테스트 조직",
        type: "YOUTH_GROUP" as any,
      };

      jest.spyOn(organizationRepository, "findOne").mockResolvedValue(null);
      jest.spyOn(organizationRepository, "create").mockReturnValue(createDto as any);
      jest.spyOn(organizationRepository, "save").mockResolvedValue({
        id: "uuid",
        ...createDto,
      } as any);

      const result = await service.create(createDto);

      expect(result).toHaveProperty("id");
      expect(result.name).toBe(createDto.name);
    });
  });

  describe("findAll", () => {
    it("should return an array of organizations", async () => {
      const mockOrganizations = [
        { id: "1", name: "조직1" },
        { id: "2", name: "조직2" },
      ];

      jest.spyOn(organizationRepository, "find").mockResolvedValue(mockOrganizations as any);

      const result = await service.findAll();

      expect(result).toEqual(mockOrganizations);
      expect(result).toHaveLength(2);
    });
  });
});
