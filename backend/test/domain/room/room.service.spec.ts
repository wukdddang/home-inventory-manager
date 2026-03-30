import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomService } from '@domain/room/room.service';
import { Room } from '@domain/room/room.entity';

describe('RoomService', () => {
  let service: RoomService;
  let repository: jest.Mocked<Repository<Room>>;

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
        RoomService,
        {
          provide: getRepositoryToken(Room),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<RoomService>(RoomService);
    repository = module.get(getRepositoryToken(Room));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('방_목록을_조회한다', () => {
    it('houseStructureId로 방 목록을 조회해야 한다', async () => {
      const mockRooms = [
        { id: 'r-1', structureRoomKey: 'living', sortOrder: 0 },
        { id: 'r-2', structureRoomKey: 'bed', sortOrder: 1 },
      ] as Room[];
      mockRepository.find.mockResolvedValue(mockRooms);

      const result = await service.방_목록을_조회한다('hs-1');

      expect(repository.find).toHaveBeenCalledWith({
        where: { houseStructureId: 'hs-1' },
        order: { sortOrder: 'ASC', createdAt: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('방을_동기화한다', () => {
    it('새 방을 추가해야 한다', async () => {
      mockRepository.find.mockResolvedValue([]);
      mockRepository.create.mockImplementation((data) => data as Room);
      mockRepository.save.mockImplementation(async (data) => data as Room[]);

      const rooms = [
        { structureRoomKey: 'living', displayName: '거실', sortOrder: 0 },
      ];

      await service.방을_동기화한다('hs-1', rooms);

      expect(repository.create).toHaveBeenCalledWith({
        houseStructureId: 'hs-1',
        structureRoomKey: 'living',
        displayName: '거실',
        sortOrder: 0,
      });
      expect(repository.save).toHaveBeenCalled();
    });

    it('없어진 방을 삭제해야 한다', async () => {
      const existing = [
        { id: 'r-1', structureRoomKey: 'living', sortOrder: 0 },
        { id: 'r-2', structureRoomKey: 'bed', sortOrder: 1 },
      ] as Room[];
      mockRepository.find.mockResolvedValue(existing);
      mockRepository.delete.mockResolvedValue({ affected: 1 });
      mockRepository.save.mockImplementation(async (data) => data as Room[]);

      // living만 남기고 bed 삭제
      await service.방을_동기화한다('hs-1', [
        { structureRoomKey: 'living', sortOrder: 0 },
      ]);

      expect(repository.delete).toHaveBeenCalledWith({
        id: expect.objectContaining({ _value: ['r-2'] }),
      });
    });

    it('기존 방의 정보를 수정해야 한다', async () => {
      const existing = [
        {
          id: 'r-1',
          structureRoomKey: 'living',
          displayName: '거실',
          sortOrder: 0,
        },
      ] as Room[];
      mockRepository.find.mockResolvedValue(existing);
      mockRepository.save.mockImplementation(async (data) => data as Room[]);

      await service.방을_동기화한다('hs-1', [
        { structureRoomKey: 'living', displayName: '큰 거실', sortOrder: 5 },
      ]);

      expect(repository.save).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'r-1',
          displayName: '큰 거실',
          sortOrder: 5,
        }),
      ]);
    });
  });
});
