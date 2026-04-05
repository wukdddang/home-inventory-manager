import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDeviceToken } from './user-device-token.entity';

@Injectable()
export class UserDeviceTokenService {
  constructor(
    @InjectRepository(UserDeviceToken)
    private readonly repo: Repository<UserDeviceToken>,
  ) {}

  async 토큰을_등록한다(data: {
    userId: string;
    token: string;
    platform: 'web' | 'android' | 'ios';
    deviceInfo?: string | null;
  }): Promise<UserDeviceToken> {
    const existing = await this.repo.findOne({
      where: { token: data.token },
    });

    if (existing) {
      existing.userId = data.userId;
      existing.platform = data.platform;
      existing.deviceInfo = data.deviceInfo ?? existing.deviceInfo;
      existing.isActive = true;
      return this.repo.save(existing);
    }

    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async 사용자의_활성_토큰을_조회한다(
    userId: string,
  ): Promise<UserDeviceToken[]> {
    return this.repo.find({
      where: { userId, isActive: true },
    });
  }

  async 다수_사용자의_활성_토큰을_조회한다(
    userIds: string[],
  ): Promise<UserDeviceToken[]> {
    if (userIds.length === 0) return [];
    return this.repo
      .createQueryBuilder('t')
      .where('t.userId IN (:...userIds)', { userIds })
      .andWhere('t.isActive = :active', { active: true })
      .getMany();
  }

  async 토큰을_삭제한다(token: string, userId: string): Promise<boolean> {
    const result = await this.repo.delete({ token, userId });
    return (result.affected ?? 0) > 0;
  }

  async 사용자의_토큰을_일괄_삭제한다(userId: string): Promise<void> {
    await this.repo.delete({ userId });
  }

  async 토큰을_비활성화한다(token: string): Promise<void> {
    await this.repo.update({ token }, { isActive: false });
  }

  async 토큰을_일괄_비활성화한다(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ isActive: false })
      .where('token IN (:...tokens)', { tokens })
      .execute();
  }
}
