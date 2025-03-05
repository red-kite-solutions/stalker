import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { AppModule } from '../../app.module';
import { Table } from './tables.model';
import { TableService } from './tables.service';

describe('Table Service', () => {
  let moduleFixture: TestingModule;
  let tableService: TableService;
  let tableModel: Model<Table>;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    tableModel = moduleFixture.get<Model<Table>>(getModelToken('table'));
    tableService = moduleFixture.get(TableService);
  });

  beforeEach(async () => {
    await tableModel.deleteMany({});
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('Manage tables', () => {
    it('Read a table by id', async () => {
      // Arrange
      const table: Table = {
        name: 'my table',
        fields: [],
        resource: 'domain',
        icon: 'icon',
        isPinned: false,
      };

      const created = await tableModel.create(table);

      // Act
      const res = await tableService.getTable(created._id.toString());

      // Assert
      expect(res.name).toStrictEqual(table.name);
    });

    it('Read all tables', async () => {
      // Arrange
      const table: Table = {
        name: 'my table',
        fields: [],
        resource: 'domain',
        icon: 'icon',
        isPinned: false,
      };

      await tableModel.create(table);
      await tableModel.create({ ...table, name: 'my table 2' });
      await tableModel.create({ ...table, name: 'my table 3' });

      // Act
      const res = await tableService.getAll();

      // Assert
      expect(res.length).toStrictEqual(3);
    });

    it('Create a table', async () => {
      // Arrange
      const table: Table = {
        name: 'my table',
        fields: [],
        resource: 'domain',
        icon: 'icon',
        isPinned: false,
      };

      // Act
      const res = await tableService.createTable(table);

      // Assert
      expect(res.name).toStrictEqual(table.name);
    });

    it('Update a table', async () => {
      // Arrange
      const table: Table = {
        name: 'my table',
        fields: [],
        resource: 'domain',
        icon: 'icon',
        isPinned: false,
      };

      const table2: Table = {
        name: 'my updated table',
        fields: [
          { findingFieldKey: 'key1', findingKey: 'key2', name: 'field name' },
        ],
        resource: 'domain',
        icon: 'icon',
        isPinned: false,
      };
      const created = await tableService.createTable(table);

      // Act
      const res = await tableService.updateTable(
        created._id.toString(),
        table2,
      );

      // Assert
      expect(res.name).toStrictEqual(table2.name);
      expect(res.fields.length).toStrictEqual(1);
    });

    it('Delete a table', async () => {
      // Arrange
      const table: Table = {
        name: 'my table',
        fields: [],
        resource: 'domain',
        icon: 'icon',
        isPinned: false,
      };

      const table2: Table = {
        name: 'my updated table',
        fields: [
          { findingFieldKey: 'key1', findingKey: 'key2', name: 'field name' },
        ],
        resource: 'domain',
        icon: 'icon',
        isPinned: false,
      };
      const created = await tableService.createTable(table);
      await tableService.createTable(table2);

      // Act
      await tableService.deleteTable(created._id.toString());

      // Assert
      const res = await tableService.getAll();
      expect(res.length).toStrictEqual(1);
      expect(res[0].name).toStrictEqual(table2.name);
    });
  });
});
