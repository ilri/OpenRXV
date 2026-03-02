import { WelcomeComponent } from '../../representationalComponents/welcome/welcome.component';
import { CounterComponent } from '../counter/counter.component';
import { MapComponent } from '../map/map.component';
import { BarComponent } from '../bar/bar.component';
import { ChartComponent } from '../chart/chart.component';
import { GooglemapsComponent } from '../googlemaps/googlemaps.component';
import { LineComponent } from '../line/line.component';
import { ListComponent } from '../list/list.component';
import { MainListComponent } from '../list/main-list/main-list.component';
import { PieComponent } from '../pie/pie.component';
import { WordcloudComponent } from '../wordcloud/wordcloud.component';
import { SunburstComponent } from '../sunburst/sunburst.component';
import { DateRangeComponent } from '../../../filters/date-range/date-range.component';
import { LabelComponent } from '../../../filters/label/label.component';
import { RangeComponent } from '../../../filters/range/range.component';
import { SearchComponent } from '../../../filters/search/search.component';
import { SelectComponent } from '../../../filters/select/select.component';

export const ComponentLookupRegistry = (key: string): any => {
  const components = {
    DateRangeComponent: DateRangeComponent,
    LabelComponent: LabelComponent,
    RangeComponent: RangeComponent,
    SearchComponent: SearchComponent,
    SelectComponent: SelectComponent,
    WelcomeComponent: WelcomeComponent,
    CounterComponent: CounterComponent,
    ChartComponent: ChartComponent,
    PieComponent: PieComponent,
    BarComponent: BarComponent,
    LineComponent: LineComponent,
    WordcloudComponent: WordcloudComponent,
    SunburstComponent: SunburstComponent,
    MapComponent: MapComponent,
    GoogleMapsComponent: GooglemapsComponent,
    ListComponent: ListComponent,
    MainListComponent: MainListComponent,
  };
  return components[key];
};
