import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariantService } from '@domain/product-variant/product-variant.service';
import { ProductVariant } from '@domain/product-variant/product-variant.entity';

describe('ProductVariantService', () => {
    let service: ProductVariantService;
    let repository: jest.Mocked<Repository<ProductVariant>>;

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
                ProductVariantService,
                {
                    provide: getRepositoryToken(ProductVariant),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<ProductVariantService>(ProductVariantService);
        repository = module.get(getRepositoryToken(ProductVariant));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('상품_용량_변형_목록을_조회한다', () => {
        it('상품의 용량·변형 목록을 조회해야 한다', async () => {
            const mockVariants = [
                {
                    id: '1',
                    productId: 'prod-1',
                    unitId: 'unit-1',
                    quantityPerUnit: 500,
                    name: '500ml',
                },
                {
                    id: '2',
                    productId: 'prod-1',
                    unitId: 'unit-1',
                    quantityPerUnit: 1000,
                    name: '1L',
                },
            ] as ProductVariant[];
            mockRepository.find.mockResolvedValue(mockVariants);

            const result =
                await service.상품_용량_변형_목록을_조회한다('prod-1');

            expect(repository.find).toHaveBeenCalledWith({
                where: { productId: 'prod-1' },
                order: { createdAt: 'ASC' },
            });
            expect(result).toHaveLength(2);
        });
    });

    describe('상품_용량_변형을_생성한다', () => {
        it('용량·변형을 생성하고 저장해야 한다', async () => {
            const data = {
                productId: 'prod-1',
                unitId: 'unit-1',
                quantityPerUnit: 500,
                name: '500ml',
            };
            const mockVariant = { id: 'var-1', ...data } as ProductVariant;
            mockRepository.create.mockReturnValue(mockVariant);
            mockRepository.save.mockResolvedValue(mockVariant);

            const result = await service.상품_용량_변형을_생성한다(data);

            expect(repository.create).toHaveBeenCalledWith(data);
            expect(result).toEqual(mockVariant);
        });
    });

    describe('상품_용량_변형을_수정한다', () => {
        it('용량·변형을 찾아서 수정해야 한다', async () => {
            const mockVariant = {
                id: 'var-1',
                productId: 'prod-1',
                name: '500ml',
            } as ProductVariant;
            const updated = {
                ...mockVariant,
                name: '500ml 페트',
            } as ProductVariant;
            mockRepository.findOne.mockResolvedValue(mockVariant);
            mockRepository.save.mockResolvedValue(updated);

            const result = await service.상품_용량_변형을_수정한다(
                'var-1',
                'prod-1',
                { name: '500ml 페트' },
            );

            expect(result?.name).toBe('500ml 페트');
        });

        it('존재하지 않으면 null을 반환해야 한다', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            const result = await service.상품_용량_변형을_수정한다(
                'not-exist',
                'prod-1',
                { name: '500ml' },
            );

            expect(result).toBeNull();
        });
    });

    describe('상품_용량_변형을_삭제한다', () => {
        it('삭제 성공 시 true를 반환해야 한다', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 1 });

            const result = await service.상품_용량_변형을_삭제한다(
                'var-1',
                'prod-1',
            );

            expect(result).toBe(true);
        });

        it('삭제할 용량·변형이 없으면 false를 반환해야 한다', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 0 });

            const result = await service.상품_용량_변형을_삭제한다(
                'not-exist',
                'prod-1',
            );

            expect(result).toBe(false);
        });
    });
});
