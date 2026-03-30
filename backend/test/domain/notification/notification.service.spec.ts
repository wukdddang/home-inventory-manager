import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from '@domain/notification/notification.service';
import { Notification } from '@domain/notification/notification.entity';

describe('NotificationService', () => {
  let service: NotificationService;
  let repository: jest.Mocked<Repository<Notification>>;

  const mockRepository = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), update: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationService, { provide: getRepositoryToken(Notification), useValue: mockRepository }],
    }).compile();
    service = module.get<NotificationService>(NotificationService);
    repository = module.get(getRepositoryToken(Notification));
  });

  afterEach(() => jest.clearAllMocks());

  it('알림 목록을 조회해야 한다', async () => {
    mockRepository.find.mockResolvedValue([{ id: '1' }] as any);
    const result = await service.알림_목록을_조회한다('user-1');
    expect(repository.find).toHaveBeenCalledWith({ where: { userId: 'user-1' }, order: { createdAt: 'DESC' } });
    expect(result).toHaveLength(1);
  });

  it('거점 필터로 알림을 조회해야 한다', async () => {
    mockRepository.find.mockResolvedValue([]);
    await service.알림_목록을_조회한다('user-1', 'household-1');
    expect(repository.find).toHaveBeenCalledWith({ where: { userId: 'user-1', householdId: 'household-1' }, order: { createdAt: 'DESC' } });
  });

  it('알림을 생성해야 한다', async () => {
    const data = { userId: 'user-1', type: 'expiration', title: '만료 임박' };
    const mockNotif = { id: 'n-1', ...data } as any;
    mockRepository.create.mockReturnValue(mockNotif);
    mockRepository.save.mockResolvedValue(mockNotif);
    const result = await service.알림을_생성한다(data);
    expect(result).toEqual(mockNotif);
  });

  it('알림을 읽음 처리해야 한다', async () => {
    mockRepository.update.mockResolvedValue({ affected: 1 });
    mockRepository.findOne.mockResolvedValue({ id: 'n-1', readAt: new Date() } as any);
    const result = await service.알림을_읽음_처리한다('n-1', 'user-1');
    expect(result?.readAt).toBeDefined();
  });

  it('존재하지 않는 알림 읽음 처리 시 null을 반환해야 한다', async () => {
    mockRepository.update.mockResolvedValue({ affected: 0 });
    const result = await service.알림을_읽음_처리한다('not-exist', 'user-1');
    expect(result).toBeNull();
  });
});
