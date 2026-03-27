import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CategoryModule } from '../../domain/category/category.module.js';
import { CategoryContextService } from './category-context.service.js';
import { CreateCategoryHandler } from './handlers/commands/create-category.handler.js';
import { UpdateCategoryHandler } from './handlers/commands/update-category.handler.js';
import { DeleteCategoryHandler } from './handlers/commands/delete-category.handler.js';
import { GetCategoryListHandler } from './handlers/queries/get-category-list.handler.js';
import { GetCategoryDetailHandler } from './handlers/queries/get-category-detail.handler.js';

const CommandHandlers = [
  CreateCategoryHandler,
  UpdateCategoryHandler,
  DeleteCategoryHandler,
];

const QueryHandlers = [GetCategoryListHandler, GetCategoryDetailHandler];

@Module({
  imports: [CqrsModule, CategoryModule],
  providers: [CategoryContextService, ...CommandHandlers, ...QueryHandlers],
  exports: [CategoryContextService],
})
export class CategoryContextModule {}
