import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminUsersController } from "./users/admin-users.controller";
import { AdminUsersService } from "./users/admin-users.service";
import { User } from "../../entities/user.entity";
import { UserOrganization } from "../../entities/user-organization.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, UserOrganization])],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
  exports: [AdminUsersService],
})
export class AdminModule {}
