import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  SearchQueryParser,
  SearchTerm,
  SearchTerms,
  TermTypes,
} from '@red-kite/jobs-manager/common-duplicates/search-query';
import { FilterQuery, Model, Types } from 'mongoose';
import { BadRequestError } from 'passport-headerapikey';
import escapeStringRegexp from '../../../../utils/escape-string-regexp';
import { Tag } from '../../tags/tag.model';
import { Project } from '../project.model';
import { Resource } from '../resource.type';
import { SearchTermsValidator } from './search-terms-validator';

@Injectable()
export abstract class FilterParserBase<T extends Resource> {
  private validator = new SearchTermsValidator();
  protected queryParser = new SearchQueryParser();
  protected searchTermsValidator = new SearchTermsValidator();

  constructor(
    @InjectModel('project') private readonly projectModel: Model<Project>,
    @InjectModel('tags') private readonly tagModel: Model<Tag>,
  ) {}

  public async buildFilter(
    query: string,
    firstSeenStartDate: number,
    firstSeenEndDate: number,
  ): Promise<FilterQuery<T>> {
    const terms = this.queryParser.parse(query || '', {
      completeTermsOnly: true,
      excludeEmptyValues: true,
    });

    if (!terms.length) return {};
    this.validator.ensureTerms(terms);

    const finalFilter: FilterQuery<T> = {
      $and: [
        ...this.isBlockedFilters(terms),
        ...this.firstSeenFilters(firstSeenStartDate, firstSeenEndDate),
        ...(await this.projectFilters(terms)),
        ...(await this.tagFilters(terms)),
        ...(await this.buildResourceFilters(terms)),
      ],
    };

    if (terms.length) {
      throw new BadRequestError(
        `Some search terms were not handled: ${JSON.stringify(terms)}`,
      );
    }

    return finalFilter;
  }

  protected abstract buildResourceFilters(
    terms: SearchTerms,
  ): Promise<FilterQuery<T>[]>;

  protected consumeTerms(
    terms: SearchTerms,
    not: '-' | '',
    type: TermTypes,
    value?: string,
  ): SearchTerms {
    const selected = [];

    for (let i = 0; i < terms.length; ) {
      const term = terms[i];
      if (
        term.type === type &&
        (not === '-') === term.not &&
        (value == null || term.value === value)
      ) {
        selected.push(terms[i]);
        terms.splice(i, 1);
      } else {
        i++;
      }
    }

    return selected;
  }

  protected toInclusionList(
    terms: SearchTerm[],
    options?: { lowercase: boolean },
  ): (string | RegExp)[] {
    let values = terms.map((x) => x.value).map((x) => x.trim());
    if (options?.lowercase) {
      values = values.map((x) => x.toLowerCase());
    }

    if (values.some((x) => x[x.length - 1] === '*')) {
      return values
        .map((x) => escapeStringRegexp(x))
        .map(
          (x) =>
            new RegExp(
              `^${x.substring(0, x.length - 2)}${
                x[x.length - 1] === '*' ? '.*' : x[x.length - 1]
              }`,
              options?.lowercase ? 'i' : '',
            ),
        );
    } else {
      return options?.lowercase
        ? values.map((x) => new RegExp(`^${x}$`, 'i'))
        : values;
    }
  }

  /** Creates inclusion and exclusion filters for "is: blocked" */
  private isBlockedFilters(terms: SearchTerms) {
    const filters: FilterQuery<Resource>[] = [];

    // "is: blocked" filter
    {
      // Include
      {
        const t = this.consumeTerms(terms, '', 'is', 'blocked');
        if (t.length) {
          filters.push({ blocked: true });
        }
      }

      // Exclude
      {
        const t = this.consumeTerms(terms, '-', 'is', 'blocked');
        if (t.length) {
          filters.push({ blocked: { $not: { $eq: true } } });
        }
      }
    }

    return filters;
  }

  /** Creates filters using created at date. */
  private firstSeenFilters(
    firstSeenStartDate: number,
    firstSeenEndDate: number,
  ) {
    const filters: FilterQuery<Resource>[] = [];

    // Filter by createdAt
    {
      // Start
      if (firstSeenStartDate) {
        filters.push({ createdAt: { $gte: firstSeenStartDate } });
      }

      // End
      if (firstSeenEndDate) {
        filters.push({ createdAt: { $lt: firstSeenEndDate } });
      }
    }

    return filters;
  }

  private async tagFilters(terms: SearchTerms) {
    const filters: FilterQuery<Resource>[] = [];

    // "tag.name"
    {
      // Include
      {
        const t = this.consumeTerms(terms, '', 'tag.name');
        if (t.length) {
          const tags = await this.tagModel.find({
            text: { $in: this.toInclusionList(t, { lowercase: false }) },
          });

          filters.push({
            tags: { $all: tags.map((x) => x._id) },
          });
        }
      }

      // Exclude
      {
        const t = this.consumeTerms(terms, '-', 'tag.name');
        if (t.length) {
          const tags = await this.tagModel.find(
            { text: { $in: this.toInclusionList(t, { lowercase: false }) } },
            '_id',
          );

          filters.push({
            tags: { $nin: tags.map((x) => x._id) },
          });
        }
      }
    }

    // "tag.id" filters
    {
      // Include
      {
        const t = this.consumeTerms(terms, '', 'tag.id');
        if (t.length) {
          const tagIds = t.map((x) => new Types.ObjectId(x.value));
          filters.push({
            tags: { $all: tagIds },
          });
        }
      }

      // Exclude
      {
        const t = this.consumeTerms(terms, '-', 'tag.id');
        if (t.length) {
          const tagIds = t.map((x) => new Types.ObjectId(x.value));
          filters.push({
            tags: { $nin: tagIds },
          });
        }
      }
    }

    return filters;
  }

  private async projectFilters(terms: SearchTerms) {
    const filters: FilterQuery<Resource>[] = [];

    // "project.id" filters
    {
      // Include
      {
        const t = this.consumeTerms(terms, '', 'project.id');
        if (t.length) {
          const projects = t.map((x) => new Types.ObjectId(x.value));
          filters.push({ projectId: { $in: projects } });
        }
      }

      // Exclude
      {
        const t = this.consumeTerms(terms, '-', 'project.id');
        if (t.length) {
          const projects = t.map((x) => new Types.ObjectId(x.value));
          filters.push({ projectId: { $not: { $in: projects } } });
        }
      }
    }

    // "project.name" filters
    {
      // Include
      {
        const t = this.consumeTerms(terms, '', 'project.name');
        if (t.length) {
          const projects = await this.projectModel.find(
            { name: { $in: this.toInclusionList(t) } },
            '_id',
          );

          filters.push({
            projectId: { $in: projects.map((x) => x._id) },
          });
        }
      }

      // Exclude
      {
        const t = this.consumeTerms(terms, '-', 'project.name');
        if (t.length) {
          const projects = await this.projectModel.find(
            { name: { $in: this.toInclusionList(t) } },
            '_id',
          );

          filters.push({
            projectId: { $not: { $in: projects.map((x) => x._id) } },
          });
        }
      }
    }

    return filters;
  }
}
