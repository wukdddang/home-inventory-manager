import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: '유효한 이메일 형식이어야 합니다' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  @MaxLength(72, { message: '비밀번호는 최대 72자까지 가능합니다' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayName: string;
}
