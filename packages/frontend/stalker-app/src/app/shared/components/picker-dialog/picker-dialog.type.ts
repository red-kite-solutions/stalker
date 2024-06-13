import { FileTab } from '../../widget/code-editor/code-editor.type';

export interface PickerOption {
  id: string;
  options?: PickerOption[];
  name: string;
  lessImportant?: boolean;
}

export interface PickerOptionPreviewCode extends PickerOptionPreview {
  tabs: FileTab[];
}

export interface PickerOptionPreview {
  id: string;
}

export type PickerType = 'code';

export abstract class ExtendedPickerData {
  abstract type: PickerType;
  abstract onPreviewSelection:
    | ((option: PickerOption) => PickerOptionPreview)
    | ((option: PickerOption) => Promise<PickerOptionPreview>);
}

export class CodePickerData extends ExtendedPickerData {
  override type: PickerType = 'code';

  constructor(
    public override onPreviewSelection:
      | ((option: PickerOption) => PickerOptionPreviewCode)
      | ((option: PickerOption) => Promise<PickerOptionPreviewCode>)
  ) {
    super();
  }
}
