import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CategoryModule } from '../../domain/category/category.module';
import { CategoryContextService } from './category-context.service';
import { CreateCategoryHandler } from './handlers/commands/create-category.handler';
import { UpdateCategoryHandler } from './handlers/commands/update-category.handler';
import { DeleteCategoryHandler } from './handlers/commands/delete-category.handler';
import { CopyCategoriesHandler } from './handlers/commands/copy-categories.handler';
import { GetCategoryListHandler } from './handlers/queries/get-category-list.handler';
import { GetCategoryDetailHandler } from './handlers/queries/get-category-detail.handler';

const CommandHandlers = [
  CreateCategoryHandler,
  UpdateCategoryHandler,
  DeleteCategoryHandler,
  CopyCategoriesHandler,
];

const QueryHandlers = [GetCategoryListHandler, GetCategoryDetailHandler];

@Module({
  imports: [CqrsModule, CategoryModule],
  providers: [CategoryContextService, ...CommandHandlers, ...QueryHandlers],
  exports: [CategoryContextService],
})
export class CategoryContextModule {}
