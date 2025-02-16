import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { AppModule } from '../../../app.module';
import { CreateCustomFinding } from '../../../findings/findings.service';
import { TagsService } from '../../tags/tag.service';
import { FindingImageField, FindingTextField } from '../findings/finding.model';
import { HostService } from '../host/host.service';
import { ProjectService } from '../project.service';
import { FindingDefinition } from './finding-definition.model';
import { FindingDefinitionService } from './finding-definition.service';

describe('Finding Definition Service', () => {
  let moduleFixture: TestingModule;
  let hostService: HostService;
  let findingDefinitionService: FindingDefinitionService;
  let projectService: ProjectService;
  let tagsService: TagsService;
  let findingDefinitionModel: Model<FindingDefinition>;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    hostService = moduleFixture.get(HostService);
    findingDefinitionService = moduleFixture.get(FindingDefinitionService);
    projectService = moduleFixture.get(ProjectService);
    projectService = moduleFixture.get(ProjectService);
    findingDefinitionModel = moduleFixture.get<Model<FindingDefinition>>(
      getModelToken('findingdefinition'),
    );
  });

  beforeEach(async () => {
    await findingDefinitionModel.deleteMany({});
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('Manage finding definitions', () => {
    it('Read a finding definition page by key', async () => {
      // Arrange
      const key = 'my key';
      const key2 = 'my key 2';
      const f = await findingDefinitionModel.create({ key, fields: [] });
      const f2 = await findingDefinitionModel.create({ key: key2, fields: [] });

      // Act
      const found = await findingDefinitionService.getAll(0, 5, {
        keys: [key],
      });

      // Assert
      expect(found.length).toBe(1);
      expect(found[0].key).toStrictEqual(key);
      expect(found[0].fields.length).toBe(0);
    });

    it('Read a finding definition page with multiple keys', async () => {
      // Arrange
      const key = 'my key';
      const key2 = 'my key 2';
      const key3 = 'my key 3';
      const f = await findingDefinitionModel.create({ key, fields: [] });
      const f2 = await findingDefinitionModel.create({ key: key2, fields: [] });
      const f3 = await findingDefinitionModel.create({ key: key3, fields: [] });

      // Act
      const found = await findingDefinitionService.getAll(0, 5, {
        keys: [key, key2],
      });

      // Assert
      expect(found.length).toBe(2);
      expect(found[0].key).toStrictEqual(key);
      expect(found[0].fields.length).toBe(0);
      expect(found[1].key).toStrictEqual(key2);
      expect(found[1].fields.length).toBe(0);
    });

    it('Should find the last updated finding definition', async () => {
      // Arrange

      const key = 'my key';
      const key2 = 'my key 2';
      const key3 = 'my key 3';

      const f1 = new CreateCustomFinding();
      const f2 = new CreateCustomFinding();
      const f3 = new CreateCustomFinding();
      f1.key = key;
      f2.key = key2;
      f3.key = key3;

      // Create the findings
      await findingDefinitionService.upsertFindingDefinition(f1);
      await findingDefinitionService.upsertFindingDefinition(f2);
      await findingDefinitionService.upsertFindingDefinition(f3);

      // Update the findings for new update timestamps
      await findingDefinitionService.upsertFindingDefinition(f2);
      await findingDefinitionService.upsertFindingDefinition(f1);
      await findingDefinitionService.upsertFindingDefinition(f3);

      // Act
      const findings = await findingDefinitionService.getAll(0, 3, {
        sort: 'descending',
      });

      // Assert
      expect(findings.length).toBe(3);
      expect(findings[0].key).toStrictEqual(f3.key);
      expect(findings[1].key).toStrictEqual(f1.key);
      expect(findings[2].key).toStrictEqual(f2.key);
    });

    it('Create a finding definition', async () => {
      // Arrange
      const finding = new CreateCustomFinding();
      finding.key = 'FindingKey';
      const textField = new FindingTextField();
      textField.key = 'FieldKey';
      textField.label = 'FieldLabel';
      finding.fields = [textField];

      // Act
      await findingDefinitionService.upsertFindingDefinition(finding);

      // Assert
      const definition = await findingDefinitionModel.findOne({
        key: { $eq: finding.key },
      });
      expect(definition.key).toStrictEqual(finding.key);

      expect(definition.fields[0].key).toStrictEqual(textField.key);
      expect(definition.fields[0].label).toStrictEqual(textField.label);
    });

    it('Should not update a finding definition because the fields are the same', async () => {
      // Arrange
      const finding = new CreateCustomFinding();
      finding.key = 'FindingKey';
      const textField = new FindingTextField();
      textField.key = 'FieldKey';
      textField.label = 'FieldLabel';
      finding.fields = [textField];
      await findingDefinitionService.upsertFindingDefinition(finding);

      // Act
      await findingDefinitionService.upsertFindingDefinition(finding);

      // Assert
      const definition = await findingDefinitionModel.findOne({
        key: { $eq: finding.key },
      });
      expect(definition.key).toStrictEqual(finding.key);
      expect(definition.fields[0].key).toStrictEqual(textField.key);
      expect(definition.fields[0].label).toStrictEqual(textField.label);
    });

    it('Updates an existing finding definition by adding a field', async () => {
      // Arrange
      const finding = new CreateCustomFinding();
      finding.key = 'FindingKey';
      const textField = new FindingTextField();
      textField.key = 'FieldKey';
      textField.label = 'FieldLabel';
      const textField2 = new FindingTextField();
      textField2.key = 'FieldKey2';
      textField2.label = 'FieldLabel';
      finding.fields = [textField];
      await findingDefinitionService.upsertFindingDefinition(finding);
      const previousDefinition = await findingDefinitionModel.findOne({
        key: { $eq: finding.key },
      });
      finding.fields = [textField2];

      // Act
      await findingDefinitionService.upsertFindingDefinition(finding);

      // Assert
      const definition = await findingDefinitionModel.findOne({
        key: { $eq: finding.key },
      });
      expect(definition.key).toStrictEqual(finding.key);

      expect(definition.fields.length).toStrictEqual(2);
      expect(definition.fields[0].key).toStrictEqual(textField.key);
      expect(definition.fields[0].label).toStrictEqual(textField.label);
      expect(definition.fields[1].key).toStrictEqual(textField2.key);
      expect(definition.fields[1].label).toStrictEqual(textField2.label);
    });

    it('Should not add an image field to an existing finding', async () => {
      // Arrange
      const finding = new CreateCustomFinding();
      finding.key = 'FindingKey';
      const textField = new FindingTextField();
      textField.key = 'FieldKey';
      textField.label = 'FieldLabel';
      const imageField = new FindingImageField();
      imageField.key = 'ImageKey';
      imageField.data = 'data';
      finding.fields = [textField];
      await findingDefinitionService.upsertFindingDefinition(finding);
      finding.fields = [textField, imageField];

      // Act
      await findingDefinitionService.upsertFindingDefinition(finding);

      // Assert
      const definition = await findingDefinitionModel.findOne({
        key: { $eq: finding.key },
      });
      expect(definition.key).toStrictEqual(finding.key);

      expect(definition.fields.length).toStrictEqual(1);
      expect(definition.fields[0].key).toStrictEqual(textField.key);
      expect(definition.fields[0].label).toStrictEqual(textField.label);
    });
  });

  describe('Cleanup finding definitions', () => {
    it('Should preserve finding definitions that are not older than the time limit', async () => {
      // Arrange
      const key = 'my key';
      const key2 = 'my key 2';
      const key3 = 'my key 3';
      const f = await findingDefinitionModel.create({ key, fields: [] });
      const f2 = await findingDefinitionModel.create({ key: key2, fields: [] });
      const f3 = await findingDefinitionModel.create({ key: key3, fields: [] });
      const now = Date.now();
      const yearMs = 60 * 60 * 24 * 365 * 1000;
      await findingDefinitionModel.updateOne(
        { _id: f._id },
        { createdAt: now - yearMs + 1 },
      );

      // Act
      await findingDefinitionService.cleanup(now, yearMs);
      const findings = await findingDefinitionService.getAll(0, 100, {});

      // Assert
      expect(findings.length).toBe(3);
    });

    it('Should delete finding definitions that are older than the time limit', async () => {
      // Arrange
      const key = 'my key';
      const key2 = 'my key 2';
      const key3 = 'my key 3';

      const f2 = await findingDefinitionModel.create({ key: key2, fields: [] });
      const f3 = await findingDefinitionModel.create({ key: key3, fields: [] });
      const now = Date.now();
      const yearMs = 60 * 60 * 24 * 365 * 1000;
      const f = await findingDefinitionModel.create({
        key,
        fields: [],
        createdAt: now - yearMs - 1,
      });

      // Act
      await findingDefinitionService.cleanup(now, yearMs);
      const findings = await findingDefinitionService.getAll(0, 100, {});

      // Assert
      expect(findings.length).toBe(2);
    });
  });
});
