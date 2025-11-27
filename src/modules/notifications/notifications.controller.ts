import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import RolesGuard from 'src/common/guards/roles.guard';
import { NotificationsService } from './notifications.service';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/role.enum';
import { IUserIdentity } from 'src/common/interfaces/user-identity.interface';
import { UserIdentity } from 'src/common/decorator/user.decorator';
import { MarkAsReadDto } from './dto/set-read.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { TestNotificationDto } from './dto/test.dto';

@ApiBearerAuth()
@ApiTags('Notifications')
@UseGuards(RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}
  @Roles(Role.USER, Role.ADMIN, Role.ORGANIZER)
  @Post('mark-read')
  mark_read(
    @Body() markReadDto: MarkAsReadDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.notificationsService.markAsRead(markReadDto, user.id);
  }

  @Roles(Role.ADMIN)
  @Post('test')
  test(
    @Body() testNotificationDto: TestNotificationDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.notificationsService.saveNotification(
      testNotificationDto,
      user.id,
    );
  }

  @Roles(Role.USER, Role.ADMIN, Role.ORGANIZER)
  @Get()
  get(
    @Query() paginationDto: PaginationDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.notificationsService.getAll(paginationDto, user.id);
  }
}
