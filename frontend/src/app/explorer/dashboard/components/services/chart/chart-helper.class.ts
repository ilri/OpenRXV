import * as Highcharts from 'highcharts';
import { ComponentFilterConfigs } from 'src/app/explorer/configs/generalConfig.interface';
export class ChartHelper {
  protected chartType: any;
  commonProperties(): Highcharts.Options {
    return {
      title: {
        text: undefined,
      },
      responsive: {
        rules: this.responsiveRules(),
      },
      credits: {
        enabled: false,
      },
      legend: this.legendAttributes(),
    };
  }

  private legendAttributes(): Highcharts.LegendOptions {
    return {
      itemStyle: {
        color: '#000000',
      },
      enabled: true,
      layout: 'horizontal',
      floating: this.chartType === 'map',
      align: this.chartType === 'pie' ? 'right' : 'center',
      verticalAlign:
        this.chartType === 'map' ||
        this.chartType === 'packed-bubble' ||
        this.chartType === 'packed-bubble-split' ||
        this.chartType === 'column'
          ? 'bottom'
          : 'middle',
      navigation: {
        activeColor: '#3E576F',
        animation: true,
        arrowSize: 12,
        inactiveColor: '#CCCCCC',
        style: {
          fontWeight: 'bold',
          color: '#333333',
          fontSize: '12px',
        },
      } as Highcharts.LegendNavigationOptions,
    };
  }

  private responsiveRules(): Highcharts.ResponsiveRulesOptions[] {
    return [
      {
        condition: {
          maxWidth: 500,
        },
        chartOptions: {
          legend: {
            enabled: false,
          },
        },
      } as Highcharts.ResponsiveRulesOptions,
    ];
  }

  public getDataLabelAttributes(
    componentConfigs: ComponentFilterConfigs,
    chartType: string,
  ): Highcharts.DataLabelsOptions {
    if (chartType === 'pie') {
      const dataLabelsSettings = {
        enabled: false,
        formatter: function () {
          return this.key;
        },
        padding: 0,
        connectorPadding: 0,
        distance: 15,
        style: {
          textOverflow: 'clip',
        },
      };

      const dataLabelsEnabled = componentConfigs?.data_labels;
      const dataLabelsCountEnabled = componentConfigs?.data_labels_count;
      const dataLabelsPercentageEnabled =
        componentConfigs?.data_labels_percentage;
      if (
        dataLabelsEnabled ||
        dataLabelsCountEnabled ||
        dataLabelsPercentageEnabled
      ) {
        dataLabelsSettings.enabled = true;
        dataLabelsSettings.formatter = function () {
          const label = [];
          if (dataLabelsEnabled) {
            label.push(this?.key ? this.key : 'NA');
          }

          let numbers = '';
          if (dataLabelsCountEnabled) {
            numbers +=
              '<span style="color: ' +
              this.color +
              '">' +
              (this as any).y +
              '</span>';
          }
          if (dataLabelsPercentageEnabled) {
            numbers += '<span style="color: ' + this.color + '">';
            numbers += dataLabelsCountEnabled ? ' (' : '';
            numbers += (this as any).percentage.toFixed(2) + '%';
            numbers += dataLabelsCountEnabled ? ')' : '';
            numbers += '</span>';
          }
          if (numbers !== '') {
            label.push(numbers);
          }
          return label.join('<br>');
        };
      }
      return dataLabelsSettings;
    } else if (chartType === 'map') {
      const dataLabelsSettings = {
        enabled: false,
        formatter: function () {
          if (Number(this.point.value) > 0) return this.point.name;
          else return '';
        },
      };

      const dataLabelsEnabled = componentConfigs?.data_labels;
      const dataLabelsCountEnabled = componentConfigs?.data_labels_count;
      if (dataLabelsEnabled || dataLabelsCountEnabled) {
        dataLabelsSettings.enabled = true;
        dataLabelsSettings.formatter = function () {
          const label = [];
          if (Number(this.point.value) > 0) {
            if (dataLabelsEnabled) {
              label.push(this.point.name);
            }
            if (dataLabelsCountEnabled) {
              label.push(this.point.value);
            }
          }
          return label.join(': ');
        };
      }
      return dataLabelsSettings;
    } else if (chartType === 'bar') {
      return {
        enabled: componentConfigs?.data_labels_count,
        formatter: function () {
          return (this as any).y;
        },
      };
    }

    return {
      enabled: false,
    };
  }
}
