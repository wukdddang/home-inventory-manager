import { Module } from '@nestjs/common';
import { CategoryContextModule } from '../../context/category-context/category-context.module.js';
import { CategoryBusinessService } from './category-business.service.js';

@Module({
  imports: [CategoryContextModule],
  providers: [CategoryBusinessService],
  exports: [CategoryBusinessService],
})
export class CategoryBusinessModule {}
