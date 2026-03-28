import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASSWORD'),
      },
    });
  }

  async 인증_이메일을_발송한다(
    to: string,
    token: string,
  ): Promise<void> {
    const appUrl = this.configService.get('APP_URL');
    const verifyUrl = `${appUrl}/auth/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to,
      subject: '[집비치기] 이메일 인증을 완료해주세요',
      html: `
        <h2>이메일 인증</h2>
        <p>아래 링크를 클릭하여 이메일 인증을 완료해주세요.</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
        <p>본인이 요청하지 않은 경우 이 이메일을 무시해주세요.</p>
      `,
    });
  }
}
