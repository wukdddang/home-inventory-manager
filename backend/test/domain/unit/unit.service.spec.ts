import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnitService } from '@domain/unit/unit.service';
import { Unit } from '@domain/unit/unit.entity';

describe('UnitService', () => {
    let service: UnitService;
    let repository: jest.Mocked<Repository<Unit>>;

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
                UnitService,
                {
                    provide: getRepositoryToken(Unit),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<UnitService>(UnitService);
        repository = module.get(getRepositoryToken(Unit));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('단위_목록을_조회한다', () => {
        it('거점의 단위 목록을 sortOrder 순으로 조회해야 한다', async () => {
            const mockUnits = [
                { id: '1', symbol: 'ml', name: '밀리리터', sortOrder: 0 },
                { id: '2', symbol: 'g', name: '그램', sortOrder: 1 },
            ] as Unit[];
            mockRepository.find.mockResolvedValue(mockUnits);

            const result = await service.단위_목록을_조회한다('household-1');

            expect(repository.find).toHaveBeenCalledWith({
                where: { householdId: 'household-1' },
                order: { sortOrder: 'ASC', createdAt: 'ASC' },
            });
            expect(result).toHaveLength(2);
        });
    });

    describe('단위를_생성한다', () => {
        it('단위를 생성하고 저장해야 한다', async () => {
            const data = {
                householdId: 'household-1',
                symbol: 'ml',
                name: '밀리리터',
                sortOrder: 0,
            };
            const mockUnit = { id: 'unit-1', ...data } as Unit;
            mockRepository.create.mockReturnValue(mockUnit);
            mockRepository.save.mockResolvedValue(mockUnit);

            const result = await service.단위를_생성한다(data);

            expect(repository.create).toHaveBeenCalledWith(data);
            expect(result).toEqual(mockUnit);
        });
    });

    describe('단위를_수정한다', () => {
        it('단위를 찾아서 수정해야 한다', async () => {
            const mockUnit = {
                id: 'unit-1',
                householdId: 'household-1',
                symbol: 'ml',
                name: '밀리리터',
            } as Unit;
            const updated = { ...mockUnit, symbol: 'mL' } as Unit;
            mockRepository.findOne.mockResolvedValue(mockUnit);
            mockRepository.save.mockResolvedValue(updated);

            const result = await service.단위를_수정한다(
                'unit-1',
                'household-1',
                { symbol: 'mL' },
            );

            expect(result?.symbol).toBe('mL');
        });

        it('존재하지 않으면 null을 반환해야 한다', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            const result = await service.단위를_수정한다(
                'not-exist',
                'household-1',
                { symbol: 'mL' },
            );

            expect(result).toBeNull();
        });
    });

    describe('단위를_삭제한다', () => {
        it('삭제 성공 시 true를 반환해야 한다', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 1 });

            const result = await service.단위를_삭제한다(
                'unit-1',
                'household-1',
            );

            expect(result).toBe(true);
        });

        it('삭제할 단위가 없으면 false를 반환해야 한다', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 0 });

            const result = await service.단위를_삭제한다(
                'not-exist',
                'household-1',
            );

            expect(result).toBe(false);
        });
    });

    describe('다른_거점에서_단위를_복사한다', () => {
        it('원본 거점의 단위를 대상 거점으로 복사해야 한다', async () => {
            const sourceUnits = [
                { id: 'src-1', symbol: 'ml', name: '밀리리터', sortOrder: 0 },
                { id: 'src-2', symbol: 'g', name: '그램', sortOrder: 1 },
            ] as Unit[];
            mockRepository.find.mockResolvedValue(sourceUnits);

            const copies = [
                {
                    id: 'new-1',
                    householdId: 'target',
                    symbol: 'ml',
                    name: '밀리리터',
                    sortOrder: 0,
                },
                {
                    id: 'new-2',
                    householdId: 'target',
                    symbol: 'g',
                    name: '그램',
                    sortOrder: 1,
                },
            ] as Unit[];
            mockRepository.create.mockImplementation(
                (data) => data as Unit,
            );
            mockRepository.save.mockResolvedValue(copies);

            const result = await service.다른_거점에서_단위를_복사한다(
                'source',
                'target',
            );

            expect(repository.find).toHaveBeenCalledWith({
                where: { householdId: 'source' },
                order: { sortOrder: 'ASC', createdAt: 'ASC' },
            });
            expect(repository.create).toHaveBeenCalledTimes(2);
            expect(result).toHaveLength(2);
        });
    });
});
