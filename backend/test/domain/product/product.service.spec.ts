import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductService } from '@domain/product/product.service';
import { Product } from '@domain/product/product.entity';

describe('ProductService', () => {
    let service: ProductService;
    let repository: jest.Mocked<Repository<Product>>;

    const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductService,
                {
                    provide: getRepositoryToken(Product),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<ProductService>(ProductService);
        repository = module.get(getRepositoryToken(Product));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('상품_목록을_조회한다', () => {
        it('거점의 상품 목록을 조회해야 한다', async () => {
            const mockProducts = [
                { id: '1', name: '우유', isConsumable: true },
                { id: '2', name: '칫솔', isConsumable: false },
            ] as Product[];
            mockRepository.find.mockResolvedValue(mockProducts);

            const result =
                await service.상품_목록을_조회한다('household-1');

            expect(repository.find).toHaveBeenCalledWith({
                where: { householdId: 'household-1' },
                order: { createdAt: 'ASC' },
            });
            expect(result).toHaveLength(2);
        });
    });

    describe('상품을_생성한다', () => {
        it('상품을 생성하고 저장해야 한다', async () => {
            const data = {
                householdId: 'household-1',
                categoryId: 'cat-1',
                name: '우유',
                isConsumable: true,
            };
            const mockProduct = { id: 'prod-1', ...data } as Product;
            mockRepository.create.mockReturnValue(mockProduct);
            mockRepository.save.mockResolvedValue(mockProduct);

            const result = await service.상품을_생성한다(data);

            expect(repository.create).toHaveBeenCalledWith(data);
            expect(result).toEqual(mockProduct);
        });
    });

    describe('상품을_수정한다', () => {
        it('상품을 찾아서 수정해야 한다', async () => {
            const mockProduct = {
                id: 'prod-1',
                householdId: 'household-1',
                name: '우유',
            } as Product;
            const updated = { ...mockProduct, name: '저지방 우유' } as Product;
            mockRepository.findOne.mockResolvedValue(mockProduct);
            mockRepository.save.mockResolvedValue(updated);

            const result = await service.상품을_수정한다(
                'prod-1',
                'household-1',
                { name: '저지방 우유' },
            );

            expect(result?.name).toBe('저지방 우유');
        });

        it('존재하지 않으면 null을 반환해야 한다', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            const result = await service.상품을_수정한다(
                'not-exist',
                'household-1',
                { name: '저지방 우유' },
            );

            expect(result).toBeNull();
        });
    });

    describe('상품을_삭제한다', () => {
        it('삭제 성공 시 true를 반환해야 한다', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 1 });

            const result = await service.상품을_삭제한다(
                'prod-1',
                'household-1',
            );

            expect(result).toBe(true);
        });

        it('삭제할 상품이 없으면 false를 반환해야 한다', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 0 });

            const result = await service.상품을_삭제한다(
                'not-exist',
                'household-1',
            );

            expect(result).toBe(false);
        });
    });

    describe('다른_거점에서_상품을_복사한다', () => {
        it('원본 거점의 상품을 대상 거점으로 복사해야 한다', async () => {
            const sourceProducts = [
                {
                    id: 'src-1',
                    categoryId: 'cat-src-1',
                    name: '우유',
                    isConsumable: true,
                    imageUrl: null,
                    description: null,
                },
            ] as Product[];
            mockRepository.find.mockResolvedValue(sourceProducts);

            const copies = [
                {
                    id: 'new-1',
                    householdId: 'target',
                    categoryId: 'cat-target-1',
                    name: '우유',
                    isConsumable: true,
                },
            ] as Product[];
            mockRepository.create.mockImplementation(
                (data) => data as Product,
            );
            mockRepository.save.mockResolvedValue(copies);

            const categoryIdMap = new Map([
                ['cat-src-1', 'cat-target-1'],
            ]);

            const result = await service.다른_거점에서_상품을_복사한다(
                'source',
                'target',
                categoryIdMap,
            );

            expect(repository.create).toHaveBeenCalledTimes(1);
            expect(result).toHaveLength(1);
        });

        it('매핑되지 않은 카테고리의 상품은 복사하지 않아야 한다', async () => {
            const sourceProducts = [
                {
                    id: 'src-1',
                    categoryId: 'cat-unmapped',
                    name: '우유',
                    isConsumable: true,
                    imageUrl: null,
                    description: null,
                },
            ] as Product[];
            mockRepository.find.mockResolvedValue(sourceProducts);

            const categoryIdMap = new Map<string, string>();

            const result = await service.다른_거점에서_상품을_복사한다(
                'source',
                'target',
                categoryIdMap,
            );

            expect(repository.create).not.toHaveBeenCalled();
            expect(result).toHaveLength(0);
        });
    });
});
