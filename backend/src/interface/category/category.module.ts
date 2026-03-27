import { Module } from '@nestjs/common';
import { CategoryBusinessModule } from '../../business/category-business/category-business.module.js';
import { CategoryController } from './category.controller.js';

@Module({
  imports: [CategoryBusinessModule],
  controllers: [CategoryController],
})
export class CategoryInterfaceModule {}
