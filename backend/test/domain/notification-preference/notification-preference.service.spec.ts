import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationPreferenceService } from '@domain/notification-preference/notification-preference.service';
import { NotificationPreference } from '@domain/notification-preference/notification-preference.entity';

describe('NotificationPreferenceService', () => {
  let service: NotificationPreferenceService;
  let repository: jest.Mocked<Repository<NotificationPreference>>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationPreferenceService,
        { provide: getRepositoryToken(NotificationPreference), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<NotificationPreferenceService>(NotificationPreferenceService);
    repository = module.get(getRepositoryToken(NotificationPreference));
  });

  afterEach(() => jest.clearAllMocks());

  describe('알림_설정_목록을_조회한다', () => {
    it('사용자의 알림 설정 목록을 조회해야 한다', async () => {
      const mockItems = [{ id: '1' }, { id: '2' }] as NotificationPreference[];
      mockRepository.find.mockResolvedValue(mockItems);

      const result = await service.알림_설정_목록을_조회한다('user-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('알림_설정을_저장한다', () => {
    it('알림 설정을 생성해야 한다', async () => {
      const data = { userId: 'user-1', notifyExpiration: true };
      const mockItem = { id: 'pref-1', ...data } as NotificationPreference;
      mockRepository.create.mockReturnValue(mockItem);
      mockRepository.save.mockResolvedValue(mockItem);

      const result = await service.알림_설정을_저장한다(data);

      expect(result).toEqual(mockItem);
    });
  });

  describe('알림_설정을_수정한다', () => {
    it('알림 설정을 수정해야 한다', async () => {
      const updated = { id: 'pref-1', userId: 'user-1', notifyExpiration: false } as NotificationPreference;
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(updated);

      const result = await service.알림_설정을_수정한다('pref-1', 'user-1', { notifyExpiration: false });

      expect(repository.update).toHaveBeenCalledWith(
        { id: 'pref-1', userId: 'user-1' },
        { notifyExpiration: false },
      );
      expect(result?.notifyExpiration).toBe(false);
    });

    it('존재하지 않으면 null을 반환해야 한다', async () => {
      mockRepository.update.mockResolvedValue({ affected: 0 });
      expect(await service.알림_설정을_수정한다('not-exist', 'user-1', {})).toBeNull();
    });
  });

  describe('알림_설정을_삭제한다', () => {
    it('삭제 성공 시 true를 반환해야 한다', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      expect(await service.알림_설정을_삭제한다('pref-1', 'user-1')).toBe(true);
    });

    it('삭제할 항목이 없으면 false를 반환해야 한다', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });
      expect(await service.알림_설정을_삭제한다('not-exist', 'user-1')).toBe(false);
    });
  });
});
