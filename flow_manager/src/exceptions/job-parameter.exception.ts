export class JobParameterCountException extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

export class JobParameterValueException extends Error {
  constructor(parameterName: string, param: any) {
    super(`Error with parameter "${parameterName}" : ${param}`);
  }
}
