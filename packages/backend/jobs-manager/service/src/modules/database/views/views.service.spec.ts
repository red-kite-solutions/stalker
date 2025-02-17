import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { AppModule } from '../../app.module';
import { View } from './views.model';
import { ViewService } from './views.service';

describe('View Service', () => {
  let moduleFixture: TestingModule;
  let viewService: ViewService;
  let viewModel: Model<View>;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    viewModel = moduleFixture.get<Model<View>>(getModelToken('view'));
    viewService = moduleFixture.get(ViewService);
  });

  beforeEach(async () => {
    await viewModel.deleteMany({});
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('Manage views', () => {
    it('Read a view by id', async () => {
      // Arrange
      const view: View = {
        name: 'my view',
        fields: [],
        resource: 'domain',
        icon: 'icon',
        isPinned: false,
      };

      const created = await viewModel.create(view);

      // Act
      const res = await viewService.getView(created._id.toString());

      // Assert
      expect(res.name).toStrictEqual(view.name);
    });

    it('Read all views', async () => {
      // Arrange
      const view: View = {
        name: 'my view',
        fields: [],
        resource: 'domain',
        icon: 'icon',
        isPinned: false,
      };

      await viewModel.create(view);
      await viewModel.create({ ...view, name: 'my view 2' });
      await viewModel.create({ ...view, name: 'my view 3' });

      // Act
      const res = await viewService.getAll();

      // Assert
      expect(res.length).toStrictEqual(3);
    });

    it('Create a view', async () => {
      // Arrange
      const view: View = {
        name: 'my view',
        fields: [],
        resource: 'domain',
        icon: 'icon',
        isPinned: false,
      };

      // Act
      const res = await viewService.createView(view);

      // Assert
      expect(res.name).toStrictEqual(view.name);
    });

    it('Update a view', async () => {
      // Arrange
      const view: View = {
        name: 'my view',
        fields: [],
        resource: 'domain',
        icon: 'icon',
        isPinned: false,
      };

      const view2: View = {
        name: 'my updated view',
        fields: [
          { findingFieldKey: 'key1', findingKey: 'key2', name: 'field name' },
        ],
        resource: 'domain',
        icon: 'icon',
        isPinned: false,
      };
      const created = await viewService.createView(view);

      // Act
      const res = await viewService.updateView(created._id.toString(), view2);

      // Assert
      expect(res.name).toStrictEqual(view2.name);
      expect(res.fields.length).toStrictEqual(1);
    });

    it('Delete a view', async () => {
      // Arrange
      const view: View = {
        name: 'my view',
        fields: [],
        resource: 'domain',
        icon: 'icon',
        isPinned: false,
      };

      const view2: View = {
        name: 'my updated view',
        fields: [
          { findingFieldKey: 'key1', findingKey: 'key2', name: 'field name' },
        ],
        resource: 'domain',
        icon: 'icon',
        isPinned: false,
      };
      const created = await viewService.createView(view);
      await viewService.createView(view2);

      // Act
      await viewService.deleteView(created._id.toString());

      // Assert
      const res = await viewService.getAll();
      expect(res.length).toStrictEqual(1);
      expect(res[0].name).toStrictEqual(view2.name);
    });
  });
});
