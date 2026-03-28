import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UserModule } from '../../domain/user/user.module';
import { AuthInfrastructureModule } from '../../common/auth/auth-infrastructure.module';
import { MailModule } from '../../common/infrastructure/mail/mail.module';
import { AuthContextService } from './auth-context.service';
import { SignupHandler } from './handlers/commands/signup.handler';
import { LoginHandler } from './handlers/commands/login.handler';
import { RefreshTokenHandler } from './handlers/commands/refresh-token.handler';
import { LogoutHandler } from './handlers/commands/logout.handler';
import { VerifyEmailHandler } from './handlers/commands/verify-email.handler';
import { ChangePasswordHandler } from './handlers/commands/change-password.handler';
import { GetMyProfileHandler } from './handlers/queries/get-my-profile.handler';

const CommandHandlers = [
  SignupHandler,
  LoginHandler,
  RefreshTokenHandler,
  LogoutHandler,
  VerifyEmailHandler,
  ChangePasswordHandler,
];

const QueryHandlers = [GetMyProfileHandler];

@Module({
  imports: [CqrsModule, UserModule, AuthInfrastructureModule, MailModule],
  providers: [AuthContextService, ...CommandHandlers, ...QueryHandlers],
  exports: [AuthContextService],
})
export class AuthContextModule {}
