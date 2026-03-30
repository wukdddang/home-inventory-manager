import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async 카테고리_목록을_조회한다(householdId: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { householdId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async 카테고리를_단건_조회한다(
    id: string,
    householdId: string,
  ): Promise<Category | null> {
    return this.categoryRepository.findOne({
      where: { id, householdId },
    });
  }

  async 카테고리를_생성한다(data: {
    householdId: string;
    name: string;
    sortOrder?: number;
  }): Promise<Category> {
    const category = this.categoryRepository.create(data);
    return this.categoryRepository.save(category);
  }

  async 카테고리를_수정한다(
    id: string,
    householdId: string,
    data: { name?: string; sortOrder?: number },
  ): Promise<Category | null> {
    const category = await this.카테고리를_단건_조회한다(id, householdId);
    if (!category) return null;

    Object.assign(category, data);
    return this.categoryRepository.save(category);
  }

  async 카테고리를_삭제한다(
    id: string,
    householdId: string,
  ): Promise<boolean> {
    const result = await this.categoryRepository.delete({ id, householdId });
    return (result.affected ?? 0) > 0;
  }

  async 다른_거점에서_카테고리를_복사한다(
    sourceHouseholdId: string,
    targetHouseholdId: string,
  ): Promise<Category[]> {
    const sourceCategories = await this.카테고리_목록을_조회한다(
      sourceHouseholdId,
    );

    const copies = sourceCategories.map((cat) =>
      this.categoryRepository.create({
        householdId: targetHouseholdId,
        name: cat.name,
        sortOrder: cat.sortOrder,
      }),
    );

    return this.categoryRepository.save(copies);
  }
}
