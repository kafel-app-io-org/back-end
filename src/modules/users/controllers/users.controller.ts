/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Query,
  UploadedFile,
  UseInterceptors,
  Patch,
  UploadedFiles,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserIdentity } from 'src/common/decorator/user.decorator';
import { IUserIdentity } from 'src/common/interfaces/user-identity.interface';
import { ApiBearerAuth, ApiConsumes, ApiParam, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/role.enum';
import RolesGuard from 'src/common/guards/roles.guard';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ChangeWithdrawPreferenceDto } from '../dto/ChangeWithdrawPreference.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { UpdateOrganizerProfileDto } from '../dto/update-organizer-profile.dto';

@ApiBearerAuth()
@ApiTags('User')
@UseGuards(RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @Roles(Role.ADMIN, Role.USER, Role.ORGANIZER)
  getProfile(@UserIdentity() user: IUserIdentity) {
    return this.usersService.getProfile(user.id);
  }

  @Roles(Role.ADMIN, Role.USER)
  @Patch('profile')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  updateProfile(
    @UserIdentity() user: IUserIdentity,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // console.log("RSR-1 Update profile..!");
    return this.usersService.updateProfile(user, updateProfileDto, file);
  }
 
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @Patch('organizer-profile')
  @UseInterceptors(
    FileFieldsInterceptor([
      // { name: 'images', maxCount: 10 },
      { name: 'icon', maxCount: 1 },
      { name: 'image', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  updateOrganizerProfile(
    @UserIdentity() user: IUserIdentity,
    @UploadedFiles() files: {
    // images?: Express.Multer.File[];
    icon?: Express.Multer.File[];
    image?: Express.Multer.File[];
    },
    @Body() updateOrganizerProfileDto: UpdateOrganizerProfileDto,
  ) {
    const { icon, image } = files;

    return this.usersService.updateOrganizerProfile(
      updateOrganizerProfileDto,
      user,
      image?.[0],
      icon?.[0],
    );
  }

  @Roles(Role.ADMIN, Role.USER)
  @Post('withdraw-method-preference')
  changeWithdrawMethodPreference(
    @Body() dto: ChangeWithdrawPreferenceDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.usersService.changeWithdrawMethodPreference(
      dto.method,
      user.id,
    );
  }

  @Roles(Role.ADMIN, Role.ORGANIZER, Role.USER)
  @Get('not-connected-beneficiaries/:campaign_id')
  getNotConnectedBeneficiaries(@Param('campaign_id') campaign_id: string) {
    return this.usersService.getNotConnectedBeneficiaries(campaign_id);
  }

  @Roles(Role.ADMIN, Role.ORGANIZER, Role.USER)
  @Get('connected-beneficiaries/:campaign_id')
  getConnectedBeneficiaries(@Param('campaign_id') campaign_id: string) {
    return this.usersService.getConnectedBeneficiaries(campaign_id);
  }

  @Roles(Role.ADMIN, Role.USER)
  @Get('withdraw-method-preference')
  getWithdrawMethodPreference(@UserIdentity() user: IUserIdentity) {
    return this.usersService.getWithdrawMethodPreference(user.id);
  }

  @Roles(Role.ADMIN, Role.USER)
  @Get('organizes')
  getOrganizers(@Query() paginationDto: PaginationDto) {
    return this.usersService.getOrganizers(paginationDto);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(
    @Body() createUserDto: CreateUserDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.usersService.create(createUserDto, user.id);
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  @Roles(Role.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string, @UserIdentity() user: IUserIdentity) {
    return this.usersService.findOne(+id, user);
  }

  @Roles(Role.ADMIN)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.usersService.update(+id, updateUserDto, user);
  }

  @Roles(Role.ADMIN)
  @Put('/edit-profile')
  editProfile(
    @Body() updateUserDto: UpdateUserDto,
    @UserIdentity() user: IUserIdentity,
  ) {
    return this.usersService.editProfile(updateUserDto, user);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @UserIdentity() user: IUserIdentity) {
    return this.usersService.remove(+id, user.id);
  }

  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  @Post('upload-organizer-image')
  uploadOrganizerImage(
    @UserIdentity() user: IUserIdentity,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.usersService.uploadOrganizerImages(user, file);
  }

  @Delete('organizer-images/:id')
  @Roles(Role.ADMIN, Role.ORGANIZER)
  @ApiParam({ name: 'id', type: Number, description: 'Image ID to delete' })
  async deleteOrganizerImage(
    @UserIdentity() user: IUserIdentity,
    @Param('id', ParseIntPipe) imageId: number,
  ) {
    return this.usersService.deleteOrganizerImage(user, imageId);
  }
}
