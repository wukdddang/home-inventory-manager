import { Test, TestingModule } from '@nestjs/testing';
import {
  SaveKindDefinitionsHandler,
  SaveKindDefinitionsCommand,
} from '@context/household-kind-context/handlers/commands/save-kind-definitions.handler';
import { HouseholdKindDefinitionService } from '@domain/household-kind-definition/household-kind-definition.service';
import { HouseholdKindDefinition } from '@domain/household-kind-definition/household-kind-definition.entity';

describe('SaveKindDefinitionsHandler', () => {
  let handler: SaveKindDefinitionsHandler;

  const mockService = {
    유형_목록을_일괄_저장한다: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaveKindDefinitionsHandler,
        {
          provide: HouseholdKindDefinitionService,
          useValue: mockService,
        },
      ],
    }).compile();

    handler = module.get<SaveKindDefinitionsHandler>(
      SaveKindDefinitionsHandler,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('유형 목록을 일괄 저장하고 결과를 반환해야 한다', async () => {
    const items = [
      { kindId: 'home', label: '우리집', sortOrder: 0 },
      { kindId: 'custom', label: '창고', sortOrder: 1 },
    ];
    const command = new SaveKindDefinitionsCommand('user-1', items);

    const mockSaved = items.map((item, i) => ({
      id: `def-${i}`,
      userId: 'user-1',
      ...item,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as HouseholdKindDefinition[];

    mockService.유형_목록을_일괄_저장한다.mockResolvedValue(mockSaved);

    const result = await handler.execute(command);

    expect(mockService.유형_목록을_일괄_저장한다).toHaveBeenCalledWith(
      'user-1',
      items,
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(
      expect.objectContaining({ kindId: 'home', label: '우리집' }),
    );
  });
});
