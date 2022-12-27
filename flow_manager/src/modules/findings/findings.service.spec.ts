import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import {
  CustomFinding,
  FindingImageField,
  FindingTextField,
} from '../database/reporting/findings/finding.model';
import { FindingsService } from './findings.service';

describe('Findings Service Spec', () => {
  let moduleFixture: TestingModule;
  let findingsService: FindingsService;
  let findingsModel: Model<CustomFinding>;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    findingsService = moduleFixture.get(FindingsService);
    findingsModel = moduleFixture.get<Model<CustomFinding>>(
      getModelToken('finding'),
    );
  });

  beforeEach(async () => {
    findingsModel.deleteMany();
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('Test', async () => {
    // Arrange
    await findingsModel.insertMany([
      {
        created: new Date(2011, 1, 1),
        correlationKey: 'my-target',
        name: 'b',
      },
      {
        created: new Date(2010, 1, 1),
        correlationKey: 'my-target',
        name: 'a',
      },
      {
        created: new Date(2022, 1, 1),
        correlationKey: 'my-other-target',
        name: 'should not be returned',
      },
      {
        created: new Date(2012, 1, 1),
        correlationKey: 'my-target',
        name: 'c',
      },
      {
        created: new Date(2014, 1, 1),
        correlationKey: 'my-target',
        name: 'e',
      },
      {
        created: new Date(2013, 1, 1),
        correlationKey: 'my-target',
        name: 'd',
      },
    ]);

    // Act
    const firstPage = await findingsService.getAll('my-target', 1, 3);
    const secondPage = await findingsService.getAll('my-target', 2, 3);

    // Assert
    expect(firstPage.totalRecords).toBe(5);
    expect(firstPage.items.map((x) => x.name).join('')).toBe('edc');

    expect(secondPage.totalRecords).toBe(5);
    expect(secondPage.items.map((x) => x.name).join('')).toBe('ba');
  });
});

function textField(label: string, content: string): FindingTextField {
  return {
    type: 'text',
    label,
    content,
  };
}

function imageField(data: string): FindingImageField {
  return {
    type: 'image',
    data,
  };
}

// // findingsModel.create({
// //   created: new Date(2022, 10, 18),
// //   jobId: '123',
// //   target: '',
// //   name: 'Screenshot',
// //   key: '123',
// //   fields: [
// //     textField('Some more info', 'lvl >9999'),
// //     imageField('data:image/gif;base64,R0lGODlhAQABAAAAACw='),
// //   ],
// // });
