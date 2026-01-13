import {WelcomeComponent} from "../../representationalComponents/welcome/welcome.component";
import {CounterComponent} from "../counter/counter.component";
import {MapComponent} from "../map/map.component";
import {BarComponent} from "../bar/bar.component";
import {RotatedLablesComponent} from "../bar/rotated-lables/rotated-lables.component";
import {ChartComponent} from "../chart/chart.component";
import {GooglemapsComponent} from "../googlemaps/googlemaps.component";
import {LineComponent} from "../line/line.component";
import {ListComponent} from "../list/list.component";
import {MainListComponent} from "../list/main-list/main-list.component";
import {PackedBubbleComponent} from "../packed-bubble/packed-bubble.component";
import {PackedBubbleSplitComponent} from "../packed-bubble-split/packed-bubble-split.component";
import {PieComponent} from "../pie/pie.component";
import {SimiCircleComponent} from "../simi-circle/simi-circle.component";
import {WheelComponent} from "../wheel/wheel.component";
import {WordcloudComponent} from "../wordcloud/wordcloud.component";
import {DateRangeComponent} from "../../../filters/date-range/date-range.component";
import {LabelComponent} from "../../../filters/label/label.component";
import {RangeComponent} from "../../../filters/range/range.component";
import {SearchComponent} from "../../../filters/search/search.component";
import {SelectComponent} from "../../../filters/select/select.component";

export const ComponentLookupRegistry = (key: string): any => {
  const components = {
    WelcomeComponent: WelcomeComponent,
    CounterComponent: CounterComponent,
    MapComponent: MapComponent,
    BarComponent: BarComponent,
    SingleBarComponent: RotatedLablesComponent,
    ChartComponent: ChartComponent,
    GoogleMapsComponent: GooglemapsComponent,
    LineComponent: LineComponent,
    ListComponent: ListComponent,
    MainListComponent: MainListComponent,
    PackedBubbleComponent: PackedBubbleComponent,
    PackedBubbleSplitComponent: PackedBubbleSplitComponent,
    PieComponent: PieComponent,
    SimiCircleComponent: SimiCircleComponent,
    WheelComponent: WheelComponent,
    WordcloudComponent: WordcloudComponent,
    DateRangeComponent: DateRangeComponent,
    LabelComponent: LabelComponent,
    RangeComponent: RangeComponent,
    SearchComponent: SearchComponent,
    SelectComponent: SelectComponent,
  };
  return components[key];
};

// MapComponent undefined dynamic.component.ts:24:13
// ListComponent undefined 10 dynamic.component.ts:24:13
// WordcloudComponent undefined dynamic.component.ts:24:13
// ListComponent undefined dynamic.component.ts:24:13
// PieComponent undefined dynamic.component.ts:24:13
// ListComponent undefined dynamic.component.ts:24:13
// MainListComponent undefined dynamic.component.ts:24:13
// WordcloudComponent undefined dynamic.component.ts:24:13
// PieComponent undefined dynamic.component.ts:24:13
// ListComponent undefined
