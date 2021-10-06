import { HarvesterService } from '../../../harvester/services/harveter.service';
export declare class FormatSearvice {
  private readonly harvesterService;
  constructor(harvesterService: HarvesterService);
  Init(): Promise<void>;
  format(json: any, schema: any): any;
  setValue(oldvalue: any, value: any): any;
  capitalizeFirstLetter(string: any): any;
  mapIsoToLang: (value: string) => any;
  mapIsoToCountry: (value: string) => any;
  mapIt(value: any, addOn?: null): string;
  getArrayOrValue(values: Array<any>): any;
}
