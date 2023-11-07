import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  cleanIdNames(name: string): string {
    name = name.trim();
    // Replace non-word character with -
    name = name.replace(/\W|_/g, '-');
    // Remove duplicated -
    name = name.replace(/-{2,}/g, '-');
    // Remove trailing -
    name = name.replace(/^-|-$/g, '-');
    return name.toLowerCase();
  }

  async importJSON(event): Promise<any> {
    const jsonFile = event.target.files[0];

    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsText(jsonFile);
      try {
        reader.onload = () => {
          try {
            resolve(JSON.parse(reader.result.toString()));
          } catch (e) {
            resolve([]);
          }
        };
      } catch (e) {
        resolve([]);
      }
    });
  }

  importJSONResponseMessage(
    status: any,
    recordsCount: number,
    typeName: string,
  ) {
    const failedMessage =
      '<ul><li>' + status.failed.join('</li><li>') + '</li></ul>';
    if (status.success.length === recordsCount) {
      return {
        type: 'success',
        message: `${typeName} imported successfully`,
      };
    } else if (status.success.length > 0) {
      return {
        type: 'warning',
        message:
          `Some ${typeName} imported successfully. Failed ${typeName}:` +
          failedMessage,
      };
    } else if (status.failed.length > 0) {
      return {
        type: 'error',
        message: `${typeName} were not imported successfully:` + failedMessage,
      };
    } else {
      return {
        type: 'error',
        message: 'Nothing to import',
      };
    }
  }

  HumanReadableTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds - hours * 3600) / 60);
    seconds = seconds - hours * 3600 - minutes * 60;
    const timeArray = [hours, minutes, seconds]
      .map((time) => time.toFixed(0))
      .map((time) => (time.length === 1 ? '0' + time : time));
    return timeArray.join(':');
  }
}
