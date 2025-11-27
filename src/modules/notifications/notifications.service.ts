import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notifications } from './entities/notifications.entity';
import { Repository } from 'typeorm';
import { MarkAsReadDto } from './dto/set-read.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { TestNotificationDto } from './dto/test.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notifications)
    private readonly notificationsRepository: Repository<Notifications>,
  ) {}

  async getAll(paginationDto: PaginationDto, user_id: number) {
    this.logger.debug({
      function: 'getAll',
      paginationDto,
      user_id,
    });

    const { limit, offset } = paginationDto;

    const queryBuilder = this.notificationsRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.transaction', 'transaction')
      .leftJoinAndSelect('transaction.entries', 'entries')
      .where('notification.user_id = :user_id', { user_id })
      .skip(offset)
      .take(limit)
      .orderBy('notification.created_at', 'DESC');

    const [notifications, total] = await queryBuilder.getManyAndCount();

    return notifications;
  }

  async createNotification(
    title: string,
    details: string,
    arabic_title: string,
    arabic_details: string,
    user_id: number,
    transaction_id: number = null,
  ) {
    this.logger.debug({
      function: 'createNotification',
      title,
      details,
      arabic_title,
      arabic_details,
      user_id,
      transaction_id,
    });
    return this.notificationsRepository.create({
      title: title,
      details: details,
      arabic_title: arabic_title,
      arabic_details: arabic_details,
      user_id: user_id,
      transaction_id: transaction_id,
    });
  }

  async saveNotification(
    testNotificationDto: TestNotificationDto,
    user_id: number,
  ) {
    this.logger.debug({
      function: 'createNotification',
      testNotificationDto,
      user_id,
    });
    const notification = this.notificationsRepository.create({
      title: testNotificationDto.title,
      details: testNotificationDto.details,
      arabic_title: testNotificationDto.arabic_title,
      arabic_details: testNotificationDto.arabic_details,
      user_id: user_id,
      transaction_id: testNotificationDto.transaction_id || null,
    });
    return this.notificationsRepository.save(notification);
  }

  async markAsRead(markReadDto: MarkAsReadDto, user_id: number) {
    this.logger.debug({
      function: 'markAsRead',
      markReadDto,
      user_id,
    });
    const notification = await this.notificationsRepository.findOneBy({
      id: markReadDto.notification_id,
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    if (notification.user_id != user_id) {
      throw new UnauthorizedException('You are not the owner');
    }
    notification.is_read = true;
    return this.notificationsRepository.save(notification);
  }
}
