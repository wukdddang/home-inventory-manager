import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HouseholdMember } from './household-member.entity';
import { HouseholdMemberService } from './household-member.service';

@Module({
  imports: [TypeOrmModule.forFeature([HouseholdMember])],
  providers: [HouseholdMemberService],
  exports: [HouseholdMemberService],
})
export class HouseholdMemberModule {}
