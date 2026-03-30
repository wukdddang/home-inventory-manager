import { Module } from '@nestjs/common';
import { ProductVariantBusinessModule } from '../../business/product-variant-business/product-variant-business.module';
import { HouseholdMemberModule } from '../../domain/household/household-member.module';
import { ProductVariantController } from './product-variant.controller';

@Module({
    imports: [ProductVariantBusinessModule, HouseholdMemberModule],
    controllers: [ProductVariantController],
})
export class ProductVariantInterfaceModule {}
