export type ApiKind = 'cpp-api' | 'python-api';

export interface ApiParameter {
  name: string;
  type: string;
  default?: string;
}

export interface ApiField extends ApiParameter {
  mutable?: boolean;
}

export interface ApiMethod {
  id: string;
  name: string;
  signature: string;
  returnType: string;
  parameters: ApiParameter[];
  qualifiers: string[];
  throws: string[];
}

export interface ApiEnumValue {
  name: string;
  value?: string | number;
}

export interface ApiSymbol {
  id: string;
  name: string;
  qualifiedName: string;
  category:
    'class' | 'struct' | 'dataclass' | 'enum' | 'exception' | 'function';
  declaration: string;
  sourcePath: string;
  importPath?: string;
  fields: ApiField[];
  methods: ApiMethod[];
  values: ApiEnumValue[];
  bases: string[];
}

export interface ApiManifest {
  schemaVersion: 1;
  kind: ApiKind;
  component: string;
  version: string;
  sourceTag: string;
  sourceUrl: string;
  symbols: ApiSymbol[];
}

export interface CliOption {
  id: string;
  longName: string;
  shortName?: string;
  valueType: string;
  values: string[];
  description: string;
}

export interface CliCommand {
  id: string;
  name: string;
  synopsis: string;
  description?: string;
  optionIds: string[];
  positionals: ApiParameter[];
  examples: string[];
  exitStatuses: number[];
}

export interface CliManifest {
  schemaVersion: 1;
  kind: 'cli';
  component: string;
  version: string;
  sourceTag: string;
  sourceUrl: string;
  options: CliOption[];
  commands: CliCommand[];
  exitStatuses: Array<{code: number; meaning: string}>;
}

export interface RosParameter {
  name: string;
  type: string;
  default: string | number | boolean;
  unit?: string;
  constraint?: string;
  description: string;
}

export interface RosInterface {
  id: string;
  category: 'topic' | 'service' | 'state' | 'diagnostic';
  name: string;
  type: string;
  description: string;
}

export interface RosManifest {
  schemaVersion: 1;
  kind: 'ros';
  component: string;
  version: string;
  sourceTag: string;
  sourceUrl: string;
  pluginClass: string;
  standaloneParameters: RosParameter[];
  hardwareParameters: RosParameter[];
  interfaces: RosInterface[];
}

export interface ReferenceVersions {
  schemaVersion: 1;
  components: Record<
    string,
    {version: string; sourceTag: string; repository: string; sourceUrl: string}
  >;
}
