import { Test, TestingModule } from '@nestjs/testing';
import {
  CopyCategoriesHandler,
  CopyCategoriesCommand,
} from '@context/category-context/handlers/commands/copy-categories.handler';
import { CategoryService } from '@domain/category/category.service';
import { Category } from '@domain/category/category.entity';

describe('CopyCategoriesHandler', () => {
  let handler: CopyCategoriesHandler;

  const mockCategoryService = {
    다른_거점에서_카테고리를_복사한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CopyCategoriesHandler,
        { provide: CategoryService, useValue: mockCategoryService },
      ],
    }).compile();

    handler = module.get<CopyCategoriesHandler>(CopyCategoriesHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('원본 거점에서 대상 거점으로 카테고리를 복사해야 한다', async () => {
    const command = new CopyCategoriesCommand('source-hh', 'target-hh');
    const mockCopies = [
      {
        id: 'new-1',
        householdId: 'target-hh',
        name: '식료품',
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as Category[];

    mockCategoryService.다른_거점에서_카테고리를_복사한다.mockResolvedValue(
      mockCopies,
    );

    const result = await handler.execute(command);

    expect(
      mockCategoryService.다른_거점에서_카테고리를_복사한다,
    ).toHaveBeenCalledWith('source-hh', 'target-hh');
    expect(result).toHaveLength(1);
    expect(result[0].householdId).toBe('target-hh');
  });
});
