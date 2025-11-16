import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminUsersController } from "./users/admin-users.controller";
import { AdminUsersService } from "./users/admin-users.service";
import { AdminOrganizationsController } from "./organizations/admin-organizations.controller";
import { AdminOrganizationsService } from "./organizations/admin-organizations.service";
import { AdminSystemController } from "./system/admin-system.controller";
import { AdminSystemService } from "./system/admin-system.service";
import { AdminDashboardController } from "./dashboard/admin-dashboard.controller";
import { AdminDashboardService } from "./dashboard/admin-dashboard.service";
import { User } from "../../entities/user.entity";
import { UserOrganization } from "../../entities/user-organization.entity";
import { Organization } from "../../entities/organization.entity";
import { Event } from "../../entities/event.entity";
import { Budget } from "../../entities/budget.entity";
import { Settlement } from "../../entities/settlement.entity";
import { Notification } from "../../entities/notification.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserOrganization,
      Organization,
      Event,
      Budget,
      Settlement,
      Notification,
    ]),
  ],
  controllers: [
    AdminUsersController,
    AdminOrganizationsController,
    AdminSystemController,
    AdminDashboardController,
  ],
  providers: [
    AdminUsersService,
    AdminOrganizationsService,
    AdminSystemService,
    AdminDashboardService,
  ],
  exports: [
    AdminUsersService,
    AdminOrganizationsService,
    AdminSystemService,
    AdminDashboardService,
  ],
})
export class AdminModule {}
