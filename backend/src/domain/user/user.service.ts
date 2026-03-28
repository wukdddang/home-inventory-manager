import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async 이메일로_사용자를_조회한다(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async ID로_사용자를_조회한다(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async 인증토큰으로_사용자를_조회한다(
    token: string,
  ): Promise<User | null> {
    return this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });
  }

  async 사용자를_생성한다(data: {
    email: string;
    passwordHash: string;
    displayName: string;
    emailVerificationToken: string;
  }): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async 사용자를_저장한다(user: User): Promise<User> {
    return this.userRepository.save(user);
  }
}
