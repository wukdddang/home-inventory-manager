import { Module } from '@nestjs/common';
import { ProductBusinessModule } from '../../business/product-business/product-business.module';
import { HouseholdMemberModule } from '../../domain/household/household-member.module';
import { ProductController } from './product.controller';

@Module({
    imports: [ProductBusinessModule, HouseholdMemberModule],
    controllers: [ProductController],
})
export class ProductInterfaceModule {}
