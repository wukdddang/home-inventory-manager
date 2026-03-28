import { Module } from '@nestjs/common';
import { CategoryBusinessModule } from '../../business/category-business/category-business.module';
import { CategoryController } from './category.controller';

@Module({
  imports: [CategoryBusinessModule],
  controllers: [CategoryController],
})
export class CategoryInterfaceModule {}
